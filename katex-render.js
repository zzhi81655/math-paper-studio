/* MathPaper Studio · katex-render.js
   KaTeX 加载检测（CDN defer 脚本）+ 富文本渲染 + 公式错误收集
   CDN 加载失败时自动降级：公式以原始 LaTeX 文本显示，不阻塞使用 */
(function () {
  'use strict';
  window.MSP = window.MSP || {};

  var ready = false;          // katex 是否可用
  var decided = false;        // 是否已完成判定（含超时降级）
  var waiters = [];
  var KATEX_OPTS = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true }
    ],
    throwOnError: false,     // 错误公式显示红色原文，不抛异常
    strict: 'ignore',
    trust: false,
    macros: { '\\dd': '\\mathrm{d}' }
  };

  function flush() {
    ready = true; decided = true;
    var w = waiters; waiters = [];
    w.forEach(function (fn) { try { fn(); } catch (e) { /* noop */ } });
  }

  function giveUp() {
    decided = true;
    var w = waiters; waiters = [];
    w.forEach(function (fn) { try { fn(); } catch (e) { /* noop */ } });
    document.dispatchEvent(new CustomEvent('msp:katex-failed'));
  }

  // 轮询等待 CDN 脚本就绪；8 秒未就绪判定为失败并降级
  var t0 = Date.now();
  (function poll() {
    if (window.katex && window.renderMathInElement) { flush(); return; }
    if (Date.now() - t0 > 8000) { giveUp(); return; }
    setTimeout(poll, 120);
  })();

  /* fn(ready:boolean) 一定会在未来被调用一次 */
  MSP.katexReady = function (fn) {
    if (decided) { setTimeout(function () { fn(ready); }, 0); return; }
    waiters.push(fn);
  };

  /* 将容器内 HTML（已含转义后的文本）中的数学公式渲染出来 */
  MSP.renderRich = function (el, text) {
    el.innerHTML = MSP.mdToHtml(text);
    MSP.renderTree(el);
  };

  MSP.renderTree = function (el) {
    MSP.katexReady(function (ok) {
      if (ok && el && el.isConnected) {
        try { window.renderMathInElement(el, KATEX_OPTS); } catch (e) { /* 单容器失败不阻塞全局 */ }
      }
      // 不可用时保持原样：$...$ 文本本身可读性尚可
    });
  };

  /* 收集文本中疑似有问题的 LaTeX 片段（编辑器实时提示用）。
     用 katex.renderToString 逐段探测，简单可靠 */
  MSP.findLatexErrors = function (text) {
    var errs = [];
    if (!window.katex) return errs;
    var re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, m;
    while ((m = re.exec(text))) {
      var src = (m[1] || m[2] || '').trim();
      if (!src) continue;
      try { window.katex.renderToString(src, { throwOnError: true, displayMode: !!m[1], strict: 'ignore' }); }
      catch (e) { errs.push({ src: src, msg: String(e.message || e).slice(0, 160) }); }
    }
    return errs;
  };
})();
