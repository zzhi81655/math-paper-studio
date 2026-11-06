/* MathPaper Studio · paper.js
   组卷视图：所见即所得 A4 卷面渲染（自动分节编号、答案页、悬浮操作） */
(function () {
  'use strict';
  window.MSP = window.MSP || {};
  var CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  var SECTION_TEMPLATES = {
    choice: '选择题：本题共 {count} 小题，每小题 {each} 分，共 {total} 分。在每小题给出的四个选项中，只有一项是符合题目要求的。',
    blank: '填空题：本题共 {count} 小题，每小题 {each} 分，共 {total} 分。把答案填在题中的横线上。',
    solve: '解答题：本题共 {count} 小题，共 {total} 分。解答应写出文字说明、证明过程或演算步骤。',
    custom: '其他题目：本题共 {count} 小题，共 {total} 分。'
  };

  function secTitle(sec) {
    var tpl = SECTION_TEMPLATES[sec.type] || SECTION_TEMPLATES.custom;
    var each = sec.each != null ? sec.each : '分值见各题';
    return tpl
      .replace('{count}', sec.items.length)
      .replace('{each}', each)
      .replace('{total}', sec.total);
  }

  function render() {
    var store = MSP.store;
    var paper = store.currentPaper();
    var sheet = document.getElementById('paper-sheet');
    if (!paper || !sheet) return;

    var opts = MSP.appOptions;
    var html = '';

    /* 卷头 */
    html += '<h1 class="paper-title">' + MSP.escapeHtml(paper.title || '') + '</h1>';
    if (paper.subtitle) html += '<p class="paper-subtitle">' + MSP.escapeHtml(paper.subtitle) + '</p>';
    html += '<p class="paper-info">' + MSP.escapeHtml(paper.info || '') + '</p>';
    html += '<hr class="paper-sep">';
    if (opts.studentFields) {
      html += '<div class="student-fields"><span>班级：＿＿＿＿＿＿＿</span><span>姓名：＿＿＿＿＿＿＿</span><span>考号：＿＿＿＿＿＿＿</span></div>';
    }

    var sections = store.paperSections(paper);
    if (!sections.length) {
      html += '<div class="paper-empty-hint"><p>试卷还是空的。</p><p>点击下方按钮从题库选题，或新写题目。</p></div>';
    } else {
      var qno = 0; // 小题号跨节连续
      sections.forEach(function (sec, i) {
        html += '<div class="paper-sec-head">' + (CN[i] || (i + 1)) + '、' + MSP.escapeHtml(secTitle(sec)) + '</div>';
        sec.items.forEach(function (it) {
          qno++;
          var q = store.getQuestion(it.qid);
          if (!q) return;
          html += renderQuestion(q, qno, it.score);
        });
      });
    }

    /* 答案页 */
    if (opts.answerPage && sections.length) {
      html += '<div class="answer-page-start"><p class="answer-sec-title">参 考 答 案</p></div>';
      var n = 0;
      sections.forEach(function (sec) {
        sec.items.forEach(function (it) {
          n++;
          var q = store.getQuestion(it.qid);
          if (!q) return;
          var ans = q.answer ? q.answer : '（略）';
          html += '<div class="answer-item"><b>' + n + '.</b> <span class="ans-body" data-ans-text="' + MSP.escapeHtml(ans) + '"></span></div>';
        });
      });
    }

    sheet.innerHTML = html;

    /* 数学渲染 */
    MSP.renderTree(sheet);

    /* 答案文本渲染 */
    sheet.querySelectorAll('[data-ans-text]').forEach(function (el) {
      MSP.renderRich(el, el.dataset.ansText);
    });

    /* 悬浮操作按钮绑定 + 拖拽 */
    sheet.querySelectorAll('.paper-q').forEach(function (el) {
      var qid = el.dataset.qid;
      var btnEdit = el.querySelector('[data-op="edit"]');
      var btnDel = el.querySelector('[data-op="del"]');
      if (btnEdit) btnEdit.addEventListener('click', function () { MSP.editor.open(qid); });
      if (btnDel) btnDel.addEventListener('click', function () {
        store.removeItem(paper.id, qid);
        MSP.renderAll();
        MSP.toast('已从试卷移除');
      });
    });
    MSP.enableDrag(sheet, '.paper-q', '.q-drag', function (from, to) {
      store.moveItem(paper.id, from, to);
      MSP.renderAll();
    });
  }

  function renderQuestion(q, no, score) {
    var esc = MSP.escapeHtml;
    var html = '<div class="paper-q" data-qid="' + esc(q.id) + '" data-idx="' + (no - 1) + '">';
    html += '<div class="q-hud">' +
      '<button class="q-drag" title="拖动排序">⋮⋮</button>' +
      '<button data-op="edit" title="编辑题目">✎</button>' +
      '<button data-op="del" title="从试卷移除">✕</button></div>';
    html += '<span class="q-number">' + no + '.</span>';
    if (q.type !== 'choice' && score) html += '<span class="q-score">（' + score + ' 分）</span>';
    html += '<span class="q-stem"></span>';

    if (q.type === 'choice' && q.options && q.options.length) {
      var cols = MSP.appOptions.optionCols2 ? ' cols2' : ' cols1';
      html += '<div class="q-options' + cols + '">';
      q.options.forEach(function (o) {
        html += '<span class="opt"><span class="opt-label">' + esc(o.label || '') + '.</span><span class="opt-text"></span></span>';
      });
      html += '</div>';
    }
    html += '</div>';

    // 延迟渲染数学（先落 DOM 再 renderRich）
    setTimeout(function () {
      var el = document.querySelector('.paper-q[data-qid="' + q.id + '"]');
      if (!el) return;
      var stemEl = el.querySelector('.q-stem');
      if (stemEl) MSP.renderRich(stemEl, q.stem);
      el.querySelectorAll('.opt-text').forEach(function (t, i) {
        if (q.options[i]) MSP.renderRich(t, q.options[i].text);
      });
    }, 0);
    return html;
  }

  MSP.paper = {
    render: render
  };
})();
