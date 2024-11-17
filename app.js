var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const bodyParser = require('body-parser');

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

var cors = require("cors");
app.options("*", cors());
app.use(cors())

//全局变量
global.dirname = __dirname;


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// 上传作业数据
app.post("/upload", async (req, res) => {
  try {
    const date = new Date().toISOString().split("T")[0];
    const data = req.body;

    // 使用 upsert 来确保每个日期只有一条记录
    await prisma.homework.upsert({
      where: {
        date: date,
      },
      update: {
        data: data,
      },
      create: {
        date: date,
        data: data,
      },
    });

    res.json({
      status: true,
      msg: "上传成功",
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.json({
      status: false,
      msg: "上传失败：" + error.message,
    });
  }
});

// 下载作业数据
app.get("/download", async (req, res) => {
  try {
    const date = req.query.date;

    const homework = await prisma.homework.findFirst({
      where: {
        date: date,
      },
    });

    if (!homework) {
      throw new Error("该日期未上传数据");
    }

    res.json({
      status: true,
      msg: "下载成功",
      ...homework.data,
    });
  } catch (error) {
    console.error("Download error:", error);
    res.json({
      status: false,
      msg: "下载失败：" + error.message,
    });
  }
});
app.get("/config", async (req, res) => {
  res.json({
    "//": "学生名字列表(推荐按学号顺序排列)除最后一项外，每个学生姓名后面必须加一个逗号",
    "//": "如果不需要“出勤”功能，请把下面“:”后面的“[]”中的内容删除即可",
    studentList: ["张三", "李四", "王五", "赵六", "钱七"],
    "//": "作业框排版(前面的中括号中的科目显示在分割线左侧，后面在右侧)除每个中括号中的最后一项外，每个科目后面必须加一个逗号",
    homeworkArrange: [
      ["语文", "数学", "英语"],
      ["物理", "化学", "生物"],
      ["政治", "历史", "地理"],
    ],
    "//": "这里需填入部署ServerAPI的服务器url",
    "//": "端口默认17312无需改动(除非更改Python代码)",
    "//": "127.0.0.1仅适用于本地测试，实际部署请使用公网/内网ip地址或域名",
    url: "http://localhost:3030",
  });
});
app.get("/test", async (req, res) => {
  res.render("test.ejs");
})
app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
