const { generateVIPEmails } = require('./src/vip-email');

// 生成10000个VIP邮箱
async function main() {
  try {
    console.log('开始生成10000个VIP邮箱...');
    const emails = await generateVIPEmails(10000);
    console.log(`成功生成了 ${emails.length} 个VIP邮箱`);
  } catch (error) {
    console.error('生成VIP邮箱失败:', error);
  }
}

main();