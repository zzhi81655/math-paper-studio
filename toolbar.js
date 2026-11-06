/* MathPaper Studio · toolbar.js
   数学符号工具栏：一键向 textarea 光标处插入 LaTeX 片段
   选中文字时自动做智能包裹（如选中 x 点"分式" → \frac{x}{}） */
(function () {
  'use strict';
  window.MSP = window.MSP || {};

  var GROUPS = [
    { name: '运算与结构', items: [
      ['\\frac{}{}', '½', '分式'],
      ['\\sqrt{}', '√', '根号'],
      ['\\sqrt[]{}', 'ⁿ√', 'n次根'],
      ['^{}', 'xⁿ', '上标'],
      ['_{}', 'xₙ', '下标'],
      ['\\pm', '±', '正负'],
      ['\\times', '×', '乘'],
      ['\\div', '÷', '除'],
      ['\\neq', '≠', '不等'],
      ['\\leq', '≤', '小于等'],
      ['\\geq', '≥', '大于等'],
      ['\\approx', '≈', '约等']
    ]},
    { name: '分析', items: [
      ['\\sum_{i=1}^{n}', 'Σ', '求和'],
      ['\\int_{a}^{b}', '∫', '积分'],
      ['\\lim_{x \\to \\infty}', 'lim', '极限'],
      ['\\ln x', 'ln', '对数'],
      ['\\log_{a} x', 'log', '对数底'],
      ['\\infty', '∞', '无穷'],
      ['\\to', '→', '趋于'],
      ['\\prime', '′', '导数']
    ]},
    { name: '几何', items: [
      ['\\triangle', '△', '三角形'],
      ['\\angle', '∠', '角'],
      ['\\circ', '°', '度'],
      ['\\perp', '⊥', '垂直'],
      ['\\parallel', '∥', '平行'],
      ['\\sim', '∽', '相似'],
      ['\\cong', '≌', '全等'],
      ['\\vec{a}', '→a', '向量'],
      ['\\odot', '⊙', '圆'],
      ['\\overarc{AB}', '⌒', '弧']
    ]},
    { name: '集合与逻辑', items: [
      ['\\in', '∈', '属于'],
      ['\\notin', '∉', '不属于'],
      ['\\subset', '⊂', '子集'],
      ['\\cup', '∪', '并'],
      ['\\cap', '∩', '交'],
      ['\\varnothing', '∅', '空集'],
      ['\\mathbb{R}', 'ℝ', '实数集'],
      ['\\forall', '∀', '任意'],
      ['\\exists', '∃', '存在']
    ]},
    { name: '希腊与补充', items: [
      ['\\alpha', 'α', ''], ['\\beta', 'β', ''], ['\\theta', 'θ', ''],
      ['\\pi', 'π', ''], ['\\omega', 'ω', ''], ['\\Delta', 'Δ', ''],
      ['\\sin', 'sin', ''], ['\\cos', 'cos', ''], ['\\tan', 'tan', ''],
      ['\\sin^2 x', 'sin²', ''], ['\\begin{cases} x, & x>0 \\\\ -x, & x\\leq 0 \\end{cases}', '分段', '分段函数'],
      ['\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', '矩阵', '矩阵']
    ]}
  ];

  /* 向 textarea 光标处插入片段；若有选中文本，填入片段中的第一对 {} */
  function insertToTextarea(ta, snippet) {
    var st = ta.selectionStart, en = ta.selectionEnd;
    var sel = ta.value.slice(st, en);
    var text = snippet;
    if (sel) {
      // 把选中内容塞进第一个空的 {} 中
      var filled = false;
      text = snippet.replace(/\{\}/g, function (m) {
        if (filled) return m;
        filled = true;
        return sel;
      });
      if (!filled) text = snippet + sel;
    }
    ta.setRangeText(text, st, en, 'end');
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  MSP.buildSymbolToolbar = function (container, getTarget) {
    container.innerHTML = '';
    GROUPS.forEach(function (g) {
      var label = document.createElement('span');
      label.className = 'grp';
      label.textContent = g.name;
      container.appendChild(label);
      g.items.forEach(function (it) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sym';
        b.innerHTML = MSP.escapeHtml(it[1]) + (it[2] ? '<b>' + MSP.escapeHtml(it[2]) + '</b>' : '');
        b.title = it[0];
        b.addEventListener('mousedown', function (e) { e.preventDefault(); }); // 防止 textarea 失焦丢失光标
        b.addEventListener('click', function () {
          var ta = getTarget();
          if (ta) insertToTextarea(ta, it[0]);
        });
        container.appendChild(b);
      });
    });
  };
})();
