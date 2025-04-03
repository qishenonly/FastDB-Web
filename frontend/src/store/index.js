import { createStore } from 'vuex'

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
    kvData: [
      { key: 'user:1001', value: '{"name":"张三","age":28,"role":"admin"}', type: 'object', createdAt: '2023-05-10', updatedAt: '2023-06-15' },
      { key: 'product:2001', value: '{"id":2001,"name":"高级显示器","price":1299.99}', type: 'object', createdAt: '2023-04-22', updatedAt: '2023-04-22' },
      { key: 'counter:visits', value: '15782', type: 'number', createdAt: '2023-01-01', updatedAt: '2023-06-18' },
      { key: 'config:theme', value: 'dark', type: 'string', createdAt: '2023-03-15', updatedAt: '2023-05-20' },
      { key: 'list:featured', value: '[1001, 1002, 1008, 1015]', type: 'array', createdAt: '2023-02-10', updatedAt: '2023-06-01' }
    ],
    theme: getPreferredTheme()
  },
  
  getters: {
    getKvData: (state) => state.kvData,
    getKvItemByKey: (state) => (key) => {
      return state.kvData.find(item => item.key === key)
    },
    getTheme: (state) => state.theme
  },
  
  mutations: {
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
    }
  },
  
  actions: {
    addKvItem({ commit }, item) {
      // 在实际应用中，这里会有API调用
      item.createdAt = new Date().toISOString().split('T')[0]
      item.updatedAt = item.createdAt
      commit('ADD_KV_ITEM', item)
    },
    updateKvItem({ commit }, { key, updatedItem }) {
      // 在实际应用中，这里会有API调用
      updatedItem.updatedAt = new Date().toISOString().split('T')[0]
      commit('UPDATE_KV_ITEM', { key, updatedItem })
    },
    deleteKvItem({ commit }, key) {
      // 在实际应用中，这里会有API调用
      commit('DELETE_KV_ITEM', key)
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
    }
  }
}) 