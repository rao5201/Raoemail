# Raoemail 项目文档

## 项目概述

Raoemail 是一个免费的电子邮件服务平台，提供安全、稳定、极速的邮件服务。本项目包含完整的宣传网站、前端应用、后端服务以及多个二级功能网站。

**运营方**: 武穴茶海虾王电子商务中心  
**技术支持**: rao5201@126.com  
**项目地址**: https://github.com/rao5201/email

## 项目结构

```
email-signup-app/
├── logo.svg                    # 品牌Logo
├── README.md                   # 项目说明
├── PROJECT.md                  # 本文档
├── LICENSE                     # 许可证
├── QUICKSTART.md              # 快速开始指南
├── USAGE.md                   # 使用说明
├── DEPLOYMENT.md              # 部署指南
├── .gitignore                 # Git忽略文件
│
├── backend/                   # 后端服务
│   ├── src/
│   │   └── server.js         # 主服务器文件
│   ├── package.json          # 依赖配置
│   └── .env.example          # 环境变量示例
│
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── App.jsx          # 主应用组件
│   │   ├── main.jsx         # 入口文件
│   │   └── index.css        # 样式文件
│   ├── package.json         # 依赖配置
│   ├── vite.config.js       # Vite配置
│   └── index.html           # HTML模板
│
├── raoemail-landing/         # 宣传网站首页
│   ├── index.html           # 主页面（已更新）
│   ├── ai-landing.html      # AI助手落地页
│   ├── ai-tutorial.html     # AI使用教程
│   ├── ai-feedback.html     # AI反馈表单
│   ├── ai-video.html        # AI视频脚本
│   ├── ai-social.html       # AI社交媒体内容
│   └── MARKETING.md         # 营销文档
│
└── sites/                    # 二级网站文件夹
    ├── ai-assistant/        # AI助手网站
    │   └── index.html
    ├── vip-service/         # VIP服务网站
    │   └── index.html
    ├── finance/             # 财务管理网站
    │   └── index.html
    └── admin/               # 后台管理（预留）
```

## 主要功能

### 1. 宣传网站首页 (raoemail-landing/index.html)

**新增功能**:
- ✅ 用户登录/注册模态框
- ✅ 搜索功能（支持18个常用功能快速搜索）
- ✅ 快速入口栏（免费邮箱、AI助手、VIP服务、使用教程）
- ✅ VIP服务展示区域（基础版/专业版/企业版）
- ✅ AI服务展示区域（智能写作、智能回复、多语言翻译）
- ✅ 分享功能（生成二维码、复制链接）
- ✅ 广告位招商区域
- ✅ 悬浮AI助手按钮
- ✅ 响应式设计

**导航链接**:
- 功能特性
- VIP服务（链接到二级网站）
- AI助手（链接到二级网站）
- 分享
- 关于我们
- 登录/注册按钮
- VIP徽章

### 2. AI助手二级网站 (sites/ai-assistant/)

**功能**:
- AI智能邮件助手介绍
- 智能写作功能
- 智能回复功能
- 多语言翻译（50+种语言）
- 内容润色
- 邮件摘要
- 智能推荐
- AI聊天界面（模拟）
- 返回首页链接

### 3. VIP服务二级网站 (sites/vip-service/)

**功能**:
- VIP套餐展示
  - 基础版：¥9.9/月（10GB存储、每日100次AI生成）
  - 专业版：¥29.9/月（50GB存储、无限AI生成）推荐
  - 企业版：¥99.9/月（无限存储、企业级安全）
- 支付方式
  - 微信支付
  - 支付宝
  - 银行卡
  - 数字人民币
- 支付功能（开发中）
- 返回首页链接

### 4. 财务管理二级网站 (sites/finance/)

**功能**:
- 收入统计面板
  - 总收入
  - VIP订阅收入
  - 广告收入
  - 活跃用户
- 交易记录（按会计法保存30年）
- 支付方式管理
- 返回首页链接

### 5. 前端应用 (frontend/)

**技术栈**:
- React 18
- Vite
- Tailwind CSS
- QRCode.js

**功能**:
- 免费邮箱创建
- 邮件查看和管理
- 编写和发送邮件
- 文件上传和管理
- 保存重要邮件
- 二维码生成（包含网站链接和登录信息）

### 6. 后端服务 (backend/)

**技术栈**:
- Node.js
- Express
- Mail.tm API

**功能**:
- 邮箱创建和管理API
- 邮件获取API
- 代理服务

## 快速开始

### 1. 启动后端服务

```bash
cd backend
npm install
npm run dev
```

后端服务将运行在 http://localhost:3001

### 2. 启动前端应用

```bash
cd frontend
npm install
npm run dev
```

前端应用将运行在 http://localhost:3000

### 3. 访问宣传网站

直接打开 `raoemail-landing/index.html` 文件

或者使用本地服务器：

```bash
cd raoemail-landing
python -m http.server 8080
```

然后访问 http://localhost:8080

### 4. 访问二级网站

- AI助手: `sites/ai-assistant/index.html`
- VIP服务: `sites/vip-service/index.html`
- 财务管理: `sites/finance/index.html`

## 搜索功能说明

宣传网站首页集成了搜索功能，支持以下内容的快速搜索：

- 免费邮箱
- VIP服务（基础版/专业版/企业版）
- AI助手（智能写作/智能回复/多语言翻译）
- 财务管理
- 登录/注册
- 分享功能
- 帮助中心
- 联系我们
- 支付方式（微信/支付宝/银行卡/数字人民币）

## 链接关系

### 宣传网站首页链接

- **VIP服务** → `../sites/vip-service/index.html`
- **AI助手** → `../sites/ai-assistant/index.html`
- **立即体验** → `../frontend/`
- **财务管理** → `../sites/finance/index.html`

### 二级网站返回链接

所有二级网站都包含返回首页的链接：
- **返回首页** → `../../raoemail-landing/index.html`

## 品牌标识

- **Logo文件**: `logo.svg`
- **品牌名称**: Raoemail
- **品牌颜色**: 
  - 主色：#007BFF（蓝色）
  - 辅助色：#FFD700（金色）
  - 强调色：#ff9800（橙色）

## 开发状态

### 已完成 ✅
- 宣传网站首页重新设计
- 用户登录/注册功能
- 搜索功能
- 分享功能（二维码生成）
- VIP服务展示
- AI助手展示
- 财务管理界面
- 二级网站创建
- 品牌Logo设计
- 响应式设计

### 开发中 🚧
- 支付功能集成
- 数字人民币支付
- 后台管理系统
- 用户数据统计

### 计划中 📋
- 移动端APP
- 邮件客户端集成
- 更多AI功能
- 企业邮箱服务

## 技术支持

如有问题或建议，请联系：

- **邮箱**: rao5201@126.com
- **运营方**: 武穴茶海虾王电子商务中心

## 许可证

本项目采用 MIT 许可证

## 更新日志

### 2026-04-01
- 重新设计宣传网站首页
- 添加搜索功能
- 创建二级网站（AI助手、VIP服务、财务管理）
- 添加悬浮AI助手按钮
- 更新品牌Logo
- 优化响应式设计

---

**版权所有 © 2026 Raoemail. 保留所有权利。**
