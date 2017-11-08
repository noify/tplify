(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(factory)
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        // es6 module , typescript
        var tplify = factory()
        tplify.__esModule = true
        tplify['default'] = tplify
        module.exports = tplify
    } else {
        // browser
        global.tplify = factory()
    }
}(this, function () {
    var list = ['var tpl = "";']
    /**
     * 模板 + 数据 => 渲染后的字符串
     * 
     * @param {string} content 模板
     * @param {any} data 数据
     * @returns 渲染后的字符串
     */
    function render(tpl, data){
        data = data || {}
        $tpl = generalDom(tpl)
        tpl = this.$tpl.outerHTML;
        $ast = parse(tpl)
        var list = ['var tpl = "";'];
        var codeArr = transform($ast[0])
        for (var i = 0, len = codeArr.length; i < len; i++) {
            var item = codeArr[i]; // 当前分割项
            // 如果是文本类型，或者js占位项
            if (!item.type) {
                var txt = 'tpl+="' +
                    item.replace(/{{(.*?)}}/g, function (g0, g1) {
                        return '"+' + g1 + '+"';
                    }) + '"';
                list.push(txt);
            }
            else {  // 如果是js代码
                var str = item.txt
                list.push(str)
                if(str.indexOf('else') != -1){
                    list[i] = list[i+1]
                    list[i+1]  = str
                }
            }
        }
        list.push('return tpl;')
        return new Function('data', list.join('\n'))(data)
    }

    function generalDom(domStr){
        if (domStr instanceof Object) {
            return domStr
        }

        var $temp = document.createElement("div")
        $temp.innerHTML = domStr.trim() //不然会有多余的空格等东西
        return $temp.childNodes[0]
    }
    ////////////////////////////////////AST
    var dsl_prefix = "t-"
    var dslMap = {
        "t-for": 1,
        "t-if": 1,
        "t-else": 1,
        "t-else-if": 1,
        "t-bind": 0,
        "t-html": 0,
        "t-show": 0,
        "t-on": 0,
    }
    ////////////////parse-tag
    var attrRE = /([:\w-]+)|['"]{1}([^'"]*)['"]{1}/g

    var lookup = (Object.create) ? Object.create(null) : {};
    lookup.area = true;
    lookup.base = true;
    lookup.br = true;
    lookup.col = true;
    lookup.embed = true;
    lookup.hr = true;
    lookup.img = true;
    lookup.input = true;
    lookup.keygen = true;
    lookup.link = true;
    lookup.menuitem = true;
    lookup.meta = true;
    lookup.param = true;
    lookup.source = true;
    lookup.track = true;
    lookup.wbr = true;
    
    function parseTag (tag) {
        var i = 0;
        var key;
        var res = {
            type: 'tag',
            name: '',
            voidElement: false,
            attrs: {},
            children: [],
            dsl: []
        };
    
        tag.replace(attrRE, function (match) {
    
            if (dslMap[match]) {
               res.dsl.push(match);
            }
    
            if (i % 2) {
                key = match;
            } else {
                if (i === 0) {
                    if (lookup[match] || tag.charAt(tag.length - 2) === '/') {
                        res.voidElement = true;
                    }
                    res.name = match;
                } else {
                    res.attrs[key] = match.replace(/['"]/g, '');
                }
            }
            i++;
        });
    
        return res;
    }

    ///////////////////parse
    var tagRE = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g // bug <p><p></p></p>

    var empty = Object.create ? Object.create(null) : {};
    
    function parse (html, options) {
        options || (options = {});
        options.components || (options.components = empty);
        var result = [];
        var current;
        var level = -1;
        var arr = [];
        var byTag = {};
        var inComponent = false;
    
        html.replace(tagRE, function (tag, index) {
            if (inComponent) {
                if (tag !== ('</' + current.name + '>')) {
                    return;
                } else {
                    inComponent = false;
                }
            }
            var isOpen = tag.charAt(1) !== '/';
            var start = index + tag.length;
            var nextChar = html.charAt(start);
            var parent;
    
            if (isOpen) {
                level++;
    
                current = parseTag(tag)
                // options.components相关 未知
                if (current.type === 'tag' && options.components[current.name]) {
                    current.type = 'component';
                    inComponent = true;
                }
                // 不是voidElement节点 有下一个字节且不是<
                // 增加子text节点
                if (!current.voidElement && !inComponent && nextChar) { //  && nextChar !== '<'
                    current.children.push({
                        type: 'text',
                        content: html.slice(start, html.indexOf('<', start)),
                        parent: current
                    });
                }

                // 无效 未知作用
                byTag[current.tagName] = current;
    
                // if we're at root, push new base node
                if (level === 0) {
                    result.push(current);
                }
    
                parent = arr[level - 1];

                // 有父节点且父节点有子节点
                // 关联 父子同胞节点 的关系
                if (parent) { // && parent.children.length add && parent.children.length
                    current.prev = parent.children[parent.children.length - 1]
                    parent.children[parent.children.length - 1].next = current
                    parent.children.push(current)
                    current.parent = parent
                }
    
                arr[level] = current;
            }
    
            if (!isOpen || current.voidElement) {
                level--;
                // 下一个字节不是< 且有下一个字节
                if (!inComponent && nextChar !== '<' && nextChar) {
                    // trailing text node
                    arr[level].children.push({
                        type: 'text',
                        content: html.slice(start, html.indexOf('<', start)),
                        parent: arr[level]
                    });
                }
            }
        })
    
        return result;
    }

    function transform(ast){
        var list = []
        if (ast.dsl && ast.dsl.length) { //存在 dsl
            //dsl 优先级 if > for > html
            var $sdlTemp = ""
            var dslIndex
            if ((dslIndex = ast.dsl.indexOf("t-for")) !== -1) { //先判断 for 语句
                var reg = /([\w\W]+) in ([\w\W]+)/,
                    result = ast.attrs["t-for"].match(reg)
                    list.push({
                        type: 1,  //js代码
                        txt: 'for(var i in '+ result[2] +'){var '+ result[1] +'='+ result[2] +'[i];'  //匹配到的内容
                    })

                // 删除dsl
                ast.dsl.splice(dslIndex, 1)
                delete ast.attrs["t-for"]

                list = list.concat(transform(ast))

                list.push({
                    type: 1,  //js代码
                    txt: '}'  //匹配到的内容
                })
                return list

            }else if ((dslIndex = ast.dsl.indexOf("t-if")) !== -1) { //先判断 if 语句
                var itemName = ast.attrs["t-if"] // 现在只判断了值，没有进行表达式判断

                list.push({
                    type: 1,  //js代码
                    txt: 'if('+ ast.attrs["t-if"] +'){'  //匹配到的内容
                })


                // 删除dsl
                ast.dsl.splice(dslIndex, 1)
                delete ast.attrs["t-if"]
                list = list.concat(transform(ast))

                list.push({
                    type: 1,  //js代码
                    txt: '}'  //匹配到的内容
                })

                return list
            }else if ((dslIndex = ast.dsl.indexOf("t-else-if")) !== -1) { //先判断 else if 语句
                list.push({
                    type: 1,  //js代码
                    txt: 'else if('+ ast.attrs["t-else-if"] +'){'  //匹配到的内容
                })


                // 删除dsl
                ast.dsl.splice(dslIndex, 1)
                delete ast.attrs["t-else-if"]
                list = list.concat(transform(ast))

                list.push({
                    type: 1,  //js代码
                    txt: '}'  //匹配到的内容
                })

                return list
            }else if ((dslIndex = ast.dsl.indexOf("t-else")) !== -1) { //先判断 else 语句
                list.push({
                    type: 1,  //js代码
                    txt: 'else{'  //匹配到的内容
                })


                // 删除dsl
                ast.dsl.splice(dslIndex, 1)
                delete ast.attrs["t-else"]
                list = list.concat(transform(ast))

                list.push({
                    type: 1,  //js代码
                    txt: '}'  //匹配到的内容
                })

                return list
            }
        }
        if(ast.type === 'tag'){
            list.push('<'+ast.name+'')
            for (var key in ast.attrs) {
                var value = ast.attrs[key]
                
                if(key.charAt(0) === ':'){ // bug true &&
                    key = key.substr(1)
                    value = wrapStr(''+value)
                }
                list.push(' '+key+'=\''+value+'\'')
            }
            list.push('>')
            for(i in ast.children){
                list = list.concat(transform(ast.children[i]))
            }
            !ast.voidElement && list.push('</'+ast.name+'>')
            return list
        }else if(ast.type === 'text'){
            list.push(ast.content.replace(/\r?\n/g, "")) // \\n
            return list
        }
    }

    function wrapStr(str){
        return '"+'+ str +'+"'
    }
    return render
}))