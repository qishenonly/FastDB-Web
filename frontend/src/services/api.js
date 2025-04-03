import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加认证信息等
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    // 处理错误响应
    if (error.response) {
      // 服务器返回错误
      console.error('API错误:', error.response.data)
    } else if (error.request) {
      // 请求发送但没有收到响应
      console.error('网络错误:', error.request)
    } else {
      // 请求设置时发生错误
      console.error('请求错误:', error.message)
    }
    return Promise.reject(error)
  }
)

// KV数据库API
export const kvApi = {
  // 获取所有键值对
  getAllItems() {
    return api.get('/kv')
  },
  
  // 获取单个键值对
  getItem(key) {
    return api.get(`/kv/${key}`)
  },
  
  // 添加新键值对
  addItem(item) {
    return api.post('/kv', item)
  },
  
  // 更新键值对
  updateItem(key, item) {
    return api.put(`/kv/${key}`, item)
  },
  
  // 删除键值对
  deleteItem(key) {
    return api.delete(`/kv/${key}`)
  },
  
  // 导入数据
  importData(data) {
    return api.post('/kv/import', data)
  },
  
  // 导出数据
  exportData() {
    return api.get('/kv/export')
  }
}

export default api 