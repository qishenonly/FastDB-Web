<template>
  <div class="sidebar">
    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      background-color="#001529"
      text-color="#fff"
      active-text-color="#1890ff"
      router
    >
      <el-menu-item index="/dashboard">
        <el-icon><el-icon-monitor /></el-icon>
        <span>仪表盘</span>
      </el-menu-item>
      
      <el-sub-menu index="database">
        <template #title>
          <el-icon><el-icon-data-analysis /></el-icon>
          <span>数据管理</span>
        </template>
        <el-menu-item index="/database/browse">浏览数据</el-menu-item>
      </el-sub-menu>
      
      <el-menu-item index="/settings">
        <el-icon><el-icon-setting /></el-icon>
        <span>系统设置</span>
      </el-menu-item>
    </el-menu>
    
    <div class="sidebar-footer">
      <div class="version">版本 v1.0.0</div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'AppSidebar',
  setup() {
    const route = useRoute()
    
    const activeMenu = computed(() => {
      return route.path
    })
    
    return {
      activeMenu
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebar {
  width: $sidebar-width;
  height: 100%;
  background-color: #001529;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
  text-align: center;
}
</style> 