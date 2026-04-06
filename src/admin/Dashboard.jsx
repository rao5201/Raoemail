import { useState, useEffect } from 'react'

function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        window.location.href = '/admin/login'
        return
      }

      try {
        const response = await fetch('/api/admin/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminRole')
          window.location.href = '/admin/login'
          return
        }

        const data = await response.json()
        setUser(data.user)
      } catch (err) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminRole')
        window.location.href = '/admin/login'
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminRole')
    window.location.href = '/admin/login'
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent user={user} />
      case 'users':
        return <UsersContent />
      case 'customer-emails':
        return <CustomerEmailsContent />
      case 'articles':
        return <ArticlesContent />
      case 'files':
        return <FilesContent />
      case 'analytics':
        return <AnalyticsContent />
      case 'suppliers':
        return <SuppliersContent />
      case 'products':
        return <ProductsContent />
      case 'finance':
        return <FinanceContent />
      default:
        return <DashboardContent user={user} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">后台管理系统</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              user?.role === 'admin' ? 'bg-red-100 text-red-800' :
              user?.role === '客服' ? 'bg-blue-100 text-blue-800' :
              user?.role === '财务' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-2">
              <NavItem 
                label="仪表盘" 
                icon="📊" 
                active={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
              />
              <NavItem 
                label="用户管理" 
                icon="👥" 
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
                show={user?.role === 'admin'}
              />
              <NavItem 
                label="客户邮箱" 
                icon="📧" 
                active={activeTab === 'customer-emails'}
                onClick={() => setActiveTab('customer-emails')}
                show={user?.role === 'admin'}
              />
              <NavItem 
                label="文章管理" 
                icon="📝" 
                active={activeTab === 'articles'}
                onClick={() => setActiveTab('articles')}
                show={user?.role === 'admin' || user?.role === '客服'}
              />
              <NavItem 
                label="文件管理" 
                icon="📁" 
                active={activeTab === 'files'}
                onClick={() => setActiveTab('files')}
                show={user?.role === 'admin' || user?.role === '客服'}
              />
              <NavItem 
                label="用户分析" 
                icon="📈" 
                active={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
                show={user?.role === 'admin' || user?.role === '财务'}
              />
              <NavItem 
                label="供应商管理" 
                icon="🏪" 
                active={activeTab === 'suppliers'}
                onClick={() => setActiveTab('suppliers')}
                show={user?.role === 'admin'}
              />
              <NavItem 
                label="产品管理" 
                icon="🛍️" 
                active={activeTab === 'products'}
                onClick={() => setActiveTab('products')}
                show={user?.role === 'admin'}
              />
              <NavItem 
                label="财务管理" 
                icon="💰" 
                active={activeTab === 'finance'}
                onClick={() => setActiveTab('finance')}
                show={user?.role === 'admin' || user?.role === '财务'}
              />
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Navigation Item Component
function NavItem({ label, icon, active, onClick, show = true }) {
  if (!show) return null
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
        active ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-gray-700'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// Dashboard Content
function DashboardContent({ user }) {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalArticles: 0,
    totalFiles: 0,
    totalSales: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setDashboardData(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">仪表盘</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="总用户数" value={dashboardData.totalUsers.toString()} icon="👥" color="blue" />
        <StatCard title="文章数量" value={dashboardData.totalArticles.toString()} icon="📝" color="green" />
        <StatCard title="文件数量" value={dashboardData.totalFiles.toString()} icon="📁" color="purple" />
        <StatCard title="销售总额" value={`¥${dashboardData.totalSales.toLocaleString()}`} icon="💰" color="orange" />
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">最近活动</h3>
        <div className="space-y-4">
          <ActivityItem user="admin" action="创建了新文章" time="2小时前" />
          <ActivityItem user="客服" action="上传了新文件" time="4小时前" />
          <ActivityItem user="用户" action="注册了新账号" time="6小时前" />
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800'
  }

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

// Activity Item Component
function ActivityItem({ user, action, time }) {
  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
      <div className="bg-gray-100 rounded-full p-2">
        <span className="text-gray-600">👤</span>
      </div>
      <div className="flex-1">
        <p className="text-gray-800"><span className="font-medium">{user}</span> {action}</p>
        <p className="text-gray-500 text-sm">{time}</p>
      </div>
    </div>
  )
}

// Users Content
function UsersContent() {
  const [users, setUsers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'user' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      })
      const data = await response.json()
      if (data.success) {
        setUsers([...users, data.user])
        setNewUser({ email: '', password: '', name: '', role: 'user' })
        setShowAddForm(false)
        alert('用户添加成功')
      }
    } catch (err) {
      console.error('Failed to add user:', err)
      alert('添加用户失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(currentUser)
      })
      const data = await response.json()
      if (data.success) {
        setUsers(users.map(user => user.id === data.user.id ? data.user : user))
        setShowEditForm(false)
        setCurrentUser(null)
        alert('用户更新成功')
      }
    } catch (err) {
      console.error('Failed to update user:', err)
      alert('更新用户失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('确定要删除这个用户吗？')) return
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setUsers(users.filter(user => user.id !== userId))
        alert('用户删除成功')
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
      alert('删除用户失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">用户管理</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          {showAddForm ? '取消' : '添加用户'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">添加新用户</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入邮箱"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入密码"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="admin">管理员</option>
                <option value="客服">客服</option>
                <option value="财务">财务</option>
                <option value="user">普通用户</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
              >
                {loading ? '提交中...' : '提交'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditForm && currentUser && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">编辑用户</h3>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input
                type="email"
                value={currentUser.email}
                onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入邮箱"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <input
                type="text"
                value={currentUser.name}
                onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select
                value={currentUser.role}
                onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="admin">管理员</option>
                <option value="客服">客服</option>
                <option value="财务">财务</option>
                <option value="user">普通用户</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false)
                  setCurrentUser(null)
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
              >
                {loading ? '提交中...' : '提交'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p>暂无用户数据</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-medium text-gray-800">{user.name || '未命名用户'}</p>
                <p className="text-gray-600 text-sm">{user.email}</p>
                <p className="text-gray-500 text-xs">角色：{user.role}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setCurrentUser(user)
                    setShowEditForm(true)
                  }}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm"
                >
                  编辑
                </button>
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                >
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Articles Content
function ArticlesContent() {
  const [articles, setArticles] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newArticle, setNewArticle] = useState({ title: '', content: '', category: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/articles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setArticles(data.articles)
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err)
    }
  }

  const handleAddArticle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newArticle)
      })
      const data = await response.json()
      if (data.success) {
        setArticles([...articles, data.article])
        setNewArticle({ title: '', content: '', category: '' })
        setShowAddForm(false)
        alert('文章添加成功')
      }
    } catch (err) {
      console.error('Failed to add article:', err)
      alert('添加文章失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">文章管理</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          {showAddForm ? '取消' : '添加文章'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">添加新文章</h3>
          <form onSubmit={handleAddArticle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input
                type="text"
                value={newArticle.title}
                onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入文章标题"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
              <textarea
                value={newArticle.content}
                onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入文章内容"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <input
                type="text"
                value={newArticle.category}
                onChange={(e) => setNewArticle({...newArticle, category: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入文章分类"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
              >
                {loading ? '提交中...' : '提交'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {articles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>暂无文章，点击添加文章按钮创建</p>
          </div>
        ) : (
          articles.map((article) => (
            <div key={article.id} className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">{article.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{article.content.substring(0, 100)}...</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">状态：{article.status}</span>
                <div className="flex gap-2">
                  <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm">编辑</button>
                  <button className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm">删除</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Files Content
function FilesContent() {
  const [files, setFiles] = useState([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [newFile, setNewFile] = useState({ name: '', path: '', size: 0, type: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/files', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setFiles(data.files)
      }
    } catch (err) {
      console.error('Failed to fetch files:', err)
    }
  }

  const handleUploadFile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newFile)
      })
      const data = await response.json()
      if (data.success) {
        setFiles([...files, data.file])
        setNewFile({ name: '', path: '', size: 0, type: '' })
        setShowUploadForm(false)
        alert('文件上传成功')
      }
    } catch (err) {
      console.error('Failed to upload file:', err)
      alert('上传文件失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">文件管理</h2>
        <button 
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          {showUploadForm ? '取消' : '上传文件'}
        </button>
      </div>

      {showUploadForm && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">上传新文件</h3>
          <form onSubmit={handleUploadFile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">文件名称</label>
              <input
                type="text"
                value={newFile.name}
                onChange={(e) => setNewFile({...newFile, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入文件名称"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">文件路径</label>
              <input
                type="text"
                value={newFile.path}
                onChange={(e) => setNewFile({...newFile, path: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入文件路径"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">文件大小 (字节)</label>
              <input
                type="number"
                value={newFile.size}
                onChange={(e) => setNewFile({...newFile, size: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入文件大小"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">文件类型</label>
              <input
                type="text"
                value={newFile.type}
                onChange={(e) => setNewFile({...newFile, type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入文件类型"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
              >
                {loading ? '上传中...' : '上传'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📁</div>
            <p>暂无文件，点击上传文件按钮添加</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="flex justify-between items-center p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-gray-600 text-sm">{file.size} bytes</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm">下载</button>
                <button className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm">删除</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Analytics Content
function AnalyticsContent() {
  const [users, setUsers] = useState([])
  const [userStats, setUserStats] = useState({
    total: 0,
    byRole: {},
    recentRegistrations: []
  })

  useEffect(() => {
    fetchUserAnalytics()
  }, [])

  const fetchUserAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
        
        // Calculate statistics
        const stats = {
          total: data.users.length,
          byRole: {},
          recentRegistrations: []
        }
        
        // Count users by role
        data.users.forEach(user => {
          stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1
        })
        
        // Get recent registrations
        stats.recentRegistrations = data.users
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
        
        setUserStats(stats)
      }
    } catch (err) {
      console.error('Failed to fetch user analytics:', err)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">用户分析</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">总用户数</h3>
          <p className="text-2xl font-bold text-blue-900">{userStats.total}</p>
        </div>
        {Object.entries(userStats.byRole).map(([role, count]) => (
          <div key={role} className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 mb-2">{role}用户</h3>
            <p className="text-2xl font-bold text-green-900">{count}</p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">用户注册趋势</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">图表区域</p>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">用户角色分布</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">图表区域</p>
          </div>
        </div>
      </div>
      
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">最近注册用户</h3>
        <div className="space-y-3">
          {userStats.recentRegistrations.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>暂无最近注册用户</p>
            </div>
          ) : (
            userStats.recentRegistrations.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{user.name || '未命名用户'}</p>
                  <p className="text-gray-600 text-sm">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                  <p className={`text-xs px-2 py-1 rounded ${user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === '客服' ? 'bg-blue-100 text-blue-800' : user.role === '财务' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.role}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Suppliers Content
function SuppliersContent() {
  const [activeTab, setActiveTab] = useState('list')
  const [suppliers, setSuppliers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentSupplier, setCurrentSupplier] = useState(null)
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', email: '', phone: '', address: '', status: 'active' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'list' || activeTab === 'analytics') {
      fetchSuppliers()
    }
  }, [activeTab])

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setSuppliers(data.suppliers)
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
    }
  }

  const handleAddSupplier = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSupplier)
      })
      const data = await response.json()
      if (data.success) {
        setSuppliers([...suppliers, data.supplier])
        setNewSupplier({ name: '', contact: '', email: '', phone: '', address: '', status: 'active' })
        setShowAddForm(false)
        alert('供应商添加成功')
      }
    } catch (err) {
      console.error('Failed to add supplier:', err)
      alert('添加供应商失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSupplier = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/suppliers/${currentSupplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(currentSupplier)
      })
      const data = await response.json()
      if (data.success) {
        setSuppliers(suppliers.map(supplier => supplier.id === data.supplier.id ? data.supplier : supplier))
        setShowEditForm(false)
        setCurrentSupplier(null)
        alert('供应商更新成功')
      }
    } catch (err) {
      console.error('Failed to update supplier:', err)
      alert('更新供应商失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSupplier = async (supplierId) => {
    if (!confirm('确定要删除这个供应商吗？')) return
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setSuppliers(suppliers.filter(supplier => supplier.id !== supplierId))
        alert('供应商删除成功')
      }
    } catch (err) {
      console.error('Failed to delete supplier:', err)
      alert('删除供应商失败')
    } finally {
      setLoading(false)
    }
  }

  const getSupplierStats = () => {
    const stats = {
      total: suppliers.length,
      active: suppliers.filter(s => s.status === 'active').length,
      inactive: suppliers.filter(s => s.status === 'inactive').length,
      byProductCount: suppliers.map(s => ({
        name: s.name,
        productCount: s.Products?.length || 0
      })).sort((a, b) => b.productCount - a.productCount)
    }
    return stats
  }

  const stats = getSupplierStats()

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">供应商管理</h2>
      
      <div className="flex border-b mb-6">
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 ${activeTab === 'list' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          供应商列表
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 ${activeTab === 'analytics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          供应商分析
        </button>
      </div>

      {activeTab === 'list' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-700">供应商列表</h3>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              {showAddForm ? '取消' : '添加供应商'}
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white border rounded-lg p-6 mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-4">添加新供应商</h4>
              <form onSubmit={handleAddSupplier} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">供应商名称</label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入供应商名称"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                  <input
                    type="text"
                    value={newSupplier.contact}
                    onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入联系人"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入邮箱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入电话"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                  <textarea
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入地址"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={newSupplier.status}
                    onChange={(e) => setNewSupplier({...newSupplier, status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">活跃</option>
                    <option value="inactive">非活跃</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                  >
                    {loading ? '提交中...' : '提交'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showEditForm && currentSupplier && (
            <div className="bg-white border rounded-lg p-6 mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-4">编辑供应商</h4>
              <form onSubmit={handleEditSupplier} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">供应商名称</label>
                  <input
                    type="text"
                    value={currentSupplier.name}
                    onChange={(e) => setCurrentSupplier({...currentSupplier, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入供应商名称"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                  <input
                    type="text"
                    value={currentSupplier.contact}
                    onChange={(e) => setCurrentSupplier({...currentSupplier, contact: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入联系人"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input
                    type="email"
                    value={currentSupplier.email}
                    onChange={(e) => setCurrentSupplier({...currentSupplier, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入邮箱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                  <input
                    type="text"
                    value={currentSupplier.phone}
                    onChange={(e) => setCurrentSupplier({...currentSupplier, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入电话"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                  <textarea
                    value={currentSupplier.address}
                    onChange={(e) => setCurrentSupplier({...currentSupplier, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入地址"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={currentSupplier.status}
                    onChange={(e) => setCurrentSupplier({...currentSupplier, status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">活跃</option>
                    <option value="inactive">非活跃</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false)
                      setCurrentSupplier(null)
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                  >
                    {loading ? '提交中...' : '提交'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {suppliers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🏪</div>
                <p>暂无供应商数据</p>
              </div>
            ) : (
              suppliers.map((supplier) => (
                <div key={supplier.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">{supplier.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">联系人：{supplier.contact}</p>
                      <p className="text-gray-600">邮箱：{supplier.email || '无'}</p>
                      <p className="text-gray-600">电话：{supplier.phone || '无'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">地址：{supplier.address || '无'}</p>
                      <p className="text-gray-600">产品数量：{supplier.Products?.length || 0}</p>
                      <p className={`text-${supplier.status === 'active' ? 'green' : 'red'}-600`}>状态：{supplier.status === 'active' ? '活跃' : '非活跃'}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setCurrentSupplier(supplier)
                        setShowEditForm(true)
                      }}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm"
                    >
                      编辑
                    </button>
                    <button 
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-6">供应商分析</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">总供应商数</h4>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">活跃供应商</h4>
              <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">非活跃供应商</h4>
              <p className="text-2xl font-bold text-red-900">{stats.inactive}</p>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 mb-6">
            <h4 className="text-md font-semibold text-gray-700 mb-4">供应商产品数量排名</h4>
            <div className="space-y-3">
              {stats.byProductCount.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>暂无供应商数据</p>
                </div>
              ) : (
                stats.byProductCount.map((supplier, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                      <p className="font-medium text-gray-800">{supplier.name}</p>
                    </div>
                    <p className="text-gray-600">{supplier.productCount} 个产品</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Products Content
function ProductsContent() {
  const [activeTab, setActiveTab] = useState('list')
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', stock: '', category: '', supplierId: '' })
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    if (activeTab === 'list' || activeTab === 'analytics') {
      fetchProducts()
      fetchSuppliers()
    }
    if (activeTab === 'analytics') {
      fetchAnalysis()
    }
  }, [activeTab])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setProducts(data.products)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setSuppliers(data.suppliers)
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
    }
  }

  const fetchAnalysis = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/sales/analysis', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setAnalysis(data.analysis)
      }
    } catch (err) {
      console.error('Failed to fetch analysis:', err)
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock)
        })
      })
      const data = await response.json()
      if (data.success) {
        setProducts([...products, data.product])
        setNewProduct({ name: '', description: '', price: '', stock: '', category: '', supplierId: '' })
        setShowAddForm(false)
        alert('产品添加成功')
      }
    } catch (err) {
      console.error('Failed to add product:', err)
      alert('添加产品失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/products/${currentProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...currentProduct,
          price: parseFloat(currentProduct.price),
          stock: parseInt(currentProduct.stock)
        })
      })
      const data = await response.json()
      if (data.success) {
        setProducts(products.map(product => product.id === data.product.id ? data.product : product))
        setShowEditForm(false)
        setCurrentProduct(null)
        alert('产品更新成功')
      }
    } catch (err) {
      console.error('Failed to update product:', err)
      alert('更新产品失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('确定要删除这个产品吗？')) return
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setProducts(products.filter(product => product.id !== productId))
        alert('产品删除成功')
      }
    } catch (err) {
      console.error('Failed to delete product:', err)
      alert('删除产品失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">产品管理</h2>
      
      <div className="flex border-b mb-6">
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 ${activeTab === 'list' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          产品列表
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 ${activeTab === 'analytics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          产品分析
        </button>
      </div>

      {activeTab === 'list' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-700">产品列表</h3>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              {showAddForm ? '取消' : '添加产品'}
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white border rounded-lg p-6 mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-4">添加新产品</h4>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入产品名称"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入产品描述"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入价格"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入库存"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入分类"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
                  <select
                    value={newProduct.supplierId}
                    onChange={(e) => setNewProduct({...newProduct, supplierId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">请选择供应商</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.contact})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                  >
                    {loading ? '提交中...' : '提交'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showEditForm && currentProduct && (
            <div className="bg-white border rounded-lg p-6 mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-4">编辑产品</h4>
              <form onSubmit={handleEditProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                  <input
                    type="text"
                    value={currentProduct.name}
                    onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入产品名称"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={currentProduct.description}
                    onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入产品描述"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                  <input
                    type="number"
                    value={currentProduct.price}
                    onChange={(e) => setCurrentProduct({...currentProduct, price: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入价格"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
                  <input
                    type="number"
                    value={currentProduct.stock}
                    onChange={(e) => setCurrentProduct({...currentProduct, stock: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入库存"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <input
                    type="text"
                    value={currentProduct.category}
                    onChange={(e) => setCurrentProduct({...currentProduct, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入分类"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
                  <select
                    value={currentProduct.supplierId}
                    onChange={(e) => setCurrentProduct({...currentProduct, supplierId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">请选择供应商</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.contact})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false)
                      setCurrentProduct(null)
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                  >
                    {loading ? '提交中...' : '提交'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📦</div>
                <p>暂无产品数据</p>
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">描述：{product.description || '无'}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">价格：¥{product.price.toFixed(2)}</p>
                      <p className="text-gray-600">库存：{product.stock}</p>
                      <p className="text-gray-600">分类：{product.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">供应商：{product.Supplier?.name || '无'}</p>
                      <p className="text-gray-600">联系人：{product.Supplier?.contact || '无'}</p>
                      <p className="text-gray-600">创建时间：{new Date(product.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setCurrentProduct(product)
                        setShowEditForm(true)
                      }}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm"
                    >
                      编辑
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-6">产品分析</h3>
          
          {!analysis ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>正在加载分析数据...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">总销售额</h4>
                  <p className="text-2xl font-bold text-blue-900">¥{analysis.totalSales.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">总利润</h4>
                  <p className="text-2xl font-bold text-green-900">¥{analysis.profit.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">总支出</h4>
                  <p className="text-2xl font-bold text-red-900">¥{analysis.totalExpenses.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-700 mb-4">产品销售排名</h4>
                <div className="space-y-3">
                  {analysis.salesByProduct.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p>暂无销售数据</p>
                    </div>
                  ) : (
                    analysis.salesByProduct
                      .sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount))
                      .map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-medium">
                              {index + 1}
                            </div>
                            <p className="font-medium text-gray-800">{item.Product?.name || '未知产品'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-600">销量：{item.totalQuantity}</p>
                            <p className="text-gray-900 font-medium">¥{parseFloat(item.totalAmount).toFixed(2)}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-700 mb-4">分类销售分析</h4>
                <div className="space-y-3">
                  {analysis.salesByCategory.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p>暂无销售数据</p>
                    </div>
                  ) : (
                    analysis.salesByCategory
                      .sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount))
                      .map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-medium">
                              {index + 1}
                            </div>
                            <p className="font-medium text-gray-800">{item.Product?.category || '未知分类'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-600">销量：{item.totalQuantity}</p>
                            <p className="text-gray-900 font-medium">¥{parseFloat(item.totalAmount).toFixed(2)}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-700 mb-4">月度销售趋势</h4>
                <div className="space-y-3">
                  {analysis.salesByMonth.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p>暂无销售数据</p>
                    </div>
                  ) : (
                    analysis.salesByMonth.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <p className="font-medium text-gray-800">{item.month}</p>
                        <p className="text-gray-900 font-medium">¥{parseFloat(item.totalAmount).toFixed(2)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Finance Content
function FinanceContent() {
  const [activeTab, setActiveTab] = useState('analytics')
  const [sales, setSales] = useState([])
  const [expenses, setExpenses] = useState([])
  const [showAddSale, setShowAddSale] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newSale, setNewSale] = useState({ productId: '', quantity: 1, totalAmount: 0, saleDate: new Date().toISOString().split('T')[0] })
  const [newExpense, setNewExpense] = useState({ amount: 0, category: '', description: '', expenseDate: new Date().toISOString().split('T')[0] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'sales') {
      fetchSales()
    } else if (activeTab === 'expenses') {
      fetchExpenses()
    }
  }, [activeTab])

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/sales', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setSales(data.sales)
      }
    } catch (err) {
      console.error('Failed to fetch sales:', err)
    }
  }

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/expenses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setExpenses(data.expenses)
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err)
    }
  }

  const handleAddSale = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSale)
      })
      const data = await response.json()
      if (data.success) {
        setSales([...sales, data.sale])
        setNewSale({ productId: '', quantity: 1, totalAmount: 0, saleDate: new Date().toISOString().split('T')[0] })
        setShowAddSale(false)
        alert('销售记录添加成功')
      }
    } catch (err) {
      console.error('Failed to add sale:', err)
      alert('添加销售记录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newExpense)
      })
      const data = await response.json()
      if (data.success) {
        setExpenses([...expenses, data.expense])
        setNewExpense({ amount: 0, category: '', description: '', expenseDate: new Date().toISOString().split('T')[0] })
        setShowAddExpense(false)
        alert('费用记录添加成功')
      }
    } catch (err) {
      console.error('Failed to add expense:', err)
      alert('添加费用记录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">财务管理</h2>
      
      <div className="flex border-b mb-6">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 ${activeTab === 'analytics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          财务分析
        </button>
        <button 
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 ${activeTab === 'sales' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          销售记录
        </button>
        <button 
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 ${activeTab === 'expenses' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          费用记录
        </button>
      </div>

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">销售分析</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">图表区域</p>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">费用分析</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">图表区域</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-700">销售记录</h3>
            <button 
              onClick={() => setShowAddSale(!showAddSale)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              {showAddSale ? '取消' : '添加销售记录'}
            </button>
          </div>

          {showAddSale && (
            <div className="bg-white border rounded-lg p-6 mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-4">添加销售记录</h4>
              <form onSubmit={handleAddSale} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品ID</label>
                  <input
                    type="number"
                    value={newSale.productId}
                    onChange={(e) => setNewSale({...newSale, productId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入产品ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                  <input
                    type="number"
                    value={newSale.quantity}
                    onChange={(e) => setNewSale({...newSale, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入数量"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">总金额</label>
                  <input
                    type="number"
                    value={newSale.totalAmount}
                    onChange={(e) => setNewSale({...newSale, totalAmount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入总金额"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">销售日期</label>
                  <input
                    type="date"
                    value={newSale.saleDate}
                    onChange={(e) => setNewSale({...newSale, saleDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                  >
                    {loading ? '提交中...' : '提交'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {sales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💰</div>
                <p>暂无销售记录</p>
              </div>
            ) : (
              sales.map((sale) => (
                <div key={sale.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800">销售记录 #{sale.id}</h4>
                    <span className="text-green-600 font-semibold">¥{sale.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">产品：{sale.Product?.name || '未知产品'}</p>
                      <p className="text-gray-600">数量：{sale.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">销售日期：{new Date(sale.saleDate).toLocaleDateString()}</p>
                      <p className="text-gray-600">操作员：{sale.User?.name || '未知用户'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-700">费用记录</h3>
            <button 
              onClick={() => setShowAddExpense(!showAddExpense)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              {showAddExpense ? '取消' : '添加费用记录'}
            </button>
          </div>

          {showAddExpense && (
            <div className="bg-white border rounded-lg p-6 mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-4">添加费用记录</h4>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金额</label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入金额"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <input
                    type="text"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入分类"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入描述"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">费用日期</label>
                  <input
                    type="date"
                    value={newExpense.expenseDate}
                    onChange={(e) => setNewExpense({...newExpense, expenseDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                  >
                    {loading ? '提交中...' : '提交'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💸</div>
                <p>暂无费用记录</p>
              </div>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800">费用记录 #{expense.id}</h4>
                    <span className="text-red-600 font-semibold">¥{expense.amount.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">分类：{expense.category}</p>
                      <p className="text-gray-600">描述：{expense.description || '无'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">费用日期：{new Date(expense.expenseDate).toLocaleDateString()}</p>
                      <p className="text-gray-600">操作员：{expense.User?.name || '未知用户'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Customer Emails Content
function CustomerEmailsContent() {
  const [customerEmails, setCustomerEmails] = useState([])
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetchCustomerEmails()
    fetchCustomerEmailCount()
  }, [])

  const fetchCustomerEmails = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/customer-emails', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setCustomerEmails(data.customerEmails)
      }
    } catch (err) {
      console.error('Failed to fetch customer emails:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerEmailCount = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/customer-emails/count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setCount(data.count)
      }
    } catch (err) {
      console.error('Failed to fetch customer email count:', err)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">客户邮箱管理</h2>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
          总客户数：{count}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>加载客户邮箱数据中...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {customerEmails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📧</div>
              <p>暂无客户邮箱数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-3 px-4 border-b">ID</th>
                    <th className="py-3 px-4 border-b">邮箱地址</th>
                    <th className="py-3 px-4 border-b">最后访问时间</th>
                    <th className="py-3 px-4 border-b">注册时间</th>
                  </tr>
                </thead>
                <tbody>
                  {customerEmails.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b">{email.id}</td>
                      <td className="py-3 px-4 border-b font-mono">{email.email}</td>
                      <td className="py-3 px-4 border-b">
                        {email.lastAccessed ? new Date(email.lastAccessed).toLocaleString() : '未访问'}
                      </td>
                      <td className="py-3 px-4 border-b">
                        {new Date(email.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard