import { Router } from "express";
const router = Router();
import kvStore from "../models/kvStore.js";
import checkSiteKey from "../middleware/auth.js";
import { v4 as uuidv4 } from "uuid";
import errors from "../utils/errors.js";

// 检查是否为受限UUID的中间件
const checkRestrictedUUID = (req, res, next) => {
  const restrictedUUID = "00000000-0000-4000-8000-000000000000";
  const namespace = req.params.namespace;

  if (namespace === restrictedUUID) {
    return next(errors.createError(403, "无权限访问此命名空间"));
  }
  next();
};

router.use(checkSiteKey);
/**
 * GET /:namespace
 * 获取指定命名空间下的所有键名及元数据列表
 */
router.get(
  "/:namespace",
  checkRestrictedUUID,
  errors.catchAsync(async (req, res, next) => {
    const { namespace } = req.params;
    const { sortBy, sortDir, limit, skip } = req.query;

    // 构建选项
    const options = {
      sortBy: sortBy || "key",
      sortDir: sortDir || "asc",
      limit: limit ? parseInt(limit) : 100,
      skip: skip ? parseInt(skip) : 0,
    };

    const keys = await kvStore.list(namespace, options);

    // 获取总记录数
    const totalRows = await kvStore.count(namespace);

    // 构建响应对象
    const response = {
      items: keys,
      total_rows: totalRows,
    };

    // 如果还有更多数据，添加load_more字段
    const nextSkip = options.skip + options.limit;
    if (nextSkip < totalRows) {
      const baseUrl = `${req.baseUrl}/${namespace}`;
      const queryParams = new URLSearchParams({
        sortBy: options.sortBy,
        sortDir: options.sortDir,
        limit: options.limit,
        skip: nextSkip,
      }).toString();

      response.load_more = `${baseUrl}?${queryParams}`;
    }

    return res.json(response);
  })
);

/**
 * GET /:namespace/:key
 * 通过命名空间和键名获取键值
 */
router.get(
  "/:namespace/:key",
  checkRestrictedUUID,
  errors.catchAsync(async (req, res, next) => {
    const { namespace, key } = req.params;

    // 否则只返回值
    const value = await kvStore.get(namespace, key);

    if (value === null) {
      // 创建并传递错误，而不是抛出
      return next(
        errors.createError(
          404,
          `未找到命名空间 '${namespace}' 下键名为 '${key}' 的记录`
        )
      );
    }

    return res.json(value);
  })
);
router.get(
  "/:namespace/:key/metadata",
  checkRestrictedUUID,
  errors.catchAsync(async (req, res, next) => {
    const { namespace, key } = req.params;
    const metadata = await kvStore.getMetadata(namespace, key);
    if (!metadata) {
      return next(
        errors.createError(
          404,
          `未找到命名空间 '${namespace}' 下键名为 '${key}' 的记录`
        )
      );
    }
    return res.json(metadata);
  })
);
/**
 * POST /:namespace/:key
 * 更新指定命名空间下的键值，如果不存在则创建
 */
router.post(
  "/:namespace/:key",
  checkRestrictedUUID,
  errors.catchAsync(async (req, res, next) => {
    const { namespace, key } = req.params;
    const value = req.body;

    if (!value || Object.keys(value).length === 0) {
      // 创建并传递错误，而不是抛出
      return next(errors.createError(400, "请提供有效的JSON值"));
    }

    // 获取客户端IP
    const creatorIp =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket?.remoteAddress ||
      "";

    const result = await kvStore.upsert(namespace, key, value, creatorIp);
    return res.status(200).json({
      namespace: result.namespace,
      key: result.key,
      created: result.createdAt.getTime() === result.updatedAt.getTime(),
      updatedAt: result.updatedAt,
    });
  })
);

/**
 * POST /:namespace/batch-import
 * 批量导入键值对到指定命名空间
 */
router.post(
  "/:namespace/import/batch-import",
  checkRestrictedUUID,
  errors.catchAsync(async (req, res, next) => {
    const { namespace } = req.params;
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return next(errors.createError(400, "请提供有效的JSON数据，格式为 {\"key\":{}, \"key2\":{}}"));
    }

    // 获取客户端IP
    const creatorIp =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket?.remoteAddress ||
      "";

    const results = [];
    const errors = [];

    // 批量处理所有键值对
    for (const [key, value] of Object.entries(data)) {
      try {
        const result = await kvStore.upsert(namespace, key, value, creatorIp);
        results.push({
          key: result.key,
          created: result.createdAt.getTime() === result.updatedAt.getTime()
        });
      } catch (error) {
        errors.push({
          key,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      namespace,
      total: Object.keys(data).length,
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  })
);
/**
 * DELETE /:namespace
 * 删除指定命名空间及其所有键值对
 */
router.delete(
  "/:namespace",
  checkRestrictedUUID,
  errors.catchAsync(async (req, res, next) => {
    const { namespace } = req.params;
    const result = await kvStore.deleteNamespace(namespace);

    if (!result) {
      // 创建并传递错误，而不是抛出
      return next(errors.createError(404, `未找到命名空间 '${namespace}'`));
    }

    // 204状态码表示成功但无内容返回
    return res.status(204).end();
  })
);

/**
 * DELETE /:namespace/:key
 * 删除指定命名空间下的键值对
 */
router.delete(
  "/:namespace/:key",
  checkRestrictedUUID,
  errors.catchAsync(async (req, res, next) => {
    const { namespace, key } = req.params;
    const result = await kvStore.delete(namespace, key);

    if (!result) {
      // 创建并传递错误，而不是抛出
      return next(
        errors.createError(
          404,
          `未找到命名空间 '${namespace}' 下键名为 '${key}' 的记录`
        )
      );
    }

    // 204状态码表示成功但无内容返回
    return res.status(204).end();
  })
);

/**
 * GET /uuid
 * 生成并返回一个随机UUID，可用作新命名空间
 */
router.get(
  "/uuid",
  errors.catchAsync(async (req, res) => {
    const namespace = uuidv4();
    res.json({ namespace });
  })
);


export default router;
