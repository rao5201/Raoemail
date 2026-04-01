const axios = require('axios');

// Mail.tm API base URL
const MAIL_TM_API = 'https://api.mail.tm';

// 中国国内品牌公司列表
const chineseBrands = [
  '阿里巴巴', '腾讯', '百度', '华为', '小米', '京东', '美团', '字节跳动', '滴滴', '网易',
  '拼多多', '快手', 'vivo', 'OPPO', '联想', '海尔', '格力', '美的', '伊利', '蒙牛',
  '娃哈哈', '康师傅', '统一', '农夫山泉', '青岛啤酒', '雪花啤酒', '五粮液', '茅台', '安踏', '李宁',
  '特步', '361度', '波司登', '海澜之家', '雅戈尔', '七匹狼', '森马', '美特斯邦威', '太平鸟', '江南布衣',
  '周大福', '老凤祥', '六福珠宝', '周生生', '周六福', '中国黄金', '周大生', '潮宏基', '菜百首饰', '明牌珠宝',
  '中国工商银行', '中国建设银行', '中国农业银行', '中国银行', '交通银行', '招商银行', '中信银行', '浦发银行', '兴业银行', '民生银行',
  '中国平安', '中国人寿', '太平洋保险', '人保财险', '新华保险', '泰康人寿', '阳光保险', '太平保险', '安邦保险', '大地保险',
  '中国移动', '中国联通', '中国电信', '中国铁塔', '中国邮政', '中国石化', '中国石油', '中国海油', '国家电网', '南方电网',
  '中国铁路', '中国航空', '东方航空', '南方航空', '海南航空', '厦门航空', '深圳航空', '山东航空', '四川航空', '春秋航空',
  '中国建筑', '中国铁建', '中国中铁', '中国交建', '中国中冶', '中国电建', '中国能建', '中国化学', '中国核建', '中国广核'
];

// 生成随机字符串
function generateRandomString(length) {
  return Math.random().toString(36).substring(2, 2 + length);
}

// 生成邮箱
async function generateEmail() {
  try {
    // 获取可用域名
    const domainsRes = await axios.get(`${MAIL_TM_API}/domains`);
    const domain = domainsRes.data['hydra:member'][0].domain;
    
    // 随机选择一个品牌
    const brand = chineseBrands[Math.floor(Math.random() * chineseBrands.length)];
    
    // 生成随机字符串作为用户名的一部分
    const randomStr = generateRandomString(8);
    
    // 构建邮箱地址
    const username = `${brand}_${randomStr}`;
    const email = `${username}@${domain}`;
    const password = '000000';
    
    // 创建账户
    const createRes = await axios.post(`${MAIL_TM_API}/accounts`, {
      address: email,
      password: password
    });
    
    // 获取token
    const tokenRes = await axios.post(`${MAIL_TM_API}/token`, {
      address: email,
      password: password
    });
    
    return {
      success: true,
      email: email,
      password: password,
      token: tokenRes.data.token
    };
  } catch (error) {
    console.error('Error generating email:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to generate email'
    };
  }
}

// 生成1000个邮箱
async function generateEmails(count) {
  const emails = [];
  let successCount = 0;
  let failCount = 0;
  
  console.log(`开始生成 ${count} 个邮箱...`);
  
  for (let i = 0; i < count; i++) {
    console.log(`生成第 ${i + 1} 个邮箱`);
    const result = await generateEmail();
    
    if (result.success) {
      emails.push(result);
      successCount++;
    } else {
      failCount++;
    }
    
    // 避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n生成完成！`);
  console.log(`成功: ${successCount} 个`);
  console.log(`失败: ${failCount} 个`);
  
  // 保存结果到文件
  const fs = require('fs');
  fs.writeFileSync('generated-emails.json', JSON.stringify(emails, null, 2));
  console.log('结果已保存到 generated-emails.json 文件');
  
  return emails;
}

// 运行脚本
generateEmails(1000).catch(console.error);