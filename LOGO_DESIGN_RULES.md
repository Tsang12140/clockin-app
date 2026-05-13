# 荣源考勤 — 设计规范 v1.0

> 本文档是荣源考勤 App 的唯一设计语言参考。所有 AI、开发者在修改或新增界面时，必须以本文档为准，不得引入新的色值、字重、组件模式，除非明确标注"新增"并同步更新本文档。

---

## 1. 品牌标识

### Logo

| 用途 | 文件 |
|------|------|
| App Icon / 大尺寸 | `public/logo.svg`（512×512 viewBox） |
| Favicon | `public/favicon.svg`（32×32 viewBox） |

**图形语言**：圆角方形底板（rx=36），内含时钟圆圈+指针，右下角白色圆形内嵌品牌蓝对勾。

**渐变**：`linear-gradient(135deg, #60A5FA 0%, #3370FF 100%)`，左上浅天蓝到右下品牌蓝。

**禁止**：拉伸变形、改色、在图标上叠加文字、单独使用对勾或时钟而丢弃另一元素。

### 品牌名称

- 中文全称：**荣源考勤**
- 英文标注：**RONGYUAN CLOCKIN**（仅用于 Logo 横版搭配，界面内不使用英文名）

---

## 2. 色彩系统

### 主色板

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--color-brand` | `#3370FF` | 按钮、选中态、链接、强调 |
| `--color-brand-dark` | `#1A3A8F` | 主标题、核心数字、页面级标题 |
| `--color-brand-light` | `#60A5FA` | 渐变起始色、hover 浅色背景 |
| `--color-brand-hover` | `#245BDB` | 按钮 hover/press 态 |

### 背景色

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--color-bg-page` | `#F0F4FA` | 页面底色（全局） |
| `--color-bg-card` | `#FFFFFF` | 卡片、列表项底色 |
| `--color-bg-filter` | `#E8EEF8` | Segmented Control 容器、筛选栏 |
| `--color-bg-selected` | `#EBF0FF` | 日历选中浅蓝背景（非主按钮场景） |

### 语义色

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--color-success` | `#16A34A` | 已录入、正常状态、成功提示 |
| `--color-danger` | `#DC2626` | 缺勤、错误、删除 |
| `--color-warning` | `#D97706` | 请假、特殊状态、警告提示 |
| `--color-warning-bg` | `#FFF8E1` | 特殊状态格子背景 |
| `--color-danger-bg` | `#FEE2E2` | 缺勤格子背景 |

### 文字色

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--color-text-primary` | `#1a1a2e` | 正文、列表项主文字 |
| `--color-text-secondary` | `#6B7280` | 副标题、说明、标签 |
| `--color-text-disabled` | `#D1D5DB` | 禁用态、未来日期弱化 |

### 日期选中态（三种状态）

| 状态 | 样式 |
|------|------|
| **选中（非今天）** | `background: linear-gradient(135deg, #60A5FA 0%, #3370FF 100%)`，`border-radius: 8px`，内部文字和圆点全部白色 |
| **今天（未选中）** | 白色浮起卡片，明显阴影，`translateY(-2px)`，日期数字 `#3370FF` |
| **今天且选中** | 渐变背景同选中态，数字白色，录入圆点白色（尺寸不变） |
| **未来日期** | 透明背景，所有元素 `opacity: 0.4`，可点击但视觉弱化 |

---

## 3. 字体

### 字体栈

```css
font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

等宽编号（工号、ID 类）：

```css
font-family: 'JetBrains Mono', 'Courier New', monospace;
```

### 字重规则

| 场景 | Tailwind 类 |
|------|-------------|
| 页面主标题 | `font-semibold` |
| 区块标题、卡片标题、姓名 | `font-medium` |
| 标签、说明、副标题、日期 | `font-normal` |
| 核心金额、统计数字 | `font-bold` |

**禁止**：大面积使用 `font-bold` / `font-black`。数字强调才用 bold，文字段落不用。

### 加粗模式（无障碍）

用户可在设置中开启「加粗模式」，全局 class `bold-mode` 自动将所有字重上移两级，无需逐一修改组件。

---

## 4. 间距与圆角

| 场景 | 值 |
|------|-----|
| 卡片圆角 | `rounded-2xl`（16px） |
| 小组件圆角（按钮、pill、输入框） | `rounded-lg`（8px） |
| Segmented Control 容器 | `rounded-[10px]` |
| Segmented Control 选中项 | `rounded-[8px]` |
| 日期选中格子 | `border-radius: 8px`（方正，非胶囊） |
| 页面水平内边距 | `px-4`（16px） |
| 卡片内边距 | `p-4`（16px） |
| 列表项间距 | `gap-3`（12px） |

---

## 5. 阴影

| 场景 | 值 |
|------|-----|
| 普通卡片 | `shadow-sm`（Tailwind 默认） |
| 今天日期浮起卡片 | 明显阴影，参考 `box-shadow: 0 4px 12px rgba(51,112,255,0.15)` |
| 浮层、抽屉 | `shadow-lg` |

---

## 6. 组件规范

### 6.1 卡片

```jsx
<div className="bg-white rounded-2xl shadow-sm p-4">
  ...
