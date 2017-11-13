(function(global, factory) {
    typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : global.tplify = factory();
})(this, function() {
    return function render(template, data) {
        var src = template.replace(/(^|%>)([\s\S]*?)(<%|$)/g, function(g0, g1, g2) {
            return 't+="' + g2.replace(/\r?\n/g, "\\n").replace(/<(.*?)>/g, function(g0, g1) {
                return g0.replace(/"/g, "'");
            }).replace(/>(.*?)</g, function(g0, g1) {
                return g0.replace(/"/g, "&quot;");
            }).replace(/{{(.*?)}}/g, function(g0, g1) {
                g1 = g1.indexOf("=") !== 0 ? "_e(" + g1 + ")" : g1.slice(1);
                return '"+' + g1.replace(/&quot;/g, '"') + '+"';
            }) + '";';
        });
        return new Function("d", "_e", 'with(d){var t="";' + src + "return t;}")(data || {}, function(html) {
            return String(html).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        });
    };
});