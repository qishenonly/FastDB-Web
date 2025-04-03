import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

// 获取浏览器语言或本地存储的语言偏好
const getDefaultLanguage = () => {
  const savedLanguage = localStorage.getItem('language')
  if (savedLanguage) return savedLanguage
  
  const browserLang = navigator.language || navigator.userLanguage
  return browserLang.startsWith('zh') ? 'zh-CN' : 'en-US'
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLanguage(),
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export default i18n 