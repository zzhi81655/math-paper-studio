/* MathPaper Studio · bank.js
   题库视图：筛选、卡片列表、加入试卷、编辑/复制/删除 */
(function () {
  'use strict';
  window.MSP = window.MSP || {};

  var filter = { q: '', type: '', diff: '', tag: '' };

  function currentList() {
    var store = MSP.store;
    var kw = filter.q.trim().toLowerCase();
    return store.allQuestions().filter(function (q) {
      if (filter.type && q.type !== filter.type) return false;
      if (filter.diff && Number(q.difficulty) !== Number(filter.diff)) return false;
      if (filter.tag && (q.tags || []).indexOf(filter.tag) < 0) return false;
      if (kw) {
        var hay = (q.stem + ' ' + (q.answer || '') + ' ' + (q.analysis || '') + ' ' + (q.source || '')).toLowerCase();
        if (hay.indexOf(kw) < 0) return false;
      }
      return true;
    });
  }

  function render() {
    var store = MSP.store;
    var listEl = document.getElementById('bank-list');
    var emptyEl = document.getElementById('bank-empty');
    var badge = document.getElementById('bank-total-badge');
    var all = store.allQuestions();
    var list = currentList();

    badge.textContent = all.length + ' 题';
    var shown = list.slice(0, 60);
    document.getElementById('bank-count').textContent = list.length > 60
      ? '符合条件的题目：' + list.length + ' 个（仅显示前 60，可用关键词缩小范围）'
      : '符合条件的题目：' + list.length + ' / ' + all.length;

    listEl.innerHTML = '';
    emptyEl.classList.toggle('hidden', all.length > 0);

    shown.forEach(function (q) {
      var card = document.createElement('div');
      card.className = 'bank-card';
      var used = store.questionUsedCount(q.id);
      var meta =
        '<span class="tag t-' + q.type + '">' + (store.TYPE_NAMES[q.type] || '其他') + '</span>' +
        '<span class="tag diff-' + q.difficulty + '">' + (store.DIFF_NAMES[q.difficulty] || '中等') + '</span>' +
        '<span class="tag">' + (q.score || 0) + ' 分</span>' +
        (used ? '<span class="tag">已被 ' + used + ' 份试卷使用</span>' : '') +
        (q.tags || []).map(function (t) { return '<span class="tag"># ' + MSP.escapeHtml(t) + '</span>'; }).join('');
      card.innerHTML =
        '<div class="bank-main">' +
          '<div class="bank-meta">' + meta + '</div>' +
          '<div class="bank-stem"></div>' +
          '<div class="bank-foot">' +
            (q.source ? '<span class="src">来源：' + MSP.escapeHtml(q.source) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="bank-ops">' +
          '<button class="btn btn-sm btn-primary" data-op="add">＋ 加入试卷</button>' +
          '<button class="btn btn-sm" data-op="edit">编辑</button>' +
          '<button class="btn btn-sm" data-op="copy">复制</button>' +
          '<button class="btn btn-sm btn-danger" data-op="del">删除</button>' +
        '</div>';
      card.querySelector('.bank-stem').textContent = MSP.plainText(q.stem).slice(0, 160) || '（无题干）';
      // 用渲染版替代纯文本：保留数学观感
      var stemEl = card.querySelector('.bank-stem');
      MSP.renderRich(stemEl, q.stem);

      card.querySelector('[data-op="add"]').addEventListener('click', function () {
        var paper = store.currentPaper();
        if (paper.itemIds.indexOf(q.id) >= 0) { MSP.toast('这道题已在当前试卷中', 'err'); return; }
        store.addItem(paper.id, q.id);
        MSP.renderAll();
        MSP.toast('已加入「' + paper.name + '」');
      });
      card.querySelector('[data-op="edit"]').addEventListener('click', function () { MSP.editor.open(q.id); });
      card.querySelector('[data-op="copy"]').addEventListener('click', function () {
        var copy = JSON.parse(JSON.stringify(q));
        delete copy.id; delete copy.createdAt; delete copy.updatedAt;
        store.upsertQuestion(copy);
        MSP.renderAll();
        MSP.toast('已复制为新题目');
      });
      card.querySelector('[data-op="del"]').addEventListener('click', function () {
        MSP.confirmBox('删除题目', '删除后将从所有试卷中移除该题，且不可恢复。确定删除？', function () {
          store.deleteQuestion(q.id);
          MSP.renderAll();
          MSP.toast('已删除');
        });
      });

      listEl.appendChild(card);
    });

    refreshTagOptions();
  }

  function refreshTagOptions() {
    var sel = document.getElementById('filter-tag');
    var cur = filter.tag;
    var tags = MSP.store.allTags();
    sel.innerHTML = '<option value="">全部</option>' + tags.map(function (t) {
      return '<option value="' + MSP.escapeHtml(t) + '"' + (t === cur ? ' selected' : '') + '>' + MSP.escapeHtml(t) + '</option>';
    }).join('');
    var dl = document.getElementById('tag-list');
    dl.innerHTML = tags.map(function (t) { return '<option value="' + MSP.escapeHtml(t) + '">'; }).join('');
  }

  MSP.bank = {
    render: render,
    filter: filter,
    refreshTags: refreshTagOptions,
    init: function () {
      var bind = function (id, key, evt) {
        var el = document.getElementById(id);
        el.addEventListener(evt || 'input', function () {
          filter[key] = el.value;
          render();
        });
      };
      bind('filter-q', 'q');
      bind('filter-type', 'type', 'change');
      bind('filter-diff', 'diff', 'change');
      bind('filter-tag', 'tag', 'change');
    }
  };
})();
