/* MathPaper Studio · sample.js
   示例数据：一套典型的高中数学试卷（集合/函数/三角/数列/立体几何），
   题目内容为通用教学示例，方便新用户快速了解用法。所有答案已验算。 */
(function () {
  'use strict';
  window.MSP = window.MSP || {};

  var NOW = Date.now();
  var Q = [
    {
      id: 'q-sample-1', type: 'choice', difficulty: 1, score: 5,
      stem: '已知集合 $A=\\{x \\mid x^2-3x+2=0\\}$，$B=\\{1, 2, 3\\}$，则 $A \\cup B =$（　　）',
      options: [
        { label: 'A', text: '$\\{1, 2\\}$' },
        { label: 'B', text: '$\\{1, 2, 3\\}$' },
        { label: 'C', text: '$\\{0, 1, 2, 3\\}$' },
        { label: 'D', text: '$\\{2, 3\\}$' }
      ],
      answer: 'B',
      analysis: '$A=\\{1,2\\}$，故 $A \\cup B=\\{1,2,3\\}$。',
      tags: ['集合'], source: '示例', createdAt: NOW
    },
    {
      id: 'q-sample-2', type: 'choice', difficulty: 2, score: 5,
      stem: '函数 $f(x)=\\ln(x^2-4)$ 的定义域为（　　）',
      options: [
        { label: 'A', text: '$(-2, 2)$' },
        { label: 'B', text: '$[-2, 2]$' },
        { label: 'C', text: '$(-\\infty, -2) \\cup (2, +\\infty)$' },
        { label: 'D', text: '$(2, +\\infty)$' }
      ],
      answer: 'C',
      analysis: '需 $x^2-4>0$，即 $x>2$ 或 $x<-2$。',
      tags: ['函数', '定义域'], source: '示例', createdAt: NOW
    },
    {
      id: 'q-sample-3', type: 'choice', difficulty: 2, score: 5,
      stem: '已知 $\\sin\\alpha=\\dfrac{3}{5}$，且 $\\alpha$ 为第二象限角，则 $\\cos 2\\alpha =$（　　）',
      options: [
        { label: 'A', text: '$\\dfrac{7}{25}$' },
        { label: 'B', text: '$-\\dfrac{7}{25}$' },
        { label: 'C', text: '$\\dfrac{24}{25}$' },
        { label: 'D', text: '$-\\dfrac{24}{25}$' }
      ],
      answer: 'A',
      analysis: '$\\cos\\alpha=-\\dfrac{4}{5}$，$\\cos 2\\alpha = 1-2\\sin^2\\alpha=\\dfrac{7}{25}$。',
      tags: ['三角函数'], source: '示例', createdAt: NOW
    },
    {
      id: 'q-sample-4', type: 'choice', difficulty: 3, score: 5,
      stem: '等比数列 $\\{a_n\\}$ 中，$a_1=2$，前 $3$ 项和 $S_3=26$，则公比 $q$ 等于（　　）',
      options: [
        { label: 'A', text: '$3$' },
        { label: 'B', text: '$-3$ 或 $2$' },
        { label: 'C', text: '$3$ 或 $-4$' },
        { label: 'D', text: '$2$ 或 $-3$' }
      ],
      answer: 'C',
      analysis: '$2(1+q+q^2)=26$，即 $q^2+q-12=0$，解得 $q=3$ 或 $q=-4$，均满足 $S_3=26$。',
      tags: ['数列'], source: '示例', createdAt: NOW
    },
    {
      id: 'q-sample-5', type: 'blank', difficulty: 2, score: 5,
      stem: '曲线 $y=x^3-2x+1$ 在点 $(1, 0)$ 处的切线方程为＿＿＿＿。',
      options: [], answer: '$y=x-1$',
      analysis: '$y\'=3x^2-2$，在 $x=1$ 处切线斜率 $k=1$，切线为 $y=x-1$。',
      tags: ['导数', '切线'], source: '示例', createdAt: NOW
    },
    {
      id: 'q-sample-6', type: 'blank', difficulty: 1, score: 5,
      stem: '已知向量 $\\vec{a}=(1, 2)$，$\\vec{b}=(x, -1)$，若 $\\vec{a} \\perp \\vec{b}$，则 $x=$＿＿＿＿。',
      options: [], answer: '$2$',
      analysis: '$\\vec{a} \\cdot \\vec{b} = x-2=0$，故 $x=2$。',
      tags: ['平面向量'], source: '示例', createdAt: NOW
    },
    {
      id: 'q-sample-7', type: 'solve', difficulty: 2, score: 13,
      stem: '在 $\\triangle ABC$ 中，角 $A$、$B$、$C$ 所对的边分别为 $a$、$b$、$c$。已知 $b\\cos A + a\\cos B = 2c\\cos C$。\n(1) 求角 $C$ 的大小；\n(2) 若 $c=2$，求 $\\triangle ABC$ 面积的最大值。',
      options: [],
      answer: '(1) $C=\\dfrac{\\pi}{3}$；(2) 面积最大值为 $\\sqrt{3}$。',
      analysis: '(1) 由射影定理 $b\\cos A+a\\cos B=c$，故 $c=2c\\cos C$，$\\cos C=\\dfrac{1}{2}$，$C=60^{\\circ}$。\n(2) $a^2+b^2-ab=4$，由 $a^2+b^2\\ge 2ab$ 得 $ab\\le 4$，$S=\\dfrac{1}{2}ab\\sin C=\\dfrac{\\sqrt{3}}{4}ab\\le \\sqrt{3}$，当 $a=b=2$ 时取等。',
      tags: ['解三角形'], source: '示例', createdAt: NOW
    },
    {
      id: 'q-sample-8', type: 'solve', difficulty: 3, score: 15,
      stem: '如图（略），在正方体 $ABCD-A_1B_1C_1D_1$ 中，棱长为 $2$。以 $D$ 为原点，$DA$、$DC$、$DD_1$ 所在直线分别为 $x$、$y$、$z$ 轴建立空间直角坐标系。\n(1) 求证：$BD_1 \\perp$ 平面 $A_1C_1D$；\n(2) 求点 $B$ 到平面 $A_1C_1D$ 的距离。',
      options: [],
      answer: '(2) 点 $B$ 到平面 $A_1C_1D$ 的距离为 $\\dfrac{4\\sqrt{3}}{3}$。',
      analysis: '各点坐标：$D(0,0,0)$、$A_1(2,0,2)$、$C_1(0,2,2)$、$B(2,2,0)$、$D_1(0,0,2)$。\n(1) $\\overrightarrow{BD_1}=(-2,-2,2)$，$\\overrightarrow{A_1C_1}=(-2,2,0)$，$\\overrightarrow{DA_1}=(2,0,2)$；$\\overrightarrow{BD_1}\\cdot\\overrightarrow{A_1C_1}=0$，$\\overrightarrow{BD_1}\\cdot\\overrightarrow{DA_1}=0$，且两向量相交，故 $BD_1\\perp$ 平面 $A_1C_1D$。\n(2) 平面 $A_1C_1D$ 的法向量 $\\vec{n}=(1,1,-1)$，距离 $d=\\dfrac{|\\overrightarrow{DB}\\cdot\\vec{n}|}{|\\vec{n}|}=\\dfrac{4}{\\sqrt{3}}=\\dfrac{4\\sqrt{3}}{3}$。',
      tags: ['立体几何', '空间向量'], source: '示例', createdAt: NOW
    },
    {
      id: 'q-sample-9', type: 'solve', difficulty: 2, score: 15,
      stem: '在数列 $\\{a_n\\}$ 中，$a_1=1$，$a_{n+1}=2a_n+1$。\n(1) 证明：数列 $\\{a_n+1\\}$ 是等比数列，并求 $\\{a_n\\}$ 的通项公式；\n(2) 设 $b_n=a_n \\cdot 2^n$，求数列 $\\{b_n\\}$ 的前 $n$ 项和 $T_n$。',
      options: [],
      answer: '(1) $a_n=2^n-1$；(2) $T_n=\\dfrac{4^{n+1}-4}{3}-2^{n+1}+2$。',
      analysis: '(1) $a_{n+1}+1=2(a_n+1)$，首项 $a_1+1=2$，公比 $2$，故 $a_n+1=2^n$，$a_n=2^n-1$。\n(2) $b_n=(2^n-1)2^n=4^n-2^n$，$T_n=\\sum 4^n-\\sum 2^n=\\dfrac{4(4^n-1)}{3}-\\dfrac{2(2^n-1)}{1}=\\dfrac{4^{n+1}-4}{3}-2^{n+1}+2$。',
      tags: ['数列'], source: '示例', createdAt: NOW
    },
    {
      id: 'q-sample-10', type: 'custom', difficulty: 1, score: 5,
      stem: '（附加题）计算：$\\displaystyle\\lim_{n \\to \\infty}\\left(\\frac{1}{n^2}+\\frac{2}{n^2}+\\cdots+\\frac{n}{n^2}\\right)=$＿＿＿。',
      options: [], answer: '$\\dfrac{1}{2}$',
      analysis: '分子为 $\\dfrac{n(n+1)}{2}$，极限为 $\\dfrac{1}{2}$。',
      tags: ['极限'], source: '示例', createdAt: NOW
    }
  ];

  MSP.buildSampleData = function () {
    var store = MSP.store;
    if (store.getQuestion('q-sample-1')) return false; // 已载入过
    Q.forEach(function (q) { store.state.questions[q.id] = q; });
    var p = store.createPaper('示例试卷 · 高二数学期中（样例）', false);
    p.title = '高二数学期中考试试卷';
    p.subtitle = '（考试范围：集合、函数、三角函数、数列、立体几何）';
    p.info = '考试时间：120 分钟　满分：120 分';
    p.targetScore = 120;
    p.itemIds = Q.map(function (q) { return q.id; });
    store.save();
    return true;
  };
})();
