# AI 接力文档

> 每次开始新会话前先读这份文档，结束时更新它。

## 当前状态（2026-05-04）

### 已完成（2026-05-04 第二轮）

- [x] Next.js 14 App Router 项目初始化（`D:\personal\cc\clockin-app`）
- [x] 数据库 schema（`db/schema.ts`）：clockin schema，6 张表
- [x] 数据库连接（`db/index.ts`）：drizzle-orm + node-postgres
- [x] iron-session 认证基础（`lib/session.ts`）
- [x] 工具函数（`lib/utils.ts`）：formatMoney、formatHours、effectiveRate 等
- [x] 通用查询函数（`lib/queries.ts`）：getActiveEmployees、getMonthlySalary 等
- [x] 底部 Tab 导航（`components/BottomNav.tsx`）
- [x] **今日录入页**（`app/(main)/page.tsx` + `TodayEntry.tsx`）：日期切换 + 工时调节 + 状态下拉 + 保存
- [x] **员工管理页**（`app/(main)/employees/`）：在职/离职筛选 + 员工卡片列表
- [x] **月度工资表**（`app/(main)/salary/`）：月份切换 + 工时/工资汇总 + 员工明细
- [x] **seed.sql**（`seed.sql`）：从 1.xlsx 解析的真实历史数据，11 名员工，2754 条考勤记录

- [x] **登录页** + **中间件鉴权**：`/login`，iron-session，APP_USERNAME/APP_PASSWORD
- [x] **员工详情/编辑**：`/employees/[id]`（基础信息编辑、身份证打码、调薪历史、标记离职）
- [x] **新增员工**：`/employees/new`（岗位选择自动带入默认时薪）
- [x] **Excel 导出**：`GET /api/export/salary?year=&month=`（每人每天横排格式）

### 待完成（按优先级）

1. **考勤查询页**：`/attendance`，按员工+时间范围查询，导出 Excel
2. **假期管理**：节假日批量配置
3. **统计分析页**：月度/年度汇总、同比环比
4. **漏填提醒**：首页顶部 Banner（未录入天数）

## 技术要点

### 数据库
- Schema：`clockin`（独立于房产项目）
- 时薪历史：`hourly_rate_history` 表，按 `effective_date` 区间匹配
- 工资计算：`totalHours × effectiveRate(date)`，不受后续调薪影响

### 真实历史数据（来自 1.xlsx）
| 员工 | 入职 | 时薪变更记录 | 当前状态 |
|------|------|-------------|---------|
| 曾金娣 | 2023-04 | 23.5 → 24.5(2025-02) → 25.5(2026-03) | 在职·组长 |
| 黎彩群 | 2023-04 | 16 → 17(2025-02) → 18(2026-03) | 在职 |
| 陈继容 | 2023-04 | 16 → 17(2025-02) → 18(2026-03) | 在职 |
| 谢明清 | 2024-07 | 17 → 18(2025-02) → 19(2026-03) | 在职 |
| 镜 | 2025-09 | 18 | 离职(2025-11) |
| 张春容等6人 | 2024-02 | 12.5–13.5 | 离职(2024-03) |

### 部署
- 端口：3001（同阿里云服务器）
- PM2 启动：`pm2 start npm --name clockin -- start -- -p 3001`

## 文件结构
```
clockin-app/
├── app/
│   ├── (main)/
│   │   ├── layout.tsx         # 含底部导航的主布局
│   │   ├── page.tsx           # 今日录入
│   │   ├── TodayEntry.tsx     # 今日录入客户端组件
│   │   ├── actions.ts         # saveAttendance server action
│   │   ├── employees/         # 员工管理
│   │   ├── salary/            # 月度工资
│   │   └── stats/             # 统计分析（占位）
│   ├── layout.tsx             # 根布局
│   └── globals.css
├── components/
│   └── BottomNav.tsx
├── db/
│   ├── schema.ts              # Drizzle schema（clockin schema）
│   └── index.ts
├── lib/
│   ├── queries.ts             # 数据查询函数
│   ├── session.ts             # iron-session
│   └── utils.ts
├── seed.sql                   # 真实历史数据 SQL
├── DESIGN_RULES.md
└── .env.local                 # 需配置 DATABASE_URL
```
