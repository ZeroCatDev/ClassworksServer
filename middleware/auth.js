import { siteKey } from "../config.js";
import AppError from "../utils/errors.js";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const ACCESS_TYPES = {
  NO_PASSWORD_WRITABLE: 'NO_PASSWORD_WRITABLE',
  NO_PASSWORD_READABLE: 'NO_PASSWORD_READABLE',
  NO_PASSWORD_UNREADABLE: 'NO_PASSWORD_UNREADABLE'
};

export const checkSiteKey = (req, res, next) => {
    const providedKey = req.headers['x-site-key'];

    if (!siteKey) {
        return next();
    }

    if (!providedKey || providedKey !== siteKey) {
        const error = AppError.createError(
            AppError.HTTP_STATUS.UNAUTHORIZED,
            "此服务器已开启站点密钥验证，请在请求头中添加 x-site-key 以继续访问"
        );
        return res.status(error.statusCode).json(error);
    }

    next();
};

async function getOrCreateDevice(uuid, className) {
    let device = await prisma.device.findUnique({
        where: { uuid }
    });

    if (!device) {
        device = await prisma.device.create({
            data: {
                uuid,
                name: className || null,
                accessType: ACCESS_TYPES.NO_PASSWORD_WRITABLE
            }
        });
    }

    return device;
}

async function validatePassword(device, password) {
    if (!device.password) return true;
    return device.password === password;
}

export const authMiddleware = async (req, res, next) => {
    const { namespace } = req.params;
    const { password } = req.body;

    try {
        const device = await getOrCreateDevice(namespace, req.body.className);
        req.device = device;

        if (device.password && !await validatePassword(device, password)) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const readAuthMiddleware = async (req, res, next) => {
    const { namespace } = req.params;

    try {
        const device = await getOrCreateDevice(namespace);
        req.device = device;

        if (device.accessType === ACCESS_TYPES.NO_PASSWORD_UNREADABLE) {
            return res.status(403).json({ error: 'Device is not readable' });
        }

        if (device.accessType === ACCESS_TYPES.NO_PASSWORD_READABLE) {
            return next();
        }

        if (device.password) {
            const { password } = req.body;
            if (!await validatePassword(device, password)) {
                return res.status(401).json({ error: 'Invalid password' });
            }
        }

        next();
    } catch (error) {
        console.error('Read auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const writeAuthMiddleware = async (req, res, next) => {
    const { namespace } = req.params;

    try {
        const device = await getOrCreateDevice(namespace);
        req.device = device;

        if (device.password) {
            const { password } = req.body;
            if (!await validatePassword(device, password)) {
                return res.status(401).json({ error: 'Invalid password' });
            }
        }

        next();
    } catch (error) {
        console.error('Write auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};