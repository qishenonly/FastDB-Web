<template>
  <div class="kv-viewer">
    <div class="viewer-header">
      <div class="key-info">
        <span class="key-label">键名:</span>
        <span class="key-value">{{ data.key }}</span>
      </div>
      <el-tag :type="getTypeTagType(data.type)" size="large">{{ data.type }}</el-tag>
    </div>
    
    <div class="viewer-content">
      <div class="metadata">
        <div class="meta-item">
          <span class="meta-label">创建时间:</span>
          <span class="meta-value">{{ data.createdAt }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">更新时间:</span>
          <span class="meta-value">{{ data.updatedAt }}</span>
        </div>
      </div>
      
      <div class="value-container">
        <div class="value-header">
          <span class="value-label">值:</span>
          <div class="value-actions">
            <el-button size="small" type="primary" @click="copyValue">
              <el-icon><el-icon-document-copy /></el-icon>复制
            </el-button>
          </div>
        </div>
        
        <div class="value-content">
          <template v-if="data.type === 'object' || data.type === 'array'">
            <div class="json-viewer">
              <pre>{{ formattedValue }}</pre>
            </div>
          </template>
          <template v-else>
            <div class="plain-value">{{ data.value }}</div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'KeyValueViewer',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const getTypeTagType = (type) => {
      const typeMap = {
        'string': '',
        'number': 'success',
        'object': 'warning',
        'array': 'info'
      }
      return typeMap[type] || 'info'
    }
    
    const formattedValue = computed(() => {
      if (props.data.type === 'object' || props.data.type === 'array') {
        try {
          const parsed = JSON.parse(props.data.value)
          return JSON.stringify(parsed, null, 2)
        } catch (e) {
          return props.data.value
        }
      }
      return props.data.value
    })
    
    const copyValue = () => {
      navigator.clipboard.writeText(props.data.value)
        .then(() => {
          ElMessage.success('已复制到剪贴板')
        })
        .catch(() => {
          ElMessage.error('复制失败')
        })
    }
    
    return {
      getTypeTagType,
      formattedValue,
      copyValue
    }
  }
}
</script>

<style lang="scss" scoped>
.kv-viewer {
  padding: 10px;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid $border-color;
}

.key-info {
  display: flex;
  align-items: center;
}

.key-label {
  font-weight: 600;
  margin-right: 10px;
  color: $text-color-secondary;
}

.key-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 18px;
  color: $primary-color;
}

.metadata {
  display: flex;
  margin-bottom: 20px;
}

.meta-item {
  margin-right: 30px;
  display: flex;
  align-items: center;
}

.meta-label {
  font-weight: 600;
  margin-right: 8px;
  color: $text-color-secondary;
}

.meta-value {
  color: $text-color;
}

.value-container {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
}

.value-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.value-label {
  font-weight: 600;
  color: $text-color-secondary;
}

.value-content {
  margin-top: 10px;
}

.json-viewer {
  background-color: #272822;
  border-radius: 4px;
  padding: 15px;
  overflow: auto;
  max-height: 400px;
  
  pre {
    margin: 0;
    color: #f8f8f2;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
  }
}

.plain-value {
  font-family: 'Courier New', monospace;
  padding: 15px;
  background-color: white;
  border: 1px solid $border-color;
  border-radius: 4px;
  word-break: break-all;
}
</style> 