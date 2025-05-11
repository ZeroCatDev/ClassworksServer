import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// 配置
const BASE_URL = 'http://localhost:3030'; // 修改为你的服务器地址和端口
const TEST_NAMESPACE = uuidv4(); // 生成随机命名空间用于测试
const DELAY_BETWEEN_REQUESTS = 100; // 请求间隔时间(毫秒)

// 测试结果统计
const stats = {
  success: 0,
  rateLimited: 0,
  errors: 0,
  totalRequests: 0
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
 * 发送请求并处理响应
 * @param {string} method HTTP方法
 * @param {string} endpoint 请求路径
 * @param {object} data 请求数据
 * @param {number} index 请求索引
 */
async function sendRequest(method, endpoint, data = null, index) {
  stats.totalRequests++;
  const url = `${BASE_URL}${endpoint}`;

  try {
    const startTime = Date.now();
    const response = await axios({
      method,
      url,
      data,
      validateStatus: () => true // 不抛出HTTP错误
    });
    const duration = Date.now() - startTime;

    // 处理响应
    if (response.status === 429) { // 请求被限速
      stats.rateLimited++;
      console.log(`${colors.yellow}[${index}] ${method} ${endpoint} - 被限速 (${duration}ms)${colors.reset}`);
      return { limited: true, status: response.status };
    } else if (response.status >= 200 && response.status < 300) { // 成功
      stats.success++;
      console.log(`${colors.green}[${index}] ${method} ${endpoint} - 成功: ${response.status} (${duration}ms)${colors.reset}`);
      return { limited: false, status: response.status, data: response.data };
    } else { // 其他错误
      stats.errors++;
      console.log(`${colors.red}[${index}] ${method} ${endpoint} - 错误: ${response.status} (${duration}ms)${colors.reset}`);
      return { limited: false, status: response.status, error: response.data };
    }
  } catch (error) {
    stats.errors++;
    console.log(`${colors.red}[${index}] ${method} ${endpoint} - 异常: ${error.message}${colors.reset}`);
    return { limited: false, error: error.message };
  }
}

/**
 * 测试全局限速
 */
async function testGlobalRateLimit() {
  console.log(`\n${colors.cyan}===== 测试全局限速 (200/15分钟) =====${colors.reset}`);
  const requests = [];

  // 发送250个请求 (应该有50个被限速)
  for (let i = 0; i < 250; i++) {
    requests.push(sendRequest('GET', '/check', null, i));
    await delay(DELAY_BETWEEN_REQUESTS);
  }

  await Promise.all(requests);
  printStats('全局限速测试');
}

/**
 * 测试API限速
 */
async function testApiRateLimit() {
  console.log(`\n${colors.cyan}===== 测试API限速 (50/5分钟) =====${colors.reset}`);
  resetStats();
  const requests = [];

  // 发送60个请求 (应该有10个被限速)
  for (let i = 0; i < 60; i++) {
    requests.push(sendRequest('GET', '/check', null, i));
    await delay(DELAY_BETWEEN_REQUESTS);
  }

  await Promise.all(requests);
  printStats('API限速测试');
}

/**
 * 测试写操作限速
 */
async function testWriteRateLimit() {
  console.log(`\n${colors.cyan}===== 测试写操作限速 (10/分钟) =====${colors.reset}`);
  resetStats();
  const requests = [];

  // 发送15个写请求 (应该有5个被限速)
  for (let i = 0; i < 15; i++) {
    const key = `test-key-${i}`;
    const data = { value: `test-value-${i}`, timestamp: Date.now() };
    requests.push(sendRequest('POST', `/${TEST_NAMESPACE}/${key}`, data, i));
    await delay(DELAY_BETWEEN_REQUESTS);
  }

  await Promise.all(requests);
  printStats('写操作限速测试');
}

/**
 * 测试删除操作限速
 */
async function testDeleteRateLimit() {
  console.log(`\n${colors.cyan}===== 测试删除操作限速 (5/5分钟) =====${colors.reset}`);
  resetStats();

  // 先创建几个键值对
  for (let i = 0; i < 10; i++) {
    const key = `delete-key-${i}`;
    const data = { value: `delete-value-${i}` };
    await sendRequest('POST', `/${TEST_NAMESPACE}/${key}`, data, `创建-${i}`);
    await delay(DELAY_BETWEEN_REQUESTS);
  }

  resetStats();
  const requests = [];

  // 发送8个删除请求 (应该有3个被限速)
  for (let i = 0; i < 8; i++) {
    const key = `delete-key-${i}`;
    requests.push(sendRequest('DELETE', `/${TEST_NAMESPACE}/${key}`, null, i));
    await delay(DELAY_BETWEEN_REQUESTS);
  }

  await Promise.all(requests);
  printStats('删除操作限速测试');
}

/**
 * 测试认证限速
 */
async function testAuthRateLimit() {
  console.log(`\n${colors.cyan}===== 测试认证限速 (5/30分钟) =====${colors.reset}`);
  resetStats();
  const requests = [];

  // 发送8个认证请求 (应该有3个被限速)
  for (let i = 0; i < 8; i++) {
    requests.push(sendRequest('POST', '/auth', { username: 'test', password: 'wrong' }, i));
    await delay(DELAY_BETWEEN_REQUESTS);
  }

  await Promise.all(requests);
  printStats('认证限速测试');
}

/**
 * 重置统计数据
 */
function resetStats() {
  stats.success = 0;
  stats.rateLimited = 0;
  stats.errors = 0;
  stats.totalRequests = 0;
}

/**
 * 打印统计信息
 */
function printStats(testName) {
  console.log(`\n${colors.magenta}${testName}结果:${colors.reset}`);
  console.log(`总请求数: ${stats.totalRequests}`);
  console.log(`成功请求: ${stats.success}`);
  console.log(`被限速请求: ${stats.rateLimited}`);
  console.log(`错误请求: ${stats.errors}`);
  console.log(`限速比例: ${Math.round((stats.rateLimited / stats.totalRequests) * 100)}%`);
}

/**
 * 主函数
 */
async function main() {
  console.log(`${colors.cyan}开始测试限速功能...${colors.reset}`);
  console.log(`使用测试命名空间: ${TEST_NAMESPACE}`);

  try {
    // 测试全局限速
    await testGlobalRateLimit();

    // 重置统计并等待一段时间
    resetStats();
    await delay(2000);

    // 测试API限速
    await testApiRateLimit();

    // 重置统计并等待一段时间
    resetStats();
    await delay(2000);

    // 测试写操作限速
    await testWriteRateLimit();

    // 重置统计并等待一段时间
    resetStats();
    await delay(2000);

    // 测试删除操作限速
    await testDeleteRateLimit();

    // 重置统计并等待一段时间
    resetStats();
    await delay(2000);

    // 测试认证限速
    await testAuthRateLimit();

    // 清理测试数据
    console.log(`\n${colors.cyan}清理测试数据...${colors.reset}`);
    await sendRequest('DELETE', `/${TEST_NAMESPACE}`, null, 'cleanup');

    console.log(`\n${colors.green}所有测试完成!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}测试过程中发生错误: ${error.message}${colors.reset}`);
  }
}

// 执行主函数
main().catch(console.error);