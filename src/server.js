<<<<<<< HEAD
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

// User registration API
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
      role: 'user'
    });

    // Log operation
    await OperationLog.create({
      operation: 'register',
      userType: 'user',
      userEmail: email,
      details: '用户注册',
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Registration successful' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, error: 'Failed to register user' });
  }
});

// User login API
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Check if user exists
    const user = await User.findOne({ where: { email, password } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    // Log operation
    await OperationLog.create({
      operation: 'login',
      userType: 'user',
      userEmail: email,
      details: '用户登录',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, error: 'Failed to login' });
  }
});

// Login to existing email account (temporary email)
app.post('/api/login-email', async (req, res) => {
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
      operation: 'login_email',
      userType: 'customer',
      userEmail: email,
      details: '登录临时邮箱',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      email: email,
      token: tokenRes.data.token
    });
  } catch (error) {
    console.error('Error logging in to email:', error.response?.data || error.message);
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

// 产品提交API
app.post('/api/submit-product', async (req, res) => {
  try {
    const { 
      productUrl, 
      productName, 
      productDescription, 
      productCategory, 
      speed, 
      seoLink, 
      spotlight 
    } = req.body;
    
    // 模拟产品提交
    const product = {
      id: Date.now(),
      url: productUrl,
      name: productName,
      description: productDescription,
      category: productCategory,
      speed: speed,
      seoLink: seoLink,
      spotlight: spotlight,
      status: 'pending',
      submittedAt: new Date()
    };
    
    // 计算价格
    let totalPrice = 0;
    if (speed === 'fast-track') totalPrice += 10;
    if (seoLink) totalPrice += 79;
    if (spotlight === '7days') totalPrice += 29;
    if (spotlight === '30days') totalPrice += 99;
    
    res.json({ 
      success: true, 
      product, 
      totalPrice, 
      message: '产品提交成功！我们将在24小时内审核你的产品。' 
    });
  } catch (error) {
    console.error('Error submitting product:', error);
    res.status(500).json({ success: false, error: 'Failed to submit product' });
  }
});

// MCP服务器API
app.post('/api/mcp/email', async (req, res) => {
  try {
    const { action, params } = req.body;
    
    // 模拟MCP服务器响应
    let response;
    
    switch (action) {
      case 'messages:search':
        response = {
          success: true,
          data: [
            {
              id: '1',
              subject: '测试邮件',
              from: 'sender@example.com',
              to: 'recipient@example.com',
              date: new Date().toISOString(),
              body: '这是一封测试邮件',
              unread: true
            }
          ]
        };
        break;
      case 'messages:read':
        response = {
          success: true,
          data: {
            id: params.id,
            subject: '测试邮件',
            from: 'sender@example.com',
            to: 'recipient@example.com',
            date: new Date().toISOString(),
            body: '这是一封测试邮件',
            unread: false
          }
        };
        break;
      case 'send:new':
        response = {
          success: true,
          data: {
            id: '2',
            subject: params.subject,
            from: 'recipient@example.com',
            to: params.to,
            date: new Date().toISOString(),
            body: params.body
          }
        };
        break;
      default:
        response = {
          success: false,
          error: 'Unsupported action'
        };
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error processing MCP request:', error);
    res.status(500).json({ success: false, error: 'Failed to process MCP request' });
  }
});

// MCP服务器配置API
app.get('/api/mcp/config', async (req, res) => {
  try {
    const config = {
      mcpServers: {
        'better-email': {
          type: 'http',
          url: 'https://better-email-mcp.n24q02m.com/mcp'
        },
        'imap': {
          type: 'http',
          url: 'https://imap-mcp.example.com/mcp'
        },
        'email-filter': {
          type: 'http',
          url: 'https://email-filter-mcp.example.com/mcp'
        },
        'zabbix': {
          type: 'http',
          url: 'https://zabbix-mcp.example.com/mcp'
        },
        'unified': {
          type: 'http',
          url: 'https://unified-mcp.example.com/mcp'
        },
        'chatgpt': {
          type: 'http',
          url: 'https://chatgpt-mcp.example.com/mcp'
        },
        'godot': {
          type: 'http',
          url: 'https://godot-mcp-docs.example.com/mcp'
        },
        'antv': {
          type: 'http',
          url: 'https://mcp-server-antv.example.com/mcp'
        },
        'context7': {
          type: 'http',
          url: 'https://mcp.context7.com/mcp'
        },
        'figma': {
          type: 'http',
          url: 'https://framelink-figma-mcp.example.com/mcp'
        },
        'f2c': {
          type: 'http',
          url: 'https://f2c-mcp.example.com/mcp'
        },
        'image-tools': {
          type: 'http',
          url: 'https://image-tools-mcp.example.com/mcp'
        },
        'pandoc': {
          type: 'http',
          url: 'https://mcp-pandoc.example.com/mcp'
        },
        'deepwiki': {
          type: 'http',
          url: 'https://deepwiki-mcp.example.com/mcp'
        },
        'fetch': {
          type: 'http',
          url: 'https://mcp-server-fetch.example.com/mcp'
        },
        'firecrawl': {
          type: 'http',
          url: 'https://firecrawl-mcp.example.com/mcp'
        },
        'playwright': {
          type: 'http',
          url: 'https://playwright-mcp.example.com/mcp'
        },
        'mobile-mcp': {
          type: 'http',
          url: 'https://mobile-mcp.example.com/mcp'
        },
        'mcp-mobile-server': {
          type: 'http',
          url: 'https://mcp-mobile-server.example.com/mcp'
        },
        'ios-simulator': {
          type: 'http',
          url: 'https://ios-simulator-mcp.example.com/mcp'
        },
        'executeautomation-playwright': {
          type: 'http',
          url: 'https://executeautomation-playwright-mcp.example.com/mcp'
        },
        'browser-tools': {
          type: 'http',
          url: 'https://browser-tools-mcp.example.com/mcp'
        },
        'mysql': {
          type: 'http',
          url: 'https://mysql-mcp.example.com/mcp'
        },
        'mysql-pro': {
          type: 'http',
          url: 'https://mysql-mcp-pro.example.com/mcp'
        },
        'dbhub': {
          type: 'http',
          url: 'https://dbhub-mcp.example.com/mcp'
        },
        'ppt': {
          type: 'http',
          url: 'https://ppt-mcp.example.com/mcp'
        },
        'excel': {
          type: 'http',
          url: 'https://excel-mcp.example.com/mcp'
        },
        'duckdb': {
          type: 'http',
          url: 'https://duckdb-mcp.example.com/mcp'
        },
        'cryo': {
          type: 'http',
          url: 'https://cryo-mcp.example.com/mcp'
        }
      }
    };
    
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error getting MCP config:', error);
    res.status(500).json({ success: false, error: 'Failed to get MCP config' });
  }
});

// Payment API
app.post('/api/payment/process', async (req, res) => {
  try {
    const { userId, serviceType, amount, paymentMethod, platform, isInternational } = req.body;
    
    // Validate input
    if (!userId || !serviceType || !amount || !paymentMethod) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Calculate service fee (3-5%)
    const serviceFeeRate = isInternational ? 0.05 : 0.03; // 5% for international, 3% for domestic
    const serviceFee = amount * serviceFeeRate;
    const totalAmount = amount + serviceFee;
    
    // Process payment based on platform and international status
    let paymentResult;
    if (isInternational) {
      // Process international payment
      paymentResult = await processInternationalPayment(userId, serviceType, amount, serviceFee, totalAmount, paymentMethod, platform);
    } else if (platform === 'third-party') {
      // Process through third-party payment platform
      paymentResult = await processThirdPartyPayment(userId, serviceType, amount, serviceFee, totalAmount, paymentMethod);
    } else if (platform === 'bank') {
      // Process through bank settlement platform
      paymentResult = await processBankSettlement(userId, serviceType, amount, serviceFee, totalAmount, paymentMethod);
    } else {
      // Default payment processing
      paymentResult = await processDefaultPayment(userId, serviceType, amount, serviceFee, totalAmount, paymentMethod);
    }
    
    // Log payment
    await OperationLog.create({
      operation: 'payment',
      userType: 'user',
      userEmail: `user_${userId}`,
      details: `通过 ${platform || '默认'} 平台${isInternational ? '跨国' : ''}支付 ${amount} 元，服务费 ${serviceFee.toFixed(2)} 元，总计 ${totalAmount.toFixed(2)} 元购买 ${serviceType} 服务`,
      ipAddress: req.ip
    });
    
    // Auto activate service
    await activateService(userId, serviceType);
    
    res.json({
      success: true,
      paymentId: paymentResult.paymentId,
      paymentStatus: paymentResult.paymentStatus,
      serviceFee: serviceFee,
      totalAmount: totalAmount,
      message: paymentResult.message || 'Payment processed successfully and service activated'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, error: 'Failed to process payment' });
  }
});

// Process international payment
async function processInternationalPayment(userId, serviceType, amount, serviceFee, totalAmount, paymentMethod, platform) {
  try {
    // Simulate international payment processing
    console.log(`Processing international payment for user ${userId}: ${amount}元 (service fee: ${serviceFee.toFixed(2)}元, total: ${totalAmount.toFixed(2)}元) via ${paymentMethod}`);
    
    // Simulate international payment methods
    let paymentUrl;
    switch (paymentMethod) {
      case 'paypal':
        paymentUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&amount=${totalAmount}&currency_code=CNY`;
        break;
      case 'stripe':
        paymentUrl = `https://checkout.stripe.com/pay/${Date.now()}?amount=${Math.round(totalAmount * 100)}&currency=cny`;
        break;
      case 'westernunion':
        paymentUrl = `https://www.westernunion.com/cn/en/send-money.html?amount=${totalAmount}&currency=CNY`;
        break;
      case 'international-bank':
        paymentUrl = `https://international-banking.example.com/transfer?amount=${totalAmount}&currency=CNY`;
        break;
      default:
        paymentUrl = `https://international-payment.example.com/pay?amount=${totalAmount}&currency=CNY`;
    }
    
    // Simulate international payment delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      paymentId: `INTL${Date.now()}`,
      paymentStatus: 'completed',
      paymentUrl: paymentUrl,
      currency: 'CNY',
      exchangeRate: 1.0, // Assuming CNY for simplicity
      message: 'International payment processed successfully with 5% service fee'
    };
  } catch (error) {
    console.error('Error processing international payment:', error);
    throw error;
  }
}

// Process third-party payment
async function processThirdPartyPayment(userId, serviceType, amount, serviceFee, totalAmount, paymentMethod) {
  try {
    // Simulate third-party payment processing
    // In a real implementation, you would integrate with actual payment gateways
    console.log(`Processing third-party payment for user ${userId}: ${amount}元 (service fee: ${serviceFee.toFixed(2)}元, total: ${totalAmount.toFixed(2)}元) via ${paymentMethod}`);
    
    // Simulate different payment methods
    let paymentUrl;
    switch (paymentMethod) {
      case 'alipay':
        paymentUrl = `https://openapi.alipay.com/gateway.do?order=${Date.now()}&amount=${totalAmount}`;
        break;
      case 'wechat':
        paymentUrl = `https://api.mch.weixin.qq.com/pay/unifiedorder?order=${Date.now()}&amount=${totalAmount}`;
        break;
      case 'unionpay':
        paymentUrl = `https://gateway.95516.com/gateway/api/frontTransReq.do?order=${Date.now()}&amount=${totalAmount}`;
        break;
      default:
        paymentUrl = `https://payment.example.com/pay?order=${Date.now()}&amount=${totalAmount}`;
    }
    
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      paymentId: `THIRD${Date.now()}`,
      paymentStatus: 'completed',
      paymentUrl: paymentUrl,
      message: 'Third-party payment processed successfully with 3% service fee'
    };
  } catch (error) {
    console.error('Error processing third-party payment:', error);
    throw error;
  }
}

