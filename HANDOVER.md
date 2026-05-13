# Clockin App — 交接文档

## 项目背景

这是一个面向小型团队的员工考勤与工资管理 PWA，主要在手机浏览器上使用。老板每天用首页录入各员工的出勤情况，月底查工资条、导出报表。

---

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js App Router（当前版本约 15.x），`force-dynamic` 为主 |
| 样式 | Tailwind CSS v4（使用 `lab()`/`oklch()` 现代色值，不兼容 html2canvas） |
| 数据库 | PostgreSQL，Drizzle ORM，schema 在 `db/schema.ts` |
| 认证 | iron-session，共用 rent 项目的 `family_members` 表 |
| 图片导出 | html-to-image（非 html2canvas，原因见下） |
| 部署 | 宝塔面板，PM2，服务器内存有限 |

---

## 服务器环境

- **clockin 路径**：`/www/wwwroot/clockin-app`（PM2 进程名 `clockin`，端口 3001）
- **rent 路径**：`/www/wwwroot/rent`（PM2 进程名 `rent`，端口 3000）
- **psql**：`/www/server/pgsql/bin/psql`
- **数据库连接**：`/www/server/pgsql/bin/psql -U tsang -d rent`

### ⚠️ 构建必须限制内存

服务器内存不足，直接跑 `npm run build` 会卡死，**所有构建命令必须加**：

```bash
# clockin 标准部署
cd /www/wwwroot/clockin-app && NODE_OPTIONS="--max-old-space-size=512" npm run build && pm2 restart clockin

# rent 标准部署
cd /www/wwwroot/rent && NODE_OPTIONS="--max-old-space-size=512" npm run build && pm2 restart rent
```

### PM2 从零启动（重启后 PM2 为空时）

```bash
# 先构建，再 start（不是 restart）
cd /www/wwwroot/clockin-app && NODE_OPTIONS="--max-old-space-size=512" npm run build
pm2 start npm --name clockin -- start -- -p 3001
pm2 save
```

---

## 数据库 Schema（`db/schema.ts`，clockin schema）

- `employees`：员工，含 `positionId`（FK）、`currentHourlyRate`、`status(active/inactive)`
- `positions`：岗位表，员工编辑/新增时自动 find-or-create
- `hourly_rate_history`：调薪记录，按 `effectiveDate` 分段计算工资
- `attendance_records`：每日考勤，状态：`worked/leave/holiday/sick/absent/custom`，`isLocked` 字段控制编辑权限
- `holidays`：法定节假日
- `family_members`（public schema，与 rent 共用）：登录账号

---

## 环境变量（`.env.local`）

```
DATABASE_URL=postgresql://tsang:...@127.0.0.1:5432/rent
SESSION_SECRET=...
SESSION_COOKIE_NAME=clockin_session
APP_USERNAME=tsang
APP_PASSWORD=...
QWEATHER_KEY=7cc3fa1b45db4a358f5d055e72171f8c
QWEATHER_LOCATION=101281101   # 广东江门城市代码
```

天气用和风天气私有 Host（非公共 devapi.qweather.com，已停服）：
- API Host：`kk46h44wbk.re.qweatherapi.com`（硬编码在 `lib/weather.ts`）

---

## 每次改代码必须做的事

### 1. 版本号 +0.01

每次改动后，在以下两处同步更新版本：

**`app/(main)/settings/page.tsx`** 底部：
```tsx
<div className="text-center text-[11px] text-gray-300 mt-6 pb-4">v1.67</div>
```

**`CLAUDE.md`**：
```
- 当前版本：v1.67
```

当前版本：**v1.67**

### 2. 部署时上传 `components/` 目录

`components/BottomNav.tsx` 不在 `app/` 里，容易漏传。每次涉及导航改动都要确认传了。

### 3. 服务器加新环境变量后必须重启 PM2

环境变量是启动时读取的，`echo >> .env.local` 之后必须重新构建并重启才生效。

---

## 关键设计决策与历史原因

