import rateLimit from "express-rate-limit";

// 获取客户端真实IP的函数
export const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket?.remoteAddress ||
    "0.0.0.0"
  );
};

// 配置全局限速中间件
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  limit: 200, // 每个IP在windowMs时间内最多允许200个请求
  standardHeaders: "draft-7", // 返回标准的RateLimit头信息
  legacyHeaders: false, // 禁用X-RateLimit-*头
  message: "请求过于频繁，请稍后再试",
  keyGenerator: getClientIp, // 使用真实IP作为限速键
  skipSuccessfulRequests: false, // 成功的请求也计入限制
  skipFailedRequests: false, // 失败的请求也计入限制
});

// API限速器
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  limit: 20, // 每个IP在windowMs时间内最多允许20个请求
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "API请求过于频繁，请稍后再试",
  keyGenerator: getClientIp,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// 写操作限速器（更严格）
export const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  limit: 10, // 每个IP在windowMs时间内最多允许10个写操作
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "写操作请求过于频繁，请稍后再试",
  keyGenerator: getClientIp,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// 删除操作限速器（最严格）
export const deleteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 5分钟
  limit: 1, // 每个IP在windowMs时间内最多允许5个删除操作
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "删除操作请求过于频繁，请稍后再试",
  keyGenerator: getClientIp,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// 认证相关路由限速器（防止暴力破解）
export const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30分钟
  limit: 5, // 每个IP在windowMs时间内最多允许5次认证尝试
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "认证请求过于频繁，请30分钟后再试",
  keyGenerator: getClientIp,
  skipSuccessfulRequests: true, // 成功的认证不计入限制
  skipFailedRequests: false, // 失败的认证计入限制
});

// 创建一个路由处理中间件，根据HTTP方法应用不同的限速器
export const methodBasedRateLimiter = (req, res, next) => {
  // 根据HTTP方法应用不同限速
  if (req.method === "GET") {
    // 读操作使用普通API限速
    return apiLimiter(req, res, next);
  } else if (
    req.method === "POST" ||
    req.method === "PUT" ||
    req.method === "PATCH"
  ) {
    // 写操作使用更严格的限速
    return writeLimiter(req, res, next);
  } else if (req.method === "DELETE") {
    // 删除操作使用最严格的限速
    return deleteLimiter(req, res, next);
  }
  // 其他方法使用API限速
  return apiLimiter(req, res, next);
};
