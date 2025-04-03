<template>
  <header class="app-header" :class="{ 'dark-mode': isDarkMode }">
    <div class="logo-container">
      <img src="@/assets/logo.svg" alt="Logo" class="logo" />
      <h1 class="app-title">{{ $t('header.title') }}</h1>
    </div>
    <div class="header-actions">
      <!-- 主题切换按钮 -->
      <el-button
        class="theme-toggle"
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
        <span class="user-info">
          <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar>
          <span class="username">{{ $t('header.admin') }}</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>{{ $t('header.userCenter') }}</el-dropdown-item>
            <el-dropdown-item @click="$router.push('/settings')">{{ $t('header.settings') }}</el-dropdown-item>
            <el-dropdown-item divided>{{ $t('header.logout') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

export default {
  name: 'AppHeader',
  setup() {
    const store = useStore()
    const { locale } = useI18n()
    
    // 获取当前主题
    const isDarkMode = computed(() => store.state.theme === 'dark')
    
    // 切换主题
    const toggleTheme = () => {
      const newTheme = isDarkMode.value ? 'light' : 'dark'
      store.dispatch('setTheme', newTheme)
    }
    
    // 当前语言标签
    const currentLanguageLabel = computed(() => {
      return locale.value === 'zh-CN' ? '简体中文' : 'English'
    })
    
    // 切换语言
    const handleLanguageChange = (lang) => {
      locale.value = lang
      // 可以将语言偏好保存到本地存储
      localStorage.setItem('language', lang)
    }
    
    return {
      isDarkMode,
      toggleTheme,
      currentLanguageLabel,
      handleLanguageChange
    }
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  height: $header-height;
  background: linear-gradient(90deg, $primary-color, $secondary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 10;
  
  &.dark-mode {
    background: linear-gradient(90deg, #001529, #003366);
  }
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  height: 36px;
  margin-right: 12px;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.theme-toggle {
  color: white;
  background: transparent;
  border: none;
  
  &:hover, &:focus {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
}

.language-dropdown {
  margin-right: 8px;
}

.language-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: white;
  font-size: 14px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 8px;
  font-size: 14px;
}
</style> 