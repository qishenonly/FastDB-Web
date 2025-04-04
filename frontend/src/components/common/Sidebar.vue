<template>
  <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-content">
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="isCollapsed"
        background-color="transparent"
        text-color="var(--el-text-color-primary)"
        active-text-color="var(--el-color-primary)"
        router
      >
        <div class="menu-header">
          <span v-if="!isCollapsed">{{ $t('sidebar.navigation') }}</span>
        </div>
        
        <el-menu-item index="/dashboard" class="menu-item">
          <el-icon><HomeFilled /></el-icon>
          <template #title>
            <span>{{ $t('sidebar.dashboard') }}</span>
          </template>
        </el-menu-item>
        
        <el-sub-menu index="database" class="menu-item">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>{{ $t('sidebar.dataManagement') }}</span>
          </template>
          <el-menu-item index="/database/browse" class="submenu-item">
            <el-icon><Grid /></el-icon>
            {{ $t('sidebar.browseDatabases') }}
          </el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/settings" class="menu-item">
          <el-icon><Setting /></el-icon>
          <template #title>
            <span>{{ $t('sidebar.settings') }}</span>
          </template>
        </el-menu-item>
      </el-menu>
    </div>
    
    <div class="sidebar-footer">
      <div class="collapse-button" @click="toggleCollapse">
        <el-icon v-if="isCollapsed"><ArrowRight /></el-icon>
        <el-icon v-else><ArrowLeft /></el-icon>
      </div>
      <div class="version" v-if="!isCollapsed">v1.0.0</div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'AppSidebar',
  setup() {
    const route = useRoute()
    const store = useStore()
    
    const isCollapsed = ref(false)
    
    const activeMenu = computed(() => {
      return route.path
    })
    
    const toggleCollapse = () => {
      isCollapsed.value = !isCollapsed.value
      store.commit('SET_SIDEBAR_COLLAPSED', isCollapsed.value)
    }
    
    // 从store获取侧边栏状态
    watch(() => store.state.sidebarCollapsed, (newVal) => {
      isCollapsed.value = newVal
    }, { immediate: true })
    
    return {
      activeMenu,
      isCollapsed,
      toggleCollapse
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebar {
  width: $sidebar-width;
  height: 100%;
  background-color: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-sm;
  transition: width $transition;
  position: relative;
  
  &.collapsed {
    width: 64px;
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
}

.sidebar-menu {
  height: 100%;
  border-right: none;
  padding: $spacing-md 0;
}

.menu-header {
  padding: $spacing-sm $spacing-md;
  color: var(--el-text-color-secondary);
  font-size: $font-size-xs;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: $spacing-sm;
}

.menu-item {
  margin: $spacing-xs 0;
  border-radius: 0;
  
  &.is-active {
    background: linear-gradient(to right, rgba(var(--el-color-primary-rgb), 0.1), transparent);
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 4px;
      background-color: var(--el-color-primary);
      border-radius: 0 2px 2px 0;
    }
  }
}

.submenu-item {
  padding-left: $spacing-lg !important;
}

.sidebar-footer {
  padding: $spacing-md;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.collapse-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all $transition-fast;
  
  &:hover {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
}

.version {
  font-size: $font-size-xs;
  color: var(--el-text-color-secondary);
}
</style> 