// Process bank settlement payment
async function processBankSettlement(userId, serviceType, amount, serviceFee, totalAmount, paymentMethod) {
  try {
    // Simulate bank settlement processing
    console.log(`Processing bank settlement for user ${userId}: ${amount}元 (service fee: ${serviceFee.toFixed(2)}元, total: ${totalAmount.toFixed(2)}元) via ${paymentMethod}`);
    
    // Bank settlement details
    const bankDetails = {
      bankName: '中国农业银行',
      accountNumber: '6228480089304669172',
      accountName: '饶思义',
      branch: '中国农业银行股份有限公司广州林安物流园支行',
      swiftCode: 'ABOCCNBJ190'
    };
    
    // Simulate settlement process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      paymentId: `BANK${Date.now()}`,
      paymentStatus: 'pending', // Bank transfers typically take time to settle
      bankDetails: bankDetails,
      message: 'Bank settlement initiated successfully. Please transfer the total amount to the provided bank account.'
    };
  } catch (error) {
    console.error('Error processing bank settlement:', error);
    throw error;
  }
}

// Process default payment
async function processDefaultPayment(userId, serviceType, amount, serviceFee, totalAmount, paymentMethod) {
  try {
    // Simulate default payment processing
    console.log(`Processing default payment for user ${userId}: ${amount}元 (service fee: ${serviceFee.toFixed(2)}元, total: ${totalAmount.toFixed(2)}元) via ${paymentMethod}`);
    
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      paymentId: `PAY${Date.now()}`,
      paymentStatus: 'completed',
      message: 'Payment processed successfully with 3% service fee'
    };
  } catch (error) {
    console.error('Error processing default payment:', error);
    throw error;
  }
}

