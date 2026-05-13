#!/usr/bin/env node
/* eslint-disable no-console, @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const CONFIG_PATH = process.env.BACKUP_CONFIG || '/www/backup/backup-config.json';
const PROJECT_PATH = '/www/wwwroot/clockin-app';

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing config: ${filePath}. Copy backup-config.example.json and fill S4 settings first.`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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

function weekId(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function zipProject(outputPath) {
  if (!fs.existsSync(PROJECT_PATH)) throw new Error(`Project path does not exist: ${PROJECT_PATH}`);
  const excludes = [
    'node_modules/*',
    '.next/*',
    '.git/*',
    '.env.local',
    'tsconfig.tsbuildinfo',
    '.dev-server.log',
    '*.rar',
  ];
  const args = ['-r', outputPath, '.', ...excludes.flatMap(pattern => ['-x', pattern])];
  console.log(`Zipping ${PROJECT_PATH} -> ${outputPath}`);
  execFileSync('zip', args, { cwd: PROJECT_PATH, stdio: 'inherit' });
}

async function uploadFile(s3, config, localPath, key) {
  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: fs.createReadStream(localPath),
    ContentType: 'application/zip',
  }));
  console.log(`Uploaded s3://${config.s3.bucket}/${key}`);
}

async function pruneOldCodeBackups(s3, config) {
  const keep = Number(config.retention?.weeklyCodeVersions || 8);
  const prefix = 'backups/code/';
  const listed = await s3.send(new ListObjectsV2Command({ Bucket: config.s3.bucket, Prefix: prefix }));
  const files = (listed.Contents || [])
    .filter(item => item.Key && item.LastModified)
    .sort((a, b) => b.LastModified.getTime() - a.LastModified.getTime());
  for (const item of files.slice(keep)) {
    await s3.send(new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: item.Key }));
    console.log(`Deleted old backup ${item.Key}`);
  }
}

async function main() {
  const config = loadJson(CONFIG_PATH);
  ensureDirs(config);
  const id = weekId(new Date());
  const zipPath = path.join(config.tmpDir, `clockin-code-${id}.zip`);
  zipProject(zipPath);

  const s3 = makeS3(config);
  await uploadFile(s3, config, zipPath, `backups/code/clockin-code-${id}.zip`);
  await pruneOldCodeBackups(s3, config);
  console.log('Weekly code backup finished.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
