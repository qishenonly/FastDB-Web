<template>
  <div class="kv-table">
    <el-table
      :data="data"
      style="width: 100%"
      border
      stripe
      highlight-current-row
      :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
    >
      <el-table-column prop="key" :label="$t('table.key')" min-width="180">
        <template #default="{ row }">
          <el-tooltip :content="row.key" placement="top" :show-after="1000">
            <span class="key-cell">{{ row.key }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      
      <el-table-column prop="value" :label="$t('table.value')" min-width="250">
        <template #default="{ row }">
          <el-tooltip :content="row.value" placement="top" :show-after="1000">
            <div class="value-cell">
              <span v-if="row.value.length > 100">{{ row.value.substring(0, 100) }}...</span>
              <span v-else>{{ row.value }}</span>
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
      
      <el-table-column prop="type" :label="$t('table.type')" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.type)">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="updatedAt" :label="$t('table.updatedAt')" width="120" />
      
      <el-table-column :label="$t('table.actions')" width="250" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="$emit('view', row)">
            {{ $t('table.view') }}
          </el-button>
          <el-button size="small" type="warning" @click="$emit('edit', row)">
            {{ $t('table.edit') }}
          </el-button>
          <el-button size="small" type="danger" @click="$emit('delete', row)">
            {{ $t('table.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        background
        layout="prev, pager, next, sizes, total"
        :total="100"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="10"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'KeyValueTable',
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  emits: ['view', 'edit', 'delete'],
  setup() {
    const getTypeTagType = (type) => {
      const typeMap = {
        'string': '',
        'number': 'success',
        'object': 'warning',
        'array': 'info'
      }
      return typeMap[type] || 'info'
    }
    
    return {
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
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #409eff;
}

.value-cell {
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 