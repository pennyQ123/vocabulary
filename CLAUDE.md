# 背单词 — 项目完整文档

## 一、项目概述

**背单词**（原"词汇流动屋"）是一个基于 React + Vite 的雅思易混词速刷 SPA。单词数据存储于本地 IndexedDB，通过 GitHub Gist API 实现跨设备进度同步。

- **词条总数**：10,771 条（正常单词 10,547 + 短语/复合词 207 + 缩写 17）
- **辨析条目**：527 条（`src/data/synonyms.json`）
- **例句总数**：12,834 条（全部含完整中文翻译）
- **主词库**：`src/data/vocab.json`
- **辨析词库**：`src/data/synonyms.json`
- **数据库**：Dexie（IndexedDB 封装），统一数据库 `VocabAntiqueHouse_v2`（v5）
- **路由**：React Router（HashRouter）
- **启动命令**：`npm run dev`
- **预览地址**：`http://localhost:5173/vocabulary/`（base 路径 `/vocabulary/`）
- **GitHub**：pennyQ123/vocab
- **速刷轮数**：10 词/轮

---

## 二、技术栈

| 类别 | 技术 |
|---|---|
| 框架 | React 19 + Vite 8 |
| 路由 | React Router DOM（HashRouter） |
| 数据库 | Dexie（IndexedDB wrapper） |
| 样式 | CSS Custom Properties + 内联样式 |
| 同步 | GitHub Gist API（PATCH/GET） |
| 发音 | Web Speech API（女声美音） |
| 音效 | 本地 MP3 音频循环播放 |
| 例句来源 | Free Dictionary API（api.dictionaryapi.dev） |

---

## 三、配色体系（复古民国书斋风）

### 核心色板

| 变量 | 色值 | 用途 |
|---|---|---|
| `--paper-bg` | `#1E2C23` | 页面背景（深松绿） |
| `--paper-surface` | `#F2EAD8` | 卡片/浮层背景（宣纸色） |
| `--lotus` | `#B88A3A` | 强调色/金色（老金/铜色） |
| `--lotus-dark` | `#8B4545` | 错误/不认识按钮（檀红） |
| `--night-sea` | `#3D5A4A` | 正确/认识按钮（松绿） |
| `--ink-primary` | `#2C2416` | 主文字（墨色） |
| `--ink-faded` | `#B0A080` | 弱化文字（浅褐） |
| `--ink-inverse` | `#F2EAD8` | 深色背景上的文字 |

### 词性配色

| 词性 | 颜色 | 色值 |
|---|---|---|
| 名词 (n) | 青绿 | `#4A7A5A` |
| 动词 (v/vt/vi) | 檀红 | `#8B4A4A` |
| 形容词 (adj) | 铜色 | `#B8783A` |
| 副词 (adv) | 灰紫 | `#6B6A8A` |

### 背景动态呼吸

`body` 有 8 秒循环的 `breathe-bg` 动画，在 `#1C2A21` → `#253822` → `#152A26` → `#233020` 间缓慢渐变。

### 配色修改规则
- 所有颜色统一在 `src/styles/variables.css` 中管理
- JSX/CSS 中的硬编码颜色使用 CSS 变量或 rgba 值
- 修改配色时只需改 `variables.css` + 批量替换 rgba 值

---

## 四、文件结构

