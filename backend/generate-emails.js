const axios = require('axios');

// Mail.tm API base URL
const MAIL_TM_API = 'https://api.mail.tm';

// 中国国内品牌公司英文名称列表
const chineseBrands = [
  'Alibaba', 'Tencent', 'Baidu', 'Huawei', 'Xiaomi', 'JD', 'Meituan', 'ByteDance', 'Didi', 'NetEase',
  'Pinduoduo', 'Kuaishou', 'Vivo', 'OPPO', 'Lenovo', 'Haier', 'Gree', 'Midea', 'Yili', 'Mengniu',
  'Wahaha', 'MasterKong', 'Uni-President', 'NongfuSpring', 'TsingtaoBeer', 'SnowBeer', 'Wuliangye', 'Maotai', 'Anta', 'LiNing',
  'Xtep', '361Degrees', 'Bosideng', 'HLA', 'Youngor', 'Septwolves', 'Semir', 'Metersbonwe', 'Peacebird', 'JNBY',
  'ChowTaiFook', 'LaoFengXiang', 'LiuFuJewelry', 'ChowSangSang', 'ZhouLiuFu', 'ChinaGold', 'ChowTaiSeng', 'ChowTaiFook', 'Caibai', 'Mingpai',
  'ICBC', 'CCB', 'ABC', 'BOC', 'BOCOM', 'CMB', 'CITIC', 'SPDB', 'CIB', 'CMBC',
  'PingAn', 'ChinaLife', 'CPIC', 'PICC', 'NewChinaLife', 'Taikang', 'Yangguang', 'Taiping', 'Anbang', 'ChinaPacific',
  'ChinaMobile', 'ChinaUnicom', 'ChinaTelecom', 'ChinaTower', 'ChinaPost', 'Sinopec', 'CNPC', 'CNOOC', 'StateGrid', 'ChinaSouthernPowerGrid',
  'ChinaRailway', 'AirChina', 'ChinaEastern', 'ChinaSouthern', 'HainanAirlines', 'XiamenAirlines', 'ShenzhenAirlines', 'ShandongAirlines', 'SichuanAirlines', 'SpringAirlines',
  'ChinaStateConstruction', 'ChinaRailwayConstruction', 'ChinaRailwayEngineering', 'ChinaCommunications', 'ChinaMetallurgical', 'PowerChina', 'ChinaEnergyEngineering', 'ChinaChemical', 'ChinaNuclearEngineering', 'CGN'
];

// 生成随机字符串
function generateRandomString(length) {
  return Math.random().toString(36).substring(2, 2 + length);
}

// 生成邮箱
async function generateEmail() {
  let retries = 3;
  
  while (retries > 0) {
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
      
      return {
        success: true,
        email: email,
        password: password
      };
    } catch (error) {
      console.error('Error generating email:', error.response?.data || error.message);
      retries--;
      
      if (retries > 0) {
        console.log(`Retrying... ${retries} attempts left`);
        // 遇到429错误时，增加等待时间
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        return {
          success: false,
          error: error.response?.data?.detail || 'Failed to generate email'
        };
      }
    }
  }
}

// 生成1000个邮箱
async function generateEmails(count) {
  const emails = [];
  let successCount = 0;
  let failCount = 0;
  
  console.log(`开始生成 ${count} 个邮箱...`);
  
  try {
    for (let i = 0; i < count; i++) {
      console.log(`生成第 ${i + 1} 个邮箱`);
      const result = await generateEmail();
      
      if (result.success) {
        emails.push(result);
        successCount++;
        console.log(`成功生成邮箱: ${result.email}`);
      } else {
        failCount++;
        console.log(`生成邮箱失败: ${result.error}`);
      }
      
      // 避免请求过于频繁
      console.log('等待3秒后继续...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`\n生成完成！`);
    console.log(`成功: ${successCount} 个`);
    console.log(`失败: ${failCount} 个`);
    
    // 保存结果到文件
    const fs = require('fs');
    console.log(`准备保存 ${emails.length} 个邮箱到文件...`);
    fs.writeFileSync('generated-emails.json', JSON.stringify(emails, null, 2));
    console.log('结果已保存到 generated-emails.json 文件');
    
    return emails;
  } catch (error) {
    console.error('生成邮箱过程中发生错误:', error);
    // 即使发生错误，也保存已生成的邮箱
    const fs = require('fs');
    console.log(`准备保存 ${emails.length} 个邮箱到文件...`);
    fs.writeFileSync('generated-emails.json', JSON.stringify(emails, null, 2));
    console.log('结果已保存到 generated-emails.json 文件');
    return emails;
  }
}

// 运行脚本
try {
  generateEmails(10).then(emails => {
    console.log(`最终生成了 ${emails.length} 个邮箱`);
  }).catch(error => {
    console.error('脚本运行失败:', error);
  });
} catch (error) {
  console.error('脚本启动失败:', error);
}