import { siteKey } from "../config.js";
import AppError from "../utils/errors.js";

const checkSiteKey = (req, res, next) => {
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

export default checkSiteKey;