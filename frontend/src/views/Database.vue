<template>
  <div class="database-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('database.title') }}</h1>
        <p class="page-subtitle">{{ $t('database.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <el-button-group>
          <el-button type="primary" @click="showAddForm = true">
            <el-icon><Plus /></el-icon>
            {{ $t('database.addNew') }}
          </el-button>
          <el-button type="primary" @click="exportData">
            <el-icon><Download /></el-icon>
            {{ $t('database.export') }}
          </el-button>
        </el-button-group>
      </div>
    </div>
    
    <el-card class="filter-card">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          :placeholder="$t('database.searchKey')"
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-select v-model="filterType" :placeholder="$t('database.dataType')" class="filter-select">
          <el-option :label="$t('database.all')" value="" />
          <el-option :label="$t('database.string')" value="string">
            <div class="option-with-icon">
              <el-icon><Document /></el-icon>
              <span>{{ $t('database.string') }}</span>
            </div>
          </el-option>
          <el-option :label="$t('database.number')" value="number">
            <div class="option-with-icon">
              <el-icon><Odometer /></el-icon>
              <span>{{ $t('database.number') }}</span>
            </div>
          </el-option>
          <el-option :label="$t('database.object')" value="object">
            <div class="option-with-icon">
              <el-icon><Files /></el-icon>
              <span>{{ $t('database.object') }}</span>
            </div>
          </el-option>
          <el-option :label="$t('database.array')" value="array">
            <div class="option-with-icon">
              <el-icon><Collection /></el-icon>
              <span>{{ $t('database.array') }}</span>
            </div>
          </el-option>
        </el-select>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          {{ $t('database.refresh') }}
        </el-button>
      </div>
      
      <el-divider>
        <el-icon><DataAnalysis /></el-icon>
      </el-divider>
      
      <div class="data-stats" v-if="kvData && kvData.length > 0">
        <div class="stat-item">
          <div class="stat-value">{{ filteredData.length }}</div>
          <div class="stat-label">{{ $t('database.filteredItems') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ kvData.length }}</div>
          <div class="stat-label">{{ $t('database.totalItems') }}</div>
        </div>
        <div class="stat-item" v-if="filterType">
          <div class="stat-value">{{ (filteredData.length / kvData.length * 100).toFixed(1) }}%</div>
          <div class="stat-label">{{ $t('database.percentage') }}</div>
        </div>
      </div>
    </el-card>
    
    <div class="database-content" v-if="!showAddForm && !showEditForm && !showViewer">
      <el-card class="data-table-card">
        <KeyValueTable 
          :data="filteredData || []" 
          :loading="loading"
          @view="viewItem"
          @edit="editItem"
          @delete="deleteItem"
        />
      </el-card>
    </div>
    
    <!-- 查看数据详情对话框 -->
    <el-dialog
      v-model="showViewDialog"
      :title="$t('database.dataDetails')"
      width="60%"
      destroy-on-close
    >
      <KeyValueViewer :data="currentItem" v-if="currentItem" />
    </el-dialog>
    
    <!-- 添加新键值对对话框 -->
    <el-dialog
      v-model="showAddForm"
      :title="$t('database.addNewItem')"
      width="50%"
      destroy-on-close
    >
      <KeyValueForm @submit="handleAddSubmit" />
    </el-dialog>
    
    <!-- 编辑键值对对话框 -->
    <el-dialog
      v-model="showEditForm"
      :title="$t('database.editItem')"
      width="50%"
      destroy-on-close
    >
      <KeyValueForm 
        v-if="currentItem" 
        :initial-data="currentItem" 
        @submit="handleEditSubmit" 
      />
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="showDeleteConfirm"
      :title="$t('database.confirmDelete')"
      width="30%"
    >
      <span>{{ $t('database.deleteWarning') }}</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteConfirm = false">
            {{ $t('database.cancel') }}
          </el-button>
          <el-button type="danger" @click="confirmDelete">
            {{ $t('database.confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import KeyValueTable from '@/components/database/KeyValueTable.vue'
import KeyValueForm from '@/components/database/KeyValueForm.vue'
import KeyValueViewer from '@/components/database/KeyValueViewer.vue'
// 导入消息工具类
import Message from '@/utils/message'
import { format } from 'date-fns'

export default {
  name: 'Database',
  components: {
    KeyValueTable,
    KeyValueForm,
    KeyValueViewer
  },
  props: {
    showAddForm: {
      type: Boolean,
      default: false
    },
    showImportExport: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()
    
    const searchQuery = ref('')
    const filterType = ref('')
    const loading = ref(false)
    
    const showAddForm = ref(props.showAddForm)
    const showEditForm = ref(false)
    const showViewDialog = ref(false)
    const showDeleteConfirm = ref(false)
    const currentItem = ref(null)
    const itemToDelete = ref(null)
    
    const isLoading = ref(false)
    const isDbConnected = ref(true)
    
    // 确保kvData有默认值
    const kvData = computed(() => store.state.kvData || [])
    
    // 过滤后的数据
    const filteredData = computed(() => {
      if (!kvData.value) return []
      
      return kvData.value.filter(item => {
        // 搜索过滤
        const matchesSearch = searchQuery.value === '' || 
          item.key.toLowerCase().includes(searchQuery.value.toLowerCase())
        
        // 类型过滤
        const matchesType = filterType.value === '' || item.type === filterType.value
        
        return matchesSearch && matchesType
      })
    })
    
    // 按类型统计数据
    const typeStats = computed(() => {
      if (!kvData.value) return { string: 0, number: 0, object: 0, array: 0 }
      
      return kvData.value.reduce((stats, item) => {
        stats[item.type] = (stats[item.type] || 0) + 1
        return stats
      }, {})
    })
    
    // 加载数据
    const loadData = async () => {
      loading.value = true
      try {
        await store.dispatch('fetchKeyValueData')
        Message.success('数据加载成功')
      } catch (error) {
        console.error('加载数据失败:', error)
        Message.error('加载数据失败: ' + (error.message || '未知错误'))
      } finally {
        loading.value = false
      }
    }
    
    // 刷新数据
    const refreshData = async () => {
      try {
        isLoading.value = true
        
        // 检查数据库连接状态
        await store.dispatch('checkDbConnection')
        
        // 获取最新数据
        if (isDbConnected.value) {
          await store.dispatch('fetchKeyValueData')
          // 更新本地数据引用
          kvData.value = store.state.kvData
          Message.success(t('common.success'))
        } else {
          Message.warning(t('database.connectionRequired'))
        }
      } catch (error) {
        console.error('刷新数据失败:', error)
        Message.error(t('common.error'))
      } finally {
        isLoading.value = false
      }
    }
    
    // 查看数据
    const viewItem = (item) => {
      currentItem.value = item
      showViewDialog.value = true
    }
    
    // 编辑数据
    const editItem = (item) => {
      currentItem.value = item
      showEditForm.value = true
    }
    
    // 删除数据
    const deleteItem = (item) => {
      itemToDelete.value = item
      showDeleteConfirm.value = true
    }
    
    // 确认删除
    const confirmDelete = () => {
      if (!itemToDelete.value) return
      
      store.dispatch('deleteKvItem', itemToDelete.value.key)
        .then(() => {
          showDeleteConfirm.value = false
          Message.success('删除成功')
          // 刷新数据
          loadData()
        })
        .catch(error => {
          console.error('删除失败:', error)
          Message.error('删除失败')
        })
    }
    
    // 添加数据
    const handleAddSubmit = (formData) => {
      store.dispatch('addKvItem', formData)
        .then(() => {
          showAddForm.value = false
          Message.success('添加成功')
          // 刷新数据
          loadData()
        })
        .catch(error => {
          console.error('添加失败:', error)
          Message.error('添加失败')
        })
    }
    
    // 更新数据
    const handleEditSubmit = (formData) => {
      store.dispatch('updateKvItem', { 
        key: currentItem.value.key, 
        updatedItem: formData 
      })
        .then(() => {
          showEditForm.value = false
          Message.success('更新成功')
          // 刷新数据
          loadData()
        })
        .catch(error => {
          console.error('更新失败:', error)
          Message.error('更新失败')
        })
    }
    
    // 导出数据
    const exportData = () => {
      // 准备导出数据
      const dataToExport = kvData.value.map(item => ({
        key: item.key,
        value: item.value,
        type: item.type
      }));
      
      // 转换为JSON字符串
      const jsonStr = JSON.stringify(dataToExport, null, 2);
      
      // 创建Blob对象
      const blob = new Blob([jsonStr], { type: 'application/json' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fastdb-export-${new Date().toISOString().slice(0, 10)}.json`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // 使用自定义消息工具类
      Message.success('数据导出成功')
    }
    
    // 监听路由变化，自动刷新数据
    watch(() => route.path, () => {
      if (route.path.startsWith('/database')) {
        refreshData()
      }
    })
    
    // 组件挂载时加载数据
    onMounted(() => {
      // 自动加载数据
      refreshData()
      
      // 如果是从其他页面导航过来的，可能需要显示特定的表单
      if (props.showAddForm) {
        showAddForm.value = true
      }
      
      if (props.showImportExport) {
        // 显示导入导出界面
      }
    })
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          return '-';
        }
        // 使用date-fns格式化日期
        return format(date, 'yyyy-MM-dd HH:mm:ss');
      } catch (e) {
        console.error('日期格式化错误:', e);
        return '-';
      }
    };
    
    return {
      searchQuery,
      filterType,
      kvData,
      filteredData,
      typeStats,
      loading,
      showAddForm,
      showEditForm,
      showViewDialog,
      showDeleteConfirm,
      currentItem,
      itemToDelete,
      viewItem,
      editItem,
      deleteItem,
      confirmDelete,
      handleAddSubmit,
      handleEditSubmit,
      exportData,
      refreshData,
      formatDate
    }
  }
}
</script>

<style lang="scss" scoped>
.database-page {
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
}

.page-title {
  font-size: $font-size-xxl;
  font-weight: 600;
  margin-bottom: $spacing-xs;
  background: linear-gradient(to right, $primary-color, $secondary-color);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  color: $text-color-secondary;
  font-size: $font-size-sm;
}

.filter-card {
  margin-bottom: $spacing-lg;
  box-shadow: $shadow-sm;
  border-radius: $border-radius;
  transition: all $transition;
  
  &:hover {
    box-shadow: $shadow;
  }
}

.search-bar {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-md;
}

.search-input {
  flex: 1;
}

.filter-select {
  width: 180px;
}

.option-with-icon {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  
  .el-icon {
    font-size: 16px;
  }
}

.data-stats {
  display: flex;
  justify-content: space-around;
  padding: $spacing-md 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $primary-color;
}

.stat-label {
  font-size: $font-size-sm;
  color: $text-color-secondary;
  margin-top: $spacing-xs;
}

.database-content {
  background-color: white;
  border-radius: $border-radius;
  box-shadow: $shadow-sm;
  transition: all $transition;
  
  &:hover {
    box-shadow: $shadow;
  }
}

.data-table-card {
  border: none;
  box-shadow: none;
}
</style> 