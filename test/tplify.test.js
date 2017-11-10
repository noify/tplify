var tplify = require('../src/tplify.js')
var expect = require('chai').expect;

describe('判断及循环测试', function() {
  it('for循环测试', function() {
    var data = [1, 2, 3]
    var template = '<%for(var i = 0; i < data.length; i++){%><a>{{data[i]}}</a><%}%>'
    var result = '<a>1</a><a>2</a><a>3</a>'
    expect(tplify(template, data)).to.be.equal(result);
  });

  it('if else else-if判断测试', function() {
    var data = 3
    var template = '<%if(data===1){%><a>1</a><%}else if(data===2){%><a>2</a><%}else{%><a>{{data}}</a><%}%>'
    var result = '<a>3</a>'
    expect(tplify(template, data)).to.be.equal(result);
  });

  it('for if else组合判断测试', function() {
    var data = [1, 2, 3]
    var template = '<% for(var i = 0; i < data.length; i++){var item = data[i];if(item < 3){%><a>{{item}}</a><%}else{%><a>*{{item}}</a><%}%><% } %>'
    var result = '<a>1</a><a>2</a><a>*3</a>'
    expect(tplify(template, data)).to.be.equal(result);
  });

  it('while循环测试', function() {
    var data = 3
    var template = '<%while(data--){%><a>{{data}}</a><%}%>'
    var result = '<a>2</a><a>1</a><a>0</a>'
    expect(tplify(template, data)).to.be.equal(result);
  });
});

describe('赋值测试', function() {
    it('赋值测试', function() {
      var data = 1
      var template = '<a id="{{data}}">{{data}}</a>'
      var result = '<a id=\'1\'>1</a>'
      expect(tplify(template, data)).to.be.equal(result);
    });

    it('简单运算测试', function() {
        var data = 1
        var template = '<a id="{{data*2 + 1}}">{{data*2 + 1}}</a>'
        var result = '<a id=\'3\'>3</a>'
        expect(tplify(template, data)).to.be.equal(result);
    });

      
    it('三元运算测试', function() {
        var data = 1
        var template = '<a id="{{data === 1 ? "一" : "二"}}">{{data === 1 ? "一" : "二"}}</a>'
        var result = '<a id=\'一\'>一</a>'
        expect(tplify(template, data)).to.be.equal(result);
      });

      it('HTML渲染测试', function() {
        var data = '<b>1</b>'
        var template = '<a id="{{data}}">{{=data + "<b>2</b>"}}<b>3</b></a>'
        var result = '<a id=\'&lt;b&gt;1&lt;/b&gt;\'><b>1</b><b>2</b><b>3</b></a>'
        expect(tplify(template, data)).to.be.equal(result);
      });

      it('特殊字符测试', function() {
        var data = '1'
        var template = '<a id="{{data}}">"{{data + "\'"}}\'</a>'
        var result = '<a id=\'1\'>&quot;1&#39;\'</a>'
        expect(tplify(template, data)).to.be.equal(result);
      });
  });