// Payment status check API
app.get('/api/payment/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Simulate payment status check
    // In a real implementation, you would check with the actual payment gateway
    let status = 'completed';
    if (paymentId.startsWith('BANK')) {
      // Bank transfers take time to settle
      status = 'pending';
    }
    
    res.json({
      success: true,
      paymentId,
      status,
      message: `Payment ${paymentId} is ${status}`
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ success: false, error: 'Failed to check payment status' });
  }
});

// Bank settlement confirmation API
app.post('/api/payment/bank/confirm', async (req, res) => {
  try {
    const { paymentId, transactionId, amount } = req.body;
    
    if (!paymentId || !transactionId || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Simulate bank settlement confirmation
    console.log(`Confirming bank settlement for payment ${paymentId} with transaction ${transactionId}`);
    
    // Log bank settlement confirmation
    await OperationLog.create({
      operation: 'bank_settlement_confirm',
      userType: 'admin',
      userEmail: 'admin@example.com',
      details: `确认银行结算：支付ID ${paymentId}，交易ID ${transactionId}，金额 ${amount} 元`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      paymentId,
      transactionId,
      message: 'Bank settlement confirmed successfully'
    });
  } catch (error) {
    console.error('Error confirming bank settlement:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm bank settlement' });
  }
});

// Service activation function
async function activateService(userId, serviceType) {
  try {
    // Here you would implement the logic to activate the service for the user
    // This could involve updating a database record, sending a confirmation email, etc.
    
    // Log service activation
    await OperationLog.create({
      operation: 'service_activation',
      userType: 'user',
      userEmail: `user_${userId}`,
      details: `激活 ${serviceType} 服务`,
      ipAddress: 'system'
    });
    
    console.log(`Service ${serviceType} activated for user ${userId}`);
  } catch (error) {
    console.error('Error activating service:', error);
  }
}

