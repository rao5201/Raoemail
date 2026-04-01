const axios = require('axios');
const fs = require('fs');

// Mail.tm API base URL
const MAIL_TM_API = 'https://api.mail.tm';

// VIP邮箱类型
const VIP_TYPES = {
  LUCKY: '吉祥号',
  HOT: '火爆号',
  SAME_DIGITS: '同数字号'
};

// 已注册的邮箱名称
let registeredNames = new Set();

// 加载已注册的邮箱名称
function loadRegisteredNames() {
  try {
    const data = fs.readFileSync('registered-vip-emails.json', 'utf8');
    const emails = JSON.parse(data);
    emails.forEach(email => {
      const username = email.email.split('@')[0];
      registeredNames.add(username);
    });
  } catch (error) {
    console.log('No registered VIP emails found, starting fresh');
  }
}

// 保存已注册的邮箱名称
function saveRegisteredNames(emails) {
  fs.writeFileSync('registered-vip-emails.json', JSON.stringify(emails, null, 2));
}

// 生成吉祥号
function generateLuckyNumber() {
  const luckyNumbers = ['666', '888', '999', '168', '8888', '9999', '6666'];
  return luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)];
}

// 生成火爆号
function generateHotNumber() {
  const hotPrefixes = ['hot', 'vip', 'star', 'super', 'top'];
  const hotSuffixes = ['2024', '2025', '2026', '001', '007', '123'];
  const prefix = hotPrefixes[Math.floor(Math.random() * hotPrefixes.length)];
  const suffix = hotSuffixes[Math.floor(Math.random() * hotSuffixes.length)];
  return `${prefix}${suffix}`;
}

// 生成同数字号
function generateSameDigits() {
  const digits = ['111', '222', '333', '444', '555', '666', '777', '888', '999'];
  return digits[Math.floor(Math.random() * digits.length)];
}

// 生成VIP邮箱名称
function generateVIPName(type) {
  let name;
  do {
    switch (type) {
      case VIP_TYPES.LUCKY:
        name = `lucky${generateLuckyNumber()}`;
        break;
      case VIP_TYPES.HOT:
        name = generateHotNumber();
        break;
      case VIP_TYPES.SAME_DIGITS:
        name = `number${generateSameDigits()}`;
        break;
      default:
        name = `vip${Math.random().toString(36).substring(2, 8)}`;
    }
  } while (registeredNames.has(name));
  
  registeredNames.add(name);
  return name;
}

// 生成VIP邮箱
async function generateVIPEmail(type) {
  let attempts = 3;
  
  while (attempts > 0) {
    try {
      // 获取可用域名
      const domainsRes = await axios.get(`${MAIL_TM_API}/domains`);
      const domain = domainsRes.data['hydra:member'][0].domain;
      
      // 生成VIP邮箱名称
      const username = generateVIPName(type);
      const email = `${username}@${domain}`;
      const password = '888888';
      
      // 创建账户
      const createRes = await axios.post(`${MAIL_TM_API}/accounts`, {
        address: email,
        password: password
      });
      
      return {
        success: true,
        email: email,
        password: password,
        type: type
      };
    } catch (error) {
      console.error('Error generating VIP email:', error.response?.data || error.message);
      attempts--;
      
      // 如果是邮箱已被使用的错误，继续尝试
      if (error.response?.data?.detail?.includes('already used')) {
        console.log('邮箱已被使用，尝试生成新的邮箱...');
        continue;
      }
      
      // 如果是请求过于频繁的错误，增加等待时间
      if (error.response?.status === 429) {
        console.log('请求过于频繁，等待5秒后重试...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      // 其他错误，返回失败
      if (attempts === 0) {
        return {
          success: false,
          error: error.response?.data?.detail || 'Failed to generate VIP email'
        };
      }
    }
  }
}

// 生成多个VIP邮箱
async function generateVIPEmails(count) {
  const emails = [];
  let successCount = 0;
  let failCount = 0;
  
  console.log(`开始生成 ${count} 个VIP邮箱...`);
  
  // 加载已注册的邮箱名称
  loadRegisteredNames();
  
  for (let i = 0; i < count; i++) {
    // 随机选择VIP类型
    const types = Object.values(VIP_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    console.log(`生成第 ${i + 1} 个VIP邮箱 (${randomType})`);
    const result = await generateVIPEmail(randomType);
    
    if (result.success) {
      emails.push(result);
      successCount++;
      console.log(`成功生成VIP邮箱: ${result.email}`);
    } else {
      failCount++;
      console.log(`生成VIP邮箱失败: ${result.error}`);
    }
    
    // 避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log(`\n生成完成！`);
  console.log(`成功: ${successCount} 个`);
  console.log(`失败: ${failCount} 个`);
  
  // 保存已注册的邮箱
  saveRegisteredNames(emails);
  console.log('已注册的VIP邮箱已保存');
  
  return emails;
}

module.exports = {
  generateVIPEmail,
  generateVIPEmails,
  VIP_TYPES
};