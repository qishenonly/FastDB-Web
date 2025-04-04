import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      title: '仪表盘 - FastDB数据管理系统',
      requiresData: true
    }
  },
  {
    path: '/database',
    redirect: '/database/browse'
  },
  {
    path: '/database/browse',
    name: 'Database',
    component: () => import('@/views/Database.vue'),
    meta: {
      title: '数据管理 - FastDB数据管理系统',
      requiresData: true
    }
  },
  {
    path: '/database/add',
    name: 'DatabaseAdd',
    component: () => import('@/views/Database.vue'),
    meta: {
      title: '添加数据 - FastDB数据管理系统',
      requiresData: true
    },
    props: { showAddForm: true }
  },
  {
    path: '/analysis',
    name: 'Analysis',
    component: () => import('@/views/Analysis.vue'),
    meta: {
      title: '数据分析 - FastDB数据管理系统',
      requiresData: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: '数据库设置 - FastDB数据管理系统'
    }
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  } else {
    document.title = 'FastDB数据管理系统'
  }
  
  // 如果页面需要数据，检查数据库连接并获取数据
  if (to.meta.requiresData) {
    try {
      // 检查数据库连接状态
      await store.dispatch('checkDbConnection')
      
      // 如果连接成功，获取键值对数据
      if (store.getters.isDbConnected) {
        await store.dispatch('fetchKeyValueData')
      } else {
        // 如果未连接且不是前往设置页面，可以在这里处理
        // 注意：实际的重定向逻辑已经在App.vue中通过对话框处理
        console.warn('数据库未连接，但用户尝试访问需要数据的页面')
      }
    } catch (error) {
      console.error('路由守卫中获取数据失败:', error)
      // 即使获取数据失败，也允许导航继续
    }
  }
  
  next()
})

export default router 