```
src/
├── App.jsx                      # 速刷/错词榜/辨析 三栏导航
├── main.jsx                     # 入口
├── index.css                    # 全局样式
│
├── components/
│   ├── layout/
│   │   ├── Layout.jsx           # 布局容器（Header + Outlet + TabBar）
│   │   ├── Header.jsx           # 顶部栏（标题"背单词" + 搜索按钮）
│   │   └── TabBar.jsx           # 底部 Tab 导航
│   └── SoundControl.jsx         # 音效控制面板（右上角悬浮）
│
├── pages/
│   ├── Drill.jsx + Drill.css    # 速刷页面（核心，含拖拽笔记面板）
│   ├── Leaderboard.jsx + .css   # 错词排行榜
│   ├── Analysis.jsx + .css      # 近义词辨析页面
│   ├── Search.jsx               # 单词搜索（中英文）
│   ├── Home.jsx                 # 首页
│   ├── Library.jsx              # 词库浏览
│   ├── Review.jsx               # 复习模式（艾宾浩斯）
│   ├── Quiz.jsx                 # 测验模式（选择题）
│   ├── WordDetail.jsx           # 单词详情页
│   └── Profile.jsx              # 个人统计
│
├── store/
│   └── drillStore.js            # 核心数据层（统一 DB：vocab + drillProgress + memory + notes + quizRecords + wrongQuestions + settings + Gist 同步）
│
├── utils/
│   ├── ebbinghaus.js            # 艾宾浩斯复习算法
│   └── soundEngine.js           # 音效引擎（MP3 播放 + Web Audio 生成）
│
├── data/
│   ├── vocab.json               # 主词库（约 11,000 词）
│   ├── synonyms.json            # 近义词辨析数据（527 条）
│   ├── user_notes.json          # 用户笔记（Vite API 自动写入）
│   └── user_progress.json       # 速刷进度（Vite API 自动写入，跨端口持久化）
│
├── styles/
│   ├── variables.css            # CSS 变量（颜色/字体/圆角/阴影）
│   └── base.css                 # 全局基础样式 + 呼吸背景动画
│
└── public/
    └── audio/                   # 音效 MP3 文件
        ├── rain-forest.mp3      # 雨声1（森林雨滴）
        ├── rain-porch.mp3       # 雨声2（门廊雨声）
        ├── forest-fire.mp3      # 篝火1（森林篝火）
        ├── bonfire.mp3          # 篝火2（篝火堆）
        ├── forest-stream.mp3    # 溪流
        └── sea-surf.mp3         # 海浪
```

---

## 五、路由结构

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | Home | 首页 |
| `/library` | Library | 词库浏览 |
| `/review` | Review | 艾宾浩斯复习 |
| `/quiz` | Quiz | 选择题测验 |
| `/profile` | Profile | 个人统计 |
| `/word/:word` | WordDetail | 单词详情 |
| `/#drill` | App > Drill | 速刷（HashRouter），含拖拽笔记面板 |
| `/#leaderboard` | App > Leaderboard | 错词榜 |
| `/#analysis` | App > Analysis | 近义词辨析 |
| `/#search` | App > Search | 单词搜索（中英文） |

---

## 六、数据模型

### 6.1 主词库 vocab.json — 每词结构

```json
{
  "word": "example",
  "phonetic": "/ɪɡˈzæmpəl/",
  "phonetic_uk": "ɪɡˈzɑːmpəl",
  "phonetic_us": "ɪɡˈzæmpəl",
  "pos": ["n", "vt"],
  "definitions": [
    { "pos": "n", "meaning": "例子，实例" },
    { "pos": "vt", "meaning": "举例说明" }
  ],
  "memory": [
    { "type": "词根词缀", "content": "ex=出+ample=充足 → 拿出充足的例子" }
  ],
  "collocations": [
    "for example — 例如"
  ],
  "examples": [
    { "en": "Can you give me an example?", "cn": "例子：你能给我一个例子吗？" }
  ],
  "source": "真经"
}
```

### 6.2 释义格式规范
- **结构化释义**：`{ "pos": "n", "meaning": "中文释义" }`
- **单一词性**：只有一个词性时，卡片不显示词性前缀
- **多词性**：多个词性时，每条释义前显示 `n.`、`vt.`、`adj.` 等前缀
- **词性数组**：`pos` 数组必须与实际释义中的词性严格对应

### 6.3 例句格式规范（重要！）
- **格式**：`en` 字段存英文例句，`cn` 字段必须以 **`[中文释义]：[翻译]`** 格式开头
- **示例**：`{ "en": "I eat an apple every day.", "cn": "苹果：我每天吃一个苹果。" }`
- **数量**：每条释义对应一条例句，有几个释义就保留几条例句，不裁剪
- **禁止**：短语列表式例句、无中文翻译的空 CN、占位符式翻译

### 6.4 记忆法格式
- **格式**：`词尾-xx：名词后缀，表动作/状态` 或 `词根xxx=义 → 应用说明`
- **要求**：必须指明具体的词根/前缀/后缀，不能模糊写"名词后缀"

### 6.5 IndexedDB（统一数据库 `VocabAntiqueHouse_v2` v5）

所有表合并为单一数据库，`drillStore.js` 统一管理。旧数据库 `VocabAntiqueHouse` 的数据在首次启动时自动迁移。

