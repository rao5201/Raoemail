const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User, Article, File, Supplier, Product, Sale, Expense, CustomerEmail, OperationLog } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Mail.tm API base URL
const MAIL_TM_API = 'https://api.mail.tm';

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Initialize admin users if not exists
const initAdminUsers = async () => {
  const existingUsers = await User.count();
  if (existingUsers === 0) {
    await User.bulkCreate([
      { email: 'admin@example.com', password: 'admin123', role: 'admin', name: '管理员' },
      { email: 'service@example.com', password: 'service123', role: '客服', name: '客服人员' },
      { email: 'finance@example.com', password: 'finance123', role: '财务', name: '财务人员' }
    ]);
    console.log('Admin users initialized');
  }
};

// Call initialization
initAdminUsers();

app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Create a new email account
app.post('/api/create-email', async (req, res) => {
  try {
    // Generate random email address
    const randomString = Math.random().toString(36).substring(2, 10);
    const email = `${randomString}@mail.tm`;
    const password = Math.random().toString(36).substring(2, 12);

    // Get available domains from mail.tm
    const domainsRes = await axios.get(`${MAIL_TM_API}/domains`);
    const domain = domainsRes.data['hydra:member'][0].domain;
    const fullEmail = `${randomString}@${domain}`;

    // Create account
    const createRes = await axios.post(`${MAIL_TM_API}/accounts`, {
      address: fullEmail,
      password: password
    });

    // Get token for authentication
    const tokenRes = await axios.post(`${MAIL_TM_API}/token`, {
      address: fullEmail,
      password: password
    });

    // Save customer email to database
    await CustomerEmail.create({
      email: fullEmail,
      password: password,
      token: tokenRes.data.token
    });

    // Log operation
    await OperationLog.create({
      operation: 'create_email',
      userType: 'customer',
      userEmail: fullEmail,
      details: '创建临时邮箱',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      email: fullEmail,
      password: password,
      token: tokenRes.data.token
    });
  } catch (error) {
    console.error('Error creating email:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.detail || 'Failed to create email account'
    });
  }
});

// Get messages for an email account
app.get('/api/messages/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token required' });
    }

    const messagesRes = await axios.get(`${MAIL_TM_API}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    res.json({
      success: true,
      messages: messagesRes.data['hydra:member']
    });
  } catch (error) {
    console.error('Error fetching messages:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// Get single message
app.get('/api/message/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token required' });
    }

    const messageRes = await axios.get(`${MAIL_TM_API}/messages/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    res.json({
      success: true,
      message: messageRes.data
    });
  } catch (error) {
    console.error('Error fetching message:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch message'
    });
  }
});

