import { createStore } from 'vuex'
import { kvApi } from '@/services/api'
import { dbApi } from '@/services/api'
import i18n from '@/i18n'

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
    dbConnectionError: null,
    darkMode: false,
    dataInitialized: false,
    notifications: []
  },
  
  getters: {
    getKvData: (state) => state.kvData,
    getKvItemByKey: (state) => (key) => {
      return state.kvData.find(item => item.key === key)
    },
    getTheme: (state) => state.theme,
    getRecentActivities: (state) => state.recentActivities,
    isDbConnected: (state) => state.dbConnected,
    getDbConnectionError: (state) => state.dbConnectionError,
    isDarkMode: (state) => state.darkMode,
    getNotifications: (state) => state.notifications
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
    },
    SET_DARK_MODE(state, isDark) {
      state.darkMode = isDark
    },
    SET_DATA_INITIALIZED(state, initialized) {
      state.dataInitialized = initialized
    },
    ADD_NOTIFICATION(state, notification) {
      state.notifications.unshift(notification)
      
      // 限制通知数量，保留最新的20条
      if (state.notifications.length > 20) {
        state.notifications = state.notifications.slice(0, 20)
      }
    },
    MARK_NOTIFICATION_AS_READ(state, index) {
      if (state.notifications[index]) {
        state.notifications[index].read = true
      }
    },
    MARK_ALL_NOTIFICATIONS_AS_READ(state) {
      state.notifications.forEach(notification => {
        notification.read = true
      })
    },
    CLEAR_ALL_NOTIFICATIONS(state) {
      state.notifications = []
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
    async addKvItem({ commit, dispatch }, item) {
      try {
        await kvApi.addItem(item);
        
        // 记录这个活动，包含更多信息
        await dispatch('recordActivity', {
          type: 'add',
          key: item.key,
          timestamp: new Date().toISOString(),
          valueType: typeof item.value === 'string' ? 'string' : 'complex'
        });
        
        // 添加数据添加通知
        dispatch('addNotification', {
          type: 'success',
          title: i18n.global.t('notifications.dataAddTitle'),
          message: i18n.global.t('notifications.dataAddMessage'),
          time: new Date().toISOString()
        });
        
        // 重新获取所有数据以确保同步
        await dispatch('fetchKeyValueData');
        return true;
      } catch (error) {
        console.error('添加键值对失败:', error);
        
        // 添加错误通知
        dispatch('addNotification', {
          type: 'error',
          title: i18n.global.t('common.error'),
          message: error.message || i18n.global.t('database.addFailed'),
          time: new Date().toISOString()
        });
        
        throw error;
      }
    },
    
    // 更新键值对
    async updateKvItem({ commit, dispatch }, { key, updatedItem }) {
      try {
        await kvApi.updateItem(key, updatedItem);
        
        // 记录这个活动，包含更多信息
        await dispatch('recordActivity', {
          type: 'update',
          key: key,
          timestamp: new Date().toISOString(),
          valueType: typeof updatedItem.value === 'string' ? 'string' : 'complex'
        });
        
        // 添加数据更新通知
        dispatch('addNotification', {
          type: 'success',
          title: i18n.global.t('notifications.dataUpdateTitle'),
          message: i18n.global.t('notifications.dataUpdateMessage'),
          time: new Date().toISOString()
        });
        
        // 重新获取所有数据以确保同步
        await dispatch('fetchKeyValueData');
        return true;
      } catch (error) {
        console.error('更新键值对失败:', error);
        
        // 添加错误通知
        dispatch('addNotification', {
          type: 'error',
          title: i18n.global.t('common.error'),
          message: error.message || i18n.global.t('database.updateFailed'),
          time: new Date().toISOString()
        });
        
        throw error;
      }
    },
    
    // 删除键值对
    async deleteKvItem({ commit, dispatch }, key) {
      try {
        await kvApi.deleteItem(key);
        
        // 记录这个活动
        await dispatch('recordActivity', {
          type: 'delete',
          key: key,
          timestamp: new Date().toISOString()
        });
        
        // 添加数据删除通知
        dispatch('addNotification', {
          type: 'success',
          title: i18n.global.t('notifications.dataDeleteTitle'),
          message: i18n.global.t('notifications.dataDeleteMessage'),
          time: new Date().toISOString()
        });
        
        // 重新获取所有数据以确保同步
        await dispatch('fetchKeyValueData');
        return true;
      } catch (error) {
        console.error('删除键值对失败:', error);
        
        // 添加错误通知
        dispatch('addNotification', {
          type: 'error',
          title: i18n.global.t('common.error'),
          message: error.message || i18n.global.t('database.deleteFailed'),
          time: new Date().toISOString()
        });
        
        throw error;
      }
    },
    
    // 记录活动
    async recordActivity({ commit, state }, activity) {
      try {
        // 获取现有活动
        let activities = [...state.recentActivities];
        
        // 添加新活动，并添加更多信息
        const newActivity = {
          ...activity,
          user: 'Admin', // 可以从用户系统获取
          timestamp: new Date().toISOString()
        };
        
        // 如果是添加或更新操作，尝试获取值的预览
        if ((activity.type === 'add' || activity.type === 'update') && activity.key) {
          const item = state.kvData.find(item => item.key === activity.key);
          if (item) {
            // 为不同类型的值创建预览
            if (typeof item.value === 'string') {
              newActivity.valuePreview = item.value.length > 30 
                ? item.value.substring(0, 30) + '...' 
                : item.value;
            } else if (typeof item.value === 'object') {
              newActivity.valuePreview = JSON.stringify(item.value).length > 30
                ? JSON.stringify(item.value).substring(0, 30) + '...'
                : JSON.stringify(item.value);
            } else {
              newActivity.valuePreview = String(item.value);
            }
          }
        }
        
        // 将新活动添加到列表开头
        activities.unshift(newActivity);
        
        // 限制活动数量为最新的50条
        if (activities.length > 50) {
          activities = activities.slice(0, 50);
        }
        
        // 更新状态
        commit('SET_RECENT_ACTIVITIES', activities);
        
        // 将活动保存到数据库
        try {
          await kvApi.addItem({
            key: '_recent_activities',
            value: JSON.stringify(activities)
          });
        } catch (error) {
          console.error('保存活动记录失败:', error);
        }
        
        return activities;
      } catch (error) {
        console.error('记录活动失败:', error);
        return state.recentActivities;
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
    async checkDbConnection({ commit, dispatch, state }) {
      try {
        const response = await dbApi.checkConnection()
        
        // 根据返回的status字段更新连接状态
        console.log("======>", response.status === 'success');
        if (response.status === 'success') {
          commit('SET_DB_CONNECTED', true)
          commit('SET_DB_CONNECTION_ERROR', null)
          
          // 可以添加一个静默通知（不显示给用户）来记录连接状态
          if (!state.dbConnected) {
            dispatch('addNotification', {
              type: 'success',
              title: i18n.global.t('notifications.connectionSuccessTitle'),
              message: response.message || i18n.global.t('notifications.connectionSuccessMessage'),
              time: new Date().toISOString(),
              silent: true // 标记为静默通知
            })
          }
        } else {
          commit('SET_DB_CONNECTED', false)
          commit('SET_DB_CONNECTION_ERROR', response.message || 'Unknown error')
          
          // 可以添加一个静默通知来记录连接状态变化
          if (state.dbConnected) {
            dispatch('addNotification', {
              type: 'error',
              title: i18n.global.t('notifications.connectionErrorTitle'),
              message: response.message || i18n.global.t('notifications.connectionErrorMessage'),
              time: new Date().toISOString(),
              silent: true // 标记为静默通知
            })
          }
        }
        
        return response
      } catch (error) {
        console.error('检查数据库连接失败:', error)
        commit('SET_DB_CONNECTED', false)
        commit('SET_DB_CONNECTION_ERROR', error.message || 'Connection check failed')
        
        // 可以添加一个静默通知来记录连接错误
        if (state.dbConnected) {
          dispatch('addNotification', {
            type: 'error',
            title: i18n.global.t('notifications.connectionErrorTitle'),
            message: error.message || i18n.global.t('notifications.connectionErrorMessage'),
            time: new Date().toISOString(),
            silent: true // 标记为静默通知
          })
        }
        
        return Promise.reject(error)
      }
    },
    
    // 连接数据库
    async connectToDb({ commit, dispatch }, connectionInfo) {
      try {
        const response = await dbApi.connect(connectionInfo)
        
        if (response && response.status === 'success') {
          commit('SET_DB_CONNECTED', true)
          commit('SET_DB_CONNECTION_ERROR', null)
          
          // 添加连接成功通知
          dispatch('addNotification', {
            type: 'success',
            title: i18n.global.t('notifications.connectionSuccessTitle'),
            message: i18n.global.t('notifications.connectionSuccessMessage'),
            time: new Date().toISOString()
          })
          
          return response
        } else {
          const errorMessage = response?.message || '连接数据库失败'
          commit('SET_DB_CONNECTED', false)
          commit('SET_DB_CONNECTION_ERROR', errorMessage)
          
          // 添加连接失败通知
          dispatch('addNotification', {
            type: 'error',
            title: i18n.global.t('notifications.connectionErrorTitle'),
            message: errorMessage,
            time: new Date().toISOString()
          })
          
          return Promise.reject(new Error(errorMessage))
        }
      } catch (error) {
        let errorMessage = '连接数据库失败'
        
        if (error.data) {
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
        
        commit('SET_DB_CONNECTED', false)
        commit('SET_DB_CONNECTION_ERROR', errorMessage)
        
        // 添加连接失败通知
        dispatch('addNotification', {
          type: 'error',
          title: i18n.global.t('notifications.connectionErrorTitle'),
          message: errorMessage,
          time: new Date().toISOString()
        })
        
        return Promise.reject(error)
      }
    },
    
    // 关闭数据库连接
    async closeDbConnection({ commit, dispatch }) {
      try {
        // 发送关闭连接请求
        const response = await dbApi.closeConnection()
        
        // 更新连接状态
        commit('SET_DB_CONNECTED', false)
        commit('SET_DB_CONNECTION_ERROR', null)
        
        // 添加关闭连接通知
        dispatch('addNotification', {
          type: 'info',
          title: i18n.global.t('notifications.connectionClosedTitle'),
          message: i18n.global.t('notifications.connectionClosedMessage'),
          time: new Date().toISOString()
        })
        
        return response
      } catch (error) {
        console.error('关闭数据库连接失败:', error)
        
        // 添加关闭连接失败通知
        dispatch('addNotification', {
          type: 'error',
          title: i18n.global.t('notifications.connectionCloseErrorTitle'),
          message: error.message || i18n.global.t('notifications.connectionCloseErrorMessage'),
          time: new Date().toISOString()
        })
        
        return Promise.reject(error)
      }
    },

    // 获取所有键值对数据
    async fetchKeyValueData({ commit }) {
      try {
        // 使用正确的API调用方法名
        const response = await kvApi.getAllItems()
        
        // 确保每个项目都有必要的属性
        let data = [];
        
        if (response && response.items) {
          // 先解析活动记录
          let activities = []
          if (response.items._recent_activities) {
            try {
              // 解析最近活动数据
              activities = JSON.parse(response.items._recent_activities);
              // 存储最近活动到单独的状态
              commit('SET_RECENT_ACTIVITIES', activities);
            } catch (e) {
              console.error('解析最近活动数据失败:', e);
              activities = [];
            }
          }
          
          // 将对象格式转换为数组格式
          data = Object.entries(response.items)
            .filter(([key]) => key !== '_recent_activities') // 过滤掉活动记录
            .map(([key, value]) => {
              // 查找该键的创建时间
              let createdAt = null;
              // 查找添加记录
              const addActivity = activities.find(
                activity => activity.type === 'add' && activity.key === key
              );
              
              if (addActivity) {
                createdAt = new Date(addActivity.timestamp);
              } else {
                // 如果没有找到添加记录，使用当前时间
                createdAt = new Date();
              }
              
              // 查找最新的更新记录
              let updatedAt = null;
              const updateActivities = activities
                .filter(activity => (activity.type === 'update' || activity.type === 'add') && activity.key === key)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
              
              if (updateActivities.length > 0) {
                updatedAt = new Date(updateActivities[0].timestamp);
              } else {
                // 如果没有找到更新记录，使用创建时间
                updatedAt = createdAt;
              }
              
              return {
                key,
                value,
                // 尝试判断值的类型
                type: getValueType(value),
                // 使用真实的创建和更新时间
                createdAt: createdAt.toISOString(),
                updatedAt: updatedAt.toISOString(),
                // 添加数据大小属性
                size: typeof value === 'string' ? value.length : JSON.stringify(value).length
              };
            });
        }
        
        commit('SET_KV_DATA', data);
        return data;
      } catch (error) {
        console.error('获取键值对数据失败:', error);
        commit('SET_KV_DATA', []);
        throw error;
      }
    },
    
    // 添加通知
    addNotification({ commit }, notification) {
      commit('ADD_NOTIFICATION', {
        ...notification,
        read: false,
        id: Date.now() // 使用时间戳作为唯一ID
      })
    },
    
    // 标记通知为已读
    markNotificationAsRead({ commit }, index) {
      commit('MARK_NOTIFICATION_AS_READ', index)
    },
    
    // 标记所有通知为已读
    markAllNotificationsAsRead({ commit }) {
      commit('MARK_ALL_NOTIFICATIONS_AS_READ')
    },
    
    // 清除所有通知
    clearAllNotifications({ commit }) {
      commit('CLEAR_ALL_NOTIFICATIONS')
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