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

    res.json(homework.data);
  } catch (error) {
    console.error("Download error:", error);
    res.json({
      status: false,
      msg: "获取失败：" + error.message,
    });
  }
});

// 获取班级配置
router.get("/:classId/config", async (req, res) => {
  try {
    const className = req.params.classId;
    
    const config = await prisma.config.findUnique({
      where: { 
        class: className
      }
    });
    
    if (!config) {
      throw new Error("未找到配置信息");
    }
    
    res.json(config.value);
  } catch (error) {
    console.error("Config error:", error);
    res.json({
      status: false,
      msg: "获取配置失败：" + error.message,
    });
  }
});

// 更新班级配置
router.put("/:classId/config", async (req, res) => {
  try {
    const className = req.params.classId;
    const configValue = req.body;
    
    await prisma.config.upsert({
      where: {
        class: className
      },
      update: {
        value: configValue
      },
      create: {
        class: className,
        value: configValue
      }
    });

    res.json({
      status: true,
      msg: "更新成功"
    });
  } catch (error) {
    console.error("Config update error:", error);
    res.json({
      status: false,
      msg: "更新失败：" + error.message,
    });
  }
});

module.exports = router; 