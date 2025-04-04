<template>
  <div class="kv-form">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px" label-position="top">
      <el-form-item :label="$t('form.key')" prop="key">
        <el-input 
          v-model="formData.key" 
          :placeholder="$t('form.keyPlaceholder')"
          :disabled="!!initialData"
          prefix-icon="Key"
        />
        <div class="form-help-text" v-if="!initialData">
          {{ $t('form.keyHelp') }}
        </div>
      </el-form-item>
      
      <el-form-item :label="$t('form.type')" prop="type">
        <el-select
          v-model="formData.type"
          :placeholder="$t('form.typePlaceholder')"
          class="type-select"
        >
          <el-option label="String" value="string" />
          <el-option label="Number" value="number" />
          <el-option label="Object" value="object" />
          <el-option label="Array" value="array" />
        </el-select>
      </el-form-item>
      
      <el-form-item :label="$t('form.value')" prop="value">
        <template v-if="formData.type === 'object' || formData.type === 'array'">
          <div class="json-editor-container">
            <el-input
              v-model="formData.value"
              type="textarea"
              :rows="12"
              :placeholder="getPlaceholderByType(formData.type)"
              class="json-editor"
            />
            <div class="json-format-button">
              <el-tooltip :content="$t('form.formatJson')" placement="top">
                <el-button type="primary" circle @click="formatJson">
                  <el-icon><Magic /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="form-help-text">
            {{ $t('form.jsonHelp') }}
          </div>
        </template>
        <template v-else-if="formData.type === 'number'">
          <el-input-number 
            v-model="numericValue" 
            :precision="2" 
            :step="1" 
            style="width: 100%;" 
            controls-position="right"
          />
          <div class="form-help-text">
            {{ $t('form.numberHelp') }}
          </div>
        </template>
        <template v-else>
          <el-input 
            v-model="formData.value" 
            type="textarea" 
            :rows="6" 
            :placeholder="getPlaceholderByType(formData.type)"
          />
          <div class="form-help-text">
            {{ $t('form.stringHelp') }}
          </div>
        </template>
      </el-form-item>
      
      <div class="form-actions">
        <el-button @click="$emit('cancel')">{{ $t('form.cancel') }}</el-button>
        <el-button type="primary" @click="submitForm">{{ $t('form.submit') }}</el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

export default {
  name: 'KeyValueForm',
  props: {
    initialData: {
      type: Object,
      default: null
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const formRef = ref(null)
    
    const formData = reactive({
      key: props.initialData?.key || '',
      value: props.initialData?.value || '',
      type: props.initialData?.type || 'string'
    })
    
    const numericValue = ref(0)
    
    const rules = {
      key: [
        { required: true, message: t('form.keyRequired'), trigger: 'blur' },
        { min: 1, max: 100, message: t('form.keyLengthLimit'), trigger: 'blur' }
      ],
      type: [
        { required: true, message: t('form.typeRequired'), trigger: 'change' }
      ],
      value: [
        { required: true, message: t('form.valueRequired'), trigger: 'blur' }
      ]
    }
    
    // 当类型为数字时，使用numericValue作为中间值
    watch(numericValue, (newVal) => {
      if (formData.type === 'number') {
        formData.value = String(newVal)
      }
    })
    
    // 当类型改变时，重置值
    const handleTypeChange = (newType) => {
      if (newType === 'number') {
        numericValue.value = formData.value ? parseFloat(formData.value) : 0
      } else if (newType === 'object') {
        try {
          // 尝试将现有值解析为对象
          JSON.parse(formData.value)
        } catch (e) {
          formData.value = '{}'
        }
      } else if (newType === 'array') {
        try {
          // 尝试将现有值解析为数组
          JSON.parse(formData.value)
        } catch (e) {
          formData.value = '[]'
        }
      }
    }
    
    // 格式化JSON
    const formatJson = () => {
      try {
        const parsed = JSON.parse(formData.value)
        formData.value = JSON.stringify(parsed, null, 2)
      } catch (e) {
        ElMessage.error('JSON格式不正确')
      }
    }
    
    // 提交表单
    const submitForm = async () => {
      if (!formRef.value) return
      
      try {
        await formRef.value.validate()
        
        // 处理不同类型的值
        let processedValue = formData.value
        
        if (formData.type === 'object' || formData.type === 'array') {
          try {
            // 确保是有效的JSON
            JSON.parse(processedValue)
          } catch (e) {
            ElMessage.error(t('form.invalidJson'))
            return
          }
        } else if (formData.type === 'number') {
          processedValue = Number(processedValue)
          if (isNaN(processedValue)) {
            ElMessage.error(t('form.invalidNumber'))
            return
          }
        }
        
        // 提交数据
        emit('submit', {
          key: formData.key,
          value: processedValue,
          type: formData.type
        })
      } catch (error) {
        console.error('表单验证失败:', error)
      }
    }
    
    // 监听 initialData 的变化，当它改变时更新表单
    watch(() => props.initialData, (newVal) => {
      if (newVal) {
        formData.key = newVal.key
        formData.type = newVal.type
        formData.value = newVal.value
        
        if (formData.type === 'number') {
          numericValue.value = parseFloat(formData.value)
        }
      }
    }, { immediate: true })
    
    // 根据类型获取占位符文本
    const getPlaceholderByType = (type) => {
      switch (type) {
        case 'string':
          return t('form.stringPlaceholder')
        case 'number':
          return t('form.numberPlaceholder')
        case 'object':
          return t('form.objectPlaceholder')
        case 'array':
          return t('form.arrayPlaceholder')
        default:
          return t('form.valuePlaceholder')
      }
    }
    
    return {
      formRef,
      formData,
      rules,
      numericValue,
      handleTypeChange,
      formatJson,
      submitForm,
      getPlaceholderByType
    }
  }
}
</script>

<style lang="scss" scoped>
.kv-form {
  padding: $spacing-md;
}

.type-selector {
  width: 100%;
  display: flex;
  
  :deep(.el-radio-button) {
    flex: 1;
    
    .el-radio-button__inner {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-xs;
    }
  }
}

.json-editor-container {
  position: relative;
}

.json-editor {
  font-family: 'Courier New', monospace;
  
  :deep(.el-textarea__inner) {
    font-family: 'Courier New', monospace;
    line-height: 1.6;
    padding: $spacing-md;
  }
}

.json-format-button {
  position: absolute;
  right: $spacing-sm;
  bottom: $spacing-sm;
}

.form-help-text {
  font-size: $font-size-xs;
  color: $text-color-secondary;
  margin-top: $spacing-xs;
  line-height: 1.5;
}

.form-actions {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
}

.type-select {
  width: 100%;
}
</style> 