</div>
```

### 6.2 Segmented Control（iOS 风格筛选栏）

```jsx
<div className="seg-ctrl">
  <button className={active ? 'active' : ''}>标签</button>
</div>
```

`.seg-ctrl` 定义于 `globals.css`，禁止内联覆盖样式。

### 6.3 数字输入（工时录入）

大按钮步进器，步长 0.5，避免弹出键盘：

```
[−]  9.0  [＋]
```

按钮尺寸不小于 44×44px（iOS 触控最小目标）。

### 6.4 底部 Tab 导航

文件：`/components/BottomNav.tsx`

Tab 顺序（固定，不得随意调整）：

| 位置 | Tab 名 |
|------|--------|
| 1 | 今日录入 |
| 2 | 月度工资 |
| 3 | 统计分析 |
| 4 | 员工管理 |
| 5 | 设置 |

选中态：品牌蓝图标 + 文字，圆角背景高亮。

### 6.5 抽屉（Drawer）

使用 `vaul` 库：

- 默认高度：`82dvh`
- 顶部：drag handle 居中 + 左侧关闭按钮 + 中间标题
- 禁止：全屏抽屉、无 drag handle 抽屉

### 6.6 Toast 提示

保存成功、操作反馈使用轻量 toast，不使用 alert / confirm 弹窗。

### 6.7 工资金额显示

- 格式：`¥2493.00`（无千位逗号）
- 字重：`font-bold`
- 颜色：`#1A3A8F`
- 默认星号遮罩，点眼睛图标切换显示

### 6.8 通知区域（首页）

位于日期选择器与保存按钮之间，不占满全宽，三种状态：

| 时间 / 状态 | 文案 | 视觉强度 |
|-------------|------|----------|
| 18:00 前，未录入 | 还没下班哦 | 弱（灰色提示） |
| 18:00 后，未录入 | 请录入工时 | 中强（橙色警示） |
| 已保存 | 今天已录入 ✓ | 弱（绿色） |

### 6.9 天气组件

- 位置：首页日期栏右侧
- 格式：`明日 ⛅ 18°~24°`，一行，不换行
- 数据源：和风天气 API，服务端请求，Key 不暴露前端
- 温差超过 5° 或天气类型突变：在用户每天第一次保存工时后弹窗提醒

---

## 7. 语言规范

- **全中文界面**，不使用英文作为界面标题或标签
- 禁止出现：Profile / Record / History / Overview / Dashboard 等英文小标题
- 等宽编号（如工号）使用 `.font-identifier` class
- 金额无千位逗号（符合中国工人阅读习惯）

---

## 8. 移动端优先原则

- 最高频操作（今日录入全员）必须在 **3 秒内完成**
- 所有可交互元素最小触控区域 **44×44px**
- 数字输入用步进器，禁止弹出系统键盘录入工时
- 列表滚动区域避免嵌套滚动
- 字号不小于 14px（老花眼用户场景）

---

## 9. 动态天气背景

首页顶部日历区域根据当天天气状态切换背景，使用纯 CSS `@keyframes` 动画，禁止使用 Canvas 粒子系统（性能考虑）。

| 天气类型 | 背景渐变 | 动画元素 |
|----------|----------|----------|
| 晴 / 少云 | 蓝天渐变 | 白云浮动 |
| 多云 / 阴 | 灰蓝渐变 | 厚云层 |
| 小雨 / 阵雨 | 深蓝灰 | 稀疏雨滴（约30条） |
| 大雨 / 暴雨 | 深色 | 密集快速雨滴（约55条） |
| 雪 | 浅灰蓝 | 飘落白点 |

---

## 10. 文件结构约定

```
app/
  (main)/           # 主界面（需登录）
    page.tsx        # 今日录入（首页）
    salary/         # 月度工资
    stats/          # 统计分析
    employees/      # 员工管理
  login/            # 登录页
  api/              # API 路由
components/
  BottomNav.tsx     # 底部导航（唯一实例）
db/
  schema.ts         # Drizzle schema（clockin schema）
lib/
  session.ts        # iron-session 配置
  queries.ts        # 数据库查询函数
public/
  logo.svg          # 品牌 Logo（512×512）
  favicon.svg       # Favicon（32×32）
```

---

## 11. 禁止事项速查

| 禁止 | 原因 |
|------|------|
| 引入新色值（未在本文档列出） | 破坏色彩一致性 |
| 金额使用千位逗号 | 不符合用户习惯 |
| 英文界面标题 | 用户为中文使用者 |
| Canvas 粒子动画 | 低端设备性能问题 |
| 全屏 alert/confirm | 体验粗暴，用 toast 替代 |
| 工时录入弹出键盘 | 用步进器替代 |
| 修改 Tab 顺序 | 已固定，改动影响用户习惯 |
| logo 改色或变形 | 品牌一致性 |

---

*最后更新：2026年5月 / 荣源考勤 v1.0*
