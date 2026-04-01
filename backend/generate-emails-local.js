// 直接生成1000个邮箱地址，不调用API
const fs = require('fs');

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
function generateEmail() {
  // 随机选择一个品牌
  const brand = chineseBrands[Math.floor(Math.random() * chineseBrands.length)];
  
  // 生成随机字符串作为用户名的一部分
  const randomStr = generateRandomString(8);
  
  // 构建邮箱地址
  const username = `${brand}_${randomStr}`;
  const email = `${username}@example.com`;
  const password = '000000';
  
  return {
    success: true,
    email: email,
    password: password
  };
}

// 生成1000个邮箱
function generateEmails(count) {
  const emails = [];
  
  console.log(`开始生成 ${count} 个邮箱...`);
  
  for (let i = 0; i < count; i++) {
    if (i % 100 === 0) {
      console.log(`已生成 ${i} 个邮箱`);
    }
    const result = generateEmail();
    emails.push(result);
  }
  
  console.log(`
生成完成！`);
  console.log(`成功生成了 ${emails.length} 个邮箱`);
  
  // 保存结果到文件
  console.log(`准备保存 ${emails.length} 个邮箱到文件...`);
  fs.writeFileSync('generated-emails.json', JSON.stringify(emails, null, 2));
  console.log('结果已保存到 generated-emails.json 文件');
  
  return emails;
}

// 运行脚本
try {
  generateEmails(1000);
} catch (error) {
  console.error('脚本运行失败:', error);
}