import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api', // 修改为相对路径，避免跨域问题
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
      
      // 保存完整的错误信息
      const errorData = error.response.data || {};
      const errorStatus = error.response.status;
      const errorMessage = errorData.message || '未知错误';
      
      // 创建更详细的错误对象
      const enhancedError = new Error(`${errorMessage} (${errorStatus})`);
      enhancedError.status = errorStatus;
      enhancedError.data = errorData;
      enhancedError.originalError = error;
      
      return Promise.reject(enhancedError);
    }
    
    // 网络错误等
    return Promise.reject(error)
  }
)

// KV数据库API
export const kvApi = {
  // 获取所有键值对
  getAllItems() {
    return api.get('/v1/kvs')
  },
  
  // 获取单个键值对
  getItem(key) {
    return api.get(`/v1/kv/${key}`)
  },
  
  // 添加新键值对
  addItem(item) {
    return api.put(`/v1/kv/${item.key}`, { value: item.value })
  },
  
  // 更新键值对
  updateItem(key, item) {
    return api.put(`/v1/kv/${key}`, { value: item.value })
  },
  
  // 删除键值对
  deleteItem(key) {
    return api.delete(`/v1/kv/${key}`)
  },
  
  // 导入数据
  importData(data) {
    return api.post('/v1/kv/import', data)
  },
  
  // 导出数据
  exportData() {
    return api.get('/v1/kv/export')
  }
}

// 数据库API
export const dbApi = {
  // 检查数据库连接状态
  checkConnection() {
    return api.get('/v1/db/status')
  },
  
  // 连接数据库
  connect(connectionData) {
    return api.post('/v1/db/connect', connectionData)
  },
  
  // 关闭数据库连接
  closeConnection() {
    return api.post('/v1/db/close')
  }
}

export default api 