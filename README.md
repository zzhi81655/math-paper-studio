# MathPaper Studio · 数学组卷工坊

> 浏览器里的数学试卷排版工坊：题库管理、LaTeX 实时渲染、智能组卷、一键打印成 PDF。
> An in-browser exam builder for math teachers: question bank, live LaTeX rendering, smart paper assembly, one-click print to PDF.

[![No Build](https://img.shields.io/badge/build-none-yellow)](#)
[![Dependencies](https://img.shields.io/badge/dependencies-zero_:%20KaTeX%20CDN_only-orange)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**双击 `index.html` 就能用。** 无需安装、无需登录、无需服务器——数据保存在你自己的浏览器里，不上传任何服务器。

---

## 你是不是遇到了这些？

| 场景 | 传统做法 | 用本工具 |
|---|---|---|
| 出卷时公式打不出来 | Word 公式编辑器点半天 | 直接写 `$\frac{\pi}{3}$`，实时预览 |
| 卷子排版：节标题、题号、分值 | 手动编号，加题后全部重排 | **自动分节 + 跨节连续编号 + 总分实时统计** |
| 想从积累的题目里快速组一套卷 | 翻文件夹、复制粘贴 | 题库筛选 → 🎲 随机抽题 → 一键成卷 |
| 卷面要 A4 标准格式 | 反复调页边距和字体 | 所见即所得 A4 纸，打印即出标准试卷 |
| 同一道题多份卷子重复用 | 到处复制，改一题要改多处 | 题库一处存储，多卷引用 |

## 功能

**题库**
- 题目四要素：题干 / 选项 / 答案 / 解析，全部支持 Markdown 与 LaTeX（`$行内$`、`$$独立$$`）
- 题型（选择/填空/解答/其他）、难度、分值、知识点标签、来源
- 按题型、难度、标签、关键词筛选；引用计数显示每道题被几份试卷使用

**编辑体验**
- 符号工具栏：分式、根式、求和、积分、几何符号、分段函数、矩阵……点一下插入光标处，选中文字可智能包裹
- 实时预览 + **LaTeX 公式错误即时定位**（写错公式当场标红，不用等打印才发现）
- `Ctrl/Cmd + S` 快速保存

**组卷**
- 🎲 **随机抽题组卷**：按题型数量 + 难度上限 + 知识点限定随机抽题，实时预估总分
- 自动按题型分节，生成标准节标题（"一、选择题：本题共 8 小题，每小题 5 分，共 40 分……"）
- 卷面总分 vs 目标分实时对比；题型分布、难度分布可视化
- 题目拖拽排序；单卷分值覆写（不改题库原值）
- 卷首学生信息栏、卷末参考答案页（不含解析），均可开关

**版式与输出**
- A4 所见即所得，宋体正文 + 黑体标题的中文试卷惯例
- 打印分页控制：节标题不孤行、题目不跨页断开、答案页强制另起一页
- 选择题选项双栏排布（可切换）
- 导出：打印/PDF、单卷 JSON、整包 JSON（备份/迁移）、Markdown（含 LaTeX，可进其他工具链）

## 快速开始

```text
1. 双击 index.html（或部署到任意静态托管）
2. 首次打开 → 载入示例试卷，看看排版效果
3. 切到「题库」新建自己的题目，或导入 JSON
4. 回到「组卷」拖拽排序、调分值，总分对上目标后点「打印」
```

> 需要联网加载 KaTeX（数学渲染库，来自 jsdelivr CDN）。加载失败时应用自动降级为纯文本模式，不会白屏。

## 数据与隐私

- 全部数据存于浏览器 `localStorage`，**不经过任何服务器**
- 「更多 → 导出整包 JSON」是完整备份；换电脑/换浏览器时导入即可
- 「清空全部数据」前建议先导出备份

## 技术说明

| 项 | 说明 |
|---|---|
| 架构 | 纯原生 HTML/CSS/JS，零框架、零构建、零 npm 依赖 |
| 数学渲染 | KaTeX（CDN），`throwOnError: false` + 逐段探测实现错误提示 |
| 持久化 | localStorage，`v1` 版本化数据结构 |
| 打印 | `@page A4` + `break-inside: avoid` 分页策略，Chromium/Edge 实测 |
| 安全 | 所有用户内容先 HTML 转义再渲染，导入 JSON 不执行任何代码 |

## 目录结构

```text
index.html        单页应用入口
css/style.css     双主题 UI + A4 试卷版式 + 打印规则
js/
  app.js          入口：顶栏/统计/随机抽题/导入导出
  store.js        数据模型与 localStorage
  paper.js        组卷视图：分节编号/答案页
  bank.js         题库视图与筛选
  editor.js       题目编辑器抽屉
  katex-render.js KaTeX 加载检测/降级/错误探测
  md-lite.js      极轻量安全 Markdown
  toolbar.js      数学符号工具栏
  dnd.js          拖拽排序
  sample.js       示例数据
```

## 常见问题

**Q: 换浏览器后数据不见了？**
A: localStorage 按浏览器独立存储。用「导出整包 JSON」迁移。

**Q: 公式显示的是 `$...$` 原文？**
A: KaTeX CDN 没加载成功（网络问题）。检查网络后刷新；应用会以 toast 提示。

**Q: 支持多选题/判断题吗？**
A: 用"其他"题型即可。选项数量 2~8 个可增减。

**Q: 能导出 Word 吗？**
A: 导出 Markdown（含 LaTeX）后可用 Pandoc 转 Word；直接打印成 PDF 是最保真的路径。

## License

MIT
