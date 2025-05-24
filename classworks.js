#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const PRISMA_DIR = path.join(process.cwd(), "prisma");
const DATABASE_TYPE = process.env.DATABASE_TYPE || "sqlite";
const DATABASE_URL =
  DATABASE_TYPE === "sqlite"
    ? "file:/data/db.sqlite"
    : process.env.DATABASE_URL;

// 🧱 数据库初始化函数
function setupDatabase() {
  try {
    // 如果是 SQLite，确保 /data 目录存在
    if (DATABASE_TYPE === "sqlite") {
      if (!fs.existsSync("/data")) {
        fs.mkdirSync("/data", { recursive: true });
      }
    } else if (!DATABASE_URL) {
      console.error("❌ 缺少 DATABASE_URL 环境变量");
      process.exit(1);
    }

    // 从对应数据库类型的配置目录中复制配置文件
    const sourceDir = path.join(PRISMA_DIR, "database", DATABASE_TYPE);
    if (!fs.existsSync(sourceDir)) {
      console.error(`❌ 数据库配置未找到：${sourceDir}`);
      process.exit(1);
    }

    // 递归复制函数
    function copyRecursive(src, dest) {
      const stats = fs.statSync(src);
      if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const entries = fs.readdirSync(src);
        for (const entry of entries) {
          copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
      } else {
        fs.copyFileSync(src, dest);
      }
    }

    // 将所有配置文件和目录复制到 prisma 根目录下
    const entries = fs.readdirSync(sourceDir);
    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry);
      const targetPath = path.join(PRISMA_DIR, entry);
      copyRecursive(sourcePath, targetPath);
    }
    console.log(`✅ 已复制 ${DATABASE_TYPE} 数据库配置文件和目录`);

    // 设置 Prisma 的 DATABASE_URL
    process.env.DATABASE_URL = DATABASE_URL;

    // 检查数据库表并执行必要的迁移
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
  } catch (error) {
    console.error("❌ 数据库初始化失败:", error.message);
    process.exit(1);
  }
}

// 🔨 本地构建函数
function buildLocal() {
  try {
    execSync("npm install", { stdio: "inherit" }); // 安装依赖
    execSync("npx prisma generate", { stdio: "inherit" }); // 生成 Prisma 客户端
    console.log("✅ 构建完成");
  } catch (error) {
    console.error("❌ 构建失败:", error.message);
    process.exit(1);
  }
}

// 🚀 启动服务函数
function startServer() {
  try {
    console.log(`🚀 使用 ${DATABASE_TYPE} 数据库启动服务中...`);
    execSync("npm run start", { stdio: "inherit" }); // 启动项目
  } catch (error) {
    console.error("❌ 服务启动失败:", error.message);
    process.exit(1);
  }
}

// ▶️ 执行 Prisma CLI 命令函数
function runPrismaCommand(args) {
  try {
    const command = `npx prisma ${args.join(" ")}`;
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error("❌ Prisma 命令执行失败:", error.message);
    process.exit(1);
  }
}

// 🧠 主函数，根据命令行参数判断执行哪种流程
async function main() {
  const args = process.argv.slice(2); // 获取命令行参数
  if (args[0] === "prisma") {
    // 如果输入的是 prisma 命令，则执行 prisma 子命令
    runPrismaCommand(args.slice(1));
  } else {
    // 否则按默认流程：初始化 → 构建 → 启动服务
    setupDatabase();
    buildLocal();
    startServer();
  }
}

// 🚨 捕捉主函数异常
main().catch((error) => {
  console.error("❌ 脚本执行失败:", error);
  process.exit(1);
});
