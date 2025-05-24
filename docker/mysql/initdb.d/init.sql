-- 设置时区
SET GLOBAL time_zone = '+8:00';
SET time_zone = '+8:00';

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS classworks
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 设置权限
GRANT ALL PRIVILEGES ON classworks.* TO 'classworks'@'%';
FLUSH PRIVILEGES;