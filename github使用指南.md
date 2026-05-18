# GitHub 使用指南（个人备忘）

仓库地址：https://github.com/Tsang12140/clockin-app

---

## 一、每台电脑只需做一次的准备

### 1. 确认 Node.js 已安装

```bash
node -v   # 应该显示 v18 或以上
npm -v
```

没有的话去 https://nodejs.org 下载安装 LTS 版本。

### 2. 克隆项目到本地

```bash
git clone https://github.com/Tsang12140/clockin-app.git
cd clockin-app
npm install
```

### 3. 手动创建 .env.local

`.env.local` 包含数据库密码，不会被 git 同步，每台电脑需要自己放一份。
把公司电脑上的 `.env.local` 文件直接复制过来是最省事的方式。

内容格式参考：

```
DATABASE_URL=postgresql://tsang:密码@服务器IP:5432/rent
SESSION_SECRET=你的密钥
SESSION_COOKIE_NAME=clockin_session
APP_USERNAME=tsang
APP_PASSWORD=你的密码
QWEATHER_KEY=7cc3fa1b45db4a358f5d055e72171f8c
QWEATHER_LOCATION=101281101
```

### 4. 配置 Claude Code 权限白名单（VS Code 插件）

`.claude/settings.local.json` 不会被 git 同步（机器专属），换电脑后 Claude 会频繁弹权限确认。
在新电脑的项目目录下手动创建 `.claude/settings.local.json`，内容直接复制下面这份：

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npm install *)",
      "Bash(npx tsc *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push *)",
      "Bash(git pull *)",
      "Bash(git status *)",
      "Bash(git log *)",
      "Bash(git diff *)",
      "Bash(git config *)",
      "Bash(netstat -ano)",
      "WebSearch"
    ]
  }
}
```

> 这个文件只是告诉 Claude 哪些命令不需要每次弹窗确认，不包含任何密码。

### 5. Claude 的记忆不会自动同步

Claude Code 的"记忆"（项目背景、你的偏好、历史决策）存在 `C:\Users\你的用户名\.claude\` 里，
不随代码同步。换电脑后 Claude 会"失忆"，需要在新会话里简单介绍一下项目背景，
或者让 Claude 读一遍 `AI_CURRENT_HANDOFF.md` 和 `CLAUDE.md` 重新建立上下文。

**快速唤醒 Claude 上下文的提示语：**
> 你先读一下 CLAUDE.md、AI_CURRENT_HANDOFF.md 和 HANDOVER.md，了解这个项目。

---

## 二、日常开发流程

### 开始工作前（拉取最新代码）

```bash
git pull
```

> 如果另一台电脑最近有推送过代码，这一步会把新代码拉下来。
> 如果两台电脑都没有动过，这一步也没有副作用，养成习惯就行。

---

### 开发过程中（随时保存进度）

改完一个功能、修完一个 bug，就提交一次，不需要等"全部做完"才提交。

```bash
git add .
git commit -m "简单描述：改了什么"
```

提交信息例子：
- `修复保存失败的bug`
- `首页新增天气显示`
- `员工详情页调整布局`

---

### 结束工作后（推送到 GitHub）

```bash
git push
```

> 这一步才是真正同步到云端。commit 只是本地记录，push 才能让另一台电脑看到。
> **下班/收工前必须 push，否则换电脑拉不到最新代码。**

---

## 三、换电脑场景

### 场景 A：公司电脑 → 回家电脑

1. **公司电脑**：收工前确认已推送
   ```bash
   git add .
   git commit -m "今日进度"
   git push
   ```

2. **家里电脑**：开始前拉取
   ```bash
   git pull
   npm install   # 只有 package.json 有变化时才需要
   ```

3. 打开 VS Code，开启新的 Claude 会话，发送唤醒提示语让 Claude 读文档重建上下文。

---

### 场景 B：家里电脑 → 回公司电脑

1. **家里电脑**：收工前确认已推送
   ```bash
   git add .
   git commit -m "周末进度"
   git push
   ```

2. **公司电脑**：开始前拉取
   ```bash
   git pull
   ```

3. 同样开新会话，发送唤醒提示语。

---

## 四、部署到服务器（宝塔面板）

### 登录服务器

打开宝塔面板 → 左侧菜单「终端」或「SSH 终端」，进入命令行。

---

### 首次配置：让服务器也能从 GitHub 拉代码（只做一次）

服务器上的项目目录原本不是 git 仓库，需要先把它改造成能从 GitHub 拉取的仓库。

```bash
# 进入项目目录
cd /www/wwwroot/clockin-app

