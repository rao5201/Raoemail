import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import AdminLogin from './admin/Login'
import AdminDashboard from './admin/Dashboard'

function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPath, setAdminPath] = useState('')

  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/admin')) {
      setIsAdmin(true)
      setAdminPath(path)
    }
  }, [])
  const [emailData, setEmailData] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [composeEmail, setComposeEmail] = useState(false)
  const [newEmail, setNewEmail] = useState({ to: '', subject: '', body: '' })
  const [savedEmails, setSavedEmails] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [fileToUpload, setFileToUpload] = useState(null)
  const [emailNotes, setEmailNotes] = useState({})
  const [qrcodeData, setQrcodeData] = useState('')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [showLogin, setShowLogin] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [aiSettings, setAiSettings] = useState({
    autoReply: false,
    autoSend: false,
    aiAssistant: true
  })
  const qrcodeRef = useRef(null)

  // Create new email
  const createEmail = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/create-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      if (data.success) {
        setEmailData({
          email: data.email,
          password: data.password,
          token: data.token
        })
        // Fetch initial messages
        fetchMessages(data.token)
      } else {
        setError(data.error || '创建邮箱失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // Fetch messages
  const fetchMessages = async (token = emailData?.token) => {
    if (!token) return
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(emailData.email)}?token=${token}`)
      const data = await response.json()
      if (data.success) {
        // Sort messages by createdAt in descending order
        const sortedMessages = data.messages.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
        setMessages(sortedMessages)
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  // View message
  const viewMessage = async (messageId) => {
    try {
      const response = await fetch(`/api/message/${messageId}?token=${emailData.token}`)
      const data = await response.json()
      if (data.success) {
        setSelectedMessage(data.message)
      }
    } catch (err) {
      console.error('Failed to fetch message:', err)
    }
  }

  // Delete email
  const deleteEmail = async () => {
    if (!confirm('确定要删除这个邮箱吗？')) return
    try {
      const response = await fetch(`/api/delete-email/${encodeURIComponent(emailData.email)}?token=${emailData.token}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        setEmailData(null)
        setMessages([])
        setSelectedMessage(null)
        setSavedEmails([])
        setUploadedFiles([])
      }
    } catch (err) {
      console.error('Failed to delete email:', err)
    }
  }

  // Refresh messages
  const refreshMessages = () => {
    if (emailData?.token) {
      fetchMessages()
    }
  }

  // Save email
  const saveEmail = (message) => {
    setSavedEmails([...savedEmails, message])
    alert('邮件已保存')
  }

  // Add note to email
  const addNoteToEmail = (messageId, note) => {
    setEmailNotes(prev => ({
      ...prev,
      [messageId]: note
    }))
    alert('备注已添加')
  }

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFileToUpload(file)
      // Simulate upload success
      setTimeout(() => {
        setUploadedFiles([...uploadedFiles, {
          id: Date.now(),
          name: file.name,
          size: file.size,
          type: file.type
        }])
        setFileToUpload(null)
        alert('文件上传成功')
      }, 1000)
    }
  }

  // Send email
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const sendEmail = async () => {
    if (!newEmail.to || !newEmail.subject || !newEmail.body) {
      alert('请填写所有必填字段')
      return
    }

    setSending(true)
    setSendError('')
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: newEmail.to,
          subject: newEmail.subject,
          body: newEmail.body,
          token: emailData.token
        })
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`邮件已成功发送至: ${newEmail.to}`)
        setNewEmail({ to: '', subject: '', body: '' })
        setComposeEmail(false)
      } else {
        setSendError(data.error || '发送邮件失败')
        alert(`发送失败: ${data.error || '发送邮件失败'}`)
      }
    } catch (err) {
      setSendError('网络错误，请稍后重试')
      alert('网络错误，请稍后重试')
    } finally {
      setSending(false)
    }
  }

  // Generate QR code
  const generateQRCode = (email, password) => {
    const data = `Raoemail Login\nWebsite: https://rao5201.github.io/Raoemail/\nEmail: ${email}\nPassword: ${password}`
    setQrcodeData(data)
  }

  // Update QR code when email data changes
  useEffect(() => {
    if (emailData) {
      generateQRCode(emailData.email, emailData.password)
    }
  }, [emailData])

  // Generate QR code on canvas when qrcodeData changes
  useEffect(() => {
    if (qrcodeData && qrcodeRef.current) {
      QRCode.toCanvas(qrcodeRef.current, qrcodeData, {
        width: 128,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) {
          console.error('Failed to generate QR code:', error)
        }
      })
    }
  }, [qrcodeData])

  // Login to existing email
  const login = async () => {
    if (!loginForm.email || !loginForm.password) {
      setLoginError('请输入邮箱和密码')
      return
    }

    setLoading(true)
    setLoginError('')
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setEmailData({
          email: data.email,
          password: loginForm.password,
          token: data.token
        })
        setShowLogin(false)
        setLoginForm({ email: '', password: '' })
        // Fetch initial messages
        fetchMessages(data.token)
      } else {
        setLoginError(data.error || '登录失败')
      }
    } catch (err) {
      setLoginError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (isAdmin) {
    if (adminPath === '/admin/login') {
      return <AdminLogin />
    } else {
      return <AdminDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">
            📧 Raoemail
          </h1>
          <p className="text-gray-600">
            免费注册电子邮件，保护您的隐私
          </p>
          <p className="text-gray-500 text-sm mt-1">
            运营方：武穴茶海虾王电子商务中心 | 技术支持：rao5201@126.com
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!emailData ? (
            showLogin ? (
              /* Login Section */
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="mb-6">
                  <div className="text-6xl mb-4">🔐</div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    登录您的邮箱
                  </h2>
                  <p className="text-gray-600">
                    使用您已有的邮箱地址和密码登录
                  </p>
                </div>
                
                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {loginError}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="请输入邮箱地址"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="请输入密码"
                    />
                  </div>
                  <button
                    onClick={login}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 
                             text-white font-semibold py-3 px-8 rounded-xl 
                             transition-all duration-200 w-full"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full inline-block mr-2"></div>
                        登录中...
                      </>
                    ) : (
                      '🔓 登录'
                    )}
                  </button>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowLogin(false)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    没有账号？立即创建
                  </button>
                </div>
              </div>
            ) : (
              /* Create Email Section */
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="mb-6">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    创建您的免费邮箱
                  </h2>
                  <p className="text-gray-600">
                    立即获取一个可用的邮箱地址，无需注册
                  </p>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}

                <button
                  onClick={createEmail}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 
                           text-white font-semibold py-4 px-8 rounded-xl 
                           transition-all duration-200 transform hover:scale-105
                           flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      创建中...
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      立即创建邮箱
                    </>
                  )}
                </button>

                <div className="mt-6">
                  <button
                    onClick={() => setShowLogin(true)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    已有账号？立即登录
                  </button>
                </div>

                <div className="mt-8 text-left bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">✨ 功能特点：</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>✅ 完全免费，无需注册</li>
                    <li>✅ 即时接收邮件</li>
                    <li>✅ 可用于网站验证</li>
                    <li>✅ 保护隐私，避免垃圾邮件</li>
                    <li>✅ 支持编写和发送邮件</li>
                    <li>✅ 支持上传和保存资料</li>
                    <li>✅ 支持保存重要邮件</li>
                  </ul>
                </div>
              </div>
            )
          ) : (
            /* Email Dashboard */
            <div className="space-y-6">
              {/* Email Info Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">
                      您的邮箱地址
                    </h2>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                      <p className="text-2xl font-mono text-indigo-900 break-all">
                        {emailData.email}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        密码：{emailData.password}
                      </p>
                    </div>
                    
                    {/* QR Code */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        📱 扫码登录
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <canvas ref={qrcodeRef} className="w-32 h-32" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600">
                            扫描二维码获取邮箱信息，方便在手机上登录
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => setComposeEmail(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white 
                               font-medium py-2 px-4 rounded-lg transition-colors
                               text-sm"
                    >
                      ✏️ 编写邮件
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="bg-gray-600 hover:bg-gray-700 text-white 
                               font-medium py-2 px-4 rounded-lg transition-colors
                               text-sm"
                    >
                      ⚙️ 设置
                    </button>
                    <button
                      onClick={deleteEmail}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      🗑️ 删除邮箱
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={refreshMessages}
                    className="bg-green-600 hover:bg-green-700 text-white 
                             font-medium py-2 px-4 rounded-lg transition-colors
                             flex items-center gap-2"
                  >
                    🔄 刷新邮件
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(emailData.email)
                      alert('邮箱已复制到剪贴板！')
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white 
                             font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    📋 复制邮箱
                  </button>
                  <button
                    onClick={() => document.getElementById('file-upload').click()}
                    className="bg-purple-600 hover:bg-purple-700 text-white 
                             font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    📁 上传文件
                  </button>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    📁 已上传文件 ({uploadedFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{file.name}</p>
                          <p className="text-gray-500 text-xs">{file.size} bytes</p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          📥 下载
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages List */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  📬 收件箱 ({messages.length})
                </h3>
                
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📭</div>
                    <p>暂无邮件，点击刷新或等待新邮件</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => viewMessage(msg.id)}
                        className="border border-gray-200 rounded-lg p-4 
                                 hover:bg-indigo-50 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {msg.from?.name || msg.from?.address}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              {msg.subject}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Emails */}
              {savedEmails.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    💾 已保存邮件 ({savedEmails.length})
                  </h3>
                  <div className="space-y-2">
                    {savedEmails.map((msg, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedMessage(msg)}
                        className="border border-gray-200 rounded-lg p-4 
                                 hover:bg-indigo-50 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {msg.from?.name || msg.from?.address}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              {msg.subject}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Message View */}
              {selectedMessage && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      📄 邮件详情
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEmail(selectedMessage)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        💾 保存邮件
                      </button>
                      <button
                        onClick={async () => {
                          alert('AI 正在生成回复内容...');
                          try {
                            const response = await fetch('/api/ai/generate-reply', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                originalEmail: selectedMessage,
                                style: 'professional',
                                language: 'zh'
                              })
                            });
                            const data = await response.json();
                            if (data.success) {
                              setNewEmail({
                                to: selectedMessage.from?.address || '',
                                subject: `Re: ${selectedMessage.subject || ''}`,
                                body: data.content
                              });
                              setComposeEmail(true);
                              alert('AI 回复内容生成完成！');
                            } else {
                              alert('AI 回复生成失败：' + data.error);
                            }
                          } catch (error) {
                            console.error('Error generating reply:', error);
                            alert('网络错误，请稍后重试');
                          }
                        }}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        🤖 AI 回复
                      </button>
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        ✕ 关闭
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">发件人：</span>
                      <span className="text-gray-800">
                        {selectedMessage.from?.name || selectedMessage.from?.address}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">主题：</span>
                      <span className="text-gray-800">{selectedMessage.subject}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">时间：</span>
                      <span className="text-gray-800">
                        {new Date(selectedMessage.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedMessage.html || selectedMessage.text }}
                      />
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">备注</h4>
                      <textarea
                        value={emailNotes[selectedMessage.id] || ''}
                        onChange={(e) => setEmailNotes(prev => ({
                          ...prev,
                          [selectedMessage.id]: e.target.value
                        }))}
                        placeholder="添加备注..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                      <button
                        onClick={() => addNoteToEmail(selectedMessage.id, emailNotes[selectedMessage.id] || '')}
                        className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        保存备注
                      </button>
                      {emailNotes[selectedMessage.id] && (
                        <p className="mt-2 text-sm text-gray-600">
                          已添加备注: {emailNotes[selectedMessage.id]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Compose Email */}
              {composeEmail && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      ✏️ 编写邮件
                    </h3>
                    <button
                      onClick={() => setComposeEmail(false)}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      ✕ 关闭
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">收件人</label>
                      <input
                        type="email"
                        value={newEmail.to}
                        onChange={(e) => setNewEmail({...newEmail, to: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="请输入收件人邮箱"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">主题</label>
                      <input
                        type="text"
                        value={newEmail.subject}
                        onChange={(e) => setNewEmail({...newEmail, subject: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="请输入邮件主题"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">内容</label>
                        <button
                          onClick={async () => {
                            alert('AI 正在生成邮件内容...');
                            try {
                              const response = await fetch('/api/ai/generate-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  subject: newEmail.subject,
                                  to: newEmail.to,
                                  style: 'professional',
                                  language: 'zh'
                                })
                              });
                              const data = await response.json();
                              if (data.success) {
                                setNewEmail({
                                  ...newEmail,
                                  body: data.content
                                });
                                alert('AI 邮件内容生成完成！');
                              } else {
                                alert('AI 邮件生成失败：' + data.error);
                              }
                            } catch (error) {
                              console.error('Error generating email:', error);
                              alert('网络错误，请稍后重试');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          🤖 AI 生成
                        </button>
                      </div>
                      <textarea
                        value={newEmail.body}
                        onChange={(e) => setNewEmail({...newEmail, body: e.target.value})}
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="请输入邮件内容"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">附件</label>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={sendEmail}
                        disabled={sending}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400
                                 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                      >
                        {sending ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2"></div>
                            发送中...
                          </>
                        ) : (
                          '📤 发送邮件'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings */}
              {showSettings && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      ⚙️ 设置
                    </h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      ✕ 关闭
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-4">
                        🤖 AI 功能
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-800">自动回复邮件</h5>
                            <p className="text-sm text-gray-600">AI 会自动回复收到的邮件</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={aiSettings.autoReply}
                              onChange={(e) => setAiSettings({...aiSettings, autoReply: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-800">自动发送邮件</h5>
                            <p className="text-sm text-gray-600">AI 会根据你的指令自动发送邮件</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={aiSettings.autoSend}
                              onChange={(e) => setAiSettings({...aiSettings, autoSend: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-800">AI 助手</h5>
                            <p className="text-sm text-gray-600">启用 AI 助手帮助你管理邮箱</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={aiSettings.aiAssistant}
                              onChange={(e) => setAiSettings({...aiSettings, aiAssistant: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-4">
                        📧 邮箱设置
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
                          <input
                            type="email"
                            value={emailData?.email || ''}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                          <input
                            type="password"
                            value={emailData?.password || ''}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-4">
                        🤖 AI 邮件写作工具
                      </h4>
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-4">
                          使用 AI 即时生成专业邮件 - 适用于商务、个人和营销邮件
                        </p>
                        
                        <div className="space-y-4 mb-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">邮件类型 *</label>
                            <select
                              id="email-type"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="business">商务邮件</option>
                              <option value="personal">个人邮件</option>
                              <option value="marketing">营销邮件</option>
                              <option value="inquiry">询问邮件</option>
                              <option value="follow-up">跟进邮件</option>
                              <option value="introduction">介绍邮件</option>
                              <option value="thank-you">感谢信</option>
                              <option value="apology">道歉信</option>
                              <option value="announcement">公告邮件</option>
                              <option value="invitation">邀请邮件</option>
                              <option value="complaint">投诉邮件</option>
                              <option value="job-application">求职申请</option>
                              <option value="newsletter">电子报</option>
                              <option value="cold-outreach">冷启动开发邮件</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">收件人 *</label>
                            <input
                              id="recipient"
                              type="text"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="输入收件人姓名（例如：张三）"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">发件人（可选）</label>
                            <input
                              id="sender"
                              type="text"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="输入你的姓名"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">邮件主题 *</label>
                            <input
                              id="email-subject"
                              type="text"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="输入邮件主题"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">邮件目的 *</label>
                            <textarea
                              id="email-purpose"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="描述你的邮件目的（例如：请求会议、跟进提案）"
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">语气</label>
                            <select
                              id="email-tone"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="formal">正式</option>
                              <option value="professional">专业</option>
                              <option value="friendly">友好</option>
                              <option value="casual">随意</option>
                              <option value="enthusiastic">热情</option>
                              <option value="persuasive">说服性</option>
                              <option value="empathetic">同理心</option>
                              <option value="direct">直接</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">附加信息（可选）</label>
                            <textarea
                              id="additional-info"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="添加任何具体细节、要求或背景信息"
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={async () => {
                              alert('AI 正在生成邮件...');
                              try {
                                // 获取表单数据
                                const emailType = document.getElementById('email-type')?.value || 'business';
                                const recipient = document.getElementById('recipient')?.value || '收件人';
                                const sender = document.getElementById('sender')?.value || '';
                                const subject = document.getElementById('email-subject')?.value || '邮件主题';
                                const purpose = document.getElementById('email-purpose')?.value || '邮件目的';
                                const tone = document.getElementById('email-tone')?.value || 'professional';
                                const additionalInfo = document.getElementById('additional-info')?.value || '';
                                
                                const response = await fetch('/api/ai/write-email', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    emailType,
                                    recipient,
                                    sender,
                                    subject,
                                    purpose,
                                    tone,
                                    additionalInfo
                                  })
                                });
                                
                                const data = await response.json();
                                if (data.success) {
                                  // 将生成的邮件内容填充到邮件编写页面
                                  setNewEmail({
                                    to: '',
                                    subject: subject,
                                    body: data.content
                                  });
                                  setComposeEmail(true);
                                  alert('AI 邮件生成完成！');
                                } else {
                                  alert('AI 邮件生成失败：' + data.error);
                                }
                              } catch (error) {
                                console.error('Error generating email:', error);
                                alert('网络错误，请稍后重试');
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                          >
                            生成邮件
                          </button>
                          <button
                            onClick={() => {
                              // 清空表单
                              document.querySelectorAll('input, textarea, select').forEach(element => {
                                if (element.type !== 'submit' && element.type !== 'button') {
                                  element.value = '';
                                }
                              });
                              alert('表单已清空');
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                          >
                            清空表单
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h5 className="font-medium text-gray-800 mb-3">强大的AI邮件写作功能</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border border-gray-200 rounded-lg p-3">
                            <div className="text-xl mb-2">🤖</div>
                            <h6 className="font-medium text-gray-800 mb-1">AI驱动生成</h6>
                            <p className="text-xs text-gray-600">先进的AI技术创建专业、符合情境的邮件，满足你的需求</p>
                          </div>
                          <div className="border border-gray-200 rounded-lg p-3">
                            <div className="text-xl mb-2">📧</div>
                            <h6 className="font-medium text-gray-800 mb-1">多种邮件类型</h6>
                            <p className="text-xs text-gray-600">支持商务、个人、营销、询问、跟进等多种邮件类型</p>
                          </div>
                          <div className="border border-gray-200 rounded-lg p-3">
                            <div className="text-xl mb-2">🎭</div>
                            <h6 className="font-medium text-gray-800 mb-1">可定制语气</h6>
                            <p className="text-xs text-gray-600">从正式、专业、友好、随意等多种语气中选择，匹配你的沟通风格</p>
                          </div>
                          <div className="border border-gray-200 rounded-lg p-3">
                            <div className="text-xl mb-2">⚡</div>
                            <h6 className="font-medium text-gray-800 mb-1">即时生成</h6>
                            <p className="text-xs text-gray-600">几秒钟内创建专业邮件，节省你的时间和精力</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>© 2024 Raoemail | 运营方：武穴茶海虾王电子商务中心</p>
          <p className="mt-1">技术支持服务联系：rao5201@126.com</p>
        </footer>
      </div>
    </div>
  )
}

export default App
