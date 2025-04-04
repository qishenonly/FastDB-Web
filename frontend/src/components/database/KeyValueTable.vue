<template>
  <div class="kv-table">
    <el-table
      :data="data"
      style="width: 100%"
      border
      stripe
      highlight-current-row
      :empty-text="$t('table.noData')"
      v-loading="loading"
      element-loading-text="Loading..."
      element-loading-background="rgba(255, 255, 255, 0.8)"
    >
      <el-table-column prop="key" :label="$t('table.key')" min-width="180">
        <template #default="{ row }">
          <div class="key-cell">
            <el-tooltip :content="row.key" placement="top" :show-after="1000">
              <span class="key-text">{{ row.key }}</span>
            </el-tooltip>
            <el-tag size="small" :type="getTypeTagType(row.type)" class="type-tag">
              {{ row.type }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="value" :label="$t('table.value')" min-width="250">
        <template #default="{ row }">
          <el-tooltip :content="row.value" placement="top" :show-after="1000">
            <div class="value-cell">
              <span v-if="row.value.length > 100">{{ formatValue(row.value, row.type).substring(0, 100) }}...</span>
              <span v-else>{{ formatValue(row.value, row.type) }}</span>
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
      
      <el-table-column prop="type" :label="$t('table.type')" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.type)">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="updatedAt" :label="$t('table.updatedAt')" width="180" align="center">
        <template #default="{ row }">
          <div class="time-cell">
            <el-icon><Timer /></el-icon>
            <span>{{ formatDate(row.updatedAt) }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column :label="$t('table.actions')" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-tooltip :content="$t('common.view')" placement="top">
              <el-button type="primary" circle size="small" @click="$emit('view', row)">
                <el-icon><View /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip :content="$t('common.edit')" placement="top">
              <el-button type="warning" circle size="small" @click="$emit('edit', row)">
                <el-icon><Edit /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip :content="$t('common.delete')" placement="top">
              <el-button type="danger" circle size="small" @click="$emit('delete', row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container" v-if="data.length > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="data.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { format } from 'date-fns'

export default {
  name: 'KeyValueTable',
  props: {
    data: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['view', 'edit', 'delete', 'page-change'],
  setup(props, { emit }) {
    const currentPage = ref(1)
    const pageSize = ref(10)
    
    const paginatedData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return props.data.slice(start, end)
    })
    
    const handleSizeChange = (size) => {
      pageSize.value = size
      emit('page-change', { page: currentPage.value, size })
    }
    
    const handleCurrentChange = (page) => {
      currentPage.value = page
      emit('page-change', { page, size: pageSize.value })
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return '未知时间';
      
      try {
        const date = new Date(dateString)
        return format(date, 'yyyy-MM-dd HH:mm:ss')
      } catch (e) {
        return dateString || '未知时间'
      }
    }
    
    const formatValue = (value, type) => {
      if (type === 'object' || type === 'array') {
        try {
          const parsed = JSON.parse(value)
          return JSON.stringify(parsed, null, 2)
        } catch (e) {
          return value
        }
      }
      return value
    }
    
    const getTypeTagType = (type) => {
      switch (type) {
        case 'string': return ''
        case 'number': return 'success'
        case 'object': return 'warning'
        case 'array': return 'info'
        default: return 'info'
      }
    }
    
    return {
      currentPage,
      pageSize,
      paginatedData,
      handleSizeChange,
      handleCurrentChange,
      formatDate,
      formatValue,
      getTypeTagType
    }
  }
}
</script>

<style lang="scss" scoped>
.kv-table {
  width: 100%;
}

.key-cell {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  
  .key-text {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: $primary-color;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .type-tag {
    flex-shrink: 0;
  }
}

.value-cell {
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
  padding: $spacing-xs 0;
  color: $text-color-secondary;
}

.time-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  color: $text-color-secondary;
  font-size: $font-size-sm;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: $spacing-xs;
}

.pagination-container {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: flex-end;
}
</style> 