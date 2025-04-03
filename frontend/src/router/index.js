import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import Database from '@/views/Database.vue'
import Settings from '@/views/Settings.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
    meta: {
      title: '仪表盘 - FastDB 数据库管理工具'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: '仪表盘 - FastDB 数据库管理工具'
    }
  },
  {
    path: '/database/browse',
    name: 'DatabaseBrowse',
    component: Database,
    meta: {
      title: '数据库 - FastDB 数据库管理工具'
    }
  },
  {
    path: '/database/add',
    name: 'DatabaseAdd',
    component: Database,
    meta: {
      title: '添加数据 - FastDB 数据库管理工具'
    },
    props: { showAddForm: true }
  },
  {
    path: '/database/import',
    name: 'DatabaseImport',
    component: Database,
    meta: {
      title: '导入数据 - FastDB 数据库管理工具'
    },
    props: { showImportExport: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    meta: {
      title: '设置 - FastDB 数据库管理工具'
    },
    component: Settings
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置标题
  document.title = to.meta.title || 'FastDB 数据库管理系统'
  next()
})

export default router 