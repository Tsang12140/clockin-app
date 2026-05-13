@AGENTS.md

# UI font-weight 规则（必读）

本项目有全局 `bold-mode` 开关，会系统性地加重 Tailwind 字重 class。凡涉及字重改动，必须执行以下检查：

1. 确认目标元素及其父级的 JSX/CSS 来源
2. 确认是否在 `bold-mode` 范围内，或使用了 `font-normal / font-medium / font-semibold / font-bold`
3. 确认父级是否有 `style={{ fontWeight: ... }}` 内联覆盖
4. 检查 `.next/dev/static/chunks` 生成产物，确认改动已生效
5. 有条件时刷新浏览器确认实际渲染效果；无条件时明确说明并提供替代证据

**AI 助手面板字重固定规则**（不受 bold-mode 影响，必须用 inline style）：
- 标题：`fontWeight: 600`
- 对话正文：`fontWeight: 400`
- 快捷提问 / 操作按钮：`fontWeight: 400`，有明确视觉理由才用 500

# 版本号规则

每次改动代码后，必须更新 `app/(main)/settings/page.tsx` 底部的版本号。
- 格式：`v1.01`，每次改动 +0.01
- **当前版本：v1.93**
- 位置：设置页面最底部，居中，小字灰色弱化显示（`text-[11px] text-gray-300`）

# AI 助手调优记录规则

凡涉及 AI 助手调优的改动（修改 `lib/ai/attendanceAssistant.ts` 的 prompt、intent、executor 逻辑，或修改 `components/AIAssistant.tsx` 的交互行为），完成后**必须同步更新 `调优.md`**。

## 更新格式

### 如果是修复已知短板，在「已知短板」表格里把对应行标记为已解决：
```
| ~~🔴 高~~ ✅ | 问题描述 | 根因 | vX.XX：修复说明 |
```

### 如果是新增调优阶段，在「调优时间线」末尾追加一节：
```markdown
### 阶段N：简短标题（vX.XX）

**问题**：用一句话描述用户遇到了什么问题或反馈了什么。

**根因**：为什么会这样，技术层面的原因。

**改动**：
- 改了哪个函数 / 哪段 prompt
- 新增了什么规则或逻辑

**Prompt 关键规则**（如有）：
> 新增的 prompt 规则原文
```

### 如果是新发现短板，在「已知短板」表格追加一行：
```
| 🔴/🟡/🟢 优先级 | 问题描述 | 根因 | 解决方向 |
```

### 如果是前端面板改动，在「前端 AI 面板调优记录」表格追加一行：
```
| vX.XX | 改动描述 | 改动原因 |
```

## 必须更新的时机
- 修完代码、版本号已 +0.01 之后，在同一次回复里完成调优.md 更新
- 不允许"之后再补"——跨会话会丢失上下文

# 服务器环境

## 常用路径
- psql 路径：`/www/server/pgsql/bin/psql`
- clockin 部署路径：`/www/wwwroot/clockin-app`
- rent 部署路径：`/www/wwwroot/rentc`（注意不是 /rent）

## 数据库连接
```bash
/www/server/pgsql/bin/psql -U tsang -d rent
```

## ⚠️ 服务器构建必须限制内存

服务器内存有限，直接跑 `npm run build` 会卡死。所有构建命令必须加 `NODE_OPTIONS`：

```bash
# clockin 标准部署流程
cd /www/wwwroot/clockin-app && NODE_OPTIONS="--max-old-space-size=512" npm run build && pm2 restart clockin

# rent 标准部署流程（注意目录是 rentc）
cd /www/wwwroot/rentc && NODE_OPTIONS="--max-old-space-size=512" npm run build && pm2 restart rent
```

# 项目规则
