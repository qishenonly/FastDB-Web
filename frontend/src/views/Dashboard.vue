<template>
  <div class="dashboard-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('dashboard.title') }}</h1>
        <p class="page-subtitle">{{ currentDate }}</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" class="action-button" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          {{ $t('dashboard.refresh') }}
        </el-button>
      </div>
    </div>
    
    <div class="dashboard-stats">
      <el-row :gutter="24">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card" :class="{ 'pulse': isLoading }">
            <div class="stat-icon total-keys">
              <el-icon><Key /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ kvData && kvData.length || 0 }}</div>
              <div class="stat-label">{{ $t('dashboard.totalKeys') }}</div>
            </div>
            <div class="stat-trend">
              <span class="trend-value positive">+5%</span>
              <small>vs last week</small>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card" :class="{ 'pulse': isLoading }">
            <div class="stat-icon string-type">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ typeStats && typeStats.string || 0 }}</div>
              <div class="stat-label">String</div>
            </div>
            <div class="stat-trend">
              <span class="trend-value positive">+2%</span>
              <small>vs last week</small>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card" :class="{ 'pulse': isLoading }">
            <div class="stat-icon object-type">
              <el-icon><Files /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ typeStats && typeStats.object || 0 }}</div>
              <div class="stat-label">Object</div>
            </div>
            <div class="stat-trend">
              <span class="trend-value negative">-1%</span>
              <small>vs last week</small>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card" :class="{ 'pulse': isLoading }">
            <div class="stat-icon recent-updates">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ recentUpdates }}</div>
              <div class="stat-label">{{ $t('dashboard.recentUpdates') }}</div>
            </div>
            <div class="stat-trend">
              <span class="trend-value positive">+12%</span>
              <small>vs last week</small>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <el-row :gutter="24" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>数据类型分布</span>
            </div>
          </template>
          <div class="chart-container" ref="typeChartRef"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>键长度分布</span>
            </div>
          </template>
          <div class="chart-container" ref="lengthChartRef"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="24" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>键创建时间趋势</span>
            </div>
          </template>
          <div class="chart-container" ref="timeChartRef"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="recent-items-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('dashboard.recentItems') }}</span>
              <el-button type="text" @click="goToDatabase">
                {{ $t('dashboard.viewAll') }}
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          
          <el-table
            :data="kvData.slice(0, 5)"
            style="width: 100%"
            :row-class-name="tableRowClassName"
            v-loading="isLoading"
          >
            <el-table-column prop="key" :label="$t('table.key')" min-width="180">
              <template #default="{ row }">
                <div class="key-cell">{{ row.key }}</div>
                <div class="updated-time">{{ formatActivityTime(row.updatedAt) }}</div>
              </template>
            </el-table-column>
            
            <el-table-column prop="type" :label="$t('table.type')" width="100">
              <template #default="{ row }">
                <el-tag :type="getTagType(row.type)" size="small">
                  {{ row.type }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column :label="$t('table.actions')" width="100" align="right">
              <template #default="{ row }">
                <el-button
                  size="small"
                  circle
                  @click="currentItem = row; showViewDialog = true"
                >
                  <el-icon><View /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="24">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="activity-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('dashboard.recentActivity') }}</span>
            </div>
          </template>
          
          <div v-if="recentActivities.length === 0" class="empty-activity">
            {{ $t('dashboard.noActivity') }}
          </div>
          
          <div v-else class="activity-list">
            <div v-for="(activity, index) in recentActivities.slice(0, 5)" :key="index" class="activity-item">
              <div class="activity-icon" :class="`activity-icon-${activity.type}`">
                <el-icon v-if="activity.type === 'add'"><Plus /></el-icon>
                <el-icon v-else-if="activity.type === 'update'"><Edit /></el-icon>
                <el-icon v-else-if="activity.type === 'view'"><View /></el-icon>
                <el-icon v-else-if="activity.type === 'delete'"><Delete /></el-icon>
              </div>
              
              <div class="activity-content">
                <div class="activity-title">
                  {{ activity.type === 'add' ? $t('dashboard.addedKey') : 
                     activity.type === 'update' ? $t('dashboard.updatedKey') : 
                     activity.type === 'view' ? $t('dashboard.viewedKey') : 
                     $t('dashboard.deletedKey') }}
                  <span class="key-name">{{ activity.key }}</span>
                </div>
                
                <div class="activity-details">
                  <span class="activity-user">Admin</span>
                  <span class="activity-separator">•</span>
                  <span v-if="activity.value" class="activity-value-preview">{{ activity.value }}</span>
                </div>
                
                <div class="activity-time">{{ formatActivityTime(activity.time) }}</div>
              </div>
              
              <div class="activity-actions">
                <el-button
                  v-if="activity.type !== 'delete'"
                  size="small"
                  circle
                  @click="viewActivityItem(activity)"
                >
                  <el-icon><View /></el-icon>
                </el-button>
              </div>
            </div>
            
            <div v-if="recentActivities.length > 5" class="view-more-activities">
              <el-button type="text" @click="goToDatabase">
                {{ $t('dashboard.more') }}
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="system-info-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('dashboard.systemInfo') }}</span>
            </div>
          </template>
          
          <div class="system-info">
            <div class="info-item">
              <span class="info-label">{{ $t('dashboard.systemVersion') }}</span>
              <span class="info-value">1.0.0</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">{{ $t('dashboard.databaseEngine') }}</span>
              <span class="info-value">FastDB 1.0</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">{{ $t('settings.connectionStatus') }}</span>
              <span class="info-value">
                <el-tag v-if="isDbConnected" type="success">{{ $t('settings.connected') }}</el-tag>
                <el-tag v-else type="danger">{{ $t('settings.disconnected') }}</el-tag>
              </span>
            </div>
            
            <div class="info-item">
              <span class="info-label">{{ $t('dashboard.operatingSystem') }}</span>
              <span class="info-value">{{ osInfo }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">{{ $t('dashboard.memoryUsage') }}</span>
              <span class="info-value">{{ memoryUsage }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">{{ $t('dashboard.uptime') }}</span>
              <span class="info-value">{{ uptime }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 查看数据对话框 -->
    <el-dialog
      v-model="showViewDialog"
      :title="$t('dashboard.dataDetails')"
      width="60%"
    >
      <KeyValueViewer v-if="currentItem" :item="currentItem" />
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { format, formatDistance, subDays } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import Message from '@/utils/message'
import KeyValueViewer from '@/components/database/KeyValueViewer.vue'

export default {
  name: 'Dashboard',
  components: {
    KeyValueViewer
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    const { t, locale } = useI18n()
    
    // 状态
    const isLoading = ref(false)
    const showViewDialog = ref(false)
    const currentItem = ref(null)
    
    // 系统信息
    const osInfo = navigator.platform
    const memoryUsage = ref('128MB / 512MB')
    const uptime = ref('2小时36分钟')
    
    // 数据库连接状态
    const isDbConnected = computed(() => store.getters.isDbConnected)
    
    // 获取键值对数据
    const kvData = computed(() => store.state.kvData)
    const recentActivities = computed(() => store.state.recentActivities)
    
    // 计算类型统计
    const typeStats = computed(() => {
      if (!kvData.value || kvData.value.length === 0) return { string: 0, number: 0, object: 0, array: 0 }
      
      return kvData.value.reduce((stats, item) => {
        if (!item.type) return stats
        
        stats[item.type] = (stats[item.type] || 0) + 1
        return stats
      }, { string: 0, number: 0, object: 0, array: 0 })
    })
    
    // 计算最近更新数量 (过去24小时内)
    const recentUpdates = computed(() => {
      if (!kvData.value || kvData.value.length === 0) return 0
      
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      
      return kvData.value.filter(item => {
        if (!item.updatedAt) return false
        const updateDate = new Date(item.updatedAt)
        return updateDate > oneDayAgo
      }).length
    })
    
    // 当前日期
    const currentDate = computed(() => {
      return format(new Date(), 'yyyy-MM-dd')
    })
    
    // 格式化活动时间
    const formatActivityTime = (time) => {
      if (!time) return t('dashboard.justNow')
      
      try {
        const date = new Date(time)
        const now = new Date()
        const diffMinutes = Math.floor((now - date) / (1000 * 60))
        
        if (diffMinutes < 1) return t('dashboard.justNow')
        if (diffMinutes < 60) return t('dashboard.minutesAgo', { n: diffMinutes })
        
        const diffHours = Math.floor(diffMinutes / 60)
        if (diffHours < 24) return t('dashboard.hoursAgo', { n: diffHours })
        
        const diffDays = Math.floor(diffHours / 24)
        if (diffDays < 30) return t('dashboard.daysAgo', { n: diffDays })
        
        // 如果超过30天，则显示具体日期
        return format(date, 'yyyy-MM-dd')
      } catch (e) {
        console.error('格式化时间错误:', e)
        return t('dashboard.justNow')
      }
    }
    
    // 查看活动项目
    const viewActivityItem = (activity) => {
      if (!activity || !activity.key) return
      
      // 查找对应的键值对
      const item = kvData.value.find(item => item.key === activity.key)
      if (item) {
        currentItem.value = item
        showViewDialog.value = true
      } else {
        // 如果在当前数据中找不到，则使用活动中的数据
        currentItem.value = {
          key: activity.key,
          value: activity.value || '',
          type: activity.type || 'string',
          createdAt: activity.time,
          updatedAt: activity.time
        }
        showViewDialog.value = true
      }
    }
    
    // 获取标签类型
    const getTagType = (type) => {
      switch (type) {
        case 'string': return ''
        case 'number': return 'success'
        case 'object': return 'warning'
        case 'array': return 'info'
        default: return ''
      }
    }
    
    // 表格行样式
    const tableRowClassName = ({ row, rowIndex }) => {
      return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
    }
    
    // 图表引用
    const typeChartRef = ref(null)
    const lengthChartRef = ref(null)
    const timeChartRef = ref(null)
    
    // 图表实例
    let typeChart = null
    let lengthChart = null
    let timeChart = null
    
    // 计算统计数据
    const stats = computed(() => {
      const data = kvData.value
      
      // 计算各种类型的数量
      const typeCount = {
        string: 0,
        number: 0,
        object: 0,
        array: 0
      }
      
      let totalSize = 0
      
      data.forEach(item => {
        if (typeCount[item.type] !== undefined) {
          typeCount[item.type]++
        }
        
        totalSize += item.size
      })
      
      return {
        total: data.length,
        typeCount,
        totalSize,
        avgSize: data.length ? Math.round(totalSize / data.length) : 0
      }
    })
    
    // 初始化图表
    const initCharts = () => {
      // 类型分布图表
      const typeChartOption = {
        title: {
          text: '',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: [
            'String',
            'Number',
            'Object',
            'Array'
          ]
        },
        series: [
          {
            name: '',
            type: 'pie',
            radius: '55%',
            center: ['50%', '60%'],
            data: [
              { value: stats.value.typeCount.string, name: 'String' },
              { value: stats.value.typeCount.number, name: 'Number' },
              { value: stats.value.typeCount.object, name: 'Object' },
              { value: stats.value.typeCount.array, name: 'Array' }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      
      // 数据长度分布图表
      // 计算数据长度分布
      const lengthRanges = [
        { name: '短键 (1-3)', min: 1, max: 4, count: 0 },
        { name: '中键 (4-6)', min: 4, max: 7, count: 0 },
        { name: '长键 (7-10)', min: 7, max: 11, count: 0 },
        { name: '超长键 (>10)', min: 11, max: Infinity, count: 0 }
      ]
      
      // 统计每个范围内的数据数量
      kvData.value.forEach(item => {
        const keyLength = item.key ? item.key.length : 0
        const range = lengthRanges.find(r => keyLength >= r.min && keyLength < r.max)
        if (range) {
          range.count++
        }
      })
      
      const lengthChartOption = {
        title: {
          text: '',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b}: {c}个'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: lengthRanges.map(item => item.name),
          axisLabel: {
            interval: 0,
            rotate: 0
          }
        },
        yAxis: {
          type: 'value',
          minInterval: 1
        },
        series: [
          {
            name: '',
            type: 'bar',
            data: lengthRanges.map(item => item.count),
            barWidth: '40%',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#67C23A' },
                  { offset: 1, color: '#95D475' }
                ]
              },
              borderRadius: [4, 4, 0, 0]
            }
          }
        ]
      }
      
      // 使用真实的活动数据
      const timeData = []
      const now = new Date()
      
      // 只显示过去14天的数据，使图表更紧凑
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        
        timeData.push({
          date: format(date, 'MM-dd'),
          count: 0
        })
      }
      
      // 统计添加操作
      if (recentActivities.value && recentActivities.value.length > 0) {
        recentActivities.value.forEach(activity => {
          if (activity.type === 'add') {
            const activityDate = format(new Date(activity.timestamp), 'MM-dd')
            const dataPoint = timeData.find(item => item.date === activityDate)
            
            if (dataPoint) {
              dataPoint.count++
            }
          }
        })
      }
      
      const timeChartOption = {
        title: {
          text: '',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'line'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: timeData.map(item => item.date),
          axisLabel: {
            rotate: 0
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '',
            type: 'line',
            data: timeData.map(item => item.count),
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
              color: '#409EFF'
            },
            lineStyle: {
              width: 3
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
                  { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
                ]
              }
            }
          }
        ]
      }
      
      // 初始化图表实例
      if (!typeChart) {
        typeChart = echarts.init(typeChartRef.value)
      }
      typeChart.setOption(typeChartOption)
      
      if (!lengthChart) {
        lengthChart = echarts.init(lengthChartRef.value)
      }
      lengthChart.setOption(lengthChartOption)
      
      if (!timeChart) {
        timeChart = echarts.init(timeChartRef.value)
      }
      timeChart.setOption(timeChartOption)
    }
    
    // 处理窗口大小变化
    const handleResize = () => {
      if (typeChart) typeChart.resize()
      if (lengthChart) lengthChart.resize()
      if (timeChart) timeChart.resize()
    }
    
    // 组件挂载时加载数据
    onMounted(() => {
      // 自动加载数据
      refreshData()
      
      // 初始化图表
      nextTick(() => {
        initCharts()
      })
      
      // 监听窗口大小变化
      window.addEventListener('resize', handleResize)
    })
    
    // 监听数据变化，更新图表
    watch(() => kvData.value, () => {
      nextTick(() => {
        if (typeChart) initCharts()
        if (lengthChart) initCharts()
        if (timeChart) initCharts()
      })
    }, { deep: true })
    
    // 组件卸载时清理
    onUnmounted(() => {
      // 销毁图表实例
      if (typeChart) {
        typeChart.dispose()
        typeChart = null
      }
      
      if (lengthChart) {
        lengthChart.dispose()
        lengthChart = null
      }
      
      if (timeChart) {
        timeChart.dispose()
        timeChart = null
      }
      
      // 移除窗口大小变化监听
      window.removeEventListener('resize', handleResize)
    })
    
    // 刷新数据
    const refreshData = async () => {
      try {
        isLoading.value = true
        
        // 检查数据库连接状态
        await store.dispatch('checkDbConnection')
        
        // 获取最新数据
        if (isDbConnected.value) {
          await store.dispatch('fetchKeyValueData')
          Message.success(t('common.success'))
        } else {
          Message.warning(t('database.connectionRequired'))
        }
      } catch (error) {
        console.error('刷新数据失败:', error)
        Message.error(t('common.error'))
      } finally {
        isLoading.value = false
      }
    }
    
    // 监听路由变化，自动刷新数据
    watch(() => route.path, () => {
      if (route.path === '/' || route.path === '/dashboard') {
        refreshData()
      }
    })
    
    // 跳转到数据库页面
    const goToDatabase = () => {
      router.push('/database/browse')
    }
    
    return {
      isLoading,
      kvData,
      typeStats,
      recentUpdates,
      currentDate,
      recentActivities,
      showViewDialog,
      currentItem,
      typeChartRef,
      lengthChartRef,
      timeChartRef,
      refreshData,
      goToDatabase,
      formatActivityTime,
      viewActivityItem,
      getTagType,
      tableRowClassName,
      isDbConnected,
      osInfo,
      memoryUsage,
      uptime
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-page {
  padding-bottom: $spacing-xl;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
}

.page-title {
  font-size: $font-size-xxl;
  font-weight: 600;
  margin-bottom: $spacing-xs;
  background: linear-gradient(to right, $primary-color, $secondary-color);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  color: $text-color-secondary;
  font-size: $font-size-sm;
}

.action-button {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.dashboard-stats {
  margin-bottom: $spacing-lg;
}

.stat-card {
  background: white;
  border-radius: $border-radius;
  padding: $spacing-md;
  display: flex;
  align-items: center;
  box-shadow: $shadow;
  transition: all $transition;
  position: relative;
  overflow: hidden;
  height: 100px;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-md;
  }
  
  &.pulse {
    animation: pulse 1.5s infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: 6px;
  }
  
  &:nth-child(1)::after {
    background-color: $primary-color;
  }
  
  &:nth-child(2)::after {
    background-color: $success-color;
  }
  
  &:nth-child(3)::after {
    background-color: $warning-color;
  }
  
  &:nth-child(4)::after {
    background-color: $info-color;
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: $spacing-md;
  
  .el-icon {
    font-size: 24px;
    color: white;
  }
  
  &.total-keys {
    background: linear-gradient(135deg, $primary-color, darken($primary-color, 15%));
  }
  
  &.string-type {
    background: linear-gradient(135deg, $success-color, darken($success-color, 15%));
  }
  
  &.object-type {
    background: linear-gradient(135deg, $warning-color, darken($warning-color, 15%));
  }
  
  &.recent-updates {
    background: linear-gradient(135deg, $info-color, darken($info-color, 15%));
  }
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  color: $text-color;
}

.stat-label {
  font-size: $font-size-sm;
  color: $text-color-secondary;
}

.stat-trend {
  text-align: right;
  font-size: $font-size-xs;
  color: $text-color-light;
  
  .trend-value {
    display: block;
    font-weight: 600;
    
    &.positive {
      color: $success-color;
    }
    
    &.negative {
      color: $error-color;
    }
  }
}

.dashboard-content {
  margin-top: $spacing-lg;
}

.chart-card, .recent-activity-card, .dashboard-recent, .system-info-card {
  margin-bottom: $spacing-lg;
  box-shadow: $shadow-sm;
  border-radius: $border-radius;
  transition: all $transition;
  
  &:hover {
    box-shadow: $shadow;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: $text-color;
}

.chart-container {
  height: 300px;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
}

.activity-item {
  display: flex;
  padding: $spacing-md;
  border-bottom: 1px solid $border-color;
  transition: background-color 0.2s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: rgba($primary-color, 0.05);
  }
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: $spacing-md;
  flex-shrink: 0;
  
  &.activity-icon-add {
    background-color: rgba($success-color, 0.1);
    color: $success-color;
  }
  
  &.activity-icon-update {
    background-color: rgba($warning-color, 0.1);
    color: $warning-color;
  }
  
  &.activity-icon-view {
    background-color: rgba($info-color, 0.1);
    color: $info-color;
  }
  
  &.activity-icon-delete {
    background-color: rgba($error-color, 0.1);
    color: $error-color;
  }
}

.activity-content {
  flex: 1;
  min-width: 0; // 确保文本可以正确截断
}

.activity-title {
  font-size: $font-size-sm;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  .key-name {
    font-weight: 600;
    color: $primary-color;
    font-family: 'Courier New', monospace;
    margin-left: 4px;
  }
}

.activity-details {
  font-size: $font-size-xs;
  color: $text-color-secondary;
  margin-bottom: 4px;
  
  .activity-user {
    font-weight: 500;
  }
  
  .activity-separator {
    margin: 0 4px;
  }
  
  .activity-value-preview {
    font-style: italic;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    vertical-align: bottom;
  }
}

.activity-time {
  font-size: $font-size-xs;
  color: $text-color-light;
}

.activity-actions {
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
  
  .activity-item:hover & {
    opacity: 1;
  }
}

.empty-activity {
  padding: $spacing-lg 0;
  text-align: center;
}

.view-more-activities {
  text-align: center;
  padding: $spacing-sm 0;
  border-top: 1px dashed $border-color;
  margin-top: $spacing-sm;
}

.key-cell {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: $primary-color;
  font-size: $font-size-sm;
  margin-bottom: 4px;
}

.updated-time {
  font-size: $font-size-xs;
  color: $text-color-light;
}

.system-info {
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: $spacing-sm 0;
    border-bottom: 1px solid $border-color;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .info-label {
    color: $text-color-secondary;
    font-size: $font-size-sm;
  }
  
  .info-value {
    font-weight: 500;
    font-size: $font-size-sm;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba($primary-color, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba($primary-color, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba($primary-color, 0);
  }
}

/* 添加图表相关样式 */
.chart-row {
  margin-bottom: $spacing-lg;
}

.chart-container {
  height: 300px;
  width: 100%;
}

/* 添加系统信息卡片样式 */
.system-info-card {
  margin-bottom: $spacing-lg;
}

.system-info {
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: $spacing-sm 0;
    border-bottom: 1px solid $border-color;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .info-label {
    color: $text-color-secondary;
    font-size: $font-size-sm;
  }
  
  .info-value {
    font-weight: 500;
    font-size: $font-size-sm;
  }
}
</style> 