// Tool usage tracking API
app.post('/api/tools/usage', async (req, res) => {
  try {
    const { userId, toolName, usageTime } = req.body;
    
    // Validate input
    if (!userId || !toolName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Log tool usage
    await OperationLog.create({
      operation: 'tool_usage',
      userType: 'user',
      userEmail: `user_${userId}`,
      details: `使用 ${toolName} 工具，时长 ${usageTime || 0} 秒`,
      ipAddress: req.ip
    });
    
    res.json({ success: true, message: 'Tool usage logged successfully' });
  } catch (error) {
    console.error('Error logging tool usage:', error);
    res.status(500).json({ success: false, error: 'Failed to log tool usage' });
  }
});

// Tool usage analysis API
app.get('/api/tools/usage/analysis', authenticateAdmin, async (req, res) => {
  try {
    // Get tool usage data from operation logs
    const usageLogs = await OperationLog.findAll({
      where: {
        operation: 'tool_usage'
      },
      order: [['createdAt', 'DESC']]
    });
    
    // Analyze usage data
    const usageAnalysis = {};
    usageLogs.forEach(log => {
      const toolName = log.details.match(/使用 (.*?) 工具/)[1];
      if (!usageAnalysis[toolName]) {
        usageAnalysis[toolName] = 0;
      }
      usageAnalysis[toolName]++;
    });
    
    res.json({
      success: true,
      analysis: usageAnalysis,
      totalUsage: usageLogs.length
    });
  } catch (error) {
    console.error('Error analyzing tool usage:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze tool usage' });
  }
});

