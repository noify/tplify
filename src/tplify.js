(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
      typeof define === 'function' && define.amd ? define(factory) :
        (global.tplify = factory());
  }(this, function () {

    return function render(template, data) {
        // 提取html部分进行处理 js部分无需处理
        var src = template.replace(/(^|%>)([\s\S]*?)(<%|$)/g, function (g0, g1, g2) {
            return 't+="' + g2
                            //.replace(/\r/g, '') // 削除回车
                            //.replace(/^\s+|\s+$/gm, '') // 削除开头和结尾的空白
                            .replace(/\r?\n/g, "\\n") // 将回车换行替换为换行符
                            .replace(/<(.*?)>/g, function (g0, g1) { // 替换标签属性内的"
                                return g0.replace(/"/g, "'");
                            })
                            .replace(/>(.*?)</g, function (g0, g1) { // 转义文本内的" 
                                return g0.replace(/"/g, '&quot;');
                            })
                            .replace(/{{(.*?)}}/g, function (g0, g1) {  // 提取html部分中的js部分进行处理
                                g1 = g1.indexOf('=') !== 0 ?  '_e(' + g1 + ')' : g1.slice(1)
                                return '"+' + g1.replace(/&quot;/g, '"') + '+"';
                            }) + '";';
        })

        return new Function('d', '_e', 'with(d){var t="";' + src + 'return t;}')(data || {}, function (html) {
            return String(html) // 转义实体字符
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/'/g, '&#39;')
                .replace(/"/g, '&quot;');
        });

    }

}));