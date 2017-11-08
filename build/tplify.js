(function(global, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof exports === "object") {
        var tplify = factory();
        tplify.__esModule = true;
        tplify["default"] = tplify;
        module.exports = tplify;
    } else {
        global.tplify = factory();
    }
})(this, function() {
    var list = [ 'var tpl = "";' ];
    function render(tpl, data) {
        data = data || {};
        $tpl = generalDom(tpl);
        tpl = this.$tpl.outerHTML;
        $ast = parse(tpl);
        var list = [ 'var tpl = "";' ];
        var codeArr = transform($ast[0]);
        for (var i = 0, len = codeArr.length; i < len; i++) {
            var item = codeArr[i];
            if (!item.type) {
                var txt = 'tpl+="' + item.replace(/{{(.*?)}}/g, function(g0, g1) {
                    return '"+' + g1 + '+"';
                }) + '"';
                list.push(txt);
            } else {
                var text = item.txt;
                list.push(text);
                if (text.indexOf("else") != -1) {
                    list[i + 1] = list[i];
                    list[i] = text;
                }
            }
        }
        list.push("return tpl;");
        return new Function("data", list.join("\n"))(data);
    }
    function generalDom(domStr) {
        if (domStr instanceof Object) {
            return domStr;
        }
        var $temp = document.createElement("div");
        $temp.innerHTML = domStr.trim();
        return $temp.childNodes[0];
    }
    var dsl_prefix = "t-";
    var dslMap = {
        "t-for": 1,
        "t-if": 1,
        "t-else": 1,
        "t-else-if": 1,
        "t-bind": 0,
        "t-html": 0,
        "t-show": 0,
        "t-on": 0
    };
    var attrRE = /([:\w-]+)|['"]{1}([^'"]*)['"]{1}/g;
    var lookup = Object.create ? Object.create(null) : {};
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
    function parseTag(tag) {
        var i = 0;
        var key;
        var res = {
            type: "tag",
            name: "",
            voidElement: false,
            attrs: {},
            children: [],
            dsl: []
        };
        tag.replace(attrRE, function(match) {
            if (dslMap[match]) {
                res.dsl.push(match);
            }
            if (i % 2) {
                key = match;
            } else {
                if (i === 0) {
                    if (lookup[match] || tag.charAt(tag.length - 2) === "/") {
                        res.voidElement = true;
                    }
                    res.name = match;
                } else {
                    res.attrs[key] = match.replace(/['"]/g, "");
                }
            }
            i++;
        });
        return res;
    }
    var tagRE = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g;
    var empty = Object.create ? Object.create(null) : {};
    function parse(html, options) {
        options || (options = {});
        options.components || (options.components = empty);
        var result = [];
        var current;
        var level = -1;
        var arr = [];
        var byTag = {};
        var inComponent = false;
        html.replace(tagRE, function(tag, index) {
            if (inComponent) {
                if (tag !== "</" + current.name + ">") {
                    return;
                } else {
                    inComponent = false;
                }
            }
            var isOpen = tag.charAt(1) !== "/";
            var start = index + tag.length;
            var nextChar = html.charAt(start);
            var parent;
            if (isOpen) {
                level++;
                current = parseTag(tag);
                if (current.type === "tag" && options.components[current.name]) {
                    current.type = "component";
                    inComponent = true;
                }
                if (!current.voidElement && !inComponent && nextChar) {
                    current.children.push({
                        type: "text",
                        content: html.slice(start, html.indexOf("<", start)),
                        parent: current
                    });
                }
                byTag[current.tagName] = current;
                if (level === 0) {
                    result.push(current);
                }
                parent = arr[level - 1];
                if (parent) {
                    current.prev = parent.children[parent.children.length - 1];
                    parent.children[parent.children.length - 1].next = current;
                    parent.children.push(current);
                    current.parent = parent;
                }
                arr[level] = current;
            }
            if (!isOpen || current.voidElement) {
                level--;
                if (!inComponent && nextChar !== "<" && nextChar) {
                    arr[level].children.push({
                        type: "text",
                        content: html.slice(start, html.indexOf("<", start)),
                        parent: arr[level]
                    });
                }
            }
        });
        return result;
    }
    function transform(ast) {
        var list = [];
        if (ast.dsl && ast.dsl.length) {
            var $sdlTemp = "";
            var dslIndex;
            if ((dslIndex = ast.dsl.indexOf("t-for")) !== -1) {
                var reg = /([\w\W]+) in ([\w\W]+)/, result = ast.attrs["t-for"].match(reg);
                list.push({
                    type: 1,
                    txt: "for(var i in " + result[2] + "){var " + result[1] + "=" + result[2] + "[i];"
                });
                ast.dsl.splice(dslIndex, 1);
                delete ast.attrs["t-for"];
                list = list.concat(transform(ast));
                list.push({
                    type: 1,
                    txt: "}"
                });
                return list;
            } else if ((dslIndex = ast.dsl.indexOf("t-if")) !== -1) {
                var itemName = ast.attrs["t-if"];
                list.push({
                    type: 1,
                    txt: "if(" + ast.attrs["t-if"] + "){"
                });
                ast.dsl.splice(dslIndex, 1);
                delete ast.attrs["t-if"];
                list = list.concat(transform(ast));
                list.push({
                    type: 1,
                    txt: "}"
                });
                return list;
            } else if ((dslIndex = ast.dsl.indexOf("t-else-if")) !== -1) {
                list.push({
                    type: 1,
                    txt: "else if(" + ast.attrs["t-else-if"] + "){"
                });
                ast.dsl.splice(dslIndex, 1);
                delete ast.attrs["t-else-if"];
                list = list.concat(transform(ast));
                list.push({
                    type: 1,
                    txt: "}"
                });
                return list;
            } else if ((dslIndex = ast.dsl.indexOf("t-else")) !== -1) {
                list.push({
                    type: 1,
                    txt: "else{"
                });
                ast.dsl.splice(dslIndex, 1);
                delete ast.attrs["t-else"];
                list = list.concat(transform(ast));
                list.push({
                    type: 1,
                    txt: "}"
                });
                return list;
            }
        }
        if (ast.type === "tag") {
            list.push("<" + ast.name + "");
            for (var key in ast.attrs) {
                var value = ast.attrs[key];
                if (key.charAt(0) === ":") {
                    key = key.substr(1);
                    value = wrapStr("" + value);
                }
                list.push(" " + key + "='" + value + "'");
            }
            list.push(">");
            for (i in ast.children) {
                list = list.concat(transform(ast.children[i]));
            }
            !ast.voidElement && list.push("</" + ast.name + ">");
            return list;
        } else if (ast.type === "text") {
            list.push(ast.content.replace(/\r?\n/g, ""));
            return list;
        }
    }
    function wrapStr(str) {
        return '"+' + str + '+"';
    }
    return render;
});