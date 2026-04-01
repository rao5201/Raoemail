# email
茶海虾王@email网站

# 📧 免费邮箱注册应用 (Free Email Signup)

一个开源的免费临时邮箱注册应用，帮助用户快速创建临时邮箱地址，用于网站注册、验证等场景，保护主邮箱免受垃圾邮件骚扰。

## ✨ 功能特点

- 🚀 **一键创建** - 无需注册，立即获取邮箱
- 📬 **实时收件** - 即时接收和查看邮件
- 🔒 **隐私保护** - 避免主邮箱收到垃圾邮件
- 🆓 **完全免费** - 基于 Mail.tm 免费 API
- 📱 **响应式设计** - 支持手机和桌面端
- 🎨 **现代 UI** - 使用 React + Tailwind CSS

## 🛠️ 技术栈

### 前端
- React 18
- Vite
- Tailwind CSS

### 后端
- Node.js
- Express
- Axios

### 服务
- Mail.tm API (https://mail.tm)

## 📦 快速开始

### 环境要求

- Node.js >= 16
- npm 或 yarn

### 安装步骤

#### 1. 克隆项目

```bash
git clone <your-repo-url>
cd email-signup-app
```

#### 2. 安装后端依赖

```bash
cd backend
npm install
```

#### 3. 启动后端服务

```bash
npm start
# 或开发模式
npm run dev
```

后端服务将在 http://localhost:3001 运行

#### 4. 安装前端依赖（新终端）

```bash
cd frontend
npm install
```

#### 5. 启动前端开发服务器

```bash
npm run dev
```

前端服务将在 http://localhost:3000 运行

## 🚀 部署上线

### 后端部署 (Railway)

1. 访问 https://railway.app
2. 创建新项目，连接 GitHub 仓库
3. 选择 `backend` 目录
4. Railway 会自动检测 Node.js 并部署
5. 获取部署后的 URL

### 前端部署 (Vercel)

1. 访问 https://vercel.com
2. 导入 GitHub 仓库
3. 设置构建配置：
   - Framework Preset: Vite
   - Root Directory: `frontend`
4. 部署完成后获取 URL

### 配置 API 地址

在 `frontend/src/App.jsx` 中修改 API 基础 URL：

```javascript
// 开发环境
const API_BASE = 'http://localhost:3001/api'

// 生产环境
const API_BASE = 'https://your-backend-url.railway.app/api'
```

## 📖 API 文档

### 创建邮箱

```http
POST /api/create-email
Content-Type: application/json

Response:
{
  "success": true,
  "email": "abc123@mail.tm",
  "password": "randompass",
  "token": "jwt_token_here"
}
```

### 获取邮件列表

```http
GET /api/messages/:email?token=YOUR_TOKEN

Response:
{
  "success": true,
  "messages": [...]
}
```

### 查看单封邮件

```http
GET /api/message/:id?token=YOUR_TOKEN

Response:
{
  "success": true,
  "message": {...}
}
```

### 删除邮箱

```http
DELETE /api/delete-email/:email?token=YOUR_TOKEN

Response:
{
  "success": true,
  "message": "Account deleted successfully"
}
```

## 📁 项目结构

```
email-signup-app/
├── backend/
│   ├── src/
│   │   └── server.js      # 后端主服务
│   ├── package.json
│   ├── .env.example
│   └── railway.json       # Railway 部署配置
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # 主应用组件
│   │   ├── main.jsx       # 入口文件
│   │   └── index.css      # 样式文件
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vercel.json        # Vercel 部署配置
├── LICENSE                # MIT 许可证
└── README.md              # 项目文档
```

## 🔐 安全说明

- 本应用使用 Mail.tm 的公开 API
- 邮箱密码仅在前端显示，请妥善保存
- 建议用完即删，不要用于重要账户
- 不要用于非法用途

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Mail.tm](https://mail.tm) - 提供免费邮箱 API 服务

---

**Made with ❤️ for privacy protection**
