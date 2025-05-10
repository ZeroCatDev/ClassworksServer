import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
class KVStore {
  /**
   * 通过命名空间和键名获取值
   * @param {string} namespace - 命名空间
   * @param {string} key - 键名
   * @returns {object|null} 键对应的值或null
   */
  async get(namespace, key) {
    const item = await prisma.kVStore.findUnique({
      where: {
        namespace_key: {
          namespace: namespace,
          key: key,
        },
      },
    });
    return item ? item.value : null;
  }

  /**
   * 获取键的完整信息（包括元数据）
   * @param {string} namespace - 命名空间
   * @param {string} key - 键名
   * @returns {object|null} 键的完整信息或null
   */
  async getMetadata(namespace, key) {
    const item = await prisma.kVStore.findUnique({
      where: {
        namespace_key: {
          namespace: namespace,
          key: key,
        },
      },
      select: {
        key: true,
        namespace: true,
        creatorIp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!item) return null;

    // 转换为更友好的格式
    return {
      namespace: item.namespace,
      key: item.key,
      metadata: {
        creatorIp: item.creatorIp,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    };
  }

  /**
   * 在指定命名空间下创建或更新键值
   * @param {string} namespace - 命名空间
   * @param {string} key - 键名
   * @param {object} value - 键值
   * @param {string} creatorIp - 创建者IP，可选
   * @returns {object} 创建或更新的记录
   */
  async upsert(namespace, key, value, creatorIp = "") {
    const item = await prisma.kVStore.upsert({
      where: {
        namespace_key: {
          namespace: namespace,
          key: key,
        },
      },
      update: {
        value,
        ...(creatorIp && { creatorIp }),
      },
      create: {
        namespace: namespace,
        key: key,
        value,
        creatorIp,
      },
    });

    // 返回带有命名空间和原始键的结果
    return {
      id: item.id,
      namespace,
      key,
      value: item.value,
      creatorIp: item.creatorIp,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * 通过命名空间和键名删除
   * @param {string} namespace - 命名空间
   * @param {string} key - 键名
   * @returns {object|null} 删除的记录或null
   */
  async delete(namespace, key) {
    try {
      const item = await prisma.kVStore.delete({
        where: {
          namespace_key: {
            namespace: namespace,
            key: key,
          },
        },
      });
      return item ? { ...item, namespace, key } : null;
    } catch (error) {
      // 忽略记录不存在的错误
      if (error.code === "P2025") return null;
      throw error;
    }
  }

  /**
   * 列出指定命名空间下的所有键名及其元数据
   * @param {string} namespace - 命名空间
   * @param {object} options - 选项参数
   * @returns {Array} 键名和元数据数组
   */
  async list(namespace, options = {}) {
    const { sortBy = "key", sortDir = "asc", limit = 100, skip = 0 } = options;

    // 构建排序条件
    const orderBy = {};
    orderBy[sortBy] = sortDir.toLowerCase();

    // 查询以命名空间开头的所有键
    const items = await prisma.kVStore.findMany({
      where: {
        namespace: namespace,
      },
      select: {
        namespace: true,
        key: true,
        creatorIp: true,
        createdAt: true,
        updatedAt: true,
        value: false,
      },
      orderBy,
      take: limit,
      skip: skip,
    });

    // 处理结果，从键名中移除命名空间前缀
    return items.map((item) => ({
      namespace: item.namespace,
      key: item.key,
      value: item.value,
      metadata: item.metadata,
    }));
  }

  /**
   * 统计指定命名空间下的键值对数量
   * @param {string} namespace - 命名空间
   * @returns {number} 键值对数量
   */
  async count(namespace) {
    const count = await prisma.kVStore.count({
      where: {
        namespace: namespace,
      },
    });
    return count;
  }
}

export default new KVStore();
