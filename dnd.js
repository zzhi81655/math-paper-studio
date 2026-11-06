/* MathPaper Studio · dnd.js
   HTML5 拖拽排序（试卷内题目重排），带插入位置指示线 */
(function () {
  'use strict';
  window.MSP = window.MSP || {};

  var drag = { idx: -1, overEl: null, before: false };

  /* listEl: 容器；itemSel: 可拖拽项选择器；handleSel: 拖柄（可选，为 null 则整项可拖）
     onReorder(fromIdx, toIdx)  toIdx 为目标项索引，before=true 表示插到它前面 */
  MSP.enableDrag = function (listEl, itemSel, handleSel, onReorder) {
    if (!listEl) return;

    listEl.addEventListener('mousedown', function (e) {
      if (!handleSel) return;
      var item = e.target.closest(itemSel);
      if (item) item.draggable = !!e.target.closest(handleSel);
    });

    listEl.addEventListener('dragstart', function (e) {
      var item = e.target.closest(itemSel);
      if (!item) { e.preventDefault(); return; }
      drag.idx = Number(item.dataset.idx);
      item.classList.add('drag-ghost');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(drag.idx)); } catch (err) {}
    });

    listEl.addEventListener('dragend', function (e) {
      listEl.querySelectorAll('.drag-ghost').forEach(function (el) { el.classList.remove('drag-ghost'); });
      listEl.querySelectorAll('.drop-indicator').forEach(function (el) { el.classList.remove('drop-indicator'); });
      drag.idx = -1;
    });

    listEl.addEventListener('dragover', function (e) {
      if (drag.idx < 0) return;
      var item = e.target.closest(itemSel);
      if (!item || item.dataset.idx === undefined) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      var overIdx = Number(item.dataset.idx);
      if (overIdx === drag.idx) return;
      var rect = item.getBoundingClientRect();
      var before = e.clientY < rect.top + rect.height / 2;
      listEl.querySelectorAll('.drop-indicator').forEach(function (el) { el.classList.remove('drop-indicator'); });
      item.classList.add('drop-indicator');
      // 指示线在底部时翻转阴影方向（简化：同一 class，仅记录 before）
      drag.overIdx = overIdx; drag.before = before;
    });

    listEl.addEventListener('drop', function (e) {
      if (drag.idx < 0) return;
      e.preventDefault();
      var from = drag.idx;
      var to = drag.overIdx, before = drag.before;
      listEl.querySelectorAll('.drop-indicator').forEach(function (el) { el.classList.remove('drop-indicator'); });
      if (to === undefined || to === null) return;
      if (from === to) return;
      // 计算 splice 目标：from 先被移除，若 from < to 则 to-- 后再插
      var insertAt = before ? to : to + 1;
      if (from < insertAt) insertAt--;
      onReorder(from, insertAt);
      drag.idx = -1; drag.overIdx = null;
    });
  };
})();
