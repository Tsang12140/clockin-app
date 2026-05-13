#!/usr/bin/env node
/* eslint-disable no-console, @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { Client } = require('pg');
const ExcelJS = require('exceljs');
const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const CONFIG_PATH = process.env.BACKUP_CONFIG || '/www/backup/backup-config.json';
const BACKUP_TIME_ZONE = 'Asia/Shanghai';

function formatDateInBackupZone(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BACKUP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function stamp() {
  return formatDateInBackupZone(new Date());
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing config: ${filePath}. Copy backup-config.example.json and fill S4 settings first.`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing app env file: ${filePath}`);
  }
  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function ensureDirs(config) {
  fs.mkdirSync(config.tmpDir, { recursive: true });
  fs.mkdirSync(config.logDir, { recursive: true });
}

function makeS3(config) {
  return new S3Client({
    endpoint: config.s3.endpoint,
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
    forcePathStyle: Boolean(config.s3.forcePathStyle),
  });
}

async function uploadFile(s3, config, localPath, key, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: fs.createReadStream(localPath),
    ContentType: contentType,
  }));
  console.log(`Uploaded s3://${config.s3.bucket}/${key}`);
}

function findPgDump() {
  const candidates = [
    '/www/server/pgsql/bin/pg_dump',
    '/www/server/postgresql/bin/pg_dump',
    'pg_dump',
  ];
  return candidates.find(candidate => candidate === 'pg_dump' || fs.existsSync(candidate));
}

function runPgDump(databaseUrl, outputPath) {
  const pgDump = findPgDump();
  console.log(`Running ${pgDump} -> ${outputPath}`);
  execFileSync(pgDump, [
    '--format=plain',
    '--no-owner',
    '--no-privileges',
    '--schema=clockin',
    '--file',
    outputPath,
    databaseUrl,
  ], { stdio: 'inherit' });
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function dateKey(dateLike) {
  if (dateLike instanceof Date) return formatDateInBackupZone(dateLike);
  return String(dateLike).slice(0, 10);
}

function statusText(record) {
  if (!record) return '';
  if (record.status === 'worked') return Number(record.hours || 0) ? String(Number(record.hours)) : '';
  if (record.status === 'leave') return '假';
  if (record.status === 'holiday') return '休';
  if (record.status === 'sick') return '病';
  if (record.status === 'absent') return '旷';
  return record.status_label || '特';
}

function effectiveRate(history, employeeId, workDate, fallback) {
  const rows = history.get(employeeId) || [];
  let rate = Number(fallback || 0);
  for (const row of rows) {
    if (dateKey(row.effective_date) <= workDate) {
      rate = Number(row.rate || rate);
    } else {
      break;
    }
  }
  return rate;
}

async function buildExcel(databaseUrl, outputPath, year) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const employees = (await client.query(`
      SELECT e.id, e.name, e.status, e.current_hourly_rate, p.name AS position_name
      FROM clockin.employees e
      LEFT JOIN clockin.positions p ON e.position_id = p.id
      ORDER BY CASE WHEN e.status = 'active' THEN 0 ELSE 1 END, e.id
    `)).rows;

    const records = (await client.query(`
      SELECT employee_id, work_date, hours, status, status_label
      FROM clockin.attendance_records
      WHERE work_date >= $1 AND work_date <= $2
      ORDER BY work_date, employee_id
    `, [`${year}-01-01`, `${year}-12-31`])).rows;

    const rates = (await client.query(`
      SELECT employee_id, rate, effective_date
      FROM clockin.hourly_rate_history
      ORDER BY employee_id, effective_date
    `)).rows;

    const recordMap = new Map();
    for (const record of records) {
      recordMap.set(`${record.employee_id}:${dateKey(record.work_date)}`, record);
    }

    const historyMap = new Map();
    for (const row of rates) {
      const list = historyMap.get(row.employee_id) || [];
      list.push(row);
      historyMap.set(row.employee_id, list);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'clockin-app backup';
    workbook.created = new Date();

    for (let month = 1; month <= 12; month += 1) {
      const sheet = workbook.addWorksheet(`${month}月`);
      const maxDay = daysInMonth(year, month);
      const headers = ['姓名'];
      for (let day = 1; day <= maxDay; day += 1) headers.push(String(day));
      headers.push('总工时', '预估工资', '当前时薪', '岗位', '员工状态');
      sheet.addRow(headers);

      for (const employee of employees) {
        const row = [employee.name];
        let totalHours = 0;
        let totalWage = 0;

        for (let day = 1; day <= maxDay; day += 1) {
          const workDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const record = recordMap.get(`${employee.id}:${workDate}`);
          row.push(statusText(record));
          if (record?.status === 'worked') {
            const hours = Number(record.hours || 0);
            totalHours += hours;
            totalWage += hours * effectiveRate(historyMap, employee.id, workDate, employee.current_hourly_rate);
          }
        }

        row.push(Number(totalHours.toFixed(1)));
        row.push(Number(totalWage.toFixed(2)));
        row.push(Number(employee.current_hourly_rate || 0));
        row.push(employee.position_name || '');
        row.push(employee.status === 'active' ? '在职' : '离职');
        sheet.addRow(row);
      }

      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.getRow(1).font = { bold: true };
      sheet.getColumn(1).width = 12;
      for (let col = 2; col <= maxDay + 1; col += 1) sheet.getColumn(col).width = 5;
      sheet.getColumn(maxDay + 2).width = 10;
      sheet.getColumn(maxDay + 3).width = 12;
      sheet.getColumn(maxDay + 4).width = 10;
      sheet.getColumn(maxDay + 5).width = 14;
      sheet.getColumn(maxDay + 6).width = 10;
    }

    await workbook.xlsx.writeFile(outputPath);
  } finally {
    await client.end();
  }
}

async function pruneOldDbDumps(s3, config) {
  const keepDays = Number(config.retention?.dailyDbDays || 30);
  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  const prefix = 'backups/db/';
  const listed = await s3.send(new ListObjectsV2Command({ Bucket: config.s3.bucket, Prefix: prefix }));
  for (const item of listed.Contents || []) {
    if (!item.Key || !item.LastModified) continue;
    if (item.LastModified.getTime() < cutoff) {
      await s3.send(new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: item.Key }));
      console.log(`Deleted old backup ${item.Key}`);
    }
  }
}

async function main() {
  const config = loadJson(CONFIG_PATH);
  ensureDirs(config);
  const env = loadEnv(config.appEnvPath);
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error(`DATABASE_URL not found in ${config.appEnvPath}`);

  const today = stamp();
  const year = Number(today.slice(0, 4));
  const sqlPath = path.join(config.tmpDir, `clockin-db-${today}.sql`);
  const excelPath = path.join(config.tmpDir, `clockin-attendance-${year}.xlsx`);

  runPgDump(databaseUrl, sqlPath);
  await buildExcel(databaseUrl, excelPath, year);

  const s3 = makeS3(config);
  await uploadFile(s3, config, sqlPath, `backups/db/clockin-db-${today}.sql`, 'application/sql');
  await uploadFile(
    s3,
    config,
    excelPath,
    `backups/excel/clockin-attendance-${year}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  await pruneOldDbDumps(s3, config);
  console.log('Daily backup finished.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
