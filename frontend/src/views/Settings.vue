<template>
  <div class="settings-page">
    <h1 class="title">{{ $t('settings.title') }}</h1>
    
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('settings.basicSettings') }}</span>
        </div>
      </template>
      
      <el-form :model="settings" label-width="120px">
        <el-form-item :label="$t('settings.themeMode')">
          <el-radio-group v-model="settings.theme" @change="handleThemeChange">
            <el-radio-button label="light">{{ $t('settings.lightTheme') }}</el-radio-button>
            <el-radio-button label="dark">{{ $t('settings.darkTheme') }}</el-radio-button>
            <el-radio-button label="auto">{{ $t('settings.autoTheme') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item :label="$t('settings.language')">
          <el-select v-model="settings.language" style="width: 200px;" @change="handleLanguageChange">
            <el-option :label="'简体中文'" value="zh-CN" />
            <el-option :label="'English'" value="en-US" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('settings.databaseSettings') }}</span>
        </div>
      </template>
      
      <el-form :model="dbSettings" label-width="120px">
        <el-form-item :label="$t('settings.connectionAddress')">
          <el-input v-model="dbSettings.host" placeholder="localhost" style="width: 300px;" />
        </el-form-item>
        
        <el-form-item :label="$t('settings.port')">
          <el-input-number v-model="dbSettings.port" :min="1" :max="65535" style="width: 200px;" />
        </el-form-item>
        
        <el-form-item :label="$t('settings.username')">
          <el-input v-model="dbSettings.username" placeholder="admin" style="width: 300px;" />
        </el-form-item>
        
        <el-form-item :label="$t('settings.password')">
          <el-input v-model="dbSettings.password" type="password" :placeholder="$t('settings.enterPassword')" style="width: 300px;" show-password />
        </el-form-item>
        
        <el-form-item :label="$t('settings.timeout')">
          <el-input-number v-model="dbSettings.timeout" :min="1" :max="60" style="width: 200px;" />
        </el-form-item>
      </el-form>
      
      <div class="form-actions">
        <el-button type="primary" @click="saveSettings">{{ $t('settings.saveSettings') }}</el-button>
        <el-button @click="resetSettings">{{ $t('settings.reset') }}</el-button>
      </div>
    </el-card>
    
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('settings.systemInfo') }}</span>
        </div>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="$t('settings.systemVersion')">v1.0.0</el-descriptions-item>
        <el-descriptions-item :label="$t('settings.lastUpdate')">2023-06-20</el-descriptions-item>
        <el-descriptions-item :label="$t('settings.databaseEngine')">FastDB v1.0.0</el-descriptions-item>
        <el-descriptions-item :label="$t('settings.apiVersion')">v1.0.0</el-descriptions-item>
        <el-descriptions-item :label="$t('settings.browser')">{{ browserInfo }}</el-descriptions-item>
        <el-descriptions-item :label="$t('settings.operatingSystem')">{{ osInfo }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script>
import { reactive, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

export default {
  name: 'SettingsPage',
  setup() {
    const store = useStore()
    const { locale } = useI18n()
    
    // 获取当前主题和语言
    const settings = reactive({
      theme: store.state.theme,
      language: locale.value
    })
    
    const dbSettings = reactive({
      host: 'localhost',
      port: 6379,
      username: 'admin',
      password: '',
      timeout: 10
    })
    
    const browserInfo = ref('')
    const osInfo = ref('')
    
    onMounted(() => {
      // 获取浏览器信息
      browserInfo.value = navigator.userAgent
      
      // 获取操作系统信息
      const userAgent = navigator.userAgent
      if (userAgent.indexOf('Win') !== -1) osInfo.value = 'Windows'
      else if (userAgent.indexOf('Mac') !== -1) osInfo.value = 'MacOS'
      else if (userAgent.indexOf('Linux') !== -1) osInfo.value = 'Linux'
      else if (userAgent.indexOf('Android') !== -1) osInfo.value = 'Android'
      else if (userAgent.indexOf('iOS') !== -1) osInfo.value = 'iOS'
      else osInfo.value = 'Unknown'
    })
    
    // 处理主题变更
    const handleThemeChange = (theme) => {
      if (theme === 'auto') {
        // 自动模式下根据系统偏好设置主题
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        store.dispatch('setTheme', prefersDark ? 'dark' : 'light')
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
          store.dispatch('setTheme', e.matches ? 'dark' : 'light')
        })
      } else {
        store.dispatch('setTheme', theme)
      }
    }
    
    // 处理语言变更
    const handleLanguageChange = (lang) => {
      locale.value = lang
      localStorage.setItem('language', lang)
      ElMessage.success(lang === 'zh-CN' ? '语言已更改' : 'Language changed')
    }
    
    // 保存设置
    const saveSettings = () => {
      // 保存数据库设置
      localStorage.setItem('dbSettings', JSON.stringify(dbSettings))
      ElMessage.success(locale.value === 'zh-CN' ? '设置已保存' : 'Settings saved')
    }
    
    // 重置设置
    const resetSettings = () => {
      settings.theme = 'light'
      settings.language = 'zh-CN'
      
      // 应用重置的设置
      handleThemeChange('light')
      handleLanguageChange('zh-CN')
      
      dbSettings.host = 'localhost'
      dbSettings.port = 6379
      dbSettings.username = 'admin'
      dbSettings.password = ''
      dbSettings.timeout = 10
      
      ElMessage.info(locale.value === 'zh-CN' ? '设置已重置' : 'Settings reset')
    }
    
    return {
      settings,
      dbSettings,
      browserInfo,
      osInfo,
      handleThemeChange,
      handleLanguageChange,
      saveSettings,
      resetSettings
    }
  }
}
</script>

<style lang="scss" scoped>
.settings-page {
  padding-bottom: 30px;
}

.settings-card {
  margin-bottom: 20px;
  
  .card-header {
    font-weight: 600;
  }
}

.form-actions {
  margin-top: 20px;
  text-align: right;
}
</style> 