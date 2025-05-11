import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * 运行脚本
 * @param {string} scriptName 脚本文件名
 * @param {string} description 测试描述
 */
function runScript(scriptName, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.cyan}=======================================${colors.reset}`);
    console.log(`${colors.cyan}运行: ${description}${colors.reset}`);
    console.log(`${colors.cyan}=======================================${colors.reset}\n`);

    const scriptPath = join(__dirname, scriptName);
    const child = spawn('node', [scriptPath], { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n${colors.green}${description}完成，退出码: ${code}${colors.reset}`);
        resolve();
      } else {
        console.error(`\n${colors.red}${description}失败，退出码: ${code}${colors.reset}`);
        reject(new Error(`脚本退出码: ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`\n${colors.red}启动脚本时出错: ${error.message}${colors.reset}`);
      reject(error);
    });
  });
}

/**
 * 主函数
 */
async function main() {
  console.log(`${colors.magenta}开始运行所有限速测试...${colors.reset}`);

  try {
    // 运行功能测试
    await runScript('test-rate-limit.js', '功能测试');

    // 等待一段时间以确保限速计数器重置
    console.log(`\n${colors.yellow}等待30秒以确保限速计数器重置...${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 运行压力测试
    await runScript('stress-test.js', '压力测试');

    // 等待一段时间以确保限速计数器重置
    console.log(`\n${colors.yellow}等待30秒以确保限速计数器重置...${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 运行分布式测试
    await runScript('distributed-test.js', '分布式测试');

    console.log(`\n${colors.green}所有测试已完成!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}测试过程中发生错误: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// 执行主函数
main().catch(console.error);