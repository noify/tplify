# tplify

[![NPM version](https://img.shields.io/npm/v/tpl-ify.svg)](https://www.npmjs.com/package/tpl-ify)

简易模板引擎

- 只有十几行代码，压缩后仅 ~0.74kb
- 最低支持 Internet Explorer 6

# 安装

```bash
$ npm install --save tpl-ify
```

或直接引入

```html
<script src="https://unpkg.com/tpl-ify"></script>
```

# 使用

在`<% %>`中编写js代码，使用`{{ }}`赋值，`{{= }}`也能赋值，但会渲染html。

```js
let content = `
<ul>
    <% for(var i = 0; i < data.length; i++){
        var item = data[i];
        if(item.weight < 140){%>
            <li>我是{{item.name}}，我喜欢吃大{{item.food}}</li>
        <%}else{%>
            <li>我是{{=item.name}}，我喜欢喝西北风</li>
        <%}%>
    <% } %>
</ul>
`

let data = [
    { name: '小红', weight: 132, food: '鸡腿' }, 
    { name: '明明<p></p>', weight: 139, food: '猪蹄' }, 
    { name: '<b>楚楚</b>', weight: 141, food: '烧鸭' }
];

let result = tplify(content, data)
```

```html
<ul>

    <li>我是小红，我喜欢吃大鸡腿</li>

    <li>我是明明&lt;p&gt;&lt;/p&gt;，我喜欢吃大猪蹄</li>

    <li>我是<b>楚楚</b>，我喜欢喝西北风</li>

</ul>
```