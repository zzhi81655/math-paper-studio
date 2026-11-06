/* MathPaper Studio · editor.js
   题目编辑器抽屉：字段编辑 + 实时数学预览 + LaTeX 错误提示 + 符号工具栏 */
(function () {
  'use strict';
  window.MSP = window.MSP || {};

  var editingId = null;   // null = 新建
  var addAfterSave = false;
  var lastFocused = null;

  function $(id) { return document.getElementById(id); }

  function previewField(textareaId, previewId, errId) {
    var ta = $(textareaId), pv = $(previewId), err = errId ? $(errId) : null;
    MSP.renderRich(pv, ta.value);
    if (err) {
      var errs = MSP.findLatexErrors(ta.value);
      if (errs.length) {
        err.classList.remove('hidden');
        err.innerHTML = '⚠ 公式可能有误：<code>' + MSP.escapeHtml(errs[0].src.slice(0, 60)) + '</code> — ' + MSP.escapeHtml(errs[0].msg);
      } else err.classList.add('hidden');
    }
  }

  var debounceTimer = null;
  function debouncedPreview() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      previewField('ed-stem', 'ed-stem-preview', 'ed-stem-error');
      previewField('ed-answer', 'ed-answer-preview', null);
      previewField('ed-analysis', 'ed-analysis-preview', null);
    }, 250);
  }

  function renderOptionRows(options) {
    var wrap = $('ed-options');
    wrap.innerHTML = '';
    (options || []).forEach(function (o) {
      var row = document.createElement('div');
      row.className = 'ed-option-row';
      var label = document.createElement('span');
      label.className = 'opt-label';
      label.textContent = o.label;
      var input = document.createElement('input');
      input.type = 'text';
      input.value = o.text;
      input.placeholder = '选项内容（留空将丢弃该选项）';
      row.appendChild(label); row.appendChild(input);
      wrap.appendChild(row);
    });
  }

  function collectOptions() {
    var rows = $('ed-options').querySelectorAll('.ed-option-row');
    var arr = [];
    rows.forEach(function (row, i) {
      var text = row.querySelector('input').value.trim();
      if (text) arr.push({ label: String.fromCharCode(65 + i), text: text });
    });
    return arr;
  }

  function open(qid, opts) {
    var store = MSP.store;
    editingId = qid || null;
    addAfterSave = !!(opts && opts.addAfterSave);
    var q = qid ? store.getQuestion(qid) : null;

    $('editor-title').textContent = q ? '编辑题目' : '新建题目' + (addAfterSave ? '（保存后自动加入当前试卷）' : '');
    $('ed-type').value = q ? q.type : 'choice';
    $('ed-diff').value = q ? String(q.difficulty || 2) : '2';
    $('ed-score').value = q ? (q.score != null ? q.score : 5) : 5;
    $('ed-source').value = q ? (q.source || '') : '';
    $('ed-tags').value = q ? (q.tags || []).join(', ') : '';
    $('ed-stem').value = q ? q.stem : '';
    $('ed-answer').value = q ? (q.answer || '') : '';
    $('ed-analysis').value = q ? (q.analysis || '') : '';
    renderOptionRows(q && q.options && q.options.length ? q.options : [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }]);

    $('btn-editor-delete').style.display = q ? '' : 'none';
    toggleOptionsWrap();

    // 首帧预览
    setTimeout(function () { debouncedPreview(); }, 60);

    $('drawer-mask').classList.remove('hidden');
    $('editor-drawer').classList.remove('hidden');
    $('ed-stem').focus();
  }

  function close() {
    $('drawer-mask').classList.add('hidden');
    $('editor-drawer').classList.add('hidden');
    editingId = null;
  }

  function toggleOptionsWrap() {
    $('ed-options-wrap').style.display = $('ed-type').value === 'choice' ? '' : 'none';
  }

  function save() {
    var store = MSP.store;
    var stem = $('ed-stem').value.trim();
    if (!stem) { MSP.toast('题干不能为空', 'err'); $('ed-stem').focus(); return; }

    var q = editingId ? JSON.parse(JSON.stringify(store.getQuestion(editingId))) : { id: null };
    q.type = $('ed-type').value;
    q.difficulty = Number($('ed-diff').value);
    q.score = Number($('ed-score').value) || 0;
    q.source = $('ed-source').value.trim();
    q.tags = $('ed-tags').value.split(/[,，、]/).map(function (t) { return t.trim(); }).filter(Boolean);
    q.stem = stem;
    q.answer = $('ed-answer').value.trim();
    q.analysis = $('ed-analysis').value.trim();
    q.options = q.type === 'choice' ? collectOptions() : [];

    var saved = store.upsertQuestion(q);
    if (!editingId && addAfterSave) {
      store.addItem(store.state.currentPaperId, saved.id);
    }
    close();
    MSP.renderAll();
    MSP.toast(editingId ? '已保存' : '题目已创建');
  }

  function removeCurrent() {
    if (!editingId) return;
    MSP.confirmBox('删除题目', '该题目将从题库与所有试卷中删除，不可恢复。确定？', function () {
      MSP.store.deleteQuestion(editingId);
      close();
      MSP.renderAll();
      MSP.toast('已删除');
    });
  }

  MSP.editor = {
    open: open,
    close: close,
    init: function () {
      // 符号工具栏：目标为抽屉内最后聚焦的 textarea
      MSP.buildSymbolToolbar($('symbol-toolbar'), function () { return lastFocused || $('ed-stem'); });

      $('editor-drawer').addEventListener('focusin', function (e) {
        if (e.target.tagName === 'TEXTAREA') lastFocused = e.target;
      });

      ['ed-stem', 'ed-answer', 'ed-analysis'].forEach(function (id) {
        $(id).addEventListener('input', debouncedPreview);
      });
      $('ed-type').addEventListener('change', toggleOptionsWrap);

      $('btn-opt-add').addEventListener('click', function () {
        var opts = collectOptions();
        if (opts.length >= 8) return;
        opts.push({ label: String.fromCharCode(65 + opts.length), text: '' });
        renderOptionRows(opts);
      });
      $('btn-opt-del').addEventListener('click', function () {
        var opts = collectOptions();
        if (opts.length <= 2) return;
        opts.pop();
        renderOptionRows(opts);
      });

      $('btn-editor-save').addEventListener('click', save);
      $('btn-editor-cancel').addEventListener('click', close);
      $('btn-editor-close').addEventListener('click', close);
      $('btn-editor-delete').addEventListener('click', removeCurrent);
      $('drawer-mask').addEventListener('click', close);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
        // Ctrl/Cmd+S 保存
        if ((e.ctrlKey || e.metaKey) && e.key === 's' && !$('editor-drawer').classList.contains('hidden')) {
          e.preventDefault(); save();
        }
      });
    }
  };
})();
