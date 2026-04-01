// 测试文件写入功能
const fs = require('fs');

// 测试数据
const testData = [
  {
    success: true,
    email: 'test1@example.com',
    password: '000000'
  },
  {
    success: true,
    email: 'test2@example.com',
    password: '000000'
  }
];

console.log('准备写入测试数据...');
fs.writeFileSync('test-emails.json', JSON.stringify(testData, null, 2));
console.log('测试数据已保存到 test-emails.json 文件');

// 读取文件验证
const readData = fs.readFileSync('test-emails.json', 'utf8');
console.log('读取的文件内容:', readData);