import { siteKey } from "../utils/config.js";
import { PrismaClient } from "@prisma/client";
import { DecodeAndVerifyPassword, verifySiteKey } from "../utils/crypto.js";

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

  if (!verifySiteKey(providedKey, siteKey)) {
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
        if (error.code === "P2002") {
          device = await prisma.device.findUnique({
            where: { uuid },
          });
        } else {
          throw error;
        }
      }
    }

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

export const deviceInfoMiddleware = async (req, res, next) => {
  const { namespace } = req.params;

  try {
    const device = await getOrCreateDevice(namespace, req.body?.className);
    res.locals.device = device;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      statusCode: 500,
      message: "服务器内部错误",
    });
  }
};
export const authMiddleware = async (req, res, next) => {
  const { namespace } = req.params;
  const password =
    req.headers["x-namespace-password"] ||
    req.query.password ||
    req.body?.password;

  try {
    const device = await getOrCreateDevice(namespace, req.body?.className);
    res.locals.device = device;

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

    if (
      [ACCESS_TYPES.PUBLIC, ACCESS_TYPES.PROTECTED].includes(device.accessType)
    ) {
      return next();
    }

    if (
      !device.password ||
      !(await DecodeAndVerifyPassword(password, device.password))
    ) {
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

    if (device.accessType === ACCESS_TYPES.PUBLIC) {
      return next();
    }

    if (
      !device.password ||
      !(await DecodeAndVerifyPassword(password, device.password))
    ) {
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
    res.locals.device = device;

    if (!verifySiteKey(providedKey, siteKey)) {
      return res.status(401).json({
        statusCode: 401,
        message: "此服务器已开启站点密钥验证，请提供有效的站点密钥",
      });
    }

    if (
      device.password &&
      !(await DecodeAndVerifyPassword(password, device.password))
    ) {
      return res.status(401).json({
        statusCode: 401,
        message: "设备密码验证失败",
      });
    }

    await prisma.device.update({
      where: { uuid: device.uuid },
      data: {
        password: null,
        accessType: ACCESS_TYPES.PUBLIC,
      },
    });

    next();
  } catch (error) {
    console.error("Remove password middleware error:", error);
    res.status(500).json({
      statusCode: 500,
      message: "服务器内部错误",
    });
  }
};