// API integration examples API
app.get('/api/api/integration/examples', async (req, res) => {
  try {
    const examples = {
      javascript: {
        description: 'JavaScript API integration example',
        code: `// JavaScript API integration example
const axios = require('axios');

async function createEmail() {
  try {
    const response = await axios.post('https://your-api.com/api/create-email');
    console.log('Email created:', response.data);
  } catch (error) {
    console.error('Error creating email:', error);
  }
}

createEmail();`
      },
      python: {
        description: 'Python API integration example',
        code: `# Python API integration example
import requests

response = requests.post('https://your-api.com/api/create-email')
print('Email created:', response.json())`
      },
      curl: {
        description: 'cURL API integration example',
        code: `# cURL API integration example
curl -X POST https://your-api.com/api/create-email`
      }
    };
    
    res.json({ success: true, examples });
  } catch (error) {
    console.error('Error getting API examples:', error);
    res.status(500).json({ success: false, error: 'Failed to get API examples' });
  }
});

// Multi-language support API
app.get('/api/languages', async (req, res) => {
  try {
    const languages = [
      { code: 'zh', name: '中文' },
      { code: 'en', name: 'English' },
      { code: 'ja', name: '日本語' },
      { code: 'ko', name: '한국어' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' }
    ];
    
    res.json({ success: true, languages });
  } catch (error) {
    console.error('Error getting languages:', error);
    res.status(500).json({ success: false, error: 'Failed to get languages' });
  }
});

// Mobile app API
app.get('/api/mobile/app/config', async (req, res) => {
  try {
    const config = {
      version: '1.1.0',
      apiBaseUrl: 'https://your-api.com/api',
      features: {
        emailCreation: true,
        messageChecking: true,
        toolAccess: true,
        paymentProcessing: true
      },
      supportedPlatforms: ['iOS', 'Android']
    };
    
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error getting mobile app config:', error);
    res.status(500).json({ success: false, error: 'Failed to get mobile app config' });
  }
});

// App update check API
app.get('/api/mobile/app/update-check', async (req, res) => {
  try {
    const { currentVersion, platform } = req.query;
    
    if (!currentVersion) {
      return res.status(400).json({ success: false, error: 'Current version is required' });
    }
    
    // Define latest version information
    const latestVersion = '1.1.0';
    const appStoreUrl = 'https://apps.apple.com/app/your-app/id123456789';
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.yourapp';
    
    // Check if update is needed
    const isUpdateNeeded = compareVersions(currentVersion, latestVersion) < 0;
    
    // Update information
    const updateInfo = {
      latestVersion: latestVersion,
      isUpdateNeeded: isUpdateNeeded,
      isForceUpdate: false, // Set to true if force update is required
      updateMessage: '发现新版本 v1.1.0，包含以下更新：\n\n• 新增在线支付功能\n• 新增用户注册和登录系统\n• 新增服务自动开通功能\n• 新增工具使用分析\n• 新增API集成示例\n• 新增多语言支持\n• 新增跨国支付结算\n• 修复已知问题\n\n建议您立即更新以获得最佳体验。',
      updateUrl: platform === 'iOS' ? appStoreUrl : playStoreUrl,
      releaseDate: '2026-04-06',
      releaseNotes: [
        '新增在线支付功能，支持支付宝、微信支付和银行转账',
        '新增用户注册和登录系统，实现完整的用户认证',
        '新增服务自动开通功能，支付后自动开通服务',
        '新增工具使用分析，提供详细的使用报告',
        '新增API集成示例，提供示例代码和文档',
        '新增多语言支持，提升国际用户体验',
        '新增跨国支付结算，支持国际支付方式',
        '修复已知问题，优化应用性能'
      ]
    };
    
    res.json({ success: true, updateInfo });
  } catch (error) {
    console.error('Error checking app update:', error);
    res.status(500).json({ success: false, error: 'Failed to check app update' });
  }
});

// Helper function to compare version strings
function compareVersions(version1, version2) {
  const v1 = version1.split('.').map(Number);
  const v2 = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
}

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
=======
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Mail.tm API base URL
const MAIL_TM_API = 'https://api.mail.tm';

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Email Signup Backend running on port ${PORT}`);
});
>>>>>>> 91e3903ca938bc9524555af809e10bdd7481cb71
