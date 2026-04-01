# 🚀 部署上线指南

本指南将帮助你将免费邮箱注册应用部署到生产环境。

## 方案一：快速部署（推荐新手）

### 使用 Vercel + Railway

#### 步骤 1: 创建 GitHub 仓库

```bash
cd email-signup-app
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

#### 步骤 2: 部署后端到 Railway

1. 访问 https://railway.app 并登录
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的仓库
5. 在 Settings 中设置：
   - Root Directory: `backend`
   - Start Command: `npm start`
6. Railway 会自动部署
7. 复制生成的公网 URL（如：`https://xxx-production.up.railway.app`）

#### 步骤 3: 部署前端到 Vercel

1. 访问 https://vercel.com 并登录
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库
4. 配置构建设置：
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 在 "Environment Variables" 中添加：
   - `VITE_API_URL`: 填入 Railway 后端 URL
6. 点击 "Deploy"

#### 步骤 4: 修改前端 API 地址

在 `frontend/src/App.jsx` 中，修改所有 API 调用：

```javascript
// 替换硬编码的 /api 为环境变量
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// 然后修改 fetch 调用
const response = await fetch(`${API_BASE}/api/create-email`, {...})
```

## 方案二：Docker 部署

### 创建 Dockerfile

#### 后端 Dockerfile (`backend/Dockerfile`)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

#### 前端 Dockerfile (`frontend/Dockerfile`)

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 前端 nginx 配置 (`frontend/nginx.conf`)

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker Compose 部署

在项目根目录创建 `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 部署命令

```bash
# 本地测试
docker-compose up

# 生产环境（后台运行）
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 方案三：云服务器部署（Ubuntu）

### 1. 安装 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 安装 PM2

```bash
sudo npm install -g pm2
```

### 3. 部署后端

```bash
cd /path/to/email-signup-app/backend
npm install --production
pm2 start src/server.js --name email-backend
pm2 save
pm2 startup
```

### 4. 构建并部署前端

```bash
cd /path/to/email-signup-app/frontend
npm install
npm run build

# 使用 Nginx 服务静态文件
sudo apt install nginx
sudo cp -r dist/* /var/www/html/
sudo systemctl restart nginx
```

### 5. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
}
```

## 域名和 HTTPS

### 使用 Let's Encrypt 免费 SSL

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 环境变量配置

### 后端环境变量

创建 `.env` 文件：

```env
PORT=3001
NODE_ENV=production
```

### 前端环境变量

创建 `.env.production` 文件：

```env
VITE_API_URL=https://api.your-domain.com
```

## 性能优化建议

1. **启用 CDN** - 使用 Cloudflare 加速静态资源
2. **启用 Gzip** - 在 Nginx 中压缩响应
3. **设置缓存** - 为静态资源设置长期缓存
4. **监控服务** - 使用 UptimeRobot 监控服务可用性

## 监控和日志

### Railway
- 自动提供日志和监控
- 可在 Dashboard 查看

### Vercel
- 自动提供部署日志
- 可在 Functions 标签查看 API 日志

### 自建监控
```bash
# 安装 PM2 监控
pm2 monit

# 查看日志
pm2 logs email-backend
```

## 常见问题

### Q: 后端连接超时
A: 检查 Railway 的公网 URL 是否正确，确保防火墙允许访问

### Q: 前端 API 请求失败
A: 检查 CORS 配置和 API 地址是否正确

### Q: 邮件无法接收
A: 确认 Mail.tm API 服务正常，检查网络连接

---

**部署完成后，访问你的域名即可使用！** 🎉