# 初始化 git（如果还没初始化）
git init
git remote add origin https://github.com/Tsang12140/clockin-app.git
git fetch origin
git checkout -b main origin/main
```

> 如果提示 `main already exists`，改用：
> ```bash
> git branch -f main origin/main
> git checkout main
> ```

完成后验证一下：
```bash
git status   # 应该显示 On branch main, nothing to commit
```

---

### 日常部署流程（每次更新代码后）

本地改好代码、push 到 GitHub 之后，到服务器执行：

```bash
cd /www/wwwroot/clockin-app
git pull
NODE_OPTIONS="--max-old-space-size=512" npm run build
pm2 restart clockin
```

> ⚠️ 服务器内存有限，**构建命令必须带 `NODE_OPTIONS`**，否则会卡死。
> `npm run build` 大约需要 1～3 分钟，等出现 `✓ Compiled` 再执行 pm2 restart。

---

### 验证部署成功

```bash
pm2 status          # clockin 应该显示 online
pm2 logs clockin --lines 20   # 看最近日志，确认没有报错
```

然后打开线上地址刷新一下，确认功能正常。

---

### PM2 从零启动（服务器重启后 PM2 进程消失时）

```bash
cd /www/wwwroot/clockin-app
NODE_OPTIONS="--max-old-space-size=512" npm run build
pm2 start npm --name clockin -- start -- -p 3001
pm2 save
```

---

### 如果 git pull 有冲突（服务器上文件被直接改动过）

```bash
git fetch origin
git reset --hard origin/main   # 强制和 GitHub 保持一致，放弃服务器本地改动
```

> 只在服务器上直接改过文件、导致冲突时才用这个。正常情况不会遇到。

---

## 五、查看历史记录

```bash
# 查看提交历史
git log --oneline

# 查看某次提交改了什么
git show 提交ID

# 查看当前有哪些文件被修改了
git status

# 查看具体改动内容
git diff
```

---

## 六、常见问题

### push 时提示需要先 pull？

说明 GitHub 上有你还没拉下来的代码，先 pull 再 push：

```bash
git pull
git push
```

### 改错了想撤销，还没有 commit？

```bash
git restore .
```

> ⚠️ 危险操作，会丢失所有未提交的修改，慎用。

### 改错了想撤销，已经 commit 但还没 push？

```bash
git reset HEAD~1
```

> 撤销最近一次 commit，代码改动保留，回到未提交状态。

### 不小心 push 了不想要的东西？

直接告诉 AI，让 AI 帮你处理，不要自己乱跑命令。

---

## 七、永远不要做的事

- 不要 `git push --force`（会覆盖 GitHub 上的历史）
- 不要手动删除 `.git` 文件夹（整个仓库历史会消失）
- 不要把 `.env.local` 手动 add 进去（里面有数据库密码）
- 不要把 `node_modules` 传到网盘再复制过来（直接 `npm install` 比复制快得多）

---

## 八、哪些文件会同步，哪些不会

| 文件 | 是否同步到 GitHub | 说明 |
|------|-----------------|------|
| 所有源代码 `.ts` `.tsx` | ✅ 同步 | |
| `CLAUDE.md` / `AGENTS.md` / `HANDOVER.md` | ✅ 同步 | Claude 的项目规则和上下文 |
| `package.json` / `package-lock.json` | ✅ 同步 | 依赖清单 |
| `.env.local` | ❌ 不同步 | 含密码，需每台电脑手动放 |
| `node_modules/` | ❌ 不同步 | 体积大，每台电脑 npm install |
| `.next/` | ❌ 不同步 | 构建产物，本地自动生成 |
| `.claude/settings.local.json` | ❌ 不同步 | Claude 权限白名单，需手动复制 |
| `C:\Users\Tsang\.claude\` | ❌ 不同步 | Claude 记忆，换电脑需重新建立 |
