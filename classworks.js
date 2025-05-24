#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const PRISMA_DIR = path.join(process.cwd(), "prisma");
const DATABASE_TYPE = process.env.DATABASE_TYPE || "postgres";
const DATABASE_URL =
  DATABASE_TYPE === "sqlite"
    ? "file:/data/db.sqlite"
    : process.env.DATABASE_URL;

function setupDatabase() {
  try {
    // Create data directory for SQLite if needed
    if (DATABASE_TYPE === "sqlite") {
      if (!fs.existsSync("/data")) {
        fs.mkdirSync("/data", { recursive: true });
      }
    } else if (!DATABASE_URL) {
      console.error("❌ DATABASE_URL is required for non-SQLite databases");
      process.exit(1);
    }

    // Copy files from database type directory
    const sourceDir = path.join(PRISMA_DIR, "database", DATABASE_TYPE);
    if (!fs.existsSync(sourceDir)) {
      console.error(`❌ Database configuration not found at ${sourceDir}`);
      process.exit(1);
    }

    // Read all files from source directory
    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(PRISMA_DIR, file);
      fs.copyFileSync(sourcePath, targetPath);
    }
    console.log(`✅ Copied ${DATABASE_TYPE} database configuration files`);

    // Set DATABASE_URL for Prisma
    process.env.DATABASE_URL = DATABASE_URL;
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    process.exit(1);
  }
}

function buildLocal() {
  try {
    execSync("npm install", { stdio: "inherit" });
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("✅ Build completed");
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    process.exit(1);
  }
}

function startServer() {
  try {
    console.log(`🚀 Starting server with ${DATABASE_TYPE} database...`);
    execSync("npm run start", { stdio: "inherit" });
  } catch (error) {
    console.error("❌ Server start failed:", error.message);
    process.exit(1);
  }
}

function runPrismaCommand(args) {
  try {
    const command = `npx prisma ${args.join(" ")}`;
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error("❌ Prisma command failed:", error.message);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "prisma") {
    // Run Prisma command
    runPrismaCommand(args.slice(1));
  } else {
    // Setup environment and database
    setupDatabase();
    buildLocal();
    startServer();
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
