const { generateVIPEmails } = require('./src/vip-email');
const fs = require('fs');
const path = require('path');

// 备份目录
const BACKUP_DIR = 'C:\\Users\\Lenovo\\Desktop\\邮件app\\email-signup-app-1\\第一版备份';

// 生成指定数量的VIP邮箱并备份
async function generateAndBackupVIPEmails(count) {
  try {
    console.log(`开始生成 ${count} 个VIP邮箱...`);
    const emails = await generateVIPEmails(count);
    console.log(`成功生成了 ${emails.length} 个VIP邮箱`);
    
    // 生成备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `vip-emails-${timestamp}.json`;
    const backupFilePath = path.join(BACKUP_DIR, backupFileName);
    
    // 保存备份
    fs.writeFileSync(backupFilePath, JSON.stringify(emails, null, 2));
    console.log(`已备份到: ${backupFilePath}`);
    
    // 同时保存为CSV格式
    const csvFilePath = path.join(BACKUP_DIR, `vip-emails-${timestamp}.csv`);
    const csvContent = emails.map(email => `${email.email},${email.password},${email.type}`).join('\n');
    fs.writeFileSync(csvFilePath, 'Email,Password,Type\n' + csvContent);
    console.log(`已备份为CSV格式到: ${csvFilePath}`);
    
    return emails;
  } catch (error) {
    console.error('生成VIP邮箱失败:', error);
    throw error;
  }
}

// 获取命令行参数
const args = process.argv.slice(2);
const count = parseInt(args[0]) || 10;

generateAndBackupVIPEmails(count).catch(console.error);