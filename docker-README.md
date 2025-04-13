# Docker 部署指南

本项目已配置 Docker 和 Docker Compose 文件，可以快速构建和部署。

## 使用 Docker Compose 构建和运行

最简单的方式是使用 Docker Compose，它会自动完成所有构建和运行步骤：

```bash
# 构建并启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 手动构建和运行 Docker 镜像

如果你想手动控制构建和运行过程：

1. 构建 Docker 镜像

```bash
docker build -t jiangyang-ui-admin .
```

2. 运行容器

```bash
docker run -d --name jiangyang-ui-admin -p 80:80 -e API_URL=http://your-api-server:48080 jiangyang-ui-admin
```

## 环境变量配置

支持以下环境变量来定制容器行为：

- `API_URL`: 后端 API 服务器地址 (默认为 `http://localhost:48080`)

## 部署到生产环境

在生产环境中，请确保修改以下配置：

1. 在 `docker-compose.yml` 中修改 API_URL 为实际的后端服务地址
2. 确保将容器置于适当的网络环境中，设置正确的防火墙规则

## 解决常见问题

1. 如果前端无法连接到后端 API，请检查：
   - API_URL 环境变量是否正确设置
   - 网络连接是否正常
   - 后端服务是否正常运行

2. 如果遇到权限问题，请确保 Nginx 可以访问所有必要文件

3. 如果需要自定义 Nginx 配置，请修改 `build/nginx.conf` 文件并重新构建镜像 