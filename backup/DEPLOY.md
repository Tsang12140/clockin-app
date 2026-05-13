# Clockin Backup Deploy

这套备份只针对工厂考勤项目，不包含 rent 业务数据。

## 备份内容

- 每天：导出 PostgreSQL `clockin` schema SQL，保存到 S4 `backups/db/`
- 每天：生成当年考勤 Excel，一个文件 12 个工作表，保存到 S4 `backups/excel/`
- 每周：打包 `/www/wwwroot/clockin-app` 代码，排除 `.env.local`、`.next`、`node_modules`、`.git`，保存到 S4 `backups/code/`

默认保留策略：

- SQL 日备份保留 365 天
- 代码周备份保留 52 份
- 年度 Excel 总表每天重新生成并覆盖同名文件，始终保留最新总表

## 第一次部署

在宝塔终端执行：

```bash
mkdir -p /www/backup/logs /www/backup/tmp
cd /www/backup
```

把本项目 `backup/` 目录里的这 3 个文件上传到 `/www/backup`：

```text
backup-daily.js
backup-weekly.js
backup-config.example.json
```

复制配置文件：

```bash
cp /www/backup/backup-config.example.json /www/backup/backup-config.json
```

编辑 `/www/backup/backup-config.json`，填你的缤纷云 S4 信息：

```json
{
  "s3": {
    "endpoint": "https://s3.bitiful.net",
    "region": "cn-east-1",
    "accessKeyId": "你的AccessKey",
    "secretAccessKey": "你的SecretKey",
    "bucket": "你的bucket",
    "forcePathStyle": false
  },
  "retention": {
    "dailyDbDays": 365,
    "weeklyCodeVersions": 52
  }
}
```

这版脚本用 AWS S3 SDK 自动拼出 `你的bucket.s3.bitiful.net`，所以 `endpoint` 这里不要把 bucket 名重复写进去。

安装脚本依赖：

```bash
cd /www/backup
npm init -y
npm install @aws-sdk/client-s3 pg exceljs
```

## 手动测试

先确认 PostgreSQL 工具路径：

```bash
ls /www/server/pgsql/bin/pg_dump
ls /www/server/postgresql/bin/pg_dump
```

测试每日备份：

```bash
node /www/backup/backup-daily.js
```

测试每周代码备份：

```bash
node /www/backup/backup-weekly.js
```

看到 `Daily backup finished.` 或 `Weekly code backup finished.`，并且 S4 控制台出现文件，就算成功。

## 宝塔计划任务

每日 02:00 执行：

```bash
cd /www/backup && node /www/backup/backup-daily.js >> /www/backup/logs/daily.log 2>&1
```

每周一 03:00 执行：

```bash
cd /www/backup && node /www/backup/backup-weekly.js >> /www/backup/logs/weekly.log 2>&1
```

查看日志：

```bash
tail -n 80 /www/backup/logs/daily.log
tail -n 80 /www/backup/logs/weekly.log
```

## 恢复数据库

先从 S4 下载某一天的 SQL 到服务器，例如：

```text
/www/backup/restore/clockin-db-2026-05-06.sql
```

恢复到当前 `rent` 数据库里的 `clockin` schema：

```bash
/www/server/pgsql/bin/psql -U tsang -d rent < /www/backup/restore/clockin-db-2026-05-06.sql
```

恢复前建议先额外做一次手动备份，避免把新数据覆盖掉。
