/* MathPaper Studio · app.js
   入口：顶栏、视图切换、统计面板、随机抽题、导入导出、打印、主题 */
(function () {
  'use strict';
  var store = MSP.store;
  var $ = function (id) { return document.getElementById(id); };

  /* ── toast / 模态 ── */
  MSP.toast = function (msg, type) {
    var root = $('toast-root');
    var t = document.createElement('div');
    t.className = 'toast' + (type === 'err' ? ' err' : '');
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transition = 'opacity .3s';
      setTimeout(function () { t.remove(); }, 320);
    }, 2200);
  };

  MSP.confirmBox = function (title, msg, onOk, okText) {
    var box = $('modal-box');
    box.innerHTML =
      '<div class="modal-head"><h3>' + MSP.escapeHtml(title) + '</h3></div>' +
      '<div class="modal-body"><p style="margin:4px 0 8px">' + MSP.escapeHtml(msg) + '</p></div>' +
      '<div class="modal-foot"><button class="btn" id="mb-cancel">取消</button>' +
      '<button class="btn btn-danger" id="mb-ok">' + MSP.escapeHtml(okText || '确定') + '</button></div>';
    $('modal-mask').classList.remove('hidden');
    $('mb-cancel').onclick = closeModal;
    $('mb-ok').onclick = function () { closeModal(); onOk && onOk(); };
  };

  function closeModal() { $('modal-mask').classList.add('hidden'); }

  function modalShell(title, bodyHtml, okText, onOk) {
    var box = $('modal-box');
    box.innerHTML =
      '<div class="modal-head"><h3>' + MSP.escapeHtml(title) + '</h3></div>' +
      '<div class="modal-body">' + bodyHtml + '</div>' +
      '<div class="modal-foot"><button class="btn" id="mb-cancel">取消</button>' +
      (onOk ? '<button class="btn btn-primary" id="mb-ok">' + MSP.escapeHtml(okText || '确定') + '</button>' : '') +
      '</div>';
    $('modal-mask').classList.remove('hidden');
    $('mb-cancel').onclick = closeModal;
    if (onOk) $('mb-ok').onclick = function () { if (onOk() !== false) closeModal(); };
    return box;
  }

  /* ── 试卷下拉与卷面信息 ── */
  function renderPaperSelect() {
    var sel = $('paper-select');
    var st = store.state;
    sel.innerHTML = st.paperOrder.map(function (pid) {
      var p = st.papers[pid];
      return p ? '<option value="' + pid + '"' + (pid === st.currentPaperId ? ' selected' : '') + '>' + MSP.escapeHtml(p.name) + '</option>' : '';
    }).join('');
  }

  function openPaperMeta() {
    var p = store.currentPaper(); if (!p) return;
    var body =
      '<label class="field-label">试卷名（列表显示）</label><input id="pm-name" value="' + MSP.escapeHtml(p.name) + '">' +
      '<label class="field-label">卷面大标题</label><input id="pm-title" value="' + MSP.escapeHtml(p.title || '') + '">' +
      '<label class="field-label">副标题</label><input id="pm-sub" value="' + MSP.escapeHtml(p.subtitle || '') + '">' +
      '<label class="field-label">信息行（时间 / 满分等）</label><input id="pm-info" value="' + MSP.escapeHtml(p.info || '') + '">' +
      '<label class="field-label">目标总分（用于统计对比）</label><input id="pm-target" type="number" min="0" value="' + (Number(p.targetScore) || 0) + '">';
    modalShell('卷面信息 · ' + p.name, body, '保存', function () {
      p.name = $('pm-name').value.trim() || p.name;
      p.title = $('pm-title').value.trim();
      p.subtitle = $('pm-sub').value.trim();
      p.info = $('pm-info').value.trim();
      p.targetScore = Number($('pm-target').value) || 0;
      store.save();
      MSP.renderAll();
      MSP.toast('卷面信息已更新');
    });
  }

  /* ── 统计面板 ── */
  function updateStats() {
    var paper = store.currentPaper(); if (!paper) return;
    var total = store.paperTotal(paper);
    var target = Number(paper.targetScore) || 0;
    $('stat-total').textContent = total;
    $('stat-target').textContent = target || '—';
    var fill = $('stat-progress');
    var pct = target ? Math.min(100, Math.round(total / target * 100)) : 100;
    fill.style.width = pct + '%';
    fill.classList.toggle('over', target && total > target);

    var diffEl = $('stat-diff');
    if (!paper.itemIds.length) { diffEl.textContent = '还没有选题，去题库挑几道吧'; }
    else if (!target) { diffEl.textContent = '共 ' + paper.itemIds.length + ' 题'; }
    else {
      var d = total - target;
      diffEl.textContent = d === 0 ? '✔ 正好 ' + target + ' 分，共 ' + paper.itemIds.length + ' 题'
        : (d > 0 ? '超出目标 ' + d + ' 分（' + paper.itemIds.length + ' 题）'
                : '还差 ' + (-d) + ' 分（已选 ' + paper.itemIds.length + ' 题）');
    }

    /* 题型行 */
    var rows = {};
    paper.itemIds.forEach(function (qid) {
      var q = store.getQuestion(qid); if (!q) return;
      var t = q.type || 'custom';
      rows[t] = rows[t] || { n: 0, s: 0 };
      rows[t].n++;
      rows[t].s += store.itemScore(paper, qid);
    });
    $('stat-types').innerHTML = Object.keys(rows).map(function (t) {
      return '<div class="stat-row"><span>' + (store.TYPE_NAMES[t] || '其他') + '</span><b>' + rows[t].n + ' 题 / ' + rows[t].s + ' 分</b></div>';
    }).join('') || '<div class="stat-row"><span>—</span></div>';

    /* 难度条 */
    var counts = { 1: 0, 2: 0, 3: 0 };
    paper.itemIds.forEach(function (qid) {
      var q = store.getQuestion(qid);
      if (q) counts[q.difficulty] = (counts[q.difficulty] || 0) + 1;
    });
    var sum = counts[1] + counts[2] + counts[3];
    var bar = $('stat-diffbar');
    bar.children[0].style.width = sum ? (counts[1] / sum * 100) + '%' : '0';
    bar.children[1].style.width = sum ? (counts[2] / sum * 100) + '%' : '0';
    bar.children[2].style.width = sum ? (counts[3] / sum * 100) + '%' : '0';
  }

  /* ── 随机抽题 ── */
  function openRandom() {
    var types = ['choice', 'blank', 'solve', 'custom'];
    var defaults = { choice: 8, blank: 2, solve: 3, custom: 0 };
    var rows = types.map(function (t) {
      return '<div class="rand-row">' +
        '<span class="rand-name"><input type="checkbox" data-type="' + t + '" checked> ' + (store.TYPE_NAMES[t]) + '</span>' +
        '<input type="number" min="0" value="' + defaults[t] + '" data-num="' + t + '"></div>';
    }).join('');
    var tags = store.allTags();
    var tagOptions = '<option value="">不限</option>' + tags.map(function (t) { return '<option value="' + MSP.escapeHtml(t) + '">' + MSP.escapeHtml(t) + '</option>'; }).join('');
    var body =
      '<p class="side-hint" style="margin-top:0">从题库中随机抽取指定数量的题目（同一题不会重复出现）。</p>' +
      rows +
      '<div class="rand-row"><span class="rand-name">难度不高于</span>' +
      '<select id="rand-diff"><option value="3">较难（全部）</option><option value="2">中等</option><option value="1">容易</option></select></div>' +
      '<div class="rand-row"><span class="rand-name">限定知识点</span><select id="rand-tag">' + tagOptions + '</select></div>' +
      '<div class="rand-row"><span class="rand-name">结果去向</span>' +
      '<select id="rand-dest"><option value="new">生成新试卷</option><option value="append">追加到当前试卷</option></select></div>' +
      '<div class="rand-summary" id="rand-summary"></div>';

    var box = modalShell('随机抽题组卷', body, '开始抽题', function () {
      var plan = {};
      var ok = false;
      box.querySelectorAll('[data-type]').forEach(function (cb) {
        if (cb.checked) {
          var n = Number(box.querySelector('[data-num="' + cb.dataset.type + '"]').value) || 0;
          if (n > 0) { plan[cb.dataset.type] = n; ok = true; }
        }
      });
      if (!ok) { MSP.toast('请至少勾选一种题型并填写数量', 'err'); return false; }
      doRandom(plan);
    });

    var refresh = function () {
      var maxDiff = Number($('rand-diff').value);
      var tag = $('rand-tag').value;
      var sumN = 0, sumS = 0, shortage = [];
      box.querySelectorAll('[data-type]').forEach(function (cb) {
        if (!cb.checked) return;
        var t = cb.dataset.type;
        var want = Number(box.querySelector('[data-num="' + t + '"]').value) || 0;
        var pool = store.allQuestions().filter(function (q) {
          return q.type === t && Number(q.difficulty) <= maxDiff && (!tag || (q.tags || []).indexOf(tag) >= 0);
        });
        var take = Math.min(want, pool.length);
        if (take < want) shortage.push(store.TYPE_NAMES[t] + ' 只剩 ' + pool.length + ' 题');
        sumN += take;
        pool.slice(0, take).forEach(function (q) { sumS += q.score || 0; });
      });
      var s = '预计抽取 <b>' + sumN + '</b> 题，合计约 <b>' + sumS + '</b> 分';
      if (shortage.length) s += '<br>⚠ ' + MSP.escapeHtml(shortage.join('；'));
      $('rand-summary').innerHTML = s;
    };
    box.addEventListener('input', refresh);
    box.addEventListener('change', refresh);
    refresh();
  }

  function doRandom(plan) {
    var maxDiff = Number($('rand-diff') ? $('rand-diff').value : 3);
    var tag = $('rand-tag') ? $('rand-tag').value : '';
    var dest = $('rand-dest') ? $('rand-dest').value : 'new';
    var picked = [];

    Object.keys(plan).forEach(function (t) {
      var pool = store.allQuestions().filter(function (q) {
        return q.type === t && Number(q.difficulty) <= maxDiff && (!tag || (q.tags || []).indexOf(tag) >= 0);
      });
      shuffle(pool);
      picked = picked.concat(pool.slice(0, plan[t]));
    });

    if (!picked.length) { MSP.toast('没有符合条件的题目', 'err'); return; }

    var paper;
    if (dest === 'append') {
      paper = store.currentPaper();
      picked.forEach(function (q) { store.addItem(paper.id, q.id); });
    } else {
      var d = new Date();
      var stamp = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      paper = store.createPaper('随机组卷 ' + stamp);
      picked.forEach(function (q) { store.addItem(paper.id, q.id); });
    }
    MSP.renderAll();
    MSP.toast('已抽取 ' + picked.length + ' 题 →「' + paper.name + '」');
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ── 导出 ── */
  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
  }

  function exportMarkdown() {
    var paper = store.currentPaper(); if (!paper) return;
    var lines = [];
    lines.push('# ' + (paper.title || paper.name));
    if (paper.subtitle) lines.push('> ' + paper.subtitle);
    if (paper.info) lines.push('> ' + paper.info);
    lines.push('');
    var no = 0;
    store.paperSections(paper).forEach(function (sec, i) {
      var CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      var each = sec.each != null ? '每小题 ' + sec.each + ' 分，' : '';
      lines.push('## ' + (CN[i] || i + 1) + '、' + (store.TYPE_NAMES[sec.type]) + '（共 ' + sec.total + ' 分）');
      lines.push('');
      sec.items.forEach(function (it) {
        no++;
        var q = store.getQuestion(it.qid); if (!q) return;
        lines.push('**' + no + '.** ' + q.stem);
        if (q.options && q.options.length) {
          lines.push('');
          lines.push(q.options.map(function (o) { return (o.label || '') + '. ' + o.text; }).join('　　'));
        }
        lines.push('');
      });
    });
    lines.push('---');
    lines.push('## 参考答案');
    lines.push('');
    no = 0;
    paper.itemIds.forEach(function (qid) {
      no++;
      var q = store.getQuestion(qid);
      if (q) lines.push(no + '. ' + (q.answer || '（略）'));
    });
    var fname = (paper.name || '试卷').replace(/[\\/:*?"<>|]/g, '_') + '.md';
    download(fname, lines.join('\n'), 'text/markdown;charset=utf-8');
  }

  /* ── 导入 ── */
  function importFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var r = store.importJson(reader.result);
        MSP.renderAll();
        MSP.toast('导入成功：' + r.addedQ + ' 题、' + r.addedP + ' 份试卷');
      } catch (e) {
        MSP.toast('导入失败：文件格式不正确', 'err');
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  /* ── 主题 ── */
  function applyTheme() {
    document.body.dataset.theme = store.state.theme || 'light';
    $('btn-theme').textContent = store.state.theme === 'dark' ? '☀️' : '🌙';
  }

  /* ── 总渲染 ── */
  MSP.renderAll = function () {
    renderPaperSelect();
    MSP.paper.render();
    MSP.bank.render();
    updateStats();
  };

  MSP.appOptions = { studentFields: true, answerPage: false, optionCols2: true };

  function loadOptions() {
    try {
      var o = JSON.parse(localStorage.getItem('mathpaper-studio-options') || '{}');
      Object.assign(MSP.appOptions, o);
    } catch (e) {}
    $('opt-student-fields').checked = MSP.appOptions.studentFields;
    $('opt-answer-page').checked = MSP.appOptions.answerPage;
    $('opt-option-cols2').checked = MSP.appOptions.optionCols2;
  }
  function saveOptions() {
    localStorage.setItem('mathpaper-studio-options', JSON.stringify(MSP.appOptions));
  }
  function bindOption(id, key) {
    $(id).addEventListener('change', function () {
      MSP.appOptions[key] = $(id).checked;
      saveOptions();
      MSP.paper.render();
    });
  }

  /* ── 初始化 ── */
  function switchView(v) {
    var isBank = v === 'bank';
    $('tab-paper').classList.toggle('active', !isBank);
    $('tab-bank').classList.toggle('active', isBank);
    $('view-paper').classList.toggle('hidden', isBank);
    $('view-bank').classList.toggle('hidden', !isBank);
    $('panel-paper-stats').classList.toggle('hidden', isBank);
    $('panel-bank-filter').classList.toggle('hidden', !isBank);
  }

  function init() {
    store.load();
    loadOptions();
    applyTheme();
    MSP.editor.init();
    MSP.bank.init();

    /* 顶栏 */
    $('paper-select').addEventListener('change', function () {
      store.state.currentPaperId = this.value;
      store.save();
      MSP.renderAll();
    });
    $('btn-paper-new').addEventListener('click', function () {
      store.createPaper('新试卷 ' + new Date().getHours() + ':' + pad(new Date().getMinutes()));
      MSP.renderAll();
    });
    $('btn-paper-rename').addEventListener('click', openPaperMeta);
    $('btn-paper-dup').addEventListener('click', function () {
      store.duplicatePaper(store.state.currentPaperId);
      MSP.renderAll();
      MSP.toast('已复制试卷');
    });
    $('btn-paper-del').addEventListener('click', function () {
      var p = store.currentPaper();
      MSP.confirmBox('删除试卷', '确定删除试卷「' + p.name + '」？题目会保留在题库中。', function () {
        store.deletePaper(p.id);
        MSP.renderAll();
      }, '删除');
    });

    $('tab-paper').addEventListener('click', function () { switchView('paper'); });
    $('tab-bank').addEventListener('click', function () { switchView('bank'); });

    $('btn-random').addEventListener('click', openRandom);
    $('btn-print').addEventListener('click', function () { window.print(); });

    /* 更多菜单 */
    $('btn-export-menu').addEventListener('click', function (e) {
      e.stopPropagation();
      $('menu-export').classList.toggle('hidden');
    });
    document.addEventListener('click', function () { $('menu-export').classList.add('hidden'); });
    $('menu-export').addEventListener('click', function (e) {
      var act = e.target.dataset.act;
      if (!act) return;
      $('menu-export').classList.add('hidden');
      if (act === 'export-package') download('mathpaper-整包-' + new Date().toISOString().slice(0, 10) + '.json', store.exportPackage());
      if (act === 'export-paper') download((store.currentPaper().name || '试卷').replace(/[\\/:*?"<>|]/g, '_') + '.json', store.exportPaper(store.state.currentPaperId));
      if (act === 'export-md') exportMarkdown();
      if (act === 'import-json') $('file-input').click();
      if (act === 'load-sample') {
        if (MSP.buildSampleData()) { MSP.renderAll(); MSP.toast('示例数据已载入'); }
        else MSP.toast('示例数据已存在', 'err');
      }
      if (act === 'wipe-all') {
        MSP.confirmBox('清空全部数据', '将删除题库与全部试卷，且无法恢复（建议先导出整包 JSON 备份）。确定清空？', function () {
          store.wipe();
          MSP.renderAll();
          MSP.toast('已清空');
        }, '全部清空');
      }
    });
    $('file-input').addEventListener('change', function () {
      if (this.files && this.files[0]) importFile(this.files[0]);
      this.value = '';
    });

    bindOption('opt-student-fields', 'studentFields');
    bindOption('opt-answer-page', 'answerPage');
    bindOption('opt-option-cols2', 'optionCols2');

    $('btn-theme').addEventListener('click', function () {
      store.state.theme = store.state.theme === 'dark' ? 'light' : 'dark';
      store.save();
      applyTheme();
    });

    /* 题库空态按钮 */
    $('btn-bank-new').addEventListener('click', function () { MSP.editor.open(null); });
    $('btn-bank-new2').addEventListener('click', function () { MSP.editor.open(null); });
    $('btn-add-new').addEventListener('click', function () { MSP.editor.open(null, { addAfterSave: true }); });
    $('btn-add-from-bank').addEventListener('click', function () { switchView('bank'); });
    document.querySelector('[data-act="load-sample"]').addEventListener('click', function () {
      if (MSP.buildSampleData()) { MSP.renderAll(); MSP.toast('示例数据已载入'); }
      else MSP.toast('示例数据已存在', 'err');
    });

    /* KaTeX 降级提示 */
    document.addEventListener('msp:katex-failed', function () {
      MSP.toast('数学公式渲染库（KaTeX）加载失败，公式将以原始文本显示。请检查网络后刷新页面。', 'err');
    });

    $('modal-mask').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

    switchView('paper');
    MSP.renderAll();

    /* 首次使用引导 */
    if (!store.allQuestions().length) {
      setTimeout(function () {
        MSP.confirmBox('欢迎使用数学组卷工坊', '题库是空的。要载入一套示例试卷快速体验吗？（随时可在"更多"菜单清空）', function () {
          MSP.buildSampleData();
          MSP.renderAll();
          MSP.toast('示例数据已载入');
        }, '载入示例');
      }, 400);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
