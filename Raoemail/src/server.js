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
