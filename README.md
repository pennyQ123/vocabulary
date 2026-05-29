# 词汇流动屋 — 项目文档

## 一、项目概述

**词汇流动屋** 是一个基于 React + Vite 的雅思易混词速刷 SPA，单词数据存储于本地 IndexedDB，并通过 GitHub Gist API 实现跨设备进度同步。

- 约 11,000 词条，主数据来源：`src/data/vocab.json`
- 辨析数据来源：`src/data/synonyms.json`
- 数据库：Dexie（IndexedDB 封装）
- 跨设备同步：GitHub Gist API（PATCH/GET）

---

## 二、技术栈

| 类别 | 技术 |
|---|---|
| 框架 | React 19 + Vite |
| 路由 | React Router DOM（HashRouter，#/drill、#/leaderboard、#/analysis） |
| 数据库 | Dexie（IndexedDB wrapper） |
| 样式 | CSS Custom Properties + 内联样式 |
| 同步 | GitHub Gist API（PATCH/GET） |
| 艾宾浩斯 | 自研 SM-2 变体算法 |

---

## 三、文件结构

```
src/
├── App.jsx                      # 根组件（Drill/Leaderboard/Analysis 三栏导航）
├── main.jsx                     # 入口
├── index.css                    # 全局样式（引入 base.css）
│
├── components/layout/
│   ├── Layout.jsx               # 布局容器（Header + Outlet + TabBar）
│   ├── Header.jsx               # 顶部搜索栏
│   └── TabBar.jsx              # 底部 Tab 导航
│
├── pages/
│   ├── Drill.jsx + Drill.css    # 速刷页面（核心）
│   ├── Leaderboard.jsx + .css   # 错词排行榜
│   ├── Analysis.jsx + .css     # 近义词辨析页面
│   ├── Home.jsx                 # 首页
│   ├── Library.jsx              # 词库浏览
│   ├── Review.jsx               # 复习模式（艾宾浩斯）
│   ├── Quiz.jsx                 # 测验模式（选择题）
│   ├── WordDetail.jsx           # 单词详情
│   └── Profile.jsx             # 个人统计
│
├── store/
│   └── drillStore.js            # 核心数据层（含 Gist 同步）
│
├── utils/
│   ├── storage.js               # IndexedDB 操作（独立词库版，被部分页面引用）
│   └── ebbinghaus.js            # 艾宾浩斯复习算法
│
├── data/
│   ├── vocab.json               # 主词库（约 11,000 词）
│   └── synonyms.json            # 近义词辨析数据
│
└── styles/
    ├── variables.css            # CSS 变量（颜色/字体/圆角/阴影等）
    └── base.css                 # 全局基础样式
```

---

## 四、数据模型

### 4.1 IndexedDB — drillStore（速刷系统）

数据库名：`VocabAntiqueHouse_v2`

| 表名 | Key | 字段 |
|---|---|---|
| `vocab` | `word` | word, phonetic, pos, definitions, examples, memory, collocations, synGroup 等 |
| `drillProgress` | `word` | word, total, correct, unknownCount, lastDrill |

### 4.2 IndexedDB — storage.js（独立词库版，部分页面使用）

数据库名：`VocabAntiqueHouse`

| 表名 | Key | 字段 |
|---|---|---|
| `vocab` | `word` | 同上 |
| `memory` | `word` | word, level, interval, easeFactor, nextReview, lastReview, errorCount |
| `notes` | `++id, word` | id, word, content, createdAt |
| `quizRecords` | `++id, date` | id, date, total, correct, score, mode, improvement |
| `wrongQuestions` | `word` | word, questionId, errorCount, lastError, removed |

### 4.3 GitHub Gist 同步格式

```json
{
  "hydrogen": { "total": 5, "correct": 4, "unknownCount": 0, "lastDrill": 174... },
  "oxygen": { "total": 3, "correct": 1, "unknownCount": 2, "lastDrill": 174... }
}
```

