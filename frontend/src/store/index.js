import { createStore } from 'vuex'
import { kvApi } from '@/services/api'
import { dbApi } from '@/services/api'

// 获取系统偏好的主题
const getPreferredTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) return savedTheme
  
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export default createStore({
  state: {
    kvData: [],
    theme: getPreferredTheme(),
    recentActivities: [],
    dbConnected: false,
    dbConnectionError: null
  },
  
  getters: {
    getKvData: (state) => state.kvData,
    getKvItemByKey: (state) => (key) => {
      return state.kvData.find(item => item.key === key)
    },
    getTheme: (state) => state.theme,
    getRecentActivities: (state) => state.recentActivities,
    isDbConnected: (state) => state.dbConnected,
    getDbConnectionError: (state) => state.dbConnectionError
  },
  
  mutations: {
    SET_KV_DATA(state, data) {
      state.kvData = data
    },
    ADD_KV_ITEM(state, item) {
      state.kvData.push(item)
    },
    UPDATE_KV_ITEM(state, { key, updatedItem }) {
      const index = state.kvData.findIndex(item => item.key === key)
      if (index !== -1) {
        state.kvData[index] = updatedItem
      }
    },
    DELETE_KV_ITEM(state, key) {
      const index = state.kvData.findIndex(item => item.key === key)
      if (index !== -1) {
        state.kvData.splice(index, 1)
      }
    },
    SET_THEME(state, theme) {
      state.theme = theme
    },
    SET_RECENT_ACTIVITIES(state, activities) {
      state.recentActivities = activities
    },
    SET_DB_CONNECTED(state, status) {
      state.dbConnected = status
    },
    SET_DB_CONNECTION_ERROR(state, error) {
      state.dbConnectionError = error
    }
  },
  
  actions: {
    // 获取所有键值对
    async fetchAllItems({ commit }) {
      try {
        const response = await kvApi.getAllItems()
        if (response && response.items) {
          // 将对象格式转换为数组格式
          const items = Object.entries(response.items).map(([key, value]) => ({
            key,
            value,
            // 尝试判断值的类型
            type: getValueType(value),
            // 添加一个临时的更新时间
            updatedAt: new Date().toLocaleString()
          }))
          
          // 检查是否有最近活动记录
          const recentActivitiesItem = items.find(item => item.key === '_recent_activities')
          if (recentActivitiesItem) {
            try {
              // 解析最近活动数据
              const activities = JSON.parse(recentActivitiesItem.value)
              // 存储最近活动到单独的状态
              commit('SET_RECENT_ACTIVITIES', activities)
              // 从展示列表中移除这个系统项
              const filteredItems = items.filter(item => item.key !== '_recent_activities')
              commit('SET_KV_DATA', filteredItems)
              return filteredItems
            } catch (e) {
              console.error('解析最近活动数据失败:', e)
              commit('SET_KV_DATA', items)
              return items
            }
          } else {
            commit('SET_KV_DATA', items)
            return items
          }
        }
        return []
      } catch (error) {
        console.error('获取所有数据失败:', error)
        return Promise.reject(error)
      }
    },
    
    // 获取单个键值对
    async fetchItem({ commit }, key) {
      try {
        const response = await kvApi.getItem(key)
        if (response) {
          return {
            key: response.key,
            value: response.value,
            type: getValueType(response.value),
            updatedAt: new Date().toLocaleString()
          }
        }
        return null
      } catch (error) {
        console.error(`获取键 ${key} 失败:`, error)
        return Promise.reject(error)
      }
    },
    
    // 添加新键值对
    async addKvItem({ commit, dispatch, state }, item) {
      try {
        const response = await kvApi.addItem({
          key: item.key,
          value: item.value
        })
        
        // 记录这个活动
        await dispatch('recordActivity', {
          type: 'add',
          key: item.key,
          timestamp: new Date().toISOString()
        })
        
        // 添加成功后，重新获取所有数据
        await dispatch('fetchAllItems')
        return response
      } catch (error) {
        console.error('添加数据失败:', error)
        return Promise.reject(error)
      }
    },
    
    // 更新键值对
    async updateKvItem({ commit, dispatch }, { key, updatedItem }) {
      try {
        const response = await kvApi.updateItem(key, {
          value: updatedItem.value
        })
        
        // 记录这个活动
        await dispatch('recordActivity', {
          type: 'update',
          key: key,
          timestamp: new Date().toISOString()
        })
        
        // 更新成功后，重新获取所有数据
        await dispatch('fetchAllItems')
        return response
      } catch (error) {
        console.error(`更新键 ${key} 失败:`, error)
        return Promise.reject(error)
      }
    },
    
    // 删除键值对
    async deleteKvItem({ commit, dispatch }, key) {
      try {
        await kvApi.deleteItem(key)
        
        // 记录这个活动
        await dispatch('recordActivity', {
          type: 'delete',
          key: key,
          timestamp: new Date().toISOString()
        })
        
        // 删除成功后，重新获取所有数据
        await dispatch('fetchAllItems')
        return { success: true }
      } catch (error) {
        console.error(`删除键 ${key} 失败:`, error)
        return Promise.reject(error)
      }
    },
    
    // 记录活动
    async recordActivity({ state }, activity) {
      try {
        // 获取现有活动或创建新数组
        let activities = []
        
        // 尝试从后端获取现有活动
        try {
          const response = await kvApi.getItem('_recent_activities')
          if (response && response.value) {
            activities = JSON.parse(response.value)
          }
        } catch (e) {
          // 如果不存在，则创建新数组
          activities = []
        }
        
        // 添加新活动到数组开头
        activities.unshift(activity)
        
        // 限制活动数量为最近20条
        if (activities.length > 20) {
          activities = activities.slice(0, 20)
        }
        
        // 保存回后端
        await kvApi.addItem({
          key: '_recent_activities',
          value: JSON.stringify(activities)
        })
        
        return activities
      } catch (error) {
        console.error('记录活动失败:', error)
        return Promise.reject(error)
      }
    },
    
    // 获取最近活动
    async fetchRecentActivities({ commit }) {
      try {
        const response = await kvApi.getItem('_recent_activities')
        if (response && response.value) {
          const activities = JSON.parse(response.value)
          commit('SET_RECENT_ACTIVITIES', activities)
          return activities
        }
        return []
      } catch (error) {
        console.error('获取最近活动失败:', error)
        // 如果是404错误，说明还没有活动记录
        if (error.response && error.response.status === 404) {
          return []
        }
        return Promise.reject(error)
      }
    },
    
    setTheme({ commit }, theme) {
      // 保存到本地存储
      localStorage.setItem('theme', theme)
      // 更新状态
      commit('SET_THEME', theme)
      // 更新文档根元素的类，用于全局CSS变量
      if (theme === 'dark') {
        document.documentElement.classList.add('dark-theme')
      } else {
        document.documentElement.classList.remove('dark-theme')
      }
    },
    
    // 检查数据库连接状态
    async checkDbConnection({ commit }) {
      try {
        const response = await dbApi.checkConnection()
        commit('SET_DB_CONNECTED', response.status === 'success')
        commit('SET_DB_CONNECTION_ERROR', null)
        return response
      } catch (error) {
        commit('SET_DB_CONNECTED', false)
        
        // 提取完整的错误信息并翻译成中文
        let errorMessage = '无法连接到数据库';
        
        if (error.data && error.data.message) {
          // 根据英文错误信息提供对应的中文翻译
          const errorTranslations = {
            'FastDB is not connected': 'FastDB 未连接',
            'Invalid host': '无效的主机地址',
            'Invalid port': '无效的端口',
            'Invalid username': '无效的用户名',
            'Invalid password': '无效的密码',
            'FastDB is stopped': 'FastDB 已停止'
          };
          
          const originalMessage = error.data.message;
          errorMessage = errorTranslations[originalMessage] || originalMessage;
          
          // 添加状态码
          if (error.status) {
            errorMessage += ` (错误代码: ${error.status})`;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        commit('SET_DB_CONNECTION_ERROR', errorMessage);
        return Promise.reject(error);
      }
    },
    
    // 连接数据库
    async connectToDb({ commit }, connectionData) {
      try {
        const response = await dbApi.connect(connectionData)
        commit('SET_DB_CONNECTED', response.status === 'success')
        commit('SET_DB_CONNECTION_ERROR', null)
        return response
      } catch (error) {
        commit('SET_DB_CONNECTED', false)

         // 提取完整的错误信息并翻译成中文
         let errorMessage = '无法连接到数据库';
        
         if (error.data && error.data.message) {
           // 根据英文错误信息提供对应的中文翻译
           const errorTranslations = {
             'FastDB is not connected': 'FastDB 未连接',
             'Invalid host': '无效的主机地址',
             'Invalid port': '无效的端口',
             'Invalid username': '无效的用户名',
             'Invalid password': '无效的密码',
             'FastDB is stopped': 'FastDB 已停止'
           };
           
           const originalMessage = error.data.message;
           errorMessage = errorTranslations[originalMessage] || originalMessage;
           
           // 添加状态码
           if (error.status) {
             errorMessage += ` (错误代码: ${error.status})`;
           }
         } else if (error.message) {
           errorMessage = error.message;
         }
         
        commit('SET_DB_CONNECTION_ERROR', error.message || '连接数据库失败')
        return Promise.reject(error)
      }
    },
    
    // 关闭数据库连接
    async closeDbConnection({ commit }) {
      try {
        const response = await dbApi.closeConnection()
        commit('SET_DB_CONNECTED', false)
        return response
      } catch (error) {
        console.error('关闭数据库连接失败:', error)
        return Promise.reject(error)
      }
    }
  }
})

// 辅助函数：判断值的类型
function getValueType(value) {
  try {
    // 尝试解析为JSON
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return 'array'
    if (typeof parsed === 'object' && parsed !== null) return 'object'
    if (typeof parsed === 'number') return 'number'
    return 'string'
  } catch (e) {
    // 如果不是有效的JSON，则判断是否为数字
    if (!isNaN(Number(value))) return 'number'
    return 'string'
  }
} 