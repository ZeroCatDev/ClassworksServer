import createError from "http-errors";
import express from "express";
import { join } from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import bodyParser from "body-parser";
import errorHandler from "./middleware/errorHandler.js";
import errors from "./utils/errors.js";
import { initReadme, getReadmeValue } from "./utils/siteinfo.js";

import kvRouter from "./routes/kv.js";

var app = express();

import cors from "cors";
app.options("*", cors());
app.use(cors());

//全局变量
global.dirname = import.meta.dirname;

// 初始化 readme
initReadme();

// view engine setup
app.set("views", join(dirname, "views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(dirname, "public")));

// 添加请求超时处理中间件
app.use((req, res, next) => {
  // 设置默认请求超时时间为30秒
  const timeout = 30000;

  // 设置超时回调
  const timeoutCallback = () => {
    const timeoutError = errors.createError(408, "请求处理超时");
    next(timeoutError);
  };

  // 设置超时
  req.setTimeout(timeout, timeoutCallback);

  // 监听响应完成事件
  res.on("finish", () => {
    // 如果响应已经完成，清除超时处理
    req.setTimeout(0, timeoutCallback);
  });

  next();
});
app.get("/", (req, res) => {
  res.render("index.ejs", { readmeValue: getReadmeValue() });
});

// Mount the KV store router
app.use("/", kvRouter);

// 兜底404路由 - 处理所有未匹配的路由
app.use((req, res, next) => {
  const notFoundError = errors.createError(404, `找不到路径: ${req.path}`);
  next(notFoundError);
});

// 全局错误处理中间件
app.use(errorHandler);

// 全局未捕获的异常处理
process.on("uncaughtException", (error) => {
  console.error("未捕获的异常：", error);
  // 记录错误但不退出进程
});

// 全局未处理的Promise拒绝处理
process.on("unhandledRejection", (reason, promise) => {
  console.error("未处理的Promise拒绝：", reason);
  // 记录错误但不退出进程
});

// 处理 SIGTERM 信号
process.on("SIGTERM", () => {
  console.log("收到 SIGTERM 信号，准备关闭服务...");
});

export default app;