| 表名 | Key | 字段 | 用途 |
|---|---|---|---|
| `vocab` | `word` | word, phonetic, pos, definitions, examples, memory, collocations 等 | 词库主表 |
| `drillProgress` | `word` | word, total, correct, unknownCount, lastDrill | 速刷进度 |
| `memory` | `word` | word, level, interval, easeFactor, nextReview, lastReview | 艾宾浩斯复习 |
| `notes` | `++id, word` | id, word, content, createdAt | 单词笔记 |
| `quizRecords` | `++id, date` | id, date, total, correct, score, mode | 测验记录 |
| `wrongQuestions` | `word` | word, questionId, errorCount, lastError | 错题本 |
| `settings` | `key` | key, value | 通用设置 |

---

## 七、Vite API 与数据持久化

`vite.config.js` 内置了两个 API 中间件，浏览器通过相对路径调用，不依赖固定端口：

| 端点 | 方法 | 用途 | 文件 |
|---|---|---|---|
| `/api/notes?word=xxx` | GET | 读取某词笔记 | `user_notes.json` |
| `/api/notes` | POST `{word, content}` | 保存笔记 | 同上 |
| `/api/progress` | GET | 读取全部进度 | `user_progress.json` |
| `/api/progress` | POST `{word, total, correct, ...}` | 保存单条进度 | 同上 |

- 笔记和进度在每次操作时自动写入本地 JSON 文件
- 换端口、关机重启后数据不丢失
- 首次加载时双向同步：文件→IndexedDB + IndexedDB→文件

---

## 八、Drill 卡片布局（从上到下）

**速刷页面**：左侧可拖拽笔记面板 + 居中卡片 + 右侧印章
**卡片内部**（reveal 阶段）：

1. **单词区**：单词居中 + 右侧 🔊 发音按钮（绝对定位，不挤占单词空间）
2. **音标**（reveal 阶段显示）
3. **分隔线**
4. **词性标签**（居中，在释义上方）
5. **释义列表**（单一词性无前缀，多词性有 `n.` 等前缀）
6. **记忆法**（标题"记忆法"，在释义下方、搭配/例句上方）
7. **短语搭配**（标题"短语搭配"，格式 `英文 — 中文`）
8. **形近词·近义词**
9. **同义词**（来自 synonyms.json）
10. **例句**（EN + CN 两行）
11. **印章**：卡片右侧空白处（`left: calc(100% + 16px)`，不遮挡内容）

**搜索页面**：卡片展开顺序同上（释义 → 记忆法 → 搭配 → 例句）

---

## 九、音效系统

### 控制面板
- **位置**：右上角固定悬浮
- **开关**：🔇/🔊 圆形按钮，手动开启
- **选项**（6 种，均为本地 MP3 循环播放）：

| 按钮 | 音频文件 |
|---|---|
| 🌧 雨声1 | `public/audio/rain-forest.mp3` |
| 🌦 雨声2 | `public/audio/rain-porch.mp3` |
| 🔥 篝火1 | `public/audio/forest-fire.mp3` |
| 🪵 篝火2 | `public/audio/bonfire.mp3` |
| 💧 溪流 | `public/audio/forest-stream.mp3` |
| 🌊 海浪 | `public/audio/sea-surf.mp3` |

- **技术实现**：HTML5 Audio 元素，`loop=true`，使用 `import.meta.env.BASE_URL` 拼接路径

---

## 十、发音功能

- **触发时机**：
  - 点击"认识/不认识"进入 reveal 阶段 → 自动播放一次
  - 进入 WordDetail 页面 → 自动播放一次
  - 点击 🔊 按钮 → 手动播放
- **声音**：Web Speech API，女生优先。macOS: Samantha → Karen；Windows: Zira → Female → Susan → Linda → Mary
- **参数**：语速 0.85，音调 1.05，lang='en-US'

---

## 十一、性能优化（重要！）

### Gist 同步
- **问题**：每次判题同步等待 Gist API（两次网络往返）导致按钮响应慢
- **解决方案**：先写本地 IndexedDB（毫秒级），Gist 同步放到后台延迟 300ms 批量执行
- **撤销操作**：Gist 同步同样改为后台执行

### 跳词防护
- `handleNext` 加入 `cardState !== 'idle'` 守卫
- `handleJudge` 加入 `if (!current || animating) return` 守卫
- `restart()` 重置 `pendingWord`、`cardState`、`animating`

---

## 十二、用户偏好与规则（重要！）

