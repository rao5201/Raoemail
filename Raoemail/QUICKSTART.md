# 🚀 5 分钟快速上线指南

## 方式一：本地测试（2 分钟）

```bash
# 1. 进入项目目录
cd email-signup-app

# 2. 启动后端（终端 1）
cd backend && npm install && npm start

# 3. 启动前端（终端 2）
cd frontend && npm install && npm run dev

# 4. 访问 http://localhost:3000
```

## 方式二：一键部署到云端（5 分钟）

### 第 1 步：推送到 GitHub

```bash
cd email-signup-app
git branch -M main
git remote add origin https://github.com/你的用户名/email-signup-app.git
git push -u origin main
```

### 第 2 步：部署后端（Railway）

1. 访问 https://railway.app
2. 登录 → New Project → Deploy from GitHub
3. 选择你的仓库 → Root Directory 填 `backend`
4. 部署完成后复制生成的 URL

### 第 3 步：部署前端（Vercel）

1. 访问 https://vercel.com
2. Add New → Import Git Repository
3. Root Directory 填 `frontend`
4. 添加环境变量：`VITE_API_URL` = Railway 的 URL
5. Deploy

### 第 4 步：完成！

访问 Vercel 生成的域名即可使用 🎉

## 项目文件清单

```
email-signup-app/
├── backend/              # 后端服务
│   ├── src/server.js    # API 服务器
│   ├── package.json     # 依赖配置
│   └── railway.json     # Railway 部署配置
├── frontend/            # 前端应用
│   ├── src/App.jsx     # 主界面
│   ├── package.json    # 依赖配置
│   └── vercel.json     # Vercel 部署配置
├── README.md           # 详细文档
├── DEPLOYMENT.md       # 部署指南
├── USAGE.md           # 使用说明
└── LICENSE            # MIT 开源协议
```

## 下一步

- 📝 查看详细文档：`README.md`
- 🔧 自定义样式：`frontend/src/App.jsx`
- 🚀 绑定自定义域名：参考 `DEPLOYMENT.md`
- 📊 添加监控：参考 `DEPLOYMENT.md` 监控章节

## 需要帮助？

1. 查看 `README.md` 完整文档
2. 查看 `DEPLOYMENT.md` 部署指南
3. 查看 `USAGE.md` 使用说明
4. 提交 GitHub Issue

---

**项目已就绪，开始部署吧！** ✨
