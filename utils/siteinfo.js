import kvStore from "../models/kvStore.js";

// 存储 readme 值的内存变量
let readmeValue = null;

// 封装默认 readme 对象
const defaultReadme = {
  title: "Classworks 服务端",
  readme: "暂无 Readme 内容",
};

/**
 * 初始化 readme 值
 * 在应用启动时调用此函数
 */
export const initReadme = async () => {
  try {
    const storedValue = await kvStore.get(
      "00000000-0000-4000-8000-000000000000",
      "info"
    );

    // 合并默认值与存储值，确保结构完整
    readmeValue = {
      ...defaultReadme,
      ...(storedValue || {}),
    };

    console.log("✅ 站点信息初始化成功");
  } catch (error) {
    console.error("❌ 站点信息初始化失败:", {
      message: error?.message,
      stack: error?.stack,
    });

    // 确保在异常情况下也有默认值
    readmeValue = { ...defaultReadme };
  }
};

/**
 * 获取当前的 readme 值
 * @returns {Object} readme 值对象
 */
export const getReadmeValue = () => {
  return readmeValue || { ...defaultReadme };
};

/**
 * 更新 readme 值
 * @param {Object} newValue - 新的 readme 值
 * @returns {Promise<void>}
 */
export const updateReadmeValue = async (newValue) => {
  try {
    await kvStore.upsert(
      "00000000-0000-4000-8000-000000000000",
      "info",
      newValue
    );
    readmeValue = {
      ...defaultReadme,
      ...newValue,
    };
    console.log("✅ 站点信息更新成功");
  } catch (error) {
    console.error("❌ 站点信息更新失败:", {
      message: error?.message,
      stack: error?.stack,
    });
    throw error;
  }
};