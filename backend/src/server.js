const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// 导入VIP邮箱生成模块
const { generateVIPEmail, generateVIPEmails, VIP_TYPES } = require('./vip-email');

// 导入拍卖系统模块
const { AuctionSystem, AUCTION_STATUS } = require('./auction');

// 初始化拍卖系统
const auctionSystem = new AuctionSystem();

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// VIP邮箱生成路由

// 创建单个VIP邮箱
app.post('/api/create-vip-email', async (req, res) => {
  try {
    const { type } = req.body;
    const result = await generateVIPEmail(type || Object.values(VIP_TYPES)[0]);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error creating VIP email:', error);
    res.status(500).json({ success: false, error: 'Failed to create VIP email' });
  }
});

// 生成多个VIP邮箱
app.post('/api/generate-vip-emails', async (req, res) => {
  try {
    const { count } = req.body;
    const emails = await generateVIPEmails(count || 10);
    res.json({ success: true, emails });
  } catch (error) {
    console.error('Error generating VIP emails:', error);
    res.status(500).json({ success: false, error: 'Failed to generate VIP emails' });
  }
});

// 拍卖交易路由

// 创建拍卖
app.post('/api/auction/create', (req, res) => {
  try {
    const { email, type, startingPrice, durationHours } = req.body;
    const item = auctionSystem.createAuction(email, type, startingPrice, durationHours);
    res.json({ success: true, auction: item });
  } catch (error) {
    console.error('Error creating auction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 出价
app.post('/api/auction/bid', (req, res) => {
  try {
    const { auctionId, bidder, amount } = req.body;
    const item = auctionSystem.placeBid(auctionId, bidder, amount);
    res.json({ success: true, auction: item });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 结束拍卖
app.post('/api/auction/end', (req, res) => {
  try {
    const { auctionId } = req.body;
    const item = auctionSystem.endAuction(auctionId);
    res.json({ success: true, auction: item });
  } catch (error) {
    console.error('Error ending auction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取所有拍卖
app.get('/api/auction/all', (req, res) => {
  try {
    const auctions = auctionSystem.getAllAuctions();
    res.json({ success: true, auctions });
  } catch (error) {
    console.error('Error getting auctions:', error);
    res.status(500).json({ success: false, error: 'Failed to get auctions' });
  }
});

// 获取活跃拍卖
app.get('/api/auction/active', (req, res) => {
  try {
    const auctions = auctionSystem.getActiveAuctions();
    res.json({ success: true, auctions });
  } catch (error) {
    console.error('Error getting active auctions:', error);
    res.status(500).json({ success: false, error: 'Failed to get active auctions' });
  }
});

// 获取已结束拍卖
app.get('/api/auction/ended', (req, res) => {
  try {
    const auctions = auctionSystem.getEndedAuctions();
    res.json({ success: true, auctions });
  } catch (error) {
    console.error('Error getting ended auctions:', error);
    res.status(500).json({ success: false, error: 'Failed to get ended auctions' });
  }
});

app.listen(PORT, () => {
  console.log(`Email Signup Backend running on port ${PORT}`);
});