| 问题 | 决策 | 原因 |
|------|------|------|
| 图片导出 | html-to-image，非 html2canvas | Tailwind v4 用 `lab()` 色值，html2canvas 不支持会报错 |
| 工资计算 | 按调薪历史分段，`effectiveRate()` 函数 | 员工加薪后历史月份应用旧薪 |
| 考勤锁定 | 过去日期自动锁定，需点「修改」解锁 | 防止误改历史数据 |
| 岗位存储 | `positions` 表 + 员工编辑时 find-or-create | 改为自由文本输入，不再需要预设岗位下拉 |
| 天气缓存 | 模块级变量，1小时有效 | 避免每次页面加载都请求 API |
| 字号设置 | localStorage，不存 DB | 无独立 users 表（auth 共用 rent 的 family_members），localStorage 够用 |

---

## 主要页面与文件

```
app/(main)/
  page.tsx                      首页（server component，汇聚数据）
  TodayEntry.tsx                首页主组件（client）：周历、员工考勤卡、通知条、周汇总表
  WeatherBg.tsx                 天气动画背景（独立组件，删除无副作用）
  salary/
    page.tsx + SalaryPage.tsx   月度工资列表
    [id]/page.tsx + PayslipView.tsx  单人工资条（含员工切换+月份切换）
  stats/
    page.tsx + StatsView.tsx    统计分析（月趋势图+员工工时条）
  employees/
    EmployeeList.tsx            员工列表（头像圆圈、时薪遮蔽眼睛）
    [id]/EmployeeDetail.tsx     员工详情/编辑
    [id]/actions.ts             updateEmployee（含岗位 find-or-create）
    new/NewEmployeeForm.tsx     新增员工
    new/actions.ts              createEmployee（含岗位 find-or-create）
  settings/page.tsx             设置（大字模式、字号4级、退出登录、版本号）

components/
  BottomNav.tsx                 底部导航：首页→工资→统计→员工→设置

lib/
  weather.ts                    天气 API 封装（7天优先/3天兜底、按日期匹配预报）
  utils.ts                      formatMoney、formatHours、effectiveRate 等
  queries.ts                    常用 DB 查询

db/
  schema.ts                     Drizzle schema
  index.ts                      db 实例 + re-export schema
```

---

## 当前功能状态（v1.67）

### 已完成
- 每日考勤录入（+/-调整、状态选择、全体放假、自定义状态）
- 历史日期锁定与补录
- 周视图日历（滑动切换周）
- 月度工资列表（在职/全部筛选、导出 Excel）
- 单人工资条（分段薪资计算、月历展示、保存图片/分享）
- 工资条员工切换（card 内 ←姓名→）、月份切换（←年月→）
- 统计分析（近6月趋势图、当月员工工时条）
- 员工管理（列表头像圆圈、时薪遮蔽、整行可点）
- 员工详情（编辑、调薪记录、身份证遮蔽、标记离职）
- 岗位自由文本输入（自动 find-or-create）
- 设置页（大字模式、考勤字号4级、版本号）
- 天气（和风天气，江门，按时段显示今日/明日，本周内历史日期可查询当天历史天气，点击天气条主动刷新）
- 首页通知条（优先级：18点未录→已录入→上班时间→休息时间）

### 已知待优化
- 天气动画背景在首页日历下方，用户可选删除 `WeatherBg.tsx` 及 TodayEntry 中引用
- 字号设置仅影响考勤卡片（用 CSS `zoom` 做整体放大，配合 grid 和动态 CSS 变量防止状态折行），不影响其他页面

---

## 常见问题排查

**构建卡死** → 检查是否加了 `NODE_OPTIONS="--max-old-space-size=512"`

**天气不显示** → 检查 `.env.local` 有无 `QWEATHER_KEY` 和 `QWEATHER_LOCATION`；用 `curl -s --compressed "https://kk46h44wbk.re.qweatherapi.com/v7/weather/3d?location=101281101&key=KEY"` 验证 API

**rent 显示测试数据** → 检查 `/www/wwwroot/rent/.env.local` 是否有 `DATA_SOURCE=db`

**PM2 重启循环（↺120+）** → `.next` 目录不存在，需先 `npm run build`

**Tab 顺序不对** → `components/BottomNav.tsx` 没有上传，不在 `app/` 目录下
