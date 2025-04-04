<template>
  <header class="app-header" :class="{ 'dark-mode': isDarkMode }">
    <div class="logo-container">
      <img src="@/assets/logo.svg" alt="Logo" class="logo" />
      <h1 class="app-title">{{ $t('header.title') }}</h1>
    </div>
    
    <div class="header-center">
      
    </div>
    
    <div class="header-actions">
      <!-- 通知中心 -->
      <el-tooltip :content="$t('header.notifications')" placement="bottom">
        <div class="action-item notification-icon" @click="showNotifications">
          <el-badge :value="notificationCount" :hidden="notificationCount === 0">
            <el-icon><Bell /></el-icon>
          </el-badge>
        </div>
      </el-tooltip>
      
      <!-- 主题切换按钮 -->
      <el-button
        class="icon-button"
        :icon="isDarkMode ? 'Sunny' : 'Moon'"
        circle
        @click="toggleTheme"
      />
      
      <!-- 语言切换 -->
      <el-dropdown @command="handleLanguageChange" class="language-dropdown">
        <span class="language-selector">
          <el-icon><Language /></el-icon>
          <span>{{ currentLanguageLabel }}</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zh-CN">简体中文</el-dropdown-item>
            <el-dropdown-item command="en-US">English</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <!-- 用户菜单 -->
      <el-dropdown>
        <div class="user-info">
          <el-avatar :size="36" src="https://joeschmoe.io/api/v1/random" class="user-avatar"></el-avatar>
          <div class="user-details">
            <span class="username">{{ $t('header.admin') }}</span>
            <span class="user-role">{{ $t('header.adminRole') }}</span>
          </div>
        </div>
      </el-dropdown>
    </div>
  </header>
  
  <!-- 通知抽屉 -->
  <el-drawer
    v-model="notificationDrawer"
    :title="$t('header.notifications')"
    direction="rtl"
    size="30%"
  >
    <div v-if="visibleNotifications.length === 0" class="empty-notifications">
      {{ $t('header.noNotifications') }}
    </div>
    <div v-else class="notification-list">
      <div v-for="(notification, index) in visibleNotifications" :key="index" class="notification-item" :class="{ 'unread': !notification.read }">
        <div class="notification-icon" :class="notification.type">
          <el-icon v-if="notification.type === 'info'"><InfoFilled /></el-icon>
          <el-icon v-else-if="notification.type === 'success'"><SuccessFilled /></el-icon>
          <el-icon v-else-if="notification.type === 'warning'"><WarningFilled /></el-icon>
          <el-icon v-else-if="notification.type === 'error'"><CircleCloseFilled /></el-icon>
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
          <div class="notification-time">{{ formatNotificationTime(notification.time) }}</div>
        </div>
        <div class="notification-actions">
          <el-button size="small" circle @click="markAsRead(index)">
            <el-icon><Check /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import { computed, ref, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { format, formatDistance } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'

export default {
  name: 'AppHeader',
  setup() {
    const store = useStore()
    const { locale, t } = useI18n()
    const router = useRouter()
    
    const searchQuery = ref('')
    const notificationDrawer = ref(false)
    
    // 从store获取通知
    const notifications = computed(() => store.getters.getNotifications)
    
    // 在computed中添加过滤静默通知的方法
    const visibleNotifications = computed(() => {
      return notifications.value.filter(n => !n.silent)
    })
    
    // 在notificationCount计算中使用过滤后的通知
    const notificationCount = computed(() => {
      return visibleNotifications.value.filter(n => !n.read).length
    })
    
    // 获取当前主题
    const isDarkMode = computed(() => store.state.darkMode)
    
    // 获取当前语言标签
    const currentLanguageLabel = computed(() => {
      return locale.value === 'zh-CN' ? '简体中文' : 'English'
    })
    
    // 切换主题
    const toggleTheme = () => {
      store.dispatch('toggleDarkMode')
    }
    
    // 处理语言切换
    const handleLanguageChange = (lang) => {
      locale.value = lang
      localStorage.setItem('locale', lang)
    }
    
    // 处理搜索
    const handleSearch = () => {
      if (searchQuery.value.trim()) {
        router.push({
          path: '/database/browse',
          query: { search: searchQuery.value.trim() }
        })
        searchQuery.value = ''
      }
    }
    
    // 显示通知抽屉
    const showNotifications = () => {
      notificationDrawer.value = true
      
      // 标记所有通知为已读
      setTimeout(() => {
        store.dispatch('markAllNotificationsAsRead')
      }, 2000)
    }
    
    // 标记单个通知为已读
    const markAsRead = (index) => {
      store.dispatch('markNotificationAsRead', index)
    }
    
    // 清除所有通知
    const clearAllNotifications = () => {
      store.dispatch('clearAllNotifications')
    }
    
    // 格式化通知时间
    const formatNotificationTime = (timestamp) => {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now - date
      
      // 使用适合当前语言的格式
      const localeObj = locale.value === 'zh-CN' ? zhCN : enUS
      
      if (diffMs < 60 * 1000) { // 小于1分钟
        return t('dashboard.justNow')
      } else if (diffMs < 24 * 60 * 60 * 1000) { // 小于24小时
        return formatDistance(date, now, { addSuffix: false, locale: localeObj })
      } else {
        return format(date, 'yyyy-MM-dd HH:mm', { locale: localeObj })
      }
    }
    
    // 组件挂载时添加欢迎通知
    onMounted(() => {
      // 添加欢迎通知
      store.dispatch('addNotification', {
        type: 'info',
        title: t('notifications.welcomeTitle'),
        message: t('notifications.welcomeMessage'),
        time: new Date().toISOString()
      })
    })
    
    // 监听路由变化，可以在这里添加特定页面的通知
    watch(() => router.currentRoute.value.path, (newPath, oldPath) => {
      // 可以在这里根据路由变化添加特定通知
    })
    
    return {
      searchQuery,
      isDarkMode,
      currentLanguageLabel,
      notifications,
      notificationCount,
      notificationDrawer,
      toggleTheme,
      handleLanguageChange,
      handleSearch,
      showNotifications,
      markAsRead,
      clearAllNotifications,
      formatNotificationTime,
      visibleNotifications
    }
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  height: $header-height;
  background: linear-gradient(135deg, $primary-color, darken($primary-color, 15%));
  color: white;
  display: flex;
  align-items: center;
  padding: 0 $spacing-lg;
  box-shadow: $shadow;
  position: relative;
  z-index: 1000;
  
  &.dark-mode {
    background: linear-gradient(135deg, #1a1a1a, #2c2c2c);
  }
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px;
  margin-right: $spacing-md;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  transition: transform $transition;
  
  &:hover {
    transform: scale(1.05);
  }
}

.app-title {
  font-size: $font-size-xl;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(to right, #ffffff, rgba(255,255,255,0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 $spacing-xl;
}

.search-container {
  width: 400px;
}

.global-search {
  :deep(.el-input__inner) {
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: white;
    border-radius: 20px;
    height: 40px;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
  }
  
  :deep(.el-input__prefix) {
    color: rgba(255, 255, 255, 0.7);
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.icon-button {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  height: 40px;
  width: 40px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.notification-icon {
  margin-right: $spacing-md;
}

.language-selector {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  cursor: pointer;
  color: white;
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  background: rgba(255, 255, 255, 0.1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius;
  transition: background-color $transition-fast;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-details {
  margin-left: $spacing-sm;
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
  font-size: $font-size-sm;
}

.user-role {
  font-size: $font-size-xs;
  opacity: 0.8;
}

.notification-list {
  padding: $spacing-md;
}

.empty-notifications {
  padding: $spacing-xl 0;
  text-align: center;
}

.notification-item {
  display: flex;
  padding: $spacing-md;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: all $transition-fast;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: var(--el-fill-color-light);
  }
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: $spacing-md;
  
  &.info {
    background-color: var(--el-color-info-light-9);
    color: var(--el-color-info);
  }
  
  &.success {
    background-color: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }
  
  &.warning {
    background-color: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
  }
  
  &.error {
    background-color: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
  
  .el-icon {
    font-size: 20px;
  }
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  margin-bottom: $spacing-xs;
  color: var(--el-text-color-primary);
}

.notification-message {
  font-size: $font-size-sm;
  color: var(--el-text-color-regular);
  margin-bottom: $spacing-xs;
}

.notification-time {
  font-size: $font-size-xs;
  color: var(--el-text-color-secondary);
}

.notification-actions {
  display: flex;
  align-items: center;
}
</style> 