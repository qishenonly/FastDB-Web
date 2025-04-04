// 设置深色模式
export const setDarkMode = (isDark) => {
  // 添加或移除body上的dark-mode类
  if (isDark) {
    document.body.classList.add('dark-mode')
  } else {
    document.body.classList.remove('dark-mode')
  }
  
  // 保存到localStorage
  localStorage.setItem('darkMode', isDark ? 'dark' : 'light')
  
  return isDark
}

// 获取当前主题模式
export const getCurrentTheme = () => {
  const savedTheme = localStorage.getItem('darkMode')
  return savedTheme === 'dark'
} 