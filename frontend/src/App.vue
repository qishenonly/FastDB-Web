<template>
  <div id="app" class="app-container">
    <Header />
    <div class="main-content">
      <Sidebar />
      <div class="page-content">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </div>
    </div>
    
    <!-- 数据库连接提示对话框 -->
    <el-dialog
      v-model="showConnectionDialog"
      :title="$t('database.connectionRequired')"
      width="30%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="connection-dialog-content">
        <el-alert
          type="warning"
          :title="$t('database.pleaseConnectFirst')"
          :description="$t('database.goToSettingsDescription')"
          show-icon
          :closable="false"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="goToSettings">
            {{ $t('database.goToSettings') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Header from '@/components/common/Header.vue'
import Sidebar from '@/components/common/Sidebar.vue'
import { setDarkMode, getCurrentTheme } from '@/utils/theme'

export default {
  name: 'App',
  components: {
    Header,
    Sidebar
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()
    
    // 数据库连接对话框
    const showConnectionDialog = ref(false)
    
    // 数据库连接状态
    const isDbConnected = computed(() => store.getters.isDbConnected)
    
    // 检查数据库连接状态
    const checkDbConnection = async () => {
      try {
        const response = await store.dispatch('checkDbConnection')
        
        // 如果连接成功，尝试获取键值对数据
        if (response && response.status === 'success') {
          try {
            // 始终获取一次初始数据，确保数据存在
            await store.dispatch('fetchKeyValueData')
            store.commit('SET_DATA_INITIALIZED', true)
          } catch (error) {
            console.error('获取键值对数据失败:', error)
          }
        }
      } catch (error) {
        console.error('检查数据库连接失败:', error)
      }
    }
    
    // 监听路由变化，检查数据库连接状态
    watch(() => route.path, (newPath) => {
      // 如果不是设置页面，且数据库未连接，显示连接提示
      if (newPath !== '/settings' && !isDbConnected.value) {
        showConnectionDialog.value = true
      } else {
        showConnectionDialog.value = false
      }
    }, { immediate: true })
    
    // 监听数据库连接状态变化
    watch(() => isDbConnected.value, (newVal) => {
      // 如果连接状态变为已连接，关闭提示对话框
      if (newVal) {
        showConnectionDialog.value = false
      } 
      // 如果连接状态变为未连接，且不在设置页面，显示提示对话框
      else if (route.path !== '/settings') {
        showConnectionDialog.value = true
      }
    })
    
    // 跳转到设置页面
    const goToSettings = () => {
      showConnectionDialog.value = false
      router.push('/settings')
    }
    
    // 初始化主题和检查数据库连接
    onMounted(async () => {
      // 从localStorage获取主题设置
      const isDark = getCurrentTheme()
      setDarkMode(isDark)
      
      // 检查数据库连接状态
      await checkDbConnection()
      
      // 如果数据库未连接且不在设置页面，显示连接提示
      if (!isDbConnected.value && route.path !== '/settings') {
        showConnectionDialog.value = true
      }
    })
    
    return {
      showConnectionDialog,
      goToSettings
    }
  }
}
</script>

<style lang="scss">
@import './styles/main.scss';

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.el-card {
  margin-bottom: $spacing-md;
  border-radius: $border-radius;
  border: 1px solid $border-color;
  box-shadow: $shadow;
  transition: all $transition;
  
  &:hover {
    box-shadow: $shadow-md;
  }
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.connection-dialog-content {
  margin-bottom: 20px;
}
</style> 