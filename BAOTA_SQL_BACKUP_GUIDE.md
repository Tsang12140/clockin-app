# 宝塔界面配置 PostgreSQL SQL 备份指南

这份指引用于在宝塔面板里通过「计划任务」定时备份 PostgreSQL 数据库。示例以 `rent` 项目为例，实际使用时请把路径、数据库名、用户、schema 改成对应项目自己的配置。

## 目标

- 每天自动导出一份 PostgreSQL SQL 备份。
- 备份文件保存在服务器本地固定目录。
- 通过宝塔计划任务日志确认是否成功。
- 必要时可以用 SQL 文件恢复数据库。

## 推荐目录

建议为每个项目单独建备份目录，避免混用：

```bash
mkdir -p /www/backup/rent/db
mkdir -p /www/backup/rent/logs
```

示例最终结构：

```text
/www/backup/rent/db/      # SQL 备份文件
/www/backup/rent/logs/    # 执行日志
```

## 先确认数据库连接

进入项目目录：

```bash
cd /www/wwwroot/rent
```

查看环境变量文件：

```bash
grep '^DATABASE_URL=' .env.local
```

如果项目不是 `.env.local`，就查看实际使用的环境文件，例如：

```bash
grep '^DATABASE_URL=' .env
```

常见格式：

```text
DATABASE_URL=postgres://用户名:密码@localhost:5432/数据库名
```

注意：

- 不要把密码发给别人。
- 只需要确认它是不是当前线上项目正在用的数据库。
- 如果宝塔里项目通过 PM2 设置了环境变量，也要确认 PM2 实际使用的 `DATABASE_URL`。

## 先手动测试一次

假设数据库连接写在 `/www/wwwroot/rent/.env.local`，可以用下面命令从 env 里自动读取：

```bash
cd /www/wwwroot/rent
DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)
/www/server/pgsql/bin/pg_dump \
  --format=plain \
  --no-owner \
  --no-privileges \
  --file "/www/backup/rent/db/rent-db-$(date +%F).sql" \
  "$DATABASE_URL"
```

如果你的 PostgreSQL 路径不是 `/www/server/pgsql/bin/pg_dump`，先查：

```bash
ls /www/server/pgsql/bin/pg_dump
ls /www/server/postgresql/bin/pg_dump
which pg_dump
```

手动测试成功后，看文件是否生成：

```bash
ls -lh /www/backup/rent/db
```

## 宝塔计划任务配置

打开：

```text
宝塔面板 -> 计划任务 -> 添加任务
```

推荐填写：

```text
任务类型：Shell脚本
任务名称：rent每日SQL备份
执行周期：每天
执行时间：02:00
```

脚本内容填：

```bash
cd /www/wwwroot/rent
DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)
/www/server/pgsql/bin/pg_dump \
  --format=plain \
  --no-owner \
  --no-privileges \
  --file "/www/backup/rent/db/rent-db-$(date +%F).sql" \
  "$DATABASE_URL" >> /www/backup/rent/logs/daily-sql.log 2>&1
```

如果项目使用的是 `.env`，把 `.env.local` 改成 `.env`。

如果你只想备份某一个 schema，例如 `rent` schema，可以加：

```bash
  --schema=rent \
```

完整示例：

```bash
cd /www/wwwroot/rent
DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)
/www/server/pgsql/bin/pg_dump \
  --format=plain \
  --no-owner \
  --no-privileges \
  --schema=rent \
  --file "/www/backup/rent/db/rent-db-$(date +%F).sql" \
  "$DATABASE_URL" >> /www/backup/rent/logs/daily-sql.log 2>&1
```

## 验证是否成功

在宝塔计划任务列表里，点击该任务的「执行」手动跑一次。

然后终端查看：

```bash
tail -n 80 /www/backup/rent/logs/daily-sql.log
ls -lh /www/backup/rent/db
```

正常应该看到新的 `.sql` 文件，例如：

```text
rent-db-2026-05-08.sql
```

也可以查看文件开头：

```bash
head -n 30 /www/backup/rent/db/rent-db-$(date +%F).sql
```

## 自动清理旧备份

如果只想保留最近 30 天，可以在宝塔任务脚本最后追加：

```bash
find /www/backup/rent/db -name "rent-db-*.sql" -type f -mtime +30 -delete
```

完整版本：

```bash
cd /www/wwwroot/rent
DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)
/www/server/pgsql/bin/pg_dump \
  --format=plain \
  --no-owner \
  --no-privileges \
  --file "/www/backup/rent/db/rent-db-$(date +%F).sql" \
  "$DATABASE_URL" >> /www/backup/rent/logs/daily-sql.log 2>&1
find /www/backup/rent/db -name "rent-db-*.sql" -type f -mtime +30 -delete
```

如果服务器空间足够，保留 90 天也可以：

```bash
find /www/backup/rent/db -name "rent-db-*.sql" -type f -mtime +90 -delete
```

## 恢复前提醒

恢复 SQL 会改数据库，务必先额外备份当前数据库。

恢复示例：

```bash
psql "DATABASE_URL" < /www/backup/rent/db/rent-db-2026-05-08.sql
```

如果用宝塔 PostgreSQL 路径：

```bash
/www/server/pgsql/bin/psql "DATABASE_URL" < /www/backup/rent/db/rent-db-2026-05-08.sql
```

如果只恢复到测试库，先把 `DATABASE_URL` 换成测试库连接，避免覆盖线上数据。

## 常见问题

### 1. 宝塔里显示任务成功，但没有备份文件

看日志：

```bash
tail -n 120 /www/backup/rent/logs/daily-sql.log
```

常见原因：

- `pg_dump` 路径不对。
- `.env.local` 不存在。
- `DATABASE_URL` 为空。
- 数据库密码里有特殊字符，但 env 里没有正确转义。
- 备份目录没有创建。

### 2. 任务时间不对

查看服务器时区：

```bash
date
timedatectl
```

应该是：

```text
Time zone: Asia/Shanghai
```

### 3. 不要混项目

`clockin`、`rent` 这类项目必须分开：

```text
/www/wwwroot/clockin-app
/www/wwwroot/rent

/www/backup/clockin
/www/backup/rent
```

不要共用同一个备份目录，也不要让计划任务读取另一个项目的 `.env.local`。

