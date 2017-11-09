(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
      typeof define === 'function' && define.amd ? define(factory) :
        (global.tplify = factory());
  }(this, function () {
    /**
     * 模板 + 数据 => 渲染后的字符串
     * 
     * @param {string} content 模板
     * @param {any} data 数据
     * @returns 渲染后的字符串
     */
    function render(content, data) {
        data = data || {};
        var list = ['var tpl = "";'];
        var codeArr = transform(content);

        for (var i = 0, len = codeArr.length; i < len; i++) {
            var item = codeArr[i];

            if (!item.type) {
                
                var txt = 'tpl+="' +
                    item.txt.replace(/<(.*?)>/g, function (g0, g1) {
                        return g0.replace(/"/g, "'");
                    }).replace(/>(.*?)</g, function (g0, g1) {
                        return g0.replace(/"/g, '&quot;');
                    }).replace(/{{=(.*?)}}/g, function (g0, g1) {
                        return '"+' + g1 + '+"';
                    }).replace(/{{(.*?)}}/g, function (g0, g1) {
                        return '"+_e(' + g1 + ')+"';
                    }) + '"';
                list.push(txt);
            }
            else {
                list.push(item.txt);
            }
        }
        list.push('return tpl;');
        return new Function('data','_e', list.join('\n'))(data, escape);
    }

    /**
     * 从原始模板中提取 文本/js 部分
     * 
     * @param {string} content 
     * @returns {Array<{type:number,txt:string}>} 
     */
    function transform(content) {
        var arr = [];                 //返回的数组，用于保存匹配结果
        var reg = /<%(?!=)([\s\S]*?)%>/g;  //用于匹配js代码的正则
        var match;   				  //当前匹配到的match
        var nowIndex = 0;			  //当前匹配到的索引        

        while (match = reg.exec(content)) {
            // 保存当前匹配项之前的普通文本/占位
            appendTxt(arr, content.substring(nowIndex, match.index));
            //保存当前匹配项
            arr.push({
                type: 1,  //js代码
                txt: match[1]  //匹配到的内容
            });
            //更新当前匹配索引
            nowIndex = match.index + match[0].length;
        }
        //保存文本尾部
        appendTxt(arr, content.substr(nowIndex));
        return arr;
    }

    /**
     * 普通文本添加到数组，对换行部分进行转义
     * 
     * @param {Array<{type:number,txt:string}>} list 
     * @param {string} content 
     */
    function appendTxt(list, content) {
        content = content.replace(/\r?\n/g, "\\n");
        list.push({ txt: content });
    }

    /**
     * 对字符实体进行转义
     * 
     * @param {string} html 
     * @returns {string} 
     */
    function escape(html) {
        return String(html)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&quot;');
    }
    return render;
}));
