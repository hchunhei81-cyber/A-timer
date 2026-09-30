# Pomodoro Focus

一个单文件番茄钟、任务管理器、飞行甲板模拟器，以及一小组学习与开发者工具。

基于 HTML、Tailwind CSS 和原生 JavaScript 构建。无需构建步骤，无需后端，无需账号。所有数据保存在你的浏览器中。

## 目录

- [在线使用](#在线使用)
- [包含内容](#包含内容)
- [键盘快捷键](#键盘快捷键)
- [数据存储](#数据存储)
- [本地开发](#本地开发)
- [文件结构](#文件结构)
- [隐私](#隐私)
- [免责声明](#免责声明)
- [浏览器支持](#浏览器支持)
- [许可证](#许可证)

## 在线使用

打开 [https://hchunhei81-cyber.github.io/pomodoro-focus/](https://hchunhei81-cyber.github.io/pomodoro-focus/)

无需注册。所有内容都保存在你自己的浏览器中。

## 包含内容

### 1. 番茄钟（index.html）

- 四种模式：专注、短休息、长休息、秒表
- 可调节时长
- SVG 进度环，随模式变色
- 深度专注模式：全屏、极简，只留计时器和你的任务
- 会话意图：开始前写下这次要完成的一件事
- 分心计数器，不暂停计时器
- 会话结束后的反思提示和着陆评分
- 每日目标追踪
- 环境音：关闭、棕噪音、雨声（本地生成）
- 浏览器通知和震动
- 亮/暗主题
- 任务列表，支持拖拽排序、每任务番茄钟计数、撤销删除
- 任务列表导出和导入为 JSON

### 2. 飞行甲板（index.html）

一个可选主题，把每次专注变成一次航班。

- PFD（主飞行显示器）：人工地平仪、速度带、高度带、航向带、垂直速度、飞行指引
- ND（导航显示器）：航路、航点、范围环、TCAS 交通、风向箭头
- 八个阶段：预飞、滑行、起飞、爬升、巡航、下降、进近、着陆
- 五种机型，各有不同的巡航高度、爬升率和发动机表现
- 随本地时间变化的天气：晴、多云、雨、夜
- 巡航、下降开始和准备着陆时的客舱广播
- 实时航班追踪，通过 OpenSky Network（含 10 秒冷却）

### 3. 工具（tools.html）

一个小的工具启动页。

#### 学习卡片（note.html）

- 多科目，每科目独立卡组
- 每张卡片的统计：答对、答错次数
- 翻转、高亮、编辑、删除
- 每科目的准确率
- 整个卡片库导出和导入为 JSON

#### 计算器（calc.html）

- 科学模式：三角、对数、指数、幂、阶乘
- 输入时实时预览结果
- 计算历史记录
- 微积分模式：导数、定积分、Canvas 绘图
- 程序员模式：十六进制、十进制、八进制、二进制和位运算
- 统计模式：均值、中位数、标准差、方差、排列、组合
- 矩阵模式：2x2 和 3x3 的行列式、逆、加法、乘法

#### Code Playground（code.html）

- 在线 HTML、CSS、JavaScript 编辑器
- 实时沙箱预览
- 多文件项目
- 控制台、网络、性能、测试面板
- 模板：Vanilla、Vue 3、React JSX、Canvas 2D
- CDN 包管理器
- 快照和分享链接（压缩）
- 导出为 ZIP 或单 HTML
- 命令面板和元素检查器

## 键盘快捷键

### 番茄钟

| 按键 | 功能 |
|---|---|
| `Space` | 开始或暂停 |
| `G` | 深度专注模式 |
| `R` | 重置当前会话 |
| `S` | 跳到下一阶段 |
| `F` | 全屏专注 |
| `D` | 切换经典和飞行甲板 |
| `V` | 切换 PFD 和 ND |
| `T` | 切换亮/暗主题 |
| `N` | 跳到新建任务输入框 |
| `1` `2` `3` `4` | 专注、短休息、长休息、秒表 |
| `?` | 打开快捷键说明 |
| `Esc` | 关闭弹窗或退出专注模式 |

### 学习卡片

| 按键 | 功能 |
|---|---|
| `Space` | 翻转卡片 |
| `←` `→` | 上一张或下一张 |
| `N` | 新建卡片 |
| `E` | 编辑当前卡片 |
| `D` | 删除当前卡片 |
| `G` | 标记为答对 |
| `M` | 标记为答错 |
| `?` | 快捷键说明 |
| `Esc` | 关闭弹窗 |

### Code Playground

| 按键 | 功能 |
|---|---|
| `Ctrl+S` | 运行项目 |
| `Ctrl+Shift+P` | 打开命令面板 |
| `Esc` | 关闭弹窗和抽屉 |

## 数据存储

所有内容都保存在 `localStorage` 中，按浏览器和域名隔离。

| 键 | 内容 | 页面 |
|---|---|---|
| `pomodoro.v6.settings` | 计时器设置 | index.html |
| `pomodoro.v6.tasks` | 任务列表 | index.html |
| `pomodoro.v6.session` | 当前会话状态 | index.html |
| `pomodoro.v6.stats` | 每日统计 | index.html |
| `pomodoro.v6.history` | 会话历史 | index.html |
| `pomodoro.v6.reflection` | 反思记录 | index.html |
| `study_cards_v1` | 学习卡片数据 | note.html |
| `htmlc_projects` | Code Playground 项目 | code.html |
| `htmlc_current_project` | 当前项目 id | code.html |
| `htmlc_snapshots_*` | 项目快照 | code.html |
| `htmlc_cdn_*` | 每项目的 CDN 包 | code.html |

**各页面相互隔离。** 每个工具用各自的存储键。一个页面保存的数据对另一个页面不可见。

**注意：**

- 清除浏览器数据会删除以上所有内容
- 数据不会跨浏览器、设备或域名同步
- 用每个页面的导出功能备份数据

## 本地开发

无需构建工具。

## 文件结构
.
├── index.html          番茄钟和任务
├── styles.css
├── app.js
├── flight.js           飞行甲板模块
│
├── tools.html          工具启动页
├── tools.css
│
├── note.html           学习卡片
├── note.css
├── note.js
│
├── calc.html           计算器
├── calc.css
├── calc.js
│
├── code.html           Code Playground
├── code.css
├── code.js
├── config.js
│
├── manifest.json
├── icon.svg
├── robots.txt
├── README.md
└── LICENSE

## 隐私
不向任何服务器发送数据
不使用 Cookie
不使用分析工具
除了 Tailwind CSS、Font Awesome、CodeMirror、JSZip、FileSaver 和 LZString 的 CDN，不加载第三方脚本
飞行甲板的"实时航班"功能会向公共 OpenSky Network API 发送一个地理边界框，不发送其他内容
页面包含 <meta name="robots" content="noindex, nofollow">，不会被搜索引擎索引

# 免责声明
这是一个按现状分享的个人项目。不提供任何担保。

飞行甲板是用于娱乐和专注的视觉模拟。它不是飞行训练工具，不能用于真实航空。

实时航班数据来自公共 OpenSky Network API。按现状提供，不保证准确性和可用性。不要用于任何实际运行目的。

数据保存在浏览器的 localStorage 中。清除浏览器数据会永久删除你的任务、会话、学习卡片和 Code Playground 项目。如果在意数据，请定期导出。

Code Playground 在沙箱 iframe 中执行用户编写的 JavaScript。不要粘贴来源不明的代码。

## 游览器支持
已在以下浏览器测试：

Chrome 和 Edge 88+
Firefox 85+
Safari 14+
部分功能依赖较新的 Web API：

通知：需要用户授权
语音播报：需要 speechSynthesis
环境音：需要 AudioContext
分享链接：需要 CompressionStream，否则回退到文本框

## 许可证
MIT。详见 LICENSE。
