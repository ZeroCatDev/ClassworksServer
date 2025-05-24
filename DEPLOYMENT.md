## 快速开始

如果你想快速体验 Classworks，我们推荐使用 SQLite 版本。可以零配置运行。

## 部署方案

### MySQL 版本

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      args:
        DATABASE_TYPE: mysql
    environment:
      - NODE_ENV=production
      - MYSQL_DATABASE_URL=mysql://user:password@mysql:3306/classworks
    ports:
      - 3000:3000
    depends_on:
      mysql:
        condition: service_healthy

  mysql:
    image: mysql:8
    environment:
      - MYSQL_DATABASE=classworks
      - MYSQL_USER=user
      - MYSQL_PASSWORD=password
      - MYSQL_ROOT_PASSWORD=rootpassword
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql_data:
```

默认配置：
- 数据库版本：MySQL 8
- 默认端口：3306
- 数据持久化：自动配置

### PostgreSQL 版本


```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      args:
        DATABASE_TYPE: postgres
    environment:
      - NODE_ENV=production
      - PG_DATABASE_URL=postgresql://user:password@postgres:5432/classworks
    ports:
      - 3000:3000
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=classworks
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d classworks"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

默认配置：
- 数据库版本：PostgreSQL 15 Alpine
- 默认端口：5432
- 数据持久化：自动配置

### SQLite 版本

将以下内容保存为 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      args:
        DATABASE_TYPE: sqlite
    ports:
      - 3000:3000
    environment:
      - NODE_ENV=production
    volumes:
      - sqlite_data:/data

volumes:
  sqlite_data:
```

## 使用说明

1. 选择你需要的版本，将对应的配置复制到 `docker-compose.yml` 文件中
2. 根据需要修改环境变量（见下方环境变量配置）
3. 运行 `docker compose up -d` 启动服务


## 环境变量配置
```
# Axiom.co 遥测配置 可选
AXIOM_DATASET=
AXIOM_TOKEN=

# 网站密钥 可选
SITE_KEY=

# 服务端口 可选 默认3000
PORT=
```