#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const PRISMA_DIR = path.join(process.cwd(), 'prisma');
const DATABASE_DIR = path.join(PRISMA_DIR, 'database');
const MIGRATIONS_DIR = path.join(PRISMA_DIR, 'migrations');

// 数据库 URL 环境变量映射
const DB_URL_VARS = {
  mysql: 'MYSQL_DATABASE_URL',
  postgres: 'PG_DATABASE_URL'
};

function copyDirectory(source, destination) {
  // 如果目标目录不存在，创建它
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // 读取源目录中的所有内容
  const items = fs.readdirSync(source);

  for (const item of items) {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);

    const stats = fs.statSync(sourcePath);
    if (stats.isDirectory()) {
      // 如果是目录，递归复制
      copyDirectory(sourcePath, destPath);
    } else {
      // 如果是文件，直接复制
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

function deleteMigrationsDir() {
  if (fs.existsSync(MIGRATIONS_DIR)) {
    console.log('🗑️  删除现有的 migrations 目录...');
    fs.rmSync(MIGRATIONS_DIR, { recursive: true, force: true });
  }
}

// 修改 schema 文件中的数据库配置
function updateSchemaConfig(schemaPath, dbType) {
  console.log(`📝 更新 schema 文件配置...`);

  // 读取原始内容
  let content = fs.readFileSync(schemaPath, 'utf8');
  const originalContent = content;

  if (dbType === 'sqlite') {
    // 修改 SQLite 数据库路径为 ../../data/db.db（用于迁移）
    content = content.replace(
      /url\s*=\s*"file:..\/data\/db.db"/,
      'url = "file:../../data/db.db"'
    );
  } else {
    // 获取对应的环境变量名
    const urlEnvVar = DB_URL_VARS[dbType];
    if (!urlEnvVar) {
      throw new Error(`未找到 ${dbType} 的数据库 URL 环境变量映射`);
    }

    // 替换 env("DATABASE_URL") 为对应的环境变量
    content = content.replace(
      /env\s*\(\s*"DATABASE_URL"\s*\)/,
      `env("${urlEnvVar}")`
    );
  }

  // 写入修改后的内容
  fs.writeFileSync(schemaPath, content, 'utf8');

  return originalContent;
}

// 恢复 schema 文件的原始内容，对于 SQLite 恢复为 ../data/db.db
function restoreSchema(schemaPath, dbType, originalContent) {
  if (originalContent) {
    console.log(`📝 恢复 schema 文件的原始内容...`);
    if (dbType === 'sqlite') {
      // 确保恢复为 ../data/db.db
      let content = originalContent;
      if (content.includes('../../data/db.db')) {
        content = content.replace(
          /url\s*=\s*"file:..\/..\/data\/db.db"/,
          'url = "file:../data/db.db"'
        );
      }
      fs.writeFileSync(schemaPath, content, 'utf8');
    } else {
      fs.writeFileSync(schemaPath, originalContent, 'utf8');
    }
  }
}

async function processDatabaseType(dbType) {
  const schemaPath = path.join(DATABASE_DIR, dbType, 'schema.prisma');
  const dbMigrationsDir = path.join(DATABASE_DIR, dbType, 'migrations');

  if (!fs.existsSync(schemaPath)) {
    console.log(`⚠️  跳过 ${dbType}: schema.prisma 文件不存在`);
    return;
  }

  let originalContent;
  try {
    console.log(`\n🔄 处理 ${dbType} 数据库迁移...`);

    // 删除旧的迁移目录
    deleteMigrationsDir();

    // 修改 schema 文件配置
    originalContent = updateSchemaConfig(schemaPath, dbType);

    // 先尝试部署现有迁移
    console.log(`📦 部署现有迁移...`);
    try {
      execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
        stdio: 'inherit'
      });
    } catch (error) {
      console.log(`⚠️  部署现有迁移失败，将创建新迁移`);
    }

    // 执行新迁移
    console.log(`📦 创建新迁移...`);
    execSync(`npx prisma migrate dev --name ${new Date().toISOString().split('T')[0]} --schema=${schemaPath}`, {
      stdio: 'inherit'
    });

    // 复制迁移文件到数据库特定目录
    if (fs.existsSync(MIGRATIONS_DIR)) {
      console.log(`📋 复制迁移文件到 ${dbType} 目录...`);
      copyDirectory(MIGRATIONS_DIR, dbMigrationsDir);
    }

    console.log(`✅ ${dbType} 迁移完成`);
  } catch (error) {
    console.error(`❌ ${dbType} 迁移失败:`, error.message);
  } finally {
    // 确保无论成功还是失败都恢复原始内容，对于 SQLite 恢复为 ../data/db.db
    restoreSchema(schemaPath, dbType, originalContent);
  }
}

async function main() {
  try {
    // 确保数据库目录存在
    if (!fs.existsSync(DATABASE_DIR)) {
      console.error('❌ database 目录不存在');
      process.exit(1);
    }

    // 获取所有数据库类型目录
    const dbTypes = fs.readdirSync(DATABASE_DIR).filter(item => {
      const itemPath = path.join(DATABASE_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    });

    console.log('📊 发现的数据库类型:', dbTypes.join(', '));
    console.log('🔑 数据库配置:');
    for (const [dbType, envVar] of Object.entries(DB_URL_VARS)) {
      console.log(`  - ${dbType}: 使用环境变量 ${envVar}`);
    }
    console.log('  - sqlite: 迁移时使用 ../../data/db.db，完成后恢复为 ../data/db.db');

    // 依次处理每个数据库类型
    for (const dbType of dbTypes) {
      await processDatabaseType(dbType);
    }

    console.log('\n🎉 所有数据库迁移处理完成！');
  } catch (error) {
    console.error('❌ 批量迁移失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main().catch(error => {
  console.error('❌ 程序执行失败:', error);
  process.exit(1);
});