### 🚫 绝对禁止的模板句式（严禁出现！）
以下句式绝不能出现在任何单词的例句中，违者必须全部重造：
1. `XXX plays a significant role in modern society`（如 "Filth plays a significant role"）
2. `XXX is an important topic that affects many aspects of our lives`
3. `XXX is a fascinating subject worthy of deeper study`
4. `XXX has become an increasingly important topic in recent discussions`
5. `He is widely regarded as an outstanding XXX in his community/field`
6. `XXX is widely used in the construction and manufacturing industries`
7. `XXX can be prevented through regular exercise and a healthy diet`
8. `The concept of XXX is central to understanding this subject`
9. `XXX is something we encounter frequently in daily life`
10. `XXX is something that people encounter in various situations`
11. `They decided to XXX the project after careful consideration`
12. `The committee decided to XXX the original plan`
13. `XXX is found in nature and has many practical uses`
14. `XXX is a word that appears frequently in both spoken and written English`

### ✅ 例句正确做法
- **每条例句必须针对该单词的具体含义造句**
- **优先联网搜索柯林斯词典原版例句**（`https://www.collinsdictionary.com/sentences/english/[word]`）
- **根据释义的语义类别选择不同的句式**（人物类/动物类/食物类/疾病类/地点类/抽象类等）
- **中文翻译绝不能是占位符**：不能用 "（英文例句）"、"关于XX的例句。"、"XX的相关例句。"
- **CN 格式**：`[中文释义]：[完整中文翻译]`，翻译要完整通顺
- **有几个释义保留几条例句**，不裁减
- **造句要动脑子**：郁金香不能说成工业材料，疾病不能说成有趣课题，新娘不能说成迷人研究主题

### 禁止做的事
1. **不要创建不必要的文件**：优先编辑已有文件
2. **不要删除词条**：除非数据完全无意义（如纯碎片 `、renew、`）；错拼字要纠正拼写而不是删除
3. **不要裁剪例句数量**：有几个释义就保留几条例句
4. **不要用模糊的描述**：记忆法必须指明具体词根词缀名
5. **不要编造模板句子**：严禁使用任何模板句式
6. **记忆法不放同义词**：同义词放入 `synonyms.json` 辨析数据中
7. **程序化造句不可靠**：避免用填空式模板生成例句，尽量用词典 API 获取真实例句

### 必须遵守的规则
1. **配色**：所有颜色改动用 CSS 变量，不改结构
2. **释义格式**：结构化 `{pos, meaning}`，多词性时前缀标注
3. **例句格式**：`cn` 字段以 `[中文释义]：[翻译]` 开头
4. **音标**：以美音为主，缺失时用 CMU 词典补全；多词短语不标音标
5. **短语搭配**：必须有中文释义，格式 `英文 — 中文`
6. **记忆法**：`词尾-xx：`/`词首-xx：`/`词根xxx=义 →`
7. **例句语法**：必须符合英语语法且语义匹配
8. **音效路径**：使用 `BASE_URL + 'audio/xxx.mp3'`（因为有 `/vocabulary/` 前缀）
9. **联网查例句**：当没有好的例句时，使用联网搜索柯林斯词典获取真实例句
10. **缩略语保留**：如 e.g./i.e./a.m. 等保留，补充英文全称，不删除

### 数据质量规则
- POS 数组必须与释义中实际出现词性一一对应
- 释义和例句不能含 `、` 等数据污染碎片
- 不能有纯英文短语当例句（如 `the abolition of X; the abolition of Y`）
- 中文翻译不能是占位符（如 `关于XX的例句。`、`（英文例句）`）
- 单词只有一个词性时释义前不重复标词性
- 错拼字找到正确拼写后更正，不要直接删除
- 纯音标当词条存的（如 `reɪtəs`）删除
- 换行符出现在 JSON key 中必须修复合并

### 例句 API
- 来源1：`https://api.dictionaryapi.dev/api/v2/entries/en/[word]`（覆盖率约 30%）
- 来源2：柯林斯词典 `https://www.collinsdictionary.com/sentences/english/[word]`（联网搜索）
- 获取的 EN 例句需手动或半自动添加 CN 翻译
- 搜索不到例句时，根据单词的具体含义手工造句，绝不使用模板

---

## 十三、Gist 同步配置

```
Gist Token：`VITE_GIST_TOKEN`（环境变量，见 .env.local）
Gist ID：f4af5288641e645de4b42de84a1fa2b1
```

---

## 十四、词库处理历史

