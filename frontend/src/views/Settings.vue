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
          <el-tag v-if="isDbConnected" type="success">{{ $t('settings.connected') }}</el-tag>
          <el-tag v-else type="danger">{{ $t('settings.disconnected') }}</el-tag>
        </div>
      </template>
      
      <el-form :model="dbSettings" label-width="120px" :rules="dbRules" ref="dbFormRef">
        <el-form-item :label="$t('settings.connectionAddress')" prop="host">
          <el-input v-model="dbSettings.host" />
        </el-form-item>
        
        <el-form-item :label="$t('settings.port')" prop="port">
          <el-input-number v-model="dbSettings.port" :min="1" :max="65535" />
        </el-form-item>
        
        <el-form-item :label="$t('settings.username')" prop="username">
          <el-input v-model="dbSettings.username" />
        </el-form-item>
        
        <el-form-item :label="$t('settings.password')" prop="password">
          <el-input 
            v-model="dbSettings.password" 
            type="password" 
            :placeholder="$t('settings.passwordPlaceholder')" 
            show-password 
          />
          <div class="form-help-text" v-if="isDbConnected">
            {{ $t('settings.passwordNotDisplayed') }}
          </div>
        </el-form-item>
        
        <el-form-item :label="$t('settings.timeout')" prop="timeout">
          <el-input-number v-model="dbSettings.timeout" :min="1" :max="60" />
        </el-form-item>
        
        <div class="form-actions">
          <el-button @click="resetSettings" :loading="disconnecting">{{ $t('settings.reset') }}</el-button>
          <el-button type="primary" @click="saveSettings" :loading="connecting">{{ $t('settings.saveSettings') }}</el-button>
        </div>
      </el-form>
      
      <el-alert
        v-if="connectionError"
        type="error"
        :title="$t('settings.connectionError')"
        :description="connectionError"
        show-icon
        style="margin-top: 15px; margin-bottom: 15px; width: 100%;"
      />
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import Message from '@/utils/message'

export default {
  name: 'Settings',
  setup() {
    const store = useStore()
    const { t, locale } = useI18n()
    const dbFormRef = ref(null)
    const connecting = ref(false)
    const disconnecting = ref(false)
    const connectionError = ref('')
    
    // 系统信息
    const browserInfo = navigator.userAgent
    const osInfo = navigator.platform
    
    // 数据库连接状态
    const isDbConnected = computed(() => store.getters.isDbConnected)
    
    // 设置
    const settings = reactive({
      theme: localStorage.getItem('theme') || 'light',
      language: locale.value
    })
    
    // 数据库设置
    const dbSettings = reactive({
      host: localStorage.getItem('db_host') || 'localhost',
      port: parseInt(localStorage.getItem('db_port') || '3306'),
      username: localStorage.getItem('db_username') || 'root',
      password: '',
      timeout: parseInt(localStorage.getItem('db_timeout') || '30')
    })
    
    // 当前连接配置
    const currentConnection = computed(() => {
      return store.state.dbConnection && store.state.dbConnection.config
    })
    
    // 主题切换
    const handleThemeChange = (theme) => {
      localStorage.setItem('theme', theme)
      store.commit('SET_THEME', theme)
      
      // 应用主题
      if (theme === 'dark') {
        document.documentElement.classList.add('dark-mode')
      } else {
        document.documentElement.classList.remove('dark-mode')
      }
    }
    
    // 语言切换
    const handleLanguageChange = (lang) => {
      locale.value = lang
      localStorage.setItem('locale', lang)
    }
    
    // 表单验证规则
    const dbRules = {
      host: [
        { required: true, message: t('settings.hostRequired'), trigger: 'blur' }
      ],
      port: [
        { required: true, message: t('settings.portRequired'), trigger: 'blur' }
      ],
      username: [
        { required: true, message: t('settings.usernameRequired'), trigger: 'blur' }
      ]
    }
    
    // 保存数据库设置
    const saveSettings = async () => {
      try {
        // 验证表单
        await dbFormRef.value.validate()
        
        connecting.value = true
        connectionError.value = ''
        
        // 准备连接参数
        const connectionParams = {
          host: dbSettings.host,
          port: dbSettings.port.toString(),
          username: dbSettings.username,
          timeout: dbSettings.timeout.toString()
        }
        
        // 如果用户输入了新密码，使用新密码
        if (dbSettings.password) {
          connectionParams.password = dbSettings.password
        } 
        // 如果用户没有输入新密码但已经连接，保留现有密码
        else if (isDbConnected.value && currentConnection.value && currentConnection.value.password) {
          connectionParams.password = currentConnection.value.password
        }
        // 否则使用空密码
        else {
          connectionParams.password = ''
        }
        
        try {
          // 连接数据库
          const response = await store.dispatch('connectToDb', connectionParams)
          
          // 保存设置到localStorage
          localStorage.setItem('db_host', dbSettings.host)
          localStorage.setItem('db_port', dbSettings.port.toString())
          localStorage.setItem('db_username', dbSettings.username)
          localStorage.setItem('db_timeout', dbSettings.timeout.toString())
          
          ElMessage.success(t('settings.saveSuccess'))
        } catch (error) {
          console.error('连接数据库失败:', error)
          connectionError.value = error.message || t('settings.connectionFailed')
          ElMessage.error(t('settings.saveFailed'))
        } finally {
          connecting.value = false
        }
      } catch (formError) {
        console.error('表单验证失败:', formError)
        ElMessage.error(t('settings.formValidationFailed'))
      }
    }
    
    // 重置连接
    const resetSettings = async () => {
      try {
        disconnecting.value = true
        connectionError.value = ''
        
        // 调用关闭连接的API
        await store.dispatch('closeDbConnection')
        
        // 清空密码字段
        dbSettings.password = ''
        
        // 显示成功消息
        ElMessage.success(t('settings.connectionClosed'))
      } catch (error) {
        console.error('重置连接失败:', error)
        connectionError.value = error.message || t('settings.failedToClose')
        ElMessage.error(t('settings.failedToClose'))
      } finally {
        disconnecting.value = false
      }
    }
    
    // 初始化表单数据
    const initFormData = () => {
      // 如果已连接且有配置信息，使用当前连接的配置
      if (isDbConnected.value && currentConnection.value) {
        dbSettings.host = currentConnection.value.host || 'localhost'
        dbSettings.port = currentConnection.value.port || 3306
        dbSettings.username = currentConnection.value.username || 'root'
        dbSettings.password = currentConnection.value.password || ''
        dbSettings.timeout = currentConnection.value.timeout || 30
      }
    }
    
    // 组件挂载时检查连接状态
    onMounted(async () => {
      try {
        await store.dispatch('checkDbConnection')
        // 初始化表单数据
        initFormData()
      } catch (error) {
        console.error('检查连接状态失败:', error)
      }
    })
    
    // 监听连接状态变化
    watch(() => isDbConnected.value, (newVal) => {
      if (newVal) {
        // 连接状态改变时更新表单
        initFormData()
      }
    })
    
    return {
      settings,
      dbSettings,
      dbFormRef,
      dbRules,
      isDbConnected,
      connecting,
      disconnecting,
      connectionError,
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

.form-help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}
</style> 