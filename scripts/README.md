# 接口限速测试脚本

这个目录包含了用于测试API接口限速功能的脚本。

## 前置条件

在运行测试脚本之前，请确保安装了所需的依赖：

```bash
npm install axios
```

## 可用测试脚本

### 1. 功能测试 (test-rate-limit.js)

测试不同类型的限速功能是否正常工作，包括全局限速、API限速、写操作限速和删除操作限速。

```bash
npm run test:rate-limit
# 或直接运行
node scripts/test-rate-limit.js
```

### 2. 压力测试 (stress-test.js)

对指定端点进行高并发请求，测试限速在高负载下的表现。

```bash
npm run test:stress
# 或直接运行
node scripts/stress-test.js
```

### 3. 分布式测试 (distributed-test.js)

模拟多个不同IP地址的请求，测试基于IP的限速是否有效。

```bash
npm run test:distributed
# 或直接运行
node scripts/distributed-test.js
```

### 4. 运行所有测试 (run-all-tests.js)

按顺序运行所有测试，并在测试之间添加适当的延迟以重置限速计数器。

```bash
npm run test:all-limits
# 或直接运行
node scripts/run-all-tests.js
```

## 配置测试参数

每个测试脚本的开头都有配置参数，可以根据需要进行调整：

- `BASE_URL`: API服务器的基础URL（默认为 http://localhost:3000）
- `CONCURRENT_REQUESTS`: 并发请求数（仅适用于压力测试）
- `TOTAL_REQUESTS`: 总请求数
- `SIMULATED_IPS`: 模拟的IP数量（仅适用于分布式测试）
- `REQUESTS_PER_IP`: 每个IP的请求数（仅适用于分布式测试）
- `TEST_ENDPOINT`: 测试的API端点

## 测试结果说明

测试脚本会输出彩色的测试进度和结果统计信息：

- 绿色点(`.`): 成功的请求
- 黄色L(`L`): 被限速的请求
- 红色E(`E`): 错误的请求
- 红色X(`X`): 请求异常

测试完成后，会显示总体统计信息，包括总请求数、成功请求数、被限速请求数、错误请求数和限速比例。