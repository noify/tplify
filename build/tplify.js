(function(global, factory) {
    typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : global.tplify = factory();
})(this, function() {
    function render(content, data) {
        data = data || {};
        var list = [ 'var tpl = "";' ];
        var codeArr = transform(content);
        for (var i = 0, len = codeArr.length; i < len; i++) {
            var item = codeArr[i];
            if (!item.type) {
                var txt = 'tpl+="' + item.txt.replace(/<(.*?)>/g, function(g0, g1) {
                    return g0.replace(/"/g, "'");
                }).replace(/>(.*?)</g, function(g0, g1) {
                    return g0.replace(/"/g, "&quot;");
                }).replace(/{{=(.*?)}}/g, function(g0, g1) {
                    return '"+' + g1 + '+"';
                }).replace(/{{(.*?)}}/g, function(g0, g1) {
                    return '"+_e(' + g1 + ')+"';
                }) + '"';
                list.push(txt);
            } else {
                list.push(item.txt);
            }
        }
        list.push("return tpl;");
        return new Function("data", "_e", list.join("\n"))(data, escape);
    }
    function transform(content) {
        var arr = [];
        var reg = /<%(?!=)([\s\S]*?)%>/g;
        var match;
        var nowIndex = 0;
        while (match = reg.exec(content)) {
            appendTxt(arr, content.substring(nowIndex, match.index));
            arr.push({
                type: 1,
                txt: match[1]
            });
            nowIndex = match.index + match[0].length;
        }
        appendTxt(arr, content.substr(nowIndex));
        return arr;
    }
    function appendTxt(list, content) {
        content = content.replace(/\r?\n/g, "\\n");
        list.push({
            txt: content
        });
    }
    function escape(html) {
        return String(html).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    }
    return render;
});