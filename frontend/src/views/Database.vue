<template>
  <div class="database-page">
    <div class="page-header">
      <h1 class="title">{{ $t('database.title') }}</h1>
      <div class="actions">
        <el-button type="primary" @click="showAddForm = true">
          <el-icon><el-icon-plus /></el-icon>{{ $t('database.addNew') }}
        </el-button>
        <el-button type="success">
          <el-icon><el-icon-upload /></el-icon>{{ $t('database.import') }}
        </el-button>
        <el-button type="info">
          <el-icon><el-icon-download /></el-icon>{{ $t('database.export') }}
        </el-button>
      </div>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        :placeholder="$t('database.searchKey')"
        prefix-icon="el-icon-search"
        clearable
      />
      <el-select v-model="filterType" :placeholder="$t('database.dataType')" style="width: 120px; margin-left: 10px;">
        <el-option :label="$t('database.all')" value="" />
        <el-option :label="$t('database.string')" value="string" />
        <el-option :label="$t('database.number')" value="number" />
        <el-option :label="$t('database.object')" value="object" />
        <el-option :label="$t('database.array')" value="array" />
      </el-select>
    </div>
    
    <div class="database-content">
      <el-card class="data-table-card">
        <KeyValueTable 
          :data="filteredData" 
          @view="handleView"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </el-card>
    </div>
    
    <el-dialog
      v-model="showAddForm"
      :title="$t('database.addNewItem')"
      width="50%"
    >
      <KeyValueForm @submit="handleAddSubmit" @cancel="showAddForm = false" />
    </el-dialog>
    
    <el-dialog
      v-model="showEditForm"
      :title="$t('database.editItem')"
      width="50%"
    >
      <KeyValueForm 
        v-if="currentItem" 
        :initial-data="currentItem" 
        @submit="handleEditSubmit" 
        @cancel="showEditForm = false" 
      />
    </el-dialog>
    
    <el-dialog
      v-model="showViewer"
      :title="$t('database.dataDetails')"
      width="60%"
    >
      <KeyValueViewer v-if="currentItem" :data="currentItem" />
    </el-dialog>
    
    <el-dialog
      v-model="showDeleteConfirm"
      :title="$t('database.confirmDelete')"
      width="30%"
    >
      <span>{{ $t('database.deleteWarning') }}</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteConfirm = false">{{ $t('database.cancel') }}</el-button>
          <el-button type="danger" @click="confirmDelete">{{ $t('database.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import KeyValueTable from '@/components/database/KeyValueTable.vue'
import KeyValueForm from '@/components/database/KeyValueForm.vue'
import KeyValueViewer from '@/components/database/KeyValueViewer.vue'

export default {
  name: 'DatabasePage',
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
    
    const searchQuery = ref('')
    const filterType = ref('')
    
    const showAddForm = ref(props.showAddForm)
    const showEditForm = ref(false)
    const showViewer = ref(false)
    const showDeleteConfirm = ref(false)
    const currentItem = ref(null)
    const itemToDelete = ref(null)
    
    const kvData = computed(() => store.getters.getKvData)
    
    const filteredData = computed(() => {
      return kvData.value.filter(item => {
        const matchesSearch = searchQuery.value ? item.key.toLowerCase().includes(searchQuery.value.toLowerCase()) : true
        const matchesType = filterType.value ? item.type === filterType.value : true
        return matchesSearch && matchesType
      })
    })
    
    const handleView = (item) => {
      currentItem.value = item
      showViewer.value = true
    }
    
    const handleEdit = (item) => {
      currentItem.value = item
      showEditForm.value = true
    }
    
    const handleDelete = (item) => {
      itemToDelete.value = item
      showDeleteConfirm.value = true
    }
    
    const confirmDelete = () => {
      if (itemToDelete.value) {
        store.dispatch('deleteKvItem', itemToDelete.value.key)
        ElMessage.success('删除成功')
        showDeleteConfirm.value = false
        itemToDelete.value = null
      }
    }
    
    const handleAddSubmit = (formData) => {
      store.dispatch('addKvItem', formData)
      ElMessage.success('添加成功')
      showAddForm.value = false
    }
    
    const handleEditSubmit = (formData) => {
      store.dispatch('updateKvItem', { key: currentItem.value.key, updatedItem: formData })
      ElMessage.success('更新成功')
      showEditForm.value = false
    }
    
    onMounted(() => {
      // 如果是从其他页面导航过来的，可能需要显示特定的表单
      if (props.showAddForm) {
        showAddForm.value = true
      }
      
      if (props.showImportExport) {
        // 显示导入导出界面的逻辑
      }
    })
    
    return {
      searchQuery,
      filterType,
      filteredData,
      showAddForm,
      showEditForm,
      showViewer,
      showDeleteConfirm,
      currentItem,
      handleView,
      handleEdit,
      handleDelete,
      confirmDelete,
      handleAddSubmit,
      handleEditSubmit
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
  margin-bottom: 24px;
}

.search-bar {
  display: flex;
  margin-bottom: 20px;
}

.database-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.data-table-card {
  border: none;
  box-shadow: none;
}
</style> 