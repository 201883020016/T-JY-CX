# Dockerfile

# --- 第一阶段：构建后端 ---
# 使用一个包含 Node.js 的轻量级系统作为基础
FROM node:18-alpine AS builder

# 在容器内创建一个工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json 文件
COPY package*.json ./

# 安装后端依赖
RUN npm install

# 复制所有项目文件到工作目录
COPY . .


# --- 第二阶段：最终运行 ---
# 使用一个包含 Nginx (网络服务器) 的轻量级系统作为最终镜像的基础
FROM nginx:alpine

# 从第一阶段 (builder) 复制已经准备好的所有文件
# 包括前端文件、后端文件、以及安装好的 node_modules
COPY --from=builder /app /usr/share/nginx/html

# 我们还需要一个自定义的 nginx 配置文件，下一步创建
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口，这是 Nginx 默认监听的网页访问端口
EXPOSE 80

# 启动命令：先在后台启动我们的 Node.js 后端服务，然后再启动 Nginx 服务
CMD ["/bin/sh", "-c", "node /usr/share/nginx/html/server.js & nginx -g 'daemon off;'"]
