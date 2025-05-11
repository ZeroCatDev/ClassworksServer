import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// 配置
const BASE_URL = 'http://localhost:3000'; // 修改为你的服务器地址和端口
const TEST_NAMESPACE = uuidv4(); // 生成随机命名空间用于测试
const SIMULATED_IPS = 10; // 模拟的IP数量
const REQUESTS_PER_IP = 30; // 每个IP的请求数
const TEST_ENDPOINT = '/check'; // 测试端点
const DELAY_BETWEEN_BATCHES = 500; // 批次间延迟(毫秒)

// 测试结果统计
const stats = {
  totalRequests: 0,
  success: 0,
  rateLimited: 0,
  errors: 0,
  ipStats: {} // 每个IP的统计信息
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
 * 延迟函数
 * @param {number} ms 延迟毫秒数
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 生成随机IP地址
 */
function generateRandomIP() {
  const ip = [];
  for (let i = 0; i < 4; i++) {
    ip.push(Math.floor(Math.random() * 256));
  }
  return ip.join('.');
}

/**
 * 初始化IP统计
 */
function initIPStats() {
  const ips = [];
  for (let i = 0; i < SIMULATED_IPS; i++) {
    const ip = generateRandomIP();
    ips.push(ip);
    stats.ipStats[ip] = {
      success: 0,
      rateLimited: 0,
      errors: 0,
      totalRequests: 0
    };
  }
  return ips;
}

/**
 * 发送单个请求
 * @param {string} ip 模拟的IP地址
 * @param {number} index 请求索引
 */
async function sendRequest(ip, index) {
  stats.totalRequests++;
  stats.ipStats[ip].totalRequests++;

  const url = `${BASE_URL}${TEST_ENDPOINT}`;

  try {
    const response = await axios({
      method: 'GET',
      url,
      headers: {
        'X-Forwarded-For': ip, // 模拟不同的IP地址
        'User-Agent': `TestBot/${ip}` // 模拟不同的用户代理
      },
      validateStatus: () => true // 不抛出HTTP错误
    });

    // 处理响应
    if (response.status === 429) { // 请求被限速
      stats.rateLimited++;
      stats.ipStats[ip].rateLimited++;
      process.stdout.write(`${colors.yellow}L${colors.reset}`);
    } else if (response.status >= 200 && response.status < 300) { // 成功
      stats.success++;
      stats.ipStats[ip].success++;
      process.stdout.write(`${colors.green}.${colors.reset}`);
    } else { // 其他错误
      stats.errors++;
      stats.ipStats[ip].errors++;
      process.stdout.write(`${colors.red}E${colors.reset}`);
    }

    return response.status;
  } catch (error) {
    stats.errors++;
    stats.ipStats[ip].errors++;
    process.stdout.write(`${colors.red}X${colors.reset}`);
    return 0;
  }
}

/**
 * 打印统计信息
 * @param {Array<string>} ips IP地址列表
 */
function printStats(ips) {
  console.log(`\n\n${colors.magenta}分布式测试结果:${colors.reset}`);
  console.log(`总请求数: ${stats.totalRequests}`);
  console.log(`成功请求: ${stats.success}`);
  console.log(`被限速请求: ${stats.rateLimited}`);
  console.log(`错误请求: ${stats.errors}`);
  console.log(`总限速比例: ${Math.round((stats.rateLimited / stats.totalRequests) * 100)}%`);

  console.log(`\n${colors.magenta}各IP测试结果:${colors.reset}`);
  ips.forEach((ip, index) => {
    const ipStat = stats.ipStats[ip];
    const limitedPercent = Math.round((ipStat.rateLimited / ipStat.totalRequests) * 100);
    console.log(`IP-${index+1} (${ip}): 总请求=${ipStat.totalRequests}, 成功=${ipStat.success}, 限速=${ipStat.rateLimited} (${limitedPercent}%), 错误=${ipStat.errors}`);
  });
}

/**
 * 为单个IP发送多个请求
 * @param {string} ip IP地址
 */
async function sendRequestsForIP(ip) {
  const promises = [];
  for (let i = 0; i < REQUESTS_PER_IP; i++) {
    promises.push(sendRequest(ip, i));
  }
  await Promise.all(promises);
}

/**
 * 主函数
 */
async function main() {
  console.log(`${colors.cyan}开始分布式测试限速功能...${colors.reset}`);
  console.log(`目标端点: ${TEST_ENDPOINT}`);
  console.log(`模拟IP数量: ${SIMULATED_IPS}`);
  console.log(`每个IP请求数: ${REQUESTS_PER_IP}`);
  console.log(`总请求数: ${SIMULATED_IPS * REQUESTS_PER_IP}`);

  try {
    // 初始化IP统计
    const ips = initIPStats();

    console.log(`\n${colors.cyan}测试进度:${colors.reset}`);

    // 为每个IP发送请求
    for (let i = 0; i < ips.length; i++) {
      const ip = ips[i];
      console.log(`\n${colors.blue}测试IP-${i+1} (${ip}):${colors.reset} `);
      await sendRequestsForIP(ip);

      // 在IP批次之间添加延迟
      if (i < ips.length - 1) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    printStats(ips);

    console.log(`\n${colors.green}分布式测试完成!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}测试过程中发生错误: ${error.message}${colors.reset}`);
  }
}

// 执行主函数
main().catch(console.error);