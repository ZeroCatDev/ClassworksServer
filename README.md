# ClassworksServer

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/ClassworksDev/ClassworksServer/docker-image.yml?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

## 📚 项目简介

此项目是Classworks的开源后端实现，通过 RESTful API 接口，支持前端应用实现丰富的作业管理体验，包括作业的发布、查询和管理功能。

## ✨ 主要功能

- 📝 作业发布与管理
- 🔍 按班级和日期查询作业
- ⚙️ 班级配置管理
- 🔄 数据持久化存储
- 🐳 Docker 容器化部署

## 🔌 API 接口说明

### 作业管理接口

| 接口                   | 方法   | 描述                     | 参数                                |
|------------------------|--------|--------------------------|-------------------------------------|
| `/api/homework`        | GET    | 获取所有作业             | `?class=班级名&date=日期`(可选)    |
| `/api/homework/:class` | GET    | 获取指定班级的所有作业   | `:class` - 班级名                   |
| `/api/homework`        | POST   | 创建或更新作业           | Body: `{class, date, data}`         |
| `/api/homework`        | DELETE | 删除作业                 | Body: `{class, date}`               |

### 配置管理接口

| 接口                 | 方法   | 描述                   | 参数                          |
|----------------------|--------|------------------------|-------------------------------|
| `/api/config`        | GET    | 获取所有班级配置       | 无                            |
| `/api/config/:class` | GET    | 获取指定班级的配置     | `:class` - 班级名             |
| `/api/config`        | POST   | 创建或更新班级配置     | Body: `{class, value}`        |
| `/api/config/:class` | DELETE | 删除指定班级的配置     | `:class` - 班级名             |

## 🚀 快速开始

### 前置要求

- Node.js (v14+)
- MySQL 数据库
- Docker (可选)

### 安装与运行

1. 克隆仓库

```bash
git clone https://github.com/ClassworksDev/ClassworksServer.git
cd ClassworksServer
```

2. 安装依赖

```bash
npm install
# 或使用 pnpm
pnpm install
```

3. 配置环境变量

创建 `.env` 文件并配置以下变量：

```
DATABASE_URL="mysql://username:password@localhost:3306/classworks"
PORT=3000
```

4. 初始化数据库

```bash
npx prisma migrate dev --name init
```

5. 启动服务

```bash
npm start
```

## 🐳 Docker 部署

### 使用 Docker Compose

1. 创建 `docker-compose.yml` 文件：

```yaml
version: '3'
services:
  classworks-server:
    image: classworksdev/classworks-server:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://username:password@db:3306/classworks
    depends_on:
      - db
  
  db:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=classworks
      - MYSQL_USER=username
      - MYSQL_PASSWORD=password
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```

2. 启动服务

```bash
docker-compose up -d
```

### 手动构建 Docker 镜像

1. 构建镜像

```bash
docker build -t classworks-server .
```

2. 运行容器

```bash
docker run -p 3000:3000 -e DATABASE_URL="mysql://username:password@host:3306/classworks" classworks-server
```

## 📄 许可证

本项目采用 [待定] 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

## 📞 联系方式

项目维护者: [SunWuyuan](https://github.com/SunWuyuan)

GitHub 仓库: [https://github.com/ClassworksDev/ClassworksServer](https://github.com/ClassworksDev/ClassworksServer)
