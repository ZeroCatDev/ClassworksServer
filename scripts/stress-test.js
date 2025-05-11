import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// 配置
const BASE_URL = 'http://localhost:3000'; // 修改为你的服务器地址和端口
const TEST_NAMESPACE = uuidv4(); // 生成随机命名空间用于测试
const CONCURRENT_REQUESTS = 50; // 并发请求数
const TOTAL_REQUESTS = 500; // 总请求数
const TEST_ENDPOINT = '/check'; // 测试端点

// 测试结果统计
const stats = {
  success: 0,
  rateLimited: 0,
  errors: 0,
  totalRequests: 0,
  startTime: 0,
  endTime: 0
};

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
 * 发送单个请求
 * @param {number} index 请求索引
 */
async function sendRequest(index) {
  stats.totalRequests++;
  const url = `${BASE_URL}${TEST_ENDPOINT}`;

  try {
    const response = await axios({
      method: 'GET',
      url,
      validateStatus: () => true // 不抛出HTTP错误
    });

    // 处理响应
    if (response.status === 429) { // 请求被限速
      stats.rateLimited++;
      process.stdout.write(`${colors.yellow}L${colors.reset}`);
    } else if (response.status >= 200 && response.status < 300) { // 成功
      stats.success++;
      process.stdout.write(`${colors.green}.${colors.reset}`);
    } else { // 其他错误
      stats.errors++;
      process.stdout.write(`${colors.red}E${colors.reset}`);
    }

    // 每50个请求换行
    if (index % 50 === 0 && index > 0) {
      process.stdout.write('\n');
    }

    return response.status;
  } catch (error) {
    stats.errors++;
    process.stdout.write(`${colors.red}X${colors.reset}`);
    return 0;
  }
}

/**
 * 打印统计信息
 */
function printStats() {
  const duration = (stats.endTime - stats.startTime) / 1000;
  const rps = Math.round(stats.totalRequests / duration);

  console.log(`\n\n${colors.magenta}压力测试结果:${colors.reset}`);
  console.log(`总请求数: ${stats.totalRequests}`);
  console.log(`成功请求: ${stats.success}`);
  console.log(`被限速请求: ${stats.rateLimited}`);
  console.log(`错误请求: ${stats.errors}`);
  console.log(`限速比例: ${Math.round((stats.rateLimited / stats.totalRequests) * 100)}%`);
  console.log(`测试持续时间: ${duration.toFixed(2)}秒`);
  console.log(`平均请求速率: ${rps} 请求/秒`);
}

/**
 * 批量发送请求
 * @param {number} batchSize 批次大小
 * @param {number} startIndex 起始索引
 */
async function sendBatch(batchSize, startIndex) {
  const promises = [];
  for (let i = 0; i < batchSize; i++) {
    const index = startIndex + i;
    if (index < TOTAL_REQUESTS) {
      promises.push(sendRequest(index));
    }
  }
  await Promise.all(promises);
}

/**
 * 主函数
 */
async function main() {
  console.log(`${colors.cyan}开始压力测试限速功能...${colors.reset}`);
  console.log(`目标端点: ${TEST_ENDPOINT}`);
  console.log(`并发请求数: ${CONCURRENT_REQUESTS}`);
  console.log(`总请求数: ${TOTAL_REQUESTS}`);
  console.log(`\n${colors.cyan}测试进度:${colors.reset}`);

  try {
    stats.startTime = Date.now();

    // 分批发送请求
    const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS);
    for (let i = 0; i < batches; i++) {
      const startIndex = i * CONCURRENT_REQUESTS;
      await sendBatch(CONCURRENT_REQUESTS, startIndex);
    }

    stats.endTime = Date.now();
    printStats();

    console.log(`\n${colors.green}压力测试完成!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}测试过程中发生错误: ${error.message}${colors.reset}`);
  }
}

// 执行主函数
main().catch(console.error);