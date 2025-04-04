<template>
  <div id="app" class="app-container">
    <Header />
    <div class="main-content">
      <Sidebar />
      <div class="page-content">
        <router-view />
      </div>
    </div>
    
    <!-- 数据库连接提示 -->
    <el-dialog
      v-model="showConnectionDialog"
      title="数据库连接提示"
      width="30%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="connection-dialog-content">
        <el-alert
          type="warning"
          :title="$t('database.connectionRequired')"
          :description="$t('database.pleaseConnectFirst')"
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
import { ref, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import Header from '@/components/common/Header.vue'
import Sidebar from '@/components/common/Sidebar.vue'

export default {
  name: 'App',
  components: {
    Header,
    Sidebar
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    
    // 数据库连接对话框
    const showConnectionDialog = ref(false)
    
    // 检查数据库连接状态
    const checkDbConnection = async () => {
      try {
        await store.dispatch('checkDbConnection')
      } catch (error) {
        console.error('数据库连接检查失败:', error)
        // 如果是在设置页面，不显示对话框
        if (router.currentRoute.value.path !== '/settings') {
          showConnectionDialog.value = true
        }
      }
    }
    
    // 跳转到设置页面
    const goToSettings = () => {
      showConnectionDialog.value = false
      router.push('/settings')
    }
    
    onMounted(() => {
      // 初始检查数据库连接
      checkDbConnection()
      
      // 每60秒检查一次数据库连接
      const interval = setInterval(checkDbConnection, 60000)
      
      // 组件卸载时清除定时器
      return () => clearInterval(interval)
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
  background-color: #f5f7fa;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
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