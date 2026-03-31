import { useState } from 'react'

function App() {
  const [emailData, setEmailData] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)

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
        setMessages(data.messages)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">
            📧 免费邮箱注册
          </h1>
          <p className="text-gray-600">
            一键创建临时邮箱，用于注册、验证等场景
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!emailData ? (
            /* Create Email Section */
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  创建您的免费临时邮箱
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

              <div className="mt-8 text-left bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">✨ 功能特点：</h3>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>✅ 完全免费，无需注册</li>
                  <li>✅ 即时接收邮件</li>
                  <li>✅ 可用于网站验证</li>
                  <li>✅ 保护隐私，避免垃圾邮件</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Email Dashboard */
            <div className="space-y-6">
              {/* Email Info Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">
                      您的邮箱地址
                    </h2>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <p className="text-2xl font-mono text-indigo-900 break-all">
                        {emailData.email}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        密码：{emailData.password}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={deleteEmail}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    删除邮箱
                  </button>
                </div>

                <div className="flex gap-3">
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
                </div>
              </div>

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

              {/* Selected Message View */}
              {selectedMessage && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      📄 邮件详情
                    </h3>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      ✕ 关闭
                    </button>
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
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Mail.tm API | 开源项目</p>
        </footer>
      </div>
    </div>
  )
}

export default App
