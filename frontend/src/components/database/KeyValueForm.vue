<template>
  <div class="kv-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="键名" prop="key">
        <el-input 
          v-model="form.key" 
          placeholder="请输入键名"
          :disabled="!!initialData"
        />
      </el-form-item>
      
      <el-form-item label="类型" prop="type">
        <el-select v-model="form.type" placeholder="选择数据类型" @change="handleTypeChange">
          <el-option label="字符串" value="string" />
          <el-option label="数字" value="number" />
          <el-option label="对象" value="object" />
          <el-option label="数组" value="array" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="值" prop="value">
        <template v-if="form.type === 'object' || form.type === 'array'">
          <div class="json-editor-container">
            <el-input
              v-model="form.value"
              type="textarea"
              :rows="10"
              placeholder="请输入JSON格式的值"
            />
            <div class="json-format-button">
              <el-button size="small" type="primary" @click="formatJson">格式化JSON</el-button>
            </div>
          </div>
        </template>
        <template v-else-if="form.type === 'number'">
          <el-input-number v-model="numericValue" :precision="2" :step="1" style="width: 100%;" />
        </template>
        <template v-else>
          <el-input 
            v-model="form.value" 
            :type="form.type === 'string' ? 'text' : 'textarea'" 
            :rows="form.type === 'string' ? 1 : 5"
            placeholder="请输入值"
          />
        </template>
      </el-form-item>
    </el-form>
    
    <div class="form-actions">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" @click="submitForm">提交</el-button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue'

export default {
  name: 'KeyValueForm',
  props: {
    initialData: {
      type: Object,
      default: null
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const formRef = ref(null)
    
    const form = reactive({
      key: '',
      value: '',
      type: 'string'
    })
    
    const numericValue = ref(0)
    
    const rules = {
      key: [
        { required: true, message: '请输入键名', trigger: 'blur' },
        { min: 1, max: 100, message: '长度在1到100个字符之间', trigger: 'blur' }
      ],
      type: [
        { required: true, message: '请选择数据类型', trigger: 'change' }
      ],
      value: [
        { required: true, message: '请输入值', trigger: 'blur' }
      ]
    }
    
    // 当类型为数字时，使用numericValue作为中间值
    watch(numericValue, (newVal) => {
      if (form.type === 'number') {
        form.value = String(newVal)
      }
    })
    
    // 当类型改变时，重置值
    const handleTypeChange = (newType) => {
      if (newType === 'number') {
        numericValue.value = form.value ? parseFloat(form.value) : 0
      } else if (newType === 'object') {
        try {
          // 尝试将现有值解析为对象
          JSON.parse(form.value)
        } catch (e) {
          form.value = '{}'
        }
      } else if (newType === 'array') {
        try {
          // 尝试将现有值解析为数组
          JSON.parse(form.value)
        } catch (e) {
          form.value = '[]'
        }
      }
    }
    
    // 格式化JSON
    const formatJson = () => {
      try {
        const parsed = JSON.parse(form.value)
        form.value = JSON.stringify(parsed, null, 2)
      } catch (e) {
        ElMessage.error('JSON格式不正确')
      }
    }
    
    // 提交表单
    const submitForm = () => {
      formRef.value.validate((valid) => {
        if (valid) {
          // 验证JSON格式
          if (form.type === 'object' || form.type === 'array') {
            try {
              JSON.parse(form.value)
            } catch (e) {
              ElMessage.error('JSON格式不正确')
              return
            }
          }
          
          // 准备提交的数据
          const submitData = {
            key: form.key,
            value: form.type === 'number' ? numericValue.value.toString() : form.value,
            type: form.type
          }
          
          emit('submit', submitData)
        }
      })
    }
    
    // 监听 initialData 的变化，当它改变时更新表单
    watch(() => props.initialData, (newVal) => {
      if (newVal) {
        form.key = newVal.key
        form.type = newVal.type
        form.value = newVal.value
        
        if (form.type === 'number') {
          numericValue.value = parseFloat(form.value)
        }
      }
    }, { immediate: true })
    
    return {
      formRef,
      form,
      rules,
      numericValue,
      handleTypeChange,
      formatJson,
      submitForm
    }
  }
}
</script>

<style lang="scss" scoped>
.kv-form {
  padding: 10px;
}

.json-editor-container {
  position: relative;
}

.json-format-button {
  position: absolute;
  right: 10px;
  bottom: 10px;
}

.form-actions {
  margin-top: 20px;
  text-align: right;
}
</style> 