import { ElMessage } from 'element-plus'

// 延迟执行消息显示，避免初始化问题
const showMessage = (options) => {
  setTimeout(() => {
    ElMessage(options)
  }, 0)
}

export default {
  success(message) {
    showMessage({
      message,
      type: 'success',
      duration: 3000
    })
  },
  
  warning(message) {
    showMessage({
      message,
      type: 'warning',
      duration: 3000
    })
  },
  
  error(message) {
    showMessage({
      message,
      type: 'error',
      duration: 5000
    })
  },
  
  info(message) {
    showMessage({
      message,
      type: 'info',
      duration: 3000
    })
  }
} 