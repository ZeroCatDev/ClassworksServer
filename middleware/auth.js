import { siteKey } from "../config.js";
import AppError from "../utils/errors.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const ACCESS_TYPES = {
  PUBLIC: "PUBLIC",
  PROTECTED: "PROTECTED",
  PRIVATE: "PRIVATE",
};

export const checkSiteKey = (req, res, next) => {
  if (!siteKey) {
    return next();
  }

  const providedKey =
    req.headers["x-site-key"] || req.query.sitekey || req.body?.sitekey;
  if (!providedKey || providedKey !== siteKey) {
    return res.status(401).json({
      statusCode: 401,
      message: "此服务器已开启站点密钥验证，请提供有效的站点密钥",
    });
  }

  next();
};

async function getOrCreateDevice(uuid, className) {
  try {
    let device = await prisma.device.findUnique({
      where: { uuid },
    });

    if (!device) {
      try {
        device = await prisma.device.create({
          data: {
            uuid,
            name: className || null,
            accessType: ACCESS_TYPES.PUBLIC,
          },
        });
      } catch (error) {
        // 如果是唯一约束错误（并发创建），重新获取设备
        if (error.code === "P2002") {
          device = await prisma.device.findUnique({
            where: { uuid },
          });
        } else {
          throw error;
        }
      }
    }

    // 如果设备没有密码，自动设为public
    if (
      device &&
      !device.password &&
      device.accessType !== ACCESS_TYPES.PUBLIC
    ) {
      device = await prisma.device.update({
        where: { uuid },
        data: { accessType: ACCESS_TYPES.PUBLIC },
      });
    }

    return device;
  } catch (error) {
    console.error("Error in getOrCreateDevice:", error);
    throw error;
  }
}

export const authMiddleware = async (req, res, next) => {
  const { namespace } = req.params;
  const password =
    req.headers["x-namespace-password"] ||
    req.query.password ||
    req.body?.password;

  try {
    const device = await getOrCreateDevice(namespace, req.body?.className);
    req.device = device;

    if (device.password && password !== device.password) {
      return res.status(401).json({
        statusCode: 401,
        message: "设备密码验证失败",
      });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      statusCode: 500,
      message: "服务器内部错误",
    });
  }
};

export const readAuthMiddleware = async (req, res, next) => {
  const { namespace } = req.params;
  const password =
    req.headers["x-namespace-password"] ||
    req.query.password ||
    req.body?.password;

  try {
    const device = await getOrCreateDevice(namespace);
    res.locals.device = device;

    // PUBLIC and PROTECTED devices are always readable
    if ([ACCESS_TYPES.PUBLIC, ACCESS_TYPES.PROTECTED].includes(device.accessType)) {
      return next();
    }

    // For PRIVATE devices, require password
    if (!device.password || password !== device.password) {
      return res.status(401).json({
        statusCode: 401,
        message: "设备密码验证失败",
      });
    }

    next();
  } catch (error) {
    console.error("Read auth middleware error:", error);
    res.status(500).json({
      statusCode: 500,
      message: "服务器内部错误",
    });
  }
};

export const writeAuthMiddleware = async (req, res, next) => {
  const { namespace } = req.params;
  const password =
    req.headers["x-namespace-password"] ||
    req.query.password ||
    req.body?.password;

  try {
    const device = await getOrCreateDevice(namespace);
    res.locals.device = device;

    // PUBLIC devices are always writable
    if (device.accessType === ACCESS_TYPES.PUBLIC) {
      return next();
    }

    // For PROTECTED and PRIVATE devices, require password
    if (!device.password || password !== device.password) {
      return res.status(401).json({
        statusCode: 401,
        message: "设备密码验证失败",
      });
    }

    next();
  } catch (error) {
    console.error("Write auth middleware error:", error);
    res.status(500).json({
      statusCode: 500,
      message: "服务器内部错误",
    });
  }
};

export const removePasswordMiddleware = async (req, res, next) => {
  const { namespace } = req.params;
  const password =
    req.headers["x-namespace-password"] ||
    req.query.password ||
    req.body?.password;
  const providedKey =
    req.headers["x-site-key"] || req.query.sitekey || req.body?.sitekey;

  try {
    const device = await getOrCreateDevice(namespace);
    req.device = device;

    // 验证站点令牌（如果设置了的话）
    if (siteKey && (!providedKey || providedKey !== siteKey)) {
      return res.status(401).json({
        statusCode: 401,
        message: "此服务器已开启站点密钥验证，请提供有效的站点密钥",
      });
    }

    // 验证设备密码
    if (device.password) {
      if (!password || password !== device.password) {
        return res.status(401).json({
          statusCode: 401,
          message: "设备密码验证失败",
        });
      }
    } else {
      return res.status(400).json({
        statusCode: 400,
        message: "设备当前没有设置密码",
      });
    }

    // 更新设备，移除密码
    await prisma.device.update({
      where: { uuid: namespace },
      data: { password: null },
    });

    res.json({ message: "密码已成功移除" });
  } catch (error) {
    console.error("Remove password middleware error:", error);
    res.status(500).json({
      statusCode: 500,
      message: "服务器内部错误",
    });
  }
};
