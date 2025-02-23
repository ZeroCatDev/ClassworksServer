const express = require('express');
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 上传/更新作业数据
router.post("/:classId/homework", async (req, res) => {
  try {
    const date = new Date().toISOString().split("T")[0];
    const data = req.body;
    const className = req.params.classId;

    await prisma.homework.upsert({
      where: {
        date_class: {
          date: date,
          class: className
        }
      },
      update: {
        data: data,
      },
      create: {
        date: date,
        class: className,
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

// 获取作业数据
router.get("/:classId/homework", async (req, res) => {
  try {
    const date = req.query.date;
    const className = req.params.classId;

    const homework = await prisma.homework.findFirst({
      where: {
        date: date,
        class: className
      },
    });

    if (!homework) {
      throw new Error("该日期未上传数据");
    }

    res.json({
      status: true,
      msg: "获取成功",
      ...homework.data,
    });
  } catch (error) {
    console.error("Download error:", error);
    res.json({
      status: false,
      msg: "获取失败：" + error.message,
    });
  }
});

// 获取班级配置信息
router.get("/:classId/config", async (req, res) => {
  const className = req.params.classId;
  var studentList = [];
  
  try {
    const config = await prisma.config.findFirst({ 
      where: { 
        id: 1,
        class: className
      } 
    });
    
    if (config) {
      studentList = config.student.split(",");
    }
    
    res.json({
      studentList: studentList,
      homeworkArrange: [
        ["语文", "数学", "英语"],
        ["物理", "化学", "生物"],
        ["政治", "历史", "地理"],
      ],
    });
  } catch (error) {
    console.error("Config error:", error);
    res.json({
      status: false,
      msg: "获取配置失败：" + error.message,
    });
  }
});

// 更新班级学生列表
router.put("/:classId/students", async (req, res) => {
  try {
    const className = req.params.classId;
    const studentList = req.body.studentList.join(",");
    
    await prisma.config.upsert({
      where: {
        id_class: {
          id: req.body.id,
          class: className
        }
      },
      update: {
        student: studentList,
      },
      create: {
        id: req.body.id,
        class: className,
        student: studentList,
      },
    });

    res.json({
      status: true,
      msg: "更新成功"
    });
  } catch (error) {
    console.error("SetStudentList error:", error);
    res.json({
      status: false,
      msg: "更新失败：" + error.message,
    });
  }
});

module.exports = router; 