### 已完成的批量处理
1. **词性拆分**：472 条词性混在释义中的条目 → 结构化 `{pos, meaning}`
2. **乱码修复**：69 条纯乱码条目根据柯林斯词典重写
3. **POS 推断**：1,357 条从释义文本正则匹配推断词性
4. **词形推断**：340 条从单词后缀形态推断词性
5. **删除污染**：80 条含 `、` 碎屑的无效条目删除
6. **POS 同步**：1,677 条词条的 POS 数组与释义重新对齐
7. **音标补全**：1,146 条由 CMU 发音词典填充美音音标
8. **英式→美式**：76 条英式拼写映射为美式后获取音标
9. **记忆法填充**：4,988 条添加了词根词缀记忆法
10. **记忆法具体化**：3,576 条模糊描述改为具体词根词缀名
11. **短语搭配释义**：全部 412 条搭配补充了中文释义
12. **例句全覆盖**：10,389 条缺例句的条目补充了例句
13. **词典例句**：2,510 条从 Free Dictionary API 获取原版例句
14. **例句格式统一**：全部例句 `cn` 格式化为 `[释义]：[翻译]`
15. **垃圾清理**：81 条碎片条目删除 + 48 条连字符词修正
16. **近义词库扩充**：从 95 条扩充至 204 条（自动提取 + 噪音清理）
17. **近义词 POS 填充**：402 个近义词的 POS 字段 100% 填充
18. **模板例句清理（第1轮）**：删除 "plays a role in society" 等 4,528 条荒谬例句，按语义类别重造
19. **模板例句清理（第2轮）**：修正 2,578 条 "outstanding in community" / "important topic" 等模板
20. **模板例句清理（第3轮）**：修正 86 个分类错配（车辆→不是课题、情感→不是课题、花→不是工业材料）
21. **模板例句清理（第4轮）**：删除 2,422 条 "fascinating subject" / "leading in field" 模板，重新造句
22. **模板例句清理（第5轮）**：删除 2,078 条 "important topic that affects many aspects" 模板
23. **模板例句清理（第6轮）**：删除 3,487 条 "agreed to the proposal" / "encounter various" 模板，按词义重造
24. **CN 占位符清除**：2,581 个 "（英文例句）" 占位符替换为完整中文翻译
25. **CN 无中文修复**：15 个纯英文 CN 全部补上中文翻译
26. **最终例句验证**：全库 10,771 词 0 模板残句、0 占位符 CN、0 空 CN
27. **错拼修复**：terific→terrific, cance→cancer, pimpl→pimple, ju:'tensɪlz→utensils 等
28. **缩写规范**：e.g./i.e./a.m./p.m./etc. 等 17 个缩写保留并补全释义
29. **换行符键修复**："on the\ngrounds that" → "on the grounds that" 等全部合并
30. **音标覆盖率**：手动补全 100+ 条生僻词音标，覆盖率 99.0%
31. **CN 翻译全量修复**：5,889 条纯英文 CN 通过 Google 翻译 API + 模板自动生成 + 手动补充全部转为中文
32. **模板例句清除**：多轮清除"We spent a long time discussing..."等生成器模板句，Free Dictionary API 获取真实例句
33. **碎片句迁移**：1,277 条短语级例句从 examples 移至 collocations 区，格式 `EN — CN`
34. **数据库统一**：合并 VocabAntiqueHouse 和 VocabAntiqueHouse_v2，删除 storage.js，旧数据自动迁移
35. **搜索功能**：新增 Search.jsx 页面，支持中英文搜索，结果卡片点击展开详情，含发音按钮
36. **笔记面板**：速刷页左侧添加可拖拽笔记卡片，按词存储到 IndexedDB，换词自动切换，500ms 防抖保存
37. **同义词 POS 填充**：synonyms.json 全部 2,034 条同义词的 POS 100% 填充
38. **记忆法同义词迁移**：399 条记忆法中的同义词内容移至 synonyms.json，366 条纯同义词记忆法清空
39. **辨析卡片顺序**：Drill + Search 统一为 释义 → 记忆法 → 短语搭配 → 例句
40. **发音女性声优**：Windows 平台增加 Zira/Susan/Linda/Mary 女声优先匹配
41. **速刷轮数**：30 → 20 → 10 词/轮
42. **释义/例句修正**：逐一修正用户反馈的数百条错误释义、占位符 CN、模板句
43. **笔记文件持久化**：Vite 中间件 `/api/notes` 将笔记写入 `user_notes.json`，换端口不丢
44. **进度文件持久化**：Vite 中间件 `/api/progress` 将速刷进度写入 `user_progress.json`，跨端口双向同步
45. **搜索页笔记**：搜索结果卡片展开后内嵌笔记面板，与速刷页共用同一文件
