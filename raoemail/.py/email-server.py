from flask import Flask, request, jsonify
import smtplib
import imaplib
import email
import sqlite3
import os
from email.mime.text import MIMEText
from email.header import Header, decode_header

app = Flask(__name__)

# 数据库连接
DATABASE = 'database.sqlite'

def init_db():
    """初始化数据库，创建必要的表"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # 创建用户表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # 创建邮件表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')
    
    conn.commit()
    conn.close()

# 初始化数据库
init_db()

# 邮件系统配置（使用 Mailtrap 免费 SMTP 服务器）
# Mailtrap 是一个免费的邮件测试服务，适用于开发和测试环境
SMTP_CONFIG = {
    "host": "smtp.mailtrap.io",  # Mailtrap SMTP服务器地址
    "port": 2525,                # Mailtrap SMTP端口
    "user": "your-mailtrap-username",  # Mailtrap 用户名
    "password": "your-mailtrap-password",  # Mailtrap 密码
    "from_addr": "sender@example.com"  # 发件人地址
}

# 示例：使用腾讯企业邮
# SMTP_CONFIG = {
#     "host": "smtp.exmail.qq.com",  # 腾讯企业邮SMTP服务器地址
#     "port": 465,                     # SMTP端口（SSL：465，非SSL：25）
#     "user": "your-email@your-domain.com",# 发件人邮箱
#     "password": "your-auth-code",    # 邮箱授权码（非登录密码）
#     "from_addr": "your-email@your-domain.com" # 发件人地址
# }
# 
# 示例：使用163邮箱
# SMTP_CONFIG = {
#     "host": "smtp.163.com",  # 163邮箱SMTP服务器地址
#     "port": 465,             # SMTP端口（SSL：465，非SSL：25）
#     "user": "your-email@163.com",# 发件人邮箱
#     "password": "your-auth-code",# 邮箱授权码（非登录密码）
#     "from_addr": "your-email@163.com" # 发件人地址
# }

@app.route('/api/email/send', methods=['POST'])
def send_email():
    try:
        # 获取前端参数
        data = request.get_json()
        to_addr = data.get('to')
        subject = data.get('subject')
        content = data.get('content')

        # 参数校验
        if not all([to_addr, subject, content]):
            return jsonify({"code": 400, "msg": "参数缺失"}), 400

        # 构建邮件内容
        msg = MIMEText(content, 'html', 'utf-8')
        msg['From'] = Header(SMTP_CONFIG['from_addr'], 'utf-8')
        msg['To'] = Header(to_addr, 'utf-8')
        msg['Subject'] = Header(subject, 'utf-8')

        # 连接SMTP服务器发送邮件
        with smtplib.SMTP_SSL(SMTP_CONFIG['host'], SMTP_CONFIG['port']) as smtp:
            smtp.login(SMTP_CONFIG['user'], SMTP_CONFIG['password'])
            smtp.sendmail(SMTP_CONFIG['from_addr'], to_addr, msg.as_string())

        return jsonify({"code": 200, "msg": "邮件发送成功"})
    except smtplib.SMTPException as e:
        return jsonify({"code": 500, "msg": f"SMTP错误：{str(e)}"}), 500
    except Exception as e:
        return jsonify({"code": 500, "msg": f"服务器错误：{str(e)}"}), 500

@app.route('/api/email/inbox', methods=['GET'])
def get_inbox():
    try:
        # 由于 Mailtrap 不支持 IMAP 接收邮件，返回模拟数据
        # 实际生产环境中，需要配置真实的 IMAP 服务器
        mock_emails = [
            {
                "id": "1",
                "from": "support@raoemail.com",
                "subject": "欢迎使用 Raoemail 邮件系统",
                "date": "Thu, 07 Apr 2026 08:00:00 +0000"
            },
            {
                "id": "2",
                "from": "team@raoemail.com",
                "subject": "系统更新通知",
                "date": "Wed, 06 Apr 2026 16:30:00 +0000"
            },
            {
                "id": "3",
                "from": "client@example.com",
                "subject": "项目合作洽谈",
                "date": "Tue, 05 Apr 2026 10:15:00 +0000"
            }
        ]
        return jsonify({"code": 200, "data": mock_emails})
    except Exception as e:
        return jsonify({"code": 500, "msg": f"读取收件箱失败：{str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "timestamp": email.utils.formatdate()})

# 认证 API
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"success": False, "error": "邮箱或密码不能为空"}), 400
        
        # 从数据库验证用户
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, email FROM users WHERE email = ? AND password = ?', (email, password))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify({
                "success": True,
                "token": "jwt-token-" + str(user[0]),
                "user": {"id": user[0], "name": user[1], "email": user[2]}
            })
        else:
            return jsonify({"success": False, "error": "邮箱或密码错误"}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        if not name or not email or not password:
            return jsonify({"success": False, "error": "请填写完整的注册信息"}), 400
        
        # 检查邮箱是否已存在
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            conn.close()
            return jsonify({"success": False, "error": "邮箱已被注册"}), 400
        
        # 插入新用户
        cursor.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', (name, email, password))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "注册成功",
            "user": {"id": user_id, "name": name, "email": email}
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    # 允许跨域（生产环境需限制域名）
    from flask_cors import CORS
    CORS(app, resources=r'/api/*')
    app.run(host='0.0.0.0', port=8080, debug=False)