// Delete email account
app.delete('/api/delete-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token required' });
    }

    await axios.delete(`${MAIL_TM_API}/accounts/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Log operation
    await OperationLog.create({
      operation: 'delete_email',
      userType: 'customer',
      userEmail: email,
      details: '删除邮箱账户',
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

// Send email
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, body, token } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token required' });
    }

    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, error: 'To, subject, and body are required' });
    }

    // Get account info to get the from address
    const accountRes = await axios.get(`${MAIL_TM_API}/accounts/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const from = accountRes.data.address;

    // Create a new message
    const messageRes = await axios.post(`${MAIL_TM_API}/messages`, {
      from: {
        address: from
      },
      to: [{
        address: to
      }],
      subject: subject,
      text: body
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Log operation
    await OperationLog.create({
      operation: 'send_email',
      userType: 'customer',
      userEmail: from,
      details: `发送邮件至 ${to}，主题：${subject}`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Email sent successfully', messageId: messageRes.data.id });
  } catch (error) {
    console.error('Error sending email:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.detail || 'Failed to send email'
    });
  }
});

// Login to existing email account
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Get token for authentication
    const tokenRes = await axios.post(`${MAIL_TM_API}/token`, {
      address: email,
      password: password
    });

    // Update last accessed time in database
    await CustomerEmail.update(
      { lastAccessed: new Date(), token: tokenRes.data.token },
      { where: { email: email } }
    );

    // Log operation
    await OperationLog.create({
      operation: 'login',
      userType: 'customer',
      userEmail: email,
      details: '登录邮箱',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      email: email,
      token: tokenRes.data.token
    });
  } catch (error) {
    console.error('Error logging in:', error.response?.data || error.message);
    res.status(401).json({
      success: false,
      error: error.response?.data?.detail || 'Invalid email or password'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin API routes
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ where: { email, password } });
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get customer emails API
app.get('/api/admin/customer-emails', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const customerEmails = await CustomerEmail.findAll({
      attributes: ['id', 'email', 'lastAccessed', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, customerEmails });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get customer email count API
app.get('/api/admin/customer-emails/count', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const count = await CustomerEmail.count();
    
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get operation logs API
app.get('/api/admin/operation-logs', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const operationLogs = await OperationLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    
    res.json({ success: true, operationLogs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// AI API endpoints
app.post('/api/ai/generate-email', async (req, res) => {
  try {
    const { subject, to, style, language } = req.body;
    
    // 模拟AI邮件生成
    const generatedContent = `您好，

我希望您一切安好。关于${subject || '我们的合作'}，我想提供一些更新信息。

[邮件内容]

如果您有任何问题，请随时联系我。

此致，
[您的姓名]`;
    
    res.json({ success: true, content: generatedContent });
  } catch (error) {
    console.error('Error generating email:', error);
    res.status(500).json({ success: false, error: 'Failed to generate email' });
  }
});

app.post('/api/ai/generate-reply', async (req, res) => {
  try {
    const { originalEmail, style, language } = req.body;
    
    // 模拟AI回复生成
    const generatedReply = `您好，

感谢您的邮件。

[AI 生成的回复内容]

如果您有任何其他问题，请随时告知我。

此致，
[您的姓名]`;
    
    res.json({ success: true, content: generatedReply });
  } catch (error) {
    console.error('Error generating reply:', error);
    res.status(500).json({ success: false, error: 'Failed to generate reply' });
  }
});

app.post('/api/ai/optimize-email', async (req, res) => {
  try {
    const { content, style, language } = req.body;
    
    // 模拟AI邮件内容优化
    const optimizedContent = `[优化后的邮件内容]\n\n${content}`;
    
    res.json({ success: true, content: optimizedContent });
  } catch (error) {
    console.error('Error optimizing email:', error);
    res.status(500).json({ success: false, error: 'Failed to optimize email' });
  }
});

app.post('/api/ai/translate-email', async (req, res) => {
  try {
    const { content, targetLanguage } = req.body;
    
    // 模拟AI邮件翻译
    const translatedContent = `[${targetLanguage} 翻译]\n\n${content}`;
    
    res.json({ success: true, content: translatedContent });
  } catch (error) {
    console.error('Error translating email:', error);
    res.status(500).json({ success: false, error: 'Failed to translate email' });
  }
});

app.post('/api/ai/write-email', async (req, res) => {
  try {
    const { emailType, recipient, sender, subject, purpose, tone, additionalInfo } = req.body;
    
    // 模拟AI邮件生成
    const generatedEmail = `尊敬的${recipient}，

${purpose}

[AI 生成的邮件内容]

${additionalInfo ? `\n${additionalInfo}` : ''}

此致，
${sender || '您的姓名'}`;
    
    res.json({ success: true, content: generatedEmail });
  } catch (error) {
    console.error('Error writing email:', error);
    res.status(500).json({ success: false, error: 'Failed to write email' });
  }
});

app.post('/api/ai/create-email-template', async (req, res) => {
  try {
    const { templateName, emailType, tone, content } = req.body;
    
    // 模拟AI邮件模板创建
    const template = {
      id: Date.now(),
      name: templateName,
      type: emailType,
      tone: tone,
      content: content || '[AI 生成的邮件模板内容]',
      createdAt: new Date()
    };
    
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ success: false, error: 'Failed to create email template' });
  }
});

app.post('/api/ai/rewrite-paragraph', async (req, res) => {
  try {
    const { content, tone, style } = req.body;
    
    // 模拟AI段落重写
    const rewrittenContent = `[${tone || '专业'}风格重写]\n\n${content}`;
    
    res.json({ success: true, content: rewrittenContent });
  } catch (error) {
    console.error('Error rewriting paragraph:', error);
    res.status(500).json({ success: false, error: 'Failed to rewrite paragraph' });
  }
});

app.post('/api/ai/generate-paragraph', async (req, res) => {
  try {
    const { topic, length, tone } = req.body;
    
    // 模拟AI段落生成
    const generatedContent = `关于${topic}的${tone || '专业'}段落：\n\n[AI 生成的段落内容]`;
    
    res.json({ success: true, content: generatedContent });
  } catch (error) {
    console.error('Error generating paragraph:', error);
    res.status(500).json({ success: false, error: 'Failed to generate paragraph' });
  }
});

app.post('/api/ai/summarize-pdf', async (req, res) => {
  try {
    const { pdfContent } = req.body;
    
    // 模拟AI PDF摘要
    const summary = `[PDF 摘要]\n\n${pdfContent ? pdfContent.substring(0, 500) + '...' : 'PDF 内容摘要'}`;
    
    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error summarizing PDF:', error);
    res.status(500).json({ success: false, error: 'Failed to summarize PDF' });
  }
});

app.post('/api/ai/generate-mindmap', async (req, res) => {
  try {
    const { topic, nodes } = req.body;
    
    // 模拟AI思维导图生成
    const mindmap = {
      topic: topic || '中心主题',
      nodes: nodes || ['节点1', '节点2', '节点3'],
      structure: '层级结构'
    };
    
    res.json({ success: true, mindmap });
  } catch (error) {
    console.error('Error generating mindmap:', error);
    res.status(500).json({ success: false, error: 'Failed to generate mindmap' });
  }
});

app.post('/api/ai/generate-flowchart', async (req, res) => {
  try {
    const { process, steps } = req.body;
    
    // 模拟AI流程图生成
    const flowchart = {
      process: process || '流程名称',
      steps: steps || ['步骤1', '步骤2', '步骤3'],
      structure: '线性流程'
    };
    
    res.json({ success: true, flowchart });
  } catch (error) {
    console.error('Error generating flowchart:', error);
    res.status(500).json({ success: false, error: 'Failed to generate flowchart' });
  }
});

app.get('/api/admin/me', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (user) {
      res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Dashboard data API
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalArticles = await Article.count();
    const totalFiles = await File.count();
    const totalSales = await Sale.sum('totalAmount') || 0;
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalArticles,
        totalFiles,
        totalSales
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Users API
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'role', 'createdAt']
    });
    
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Add user API
app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { email, password, name, role } = req.body;
    
    const user = await User.create({
      email,
      password,
      name,
      role
    });
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update user API
app.put('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { id } = req.params;
    const { email, name, role } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    await user.update({ email, name, role });
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete user API
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    await user.destroy();
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Articles API
app.get('/api/admin/articles', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== '客服') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const articles = await Article.findAll({
      attributes: ['id', 'title', 'content', 'status', 'category', 'userId', 'createdAt'],
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });
    
    res.json({ success: true, articles });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Files API
app.get('/api/admin/files', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== '客服') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const files = await File.findAll({
      attributes: ['id', 'name', 'path', 'size', 'type', 'userId', 'createdAt'],
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });
    
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Add article API
app.post('/api/admin/articles', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== '客服') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { title, content, category } = req.body;
    
    const article = await Article.create({
      title,
      content,
      category,
      status: 'draft',
      userId: req.user.id
    });
    
    res.json({ success: true, article });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Upload file API
app.post('/api/admin/files', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== '客服') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { name, path, size, type } = req.body;
    
    const file = await File.create({
      name,
      path,
      size,
      type,
      userId: req.user.id
    });
    
    res.json({ success: true, file });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Mock API for analytics
app.get('/api/admin/analytics', authenticateAdmin, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== '财务') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  res.json({
    success: true,
    data: {
      userTrends: [10, 20, 30, 40, 50],
      userDistribution: [30, 40, 20, 10]
    }
  });
});

// Suppliers API
app.get('/api/admin/suppliers', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const suppliers = await Supplier.findAll({
      attributes: ['id', 'name', 'contact', 'email', 'phone', 'address', 'status', 'createdAt'],
      include: [{
        model: Product,
        attributes: ['id', 'name']
      }]
    });
    
    res.json({ success: true, suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Add supplier API
app.post('/api/admin/suppliers', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { name, contact, email, phone, address, status } = req.body;
    
    const supplier = await Supplier.create({
      name,
      contact,
      email,
      phone,
      address,
      status: status || 'active'
    });
    
    res.json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update supplier API
app.put('/api/admin/suppliers/:id', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { id } = req.params;
    const { name, contact, email, phone, address, status } = req.body;
    
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    
    await supplier.update({ name, contact, email, phone, address, status });
    
    res.json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete supplier API
app.delete('/api/admin/suppliers/:id', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { id } = req.params;
    
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    
    await supplier.destroy();
    
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Products API
app.get('/api/admin/products', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const products = await Product.findAll({
      attributes: ['id', 'name', 'description', 'price', 'stock', 'category', 'supplierId', 'createdAt'],
      include: [{
        model: Supplier,
        attributes: ['id', 'name', 'contact']
      }]
    });
    
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Add product API
app.post('/api/admin/products', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { name, description, price, stock, category, supplierId } = req.body;
    
    const product = await Product.create({
      name,
      description,
      price,
      stock,
      category,
      supplierId
    });
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update product API
app.put('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, supplierId } = req.body;
    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    await product.update({ name, description, price, stock, category, supplierId });
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete product API
app.delete('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    await product.destroy();
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Sales analysis API
app.get('/api/admin/sales/analysis', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== '财务') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    // Total sales amount
    const totalSales = await Sale.sum('totalAmount') || 0;
    
    // Sales by product
    const salesByProduct = await Sale.findAll({
      attributes: [
        'productId',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalAmount']
      ],
      include: [{
        model: Product,
        attributes: ['name']
      }],
      group: ['productId', 'Product.id']
    });
    
    // Sales by category
    const salesByCategory = await Sale.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalAmount']
      ],
      include: [{
        model: Product,
        attributes: ['category']
      }],
      group: ['Product.category']
    });
    
    // Sales by month
    const salesByMonth = await Sale.findAll({
      attributes: [
        [Sequelize.fn('strftime', '%Y-%m', Sequelize.col('saleDate')), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalAmount']
      ],
      group: [Sequelize.fn('strftime', '%Y-%m', Sequelize.col('saleDate'))],
      order: [[Sequelize.fn('strftime', '%Y-%m', Sequelize.col('saleDate')), 'ASC']]
    });
    
    // Expenses by category
    const expensesByCategory = await Expense.findAll({
      attributes: [
        'category',
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
      ],
      group: ['category']
    });
    
    // Total expenses
    const totalExpenses = await Expense.sum('amount') || 0;
    
    // Profit (sales - expenses)
    const profit = totalSales - totalExpenses;
    
    res.json({ 
      success: true, 
      analysis: {
        totalSales,
        totalExpenses,
        profit,
        salesByProduct,
        salesByCategory,
        salesByMonth,
        expensesByCategory
      }
    });
  } catch (error) {
    console.error('Sales analysis error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Finance API
app.get('/api/admin/finance', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== '财务') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    // Get sales data
    const sales = await Sale.findAll({
      attributes: ['saleDate', 'totalAmount'],
      order: [['saleDate', 'ASC']]
    });
    
    // Get expenses data
    const expenses = await Expense.findAll({
      attributes: ['expenseDate', 'amount'],
      order: [['expenseDate', 'ASC']]
    });
    
    // Format data for frontend
    const salesData = sales.map(sale => sale.totalAmount);
    const expensesData = expenses.map(expense => expense.amount);
    
    res.json({
      success: true,
      data: {
        sales: salesData.length > 0 ? salesData : [0, 0, 0, 0, 0],
        expenses: expensesData.length > 0 ? expensesData : [0, 0, 0, 0, 0]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Sales API
app.get('/api/admin/sales', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== '财务') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const sales = await Sale.findAll({
      attributes: ['id', 'productId', 'userId', 'quantity', 'totalAmount', 'saleDate'],
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price']
      }, {
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });
    
    res.json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Add sale API
app.post('/api/admin/sales', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== '财务') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { productId, quantity, totalAmount, saleDate } = req.body;
    
    const sale = await Sale.create({
      productId,
      userId: req.user.id,
      quantity,
      totalAmount,
      saleDate: saleDate || new Date()
    });
    
    res.json({ success: true, sale });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Expenses API
app.get('/api/admin/expenses', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== '财务') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const expenses = await Expense.findAll({
      attributes: ['id', 'userId', 'amount', 'category', 'description', 'expenseDate'],
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });
    
    res.json({ success: true, expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Add expense API
app.post('/api/admin/expenses', authenticateAdmin, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== '财务') {
    return res.status(403).json({ success: false, error: 'Permission denied' });
  }
  
  try {
    const { amount, category, description, expenseDate } = req.body;
    
    const expense = await Expense.create({
      userId: req.user.id,
      amount,
      category,
      description,
      expenseDate: expenseDate || new Date()
    });
    
    res.json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Email Signup Backend running on port ${PORT}`);
});
