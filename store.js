/* MathPaper Studio · store.js
   数据模型 + localStorage 持久化 + CRUD */
(function () {
  'use strict';
  window.MSP = window.MSP || {};
  var KEY = 'mathpaper-studio-v1';
  var TYPE_NAMES = { choice: '选择题', blank: '填空题', solve: '解答题', custom: '其他' };
  var DIFF_NAMES = { 1: '容易', 2: '中等', 3: '较难' };
  var TYPE_ORDER = { choice: 0, blank: 1, solve: 2, custom: 3 };

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function blankState() {
    return {
      version: 1,
      theme: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light',
      questions: {},   // id -> question
      papers: {},      // id -> paper
      paperOrder: [],  // paper ids，保持下拉框顺序
      currentPaperId: null
    };
  }

  var S = blankState();

  MSP.store = {
    get state() { return S; },
    TYPE_NAMES: TYPE_NAMES,
    DIFF_NAMES: DIFF_NAMES,

    load: function () {
      try {
        var raw = localStorage.getItem(KEY);
        if (raw) {
          var saved = JSON.parse(raw);
          if (saved && saved.version === 1) {
            S = Object.assign(blankState(), saved);
            S.questions = S.questions || {};
            S.papers = S.papers || {};
            S.paperOrder = Array.isArray(S.paperOrder) ? S.paperOrder : Object.keys(S.papers);
          }
        }
      } catch (e) { /* 数据损坏则从空开始 */ }
      // 保证至少有一份试卷
      if (!S.paperOrder.length) {
        var p = this.createPaper('未命名试卷', true);
        S.currentPaperId = p.id;
      }
      if (!S.currentPaperId || !S.papers[S.currentPaperId]) S.currentPaperId = S.paperOrder[0];
      return S;
    },

    save: function () {
      try { localStorage.setItem(KEY, JSON.stringify(S)); }
      catch (e) {
        if (window.MSP.toast) MSP.toast('保存失败：浏览器存储空间不足', 'err');
      }
    },

    /* ── 题目 ── */
    getQuestion: function (id) { return S.questions[id] || null; },

    upsertQuestion: function (q) {
      var now = Date.now();
      if (!q.id) q.id = uid('q');
      q.updatedAt = now;
      if (!q.createdAt) q.createdAt = now;
      q.options = Array.isArray(q.options) ? q.options.filter(function (o) { return o && o.text && o.text.trim(); }) : [];
      q.tags = Array.isArray(q.tags) ? q.tags.map(function (t) { return t.trim(); }).filter(Boolean) : [];
      q.score = Math.max(0, Number(q.score) || 0);
      q.difficulty = Number(q.difficulty) || 2;
      S.questions[q.id] = q;
      this.save();
      return q;
    },

    deleteQuestion: function (id) {
      delete S.questions[id];
      // 从所有试卷中移除引用
      Object.keys(S.papers).forEach(function (pid) {
        var p = S.papers[pid];
        p.itemIds = p.itemIds.filter(function (x) { return x !== id; });
        if (p.overrides) delete p.overrides[id];
      });
      this.save();
    },

    allQuestions: function () {
      return Object.values(S.questions).sort(function (a, b) { return b.createdAt - a.createdAt; });
    },

    allTags: function () {
      var set = {};
      Object.values(S.questions).forEach(function (q) { (q.tags || []).forEach(function (t) { set[t] = 1; }); });
      return Object.keys(set).sort(function (a, b) { return a.localeCompare(b, 'zh'); });
    },

    questionUsedCount: function (id) {
      var n = 0;
      Object.values(S.papers).forEach(function (p) { if (p.itemIds.indexOf(id) >= 0) n++; });
      return n;
    },

    /* ── 试卷 ── */
    getPaper: function (id) { return S.papers[id] || null; },
    currentPaper: function () { return S.papers[S.currentPaperId] || null; },

    createPaper: function (name, silent) {
      var p = {
        id: uid('p'), name: name || '未命名试卷',
        title: name || '数学试卷', subtitle: '',
        info: '考试时间：120 分钟　满分：150 分',
        targetScore: 150,
        itemIds: [], overrides: {},
        createdAt: Date.now()
      };
      S.papers[p.id] = p;
      S.paperOrder.push(p.id);
      if (!silent) S.currentPaperId = p.id;
      this.save();
      return p;
    },

    duplicatePaper: function (id) {
      var src = S.papers[id]; if (!src) return null;
      var p = JSON.parse(JSON.stringify(src));
      p.id = uid('p'); p.name = src.name + '（副本）'; p.createdAt = Date.now();
      S.papers[p.id] = p; S.paperOrder.push(p.id); S.currentPaperId = p.id;
      this.save();
      return p;
    },

    deletePaper: function (id) {
      delete S.papers[id];
      S.paperOrder = S.paperOrder.filter(function (x) { return x !== id; });
      if (!S.paperOrder.length) this.createPaper('未命名试卷', true);
      if (S.currentPaperId === id) S.currentPaperId = S.paperOrder[0];
      this.save();
    },

    /* ── 试卷-题目操作 ── */
    addItem: function (paperId, qid) {
      var p = S.papers[paperId]; if (!p || p.itemIds.indexOf(qid) >= 0) return;
      p.itemIds.push(qid);
      this.save();
    },

    removeItem: function (paperId, qid) {
      var p = S.papers[paperId]; if (!p) return;
      p.itemIds = p.itemIds.filter(function (x) { return x !== qid; });
      if (p.overrides) delete p.overrides[qid];
      this.save();
    },

    moveItem: function (paperId, from, to) {
      var p = S.papers[paperId]; if (!p) return;
      var arr = p.itemIds;
      if (from < 0 || from >= arr.length) return;
      var x = arr.splice(from, 1)[0];
      arr.splice(Math.max(0, Math.min(arr.length, to)), 0, x);
      this.save();
    },

    setOverride: function (paperId, qid, score) {
      var p = S.papers[paperId]; if (!p) return;
      var q = S.questions[qid];
      if (q && score === q.score) { if (p.overrides) delete p.overrides[qid]; }
      else { p.overrides = p.overrides || {}; p.overrides[qid] = score; }
      this.save();
    },

    /* 试卷内某题实际分值 */
    itemScore: function (paper, qid) {
      var q = S.questions[qid];
      if (!q) return 0;
      if (paper && paper.overrides && paper.overrides[qid] != null) return Number(paper.overrides[qid]) || 0;
      return q.score || 0;
    },

    /* 试卷分节：按题型自动分组（保持 itemIds 相对顺序） */
    paperSections: function (paper) {
      var self = this;
      var buckets = {}; // type -> [{qid, score}]
      (paper.itemIds || []).forEach(function (qid) {
        var q = S.questions[qid]; if (!q) return;
        var t = q.type || 'custom';
        (buckets[t] = buckets[t] || []).push({ qid: qid, score: self.itemScore(paper, qid) });
      });
      return Object.keys(TYPE_ORDER).sort(function (a, b) { return TYPE_ORDER[a] - TYPE_ORDER[b]; })
        .filter(function (t) { return buckets[t] && buckets[t].length; })
        .map(function (t) {
          var items = buckets[t];
          var total = items.reduce(function (s, it) { return s + it.score; }, 0);
          var scores = items.map(function (it) { return it.score; });
          var each = (scores.every(function (v) { return v === scores[0]; })) ? scores[0] : null;
          return { type: t, items: items, total: total, each: each };
        });
    },

    paperTotal: function (paper) {
      return (paper.itemIds || []).reduce(function (s, qid) { return s + this.itemScore(paper, qid); }.bind(this), 0);
    },

    replaceAll: function (newState) {
      S = Object.assign(blankState(), newState);
      this.save();
      return S;
    },

    exportPackage: function () {
      return JSON.stringify({ app: 'math-paper-studio', version: 1, exportedAt: new Date().toISOString(), state: S }, null, 2);
    },

    exportPaper: function (paperId) {
      var p = S.papers[paperId]; if (!p) return '';
      var qs = (p.itemIds || []).map(function (id) { return S.questions[id]; }).filter(Boolean);
      return JSON.stringify({ app: 'math-paper-studio', version: 1, kind: 'paper', paper: p, questions: qs }, null, 2);
    },

    /* 导入整包或单卷；id 冲突时重新生成 id。返回导入统计 */
    importJson: function (json) {
      var data = JSON.parse(json);
      var addedQ = 0, addedP = 0, reid = {};
      function mapId(id) { return typeof id === 'string' && S.questions[id] && !reid[id] ? null : id; }

      var questions = data.questions || (data.state && data.state.questions) || {};
      var papers = data.paper ? { [data.paper.id]: data.paper } : (data.state && data.state.papers) || {};

      Object.values(questions).forEach(function (q) {
        if (!q || !q.stem) return;
        var nid = (!S.questions[q.id]) ? q.id : uid('q');
        if (nid !== q.id) reid[q.id] = nid;
        q.id = nid;
        S.questions[nid] = q; addedQ++;
      });

      var self = this;
      Object.values(papers).forEach(function (p) {
        if (!p || !Array.isArray(p.itemIds)) return;
        var nid = (!S.papers[p.id]) ? p.id : uid('p');
        p.id = nid;
        p.itemIds = p.itemIds.map(function (id) { return reid[id] || id; }).filter(function (id) { return S.questions[id]; });
        if (!p.overrides) p.overrides = {};
        S.papers[nid] = p; S.paperOrder.push(nid); addedP++;
      });

      if (!S.paperOrder.length) self.createPaper('未命名试卷', true);
      if (addedP) S.currentPaperId = S.paperOrder[S.paperOrder.length - 1];
      this.save();
      return { addedQ: addedQ, addedP: addedP };
    },

    wipe: function () {
      S = blankState();
      var p = this.createPaper('未命名试卷', true);
      S.currentPaperId = p.id;
      this.save();
    },

    uid: uid
  };
})();