Gist Token：`VITE_GIST_TOKEN`（环境变量）
Gist ID：`f4af5288641e645de4b42de84a1fa2b1`

---

## 五、核心逻辑

### 5.1 速刷（Drill）流程

```
App 加载 → initVocab() 导入 vocab.json → restoreFromGist() 合并远程进度
                                              ↓
getDrillQueue() → 按 unknownCount↓ → 词性优先级 → 随机 打分
                                              ↓
setDrillResult(word, known)
  ├─ 本地：db.drillProgress.put({ word, total, correct, unknownCount, lastDrill })
  └─ 远程：fetchGistProgress() → merge → pushGistProgress()
```

**出队规则（getDrillQueue）：**
1. `unknownCount` 降序（错得多优先）
2. 词性优先级：n > v > adj > adv
3. 随机打散

**判题规则（setDrillResult）：**
- `known = true`：correct + 1，unknownCount → 0
- `known = false`：unknownCount + 1（上限 9）
- 撤销：删除记录，并从 Gist 中移除

### 5.2 艾宾浩斯复习（Review）流程

基于 `src/utils/ebbinghaus.js` 的 SM-2 变体算法：

| quality 值 | 标签 | 效果 |
|---|---|---|
| 1 | 模糊 | level - 1，interval × 0.5 |
| 2 | 记得 | level + 1，正常进度 |
| 3 | 牢记 | level + 2，加速升级 |

间隔表 Lv.1-6：`[1, 3, 7, 14, 30, 60]` 天

优先级：`CRITICAL(连续错误≥3) > HIGH(连续错误=2) > OVERDUE_7(逾期≥7天) > OVERDUE_1_6 > NEW`

### 5.3 测验（Quiz）流程

- 从 `vocab.json` 过滤有释义的词
- 随机抽取 10 题，每题 4 选 1
- 选项：正确释义 + 3 个随机错误释义
- 记录保存至 `db.quizRecords`

### 5.4 辨析（Analysis）数据

从 `src/data/synonyms.json` 加载，格式：
```json
{
  "ignore": {
    "pos": "v",
    "definitions": ["不理睬", "忽视"],
    "synonyms": [
      { "word": "pay no attention", "pos": "短语", "meaning": "忽视" }
    ]
  }
}
```

---

## 六、样式系统

### 6.1 CSS 变量（variables.css）

```css
/* 背景 */
--paper-bg:      #1A304C   /* 夜海蓝，页面背景（深色） */
--paper-surface: #F9F3CC   /* 月光白，卡片/顶栏背景（浅色） */

/* 文字 */
--ink-primary:   #1A304C   /* 主文字，在浅色背景上 */
--ink-secondary: #5F8DB6   /* 次要文字 */
--ink-tertiary:  #9A8A7A   /* 弱化文字 */
--ink-faded:     #7E3131   /* 装饰性弱文字 */
--ink-inverse:   #F9F3CC   /* 深色背景上的文字 */

/* 主色调 */
--lotus:         #5F8DB6   /* 浅海蓝，强调/交互色 */
--lotus-dark:    #9A7878   /* 藕荷深，按钮/标签 */
--night-sea:     #1A304C   /* 夜海蓝，成功按钮 */
--light-sea:     #5F8DB6   /* 浅海蓝，进度条 */

/* 词性配色 */
--accent-n:      #5F8DB6   /* 名词 */
--accent-v:      #9A7878   /* 动词 */
--accent-adj:    #7E3131   /* 形容词 */
--accent-adv:    #5F8DB6   /* 副词 */

/* 按钮 */
--btn-correct-bg:   #1A304C  /* 认识/夜海蓝 */
--btn-wrong-bg:     #9A7878  /* 不认识/藕荷深 */
```

### 6.2 渐变使用位置

