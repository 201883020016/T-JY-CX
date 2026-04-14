# Dockerfile

# --- 第一阶段：准备运行环境 ---
# 使用一个包含 Node.js 的轻量级系统作为基础
FROM docker.1ms.run/library/node:18-alpine

# 在容器内创建一个工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json 文件
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制所有项目文件到工作目录
COPY . .

# 暴露 8080 端口，因为 server.js 监听的是这个端口
EXPOSE 8080

# 启动命令：直接运行 Node.js 后端服务
# 这个服务会同时提供前端页面和 /api 接口
CMD ["node", "server.js"]
