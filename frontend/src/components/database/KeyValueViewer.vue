<template>
  <div class="kv-viewer">
    <div class="viewer-header">
      <div class="key-info">
        <div class="key-label">{{ $t('viewer.key') }}:</div>
        <div class="key-value">{{ data.key }}</div>
      </div>
      <el-tag :type="getTypeTagType(data.type)" size="large" class="type-tag">
        {{ data.type }}
      </el-tag>
    </div>
    
    <div class="viewer-content">
      <div class="metadata">
        <div class="meta-item">
          <div class="meta-icon created-at">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="meta-content">
            <div class="meta-label">{{ $t('viewer.createdAt') }}:</div>
            <div class="meta-value">{{ formatDate(data.createdAt) }}</div>
          </div>
        </div>
        <div class="meta-item">
          <div class="meta-icon updated-at">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="meta-content">
            <div class="meta-label">{{ $t('viewer.updatedAt') }}:</div>
            <div class="meta-value">{{ formatDate(data.updatedAt) }}</div>
          </div>
        </div>
      </div>
      
      <div class="value-container">
        <div class="value-header">
          <div class="value-label">{{ $t('viewer.value') }}:</div>
          <div class="value-actions">
            <el-tooltip :content="$t('viewer.copy')" placement="top">
              <el-button size="small" type="primary" @click="copyValue">
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
            </el-tooltip>
            
            <template v-if="isJsonValue">
              <el-tooltip :content="isFormatted ? $t('viewer.raw') : $t('viewer.formatted')" placement="top">
                <el-button size="small" type="info" @click="toggleFormat">
                  <el-icon><SetUp /></el-icon>
                </el-button>
              </el-tooltip>
            </template>
          </div>
        </div>
        
        <div class="value-content">
          <div v-if="isJsonValue" class="json-viewer">
            <pre>{{ formattedValue }}</pre>
          </div>
          <div v-else class="plain-value">
            {{ data.value }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="viewer-footer">
      <el-button @click="$emit('back')">
        <el-icon><Back /></el-icon>
        {{ $t('viewer.back') }}
      </el-button>
      <div class="footer-actions">
        <el-button type="primary" @click="$emit('edit', data)">
          <el-icon><Edit /></el-icon>
          {{ $t('viewer.edit') }}
        </el-button>
        <el-button type="danger" @click="$emit('delete', data)">
          <el-icon><Delete /></el-icon>
          {{ $t('viewer.delete') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'

export default {
  name: 'KeyValueViewer',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  emits: ['back', 'edit', 'delete'],
  setup(props, { emit }) {
    const store = useStore()
    const isFormatted = ref(true)
    
    const isJsonValue = computed(() => {
      return props.data.type === 'object' || props.data.type === 'array'
    })
    
    const formattedValue = computed(() => {
      if (!isJsonValue.value) return props.data.value
      
      try {
        const parsed = JSON.parse(props.data.value)
        return isFormatted.value 
          ? JSON.stringify(parsed, null, 2) 
          : JSON.stringify(parsed)
      } catch (e) {
        return props.data.value
      }
    })
    
    const toggleFormat = () => {
      isFormatted.value = !isFormatted.value
    }
    
    const copyValue = () => {
      navigator.clipboard.writeText(props.data.value)
        .then(() => {
          ElMessage({
            message: '已复制到剪贴板',
            type: 'success',
            duration: 2000
          })
        })
        .catch(err => {
          console.error('复制失败:', err)
          ElMessage.error('复制失败')
        })
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
    
    const getTypeTagType = (type) => {
      switch (type) {
        case 'string': return ''
        case 'number': return 'success'
        case 'object': return 'warning'
        case 'array': return 'info'
        default: return 'info'
      }
    }
    
    // 组件挂载时记录查看活动
    onMounted(() => {
      if (props.data && props.data.key) {
        store.dispatch('recordActivity', {
          type: 'view',
          key: props.data.key,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return {
      isFormatted,
      isJsonValue,
      formattedValue,
      toggleFormat,
      copyValue,
      formatDate,
      getTypeTagType
    }
  }
}
</script>

<style lang="scss" scoped>
.kv-viewer {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $border-color;
}

.key-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.key-label {
  font-weight: 600;
  color: $text-color-secondary;
}

.key-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: $font-size-lg;
  color: $primary-color;
  word-break: break-all;
}

.type-tag {
  font-size: $font-size-sm;
}

.metadata {
  display: flex;
  gap: $spacing-xl;
  margin-bottom: $spacing-lg;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.meta-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.created-at {
    background-color: rgba($success-color, 0.1);
    color: $success-color;
  }
  
  &.updated-at {
    background-color: rgba($warning-color, 0.1);
    color: $warning-color;
  }
}

.meta-content {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: $font-size-xs;
  color: $text-color-secondary;
}

.meta-value {
  font-size: $font-size-sm;
  font-weight: 500;
}

.value-container {
  background-color: $gray-1;
  border-radius: $border-radius;
  padding: $spacing-md;
}

.value-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.value-label {
  font-weight: 600;
  color: $text-color-secondary;
}

.value-actions {
  display: flex;
  gap: $spacing-xs;
}

.value-content {
  margin-top: $spacing-md;
}

.json-viewer {
  background-color: #272822;
  border-radius: $border-radius;
  padding: $spacing-md;
  overflow: auto;
  max-height: 400px;
  
  pre {
    margin: 0;
    color: #f8f8f2;
    font-family: 'Courier New', monospace;
    font-size: $font-size-sm;
    line-height: 1.6;
  }
}

.plain-value {
  font-family: 'Courier New', monospace;
  padding: $spacing-md;
  background-color: white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  word-break: break-all;
  line-height: 1.6;
  max-height: 400px;
  overflow: auto;
}

.viewer-footer {
  display: flex;
  justify-content: space-between;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color;
}

.footer-actions {
  display: flex;
  gap: $spacing-sm;
}
</style> 