| 位置 | 渐变表达式 |
|---|---|
| Drill.css 进度条 | `linear-gradient(90deg, var(--lotus), var(--night-sea))` |
| Drill.css 总进度条 | `linear-gradient(90deg, var(--night-sea), var(--lotus))` |
| Drill.css 卡片内光晕 | `linear-gradient(145deg, rgba(255,248,235,0.5), transparent)` |
| Drill.css 分隔线 | `linear-gradient(90deg, transparent, rgba(206,172,172,0.30), transparent)` |
| Drill.css session-done `::before` | `linear-gradient(135deg, var(--paper-highlight), transparent)` |
| base.css paper-card `::before` | `linear-gradient(135deg, var(--paper-highlight), transparent)` |
| Analysis.css analysis-card `::before` | `linear-gradient(135deg, var(--paper-highlight), transparent)` |

### 6.3 印章（Stamp）样式

- 位置：`right: 18%; top: 50%; transform: translate(0, -50%) rotate(-30deg)`
- 背景：`transparent`（完全透明）
- 边框：4px solid currentColor
- 动画：`stamp-glow`（淡入 + 缩放）
- 正确时颜色：`var(--night-sea)`；错误时：`var(--lotus-dark)`

---

## 七、路由结构

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | Home | 首页（底部 TabBar） |
| `/library` | Library | 词库浏览（底部 TabBar） |
| `/review` | Review | 艾宾浩斯复习（底部 TabBar） |
| `/quiz` | Quiz | 选择题测验（底部 TabBar） |
| `/profile` | Profile | 个人统计（底部 TabBar） |
| `/word/:word` | WordDetail | 单词详情（底部 TabBar） |
| `/#drill` | App > Drill | 速刷（App 内置三栏导航） |
| `/#leaderboard` | App > Leaderboard | 错词榜 |
| `/#analysis` | App > Analysis | 近义词辨析 |

App（速刷/错词榜/辨析）使用 HashRouter 三栏导航，不走 React Router 的页面路由。

---

## 八、GitHub Gist 同步机制

### 8.1 启动恢复（restoreFromGist）

```
fetchGistProgress() → 获取远程 Gist JSON
        ↓
localMap = db.drillProgress.toArray() → 以 word 为 key
        ↓
合并策略：远程有则取远程，total/correct/unknownCount 取最大值
        ↓
db.drillProgress.bulkPut(merged)
```

### 8.2 每次判题同步（setDrillResult）

```
读取远程 Gist → 合并当前结果 → 全量推送覆盖
```

### 8.3 撤销同步

撤销时删除本地记录 + 从 Gist 远程记录中移除对应 word 字段。

---

## 九、数据字段说明（vocab.json 每词结构）

```json
{
  "hydrogen": {
    "word": "hydrogen",
    "phonetic": "/haidrədʒon/",
    "phonetic_uk": "/haɪdrədʒən/",
    "phonetic_us": "/haɪdrədʒən/",
    "pos": ["n"],
    "definitions": [
      { "pos": "n", "meaning": "氢", "explanation": "一种化学元素" }
    ],
    "examples": [
      { "en": "Water contains hydrogen.", "cn": "水含有氢。" }
    ],
    "memory": [
      { "type": "词根", "content": "hydro=水" }
    ],
    "collocations": ["hydrogen bomb"],
    "synGroup": ["oxygen", "nitrogen"]
  }
}
```

---

## 十、待注意的架构问题

1. **两套数据库并存**：`drillStore.js`（VocabAntiqueHouse_v2）和 `storage.js`（VocabAntiqueHouse）同时存在，功能有重叠。Review/Quiz/WordDetail 等页面用 `storage.js`，Drill/Leaderboard 用 `drillStore.js`。建议后续统一。
2. **GitHub Gist Token 暴露**：前端代码中硬编码了 Gist Token，建议迁移至环境变量。
3. **vocab.json 全量导入**：每次 `initVocab()` 会 `db.vocab.clear()` 后重新导入，11,000 词全量覆盖，建议改为增量同步。
