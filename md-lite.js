/* MathPaper Studio · md-lite.js
   极轻量 Markdown 渲染（安全第一：先整体转义，再生成少量标签）
   数学公式 $...$ / $$...$$ 不在此处理，交给 KaTeX auto-render */
(function () {
  'use strict';
  window.MSP = window.MSP || {};

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* 行内：加粗 / 斜体 / 行内代码。输入必须是已转义文本 */
  function inline(esc) {
    return esc
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  }

  /* 多行文本 → HTML：双换行分段，段内单换行变 <br> */
  MSP.mdToHtml = function (text) {
    var src = escapeHtml(text == null ? '' : String(text)).trim();
    if (!src) return '';
    var paras = src.split(/\n{2,}/);
    return paras.map(function (p) {
      return '<p>' + inline(p).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  };

  /* 纯文本摘要（用于题库折叠展示 / 搜索），去掉标记符号 */
  MSP.plainText = function (text) {
    return String(text == null ? '' : text)
      .replace(/\$\$?/g, '')
      .replace(/\\[a-zA-Z]+\s*/g, '')
      .replace(/[{}^_]/g, '')
      .replace(/[*`#]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  MSP.escapeHtml = escapeHtml;
})();
