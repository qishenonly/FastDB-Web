<template>
  <div class="analysis-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('analysis.title') }}</h1>
        <p class="page-subtitle">{{ $t('analysis.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          {{ $t('analysis.refresh') }}
        </el-button>
      </div>
    </div>
    
    <!-- 数据概览卡片 -->
    <el-row :gutter="24" class="overview-cards">
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="overview-icon total">
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="overview-content">
            <div class="overview-value">{{ totalKeys }}</div>
            <div class="overview-label">{{ $t('analysis.totalKeys') }}</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="overview-icon strings">
            <el-icon><Document /></el-icon>
          </div>
          <div class="overview-content">
            <div class="overview-value">{{ typeStats.string || 0 }}</div>
            <div class="overview-label">{{ $t('analysis.stringType') }}</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="overview-icon numbers">
            <el-icon><Odometer /></el-icon>
          </div>
          <div class="overview-content">
            <div class="overview-value">{{ typeStats.number || 0 }}</div>
            <div class="overview-label">{{ $t('analysis.numberType') }}</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="overview-icon objects">
            <el-icon><Files /></el-icon>
          </div>
          <div class="overview-content">
            <div class="overview-value">{{ typeStats.object + typeStats.array || 0 }}</div>
            <div class="overview-label">{{ $t('analysis.complexType') }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="24" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('analysis.typeDistribution') }}</span>
            </div>
          </template>
          <div class="chart-container" ref="typeChartRef"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('analysis.keyLengthDistribution') }}</span>
            </div>
          </template>
          <div class="chart-container" ref="lengthChartRef"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="24" class="chart-row">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('analysis.creationTimeDistribution') }}</span>
            </div>
          </template>
          <div class="chart-container" ref="timeChartRef"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 数据表格 -->
    <el-card class="data-table-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('analysis.dataInsights') }}</span>
          <el-input
            v-model="searchQuery"
            :placeholder="$t('analysis.searchKey')"
            prefix-icon="Search"
            clearable
            style="width: 250px"
          />
        </div>
      </template>
      
      <el-table :data="filteredData" v-loading="loading" style="width: 100%">
        <el-table-column prop="key" :label="$t('table.key')" min-width="180">
          <template #default="{ row }">
            <div class="key-cell">{{ row.key }}</div>
          </template>
        </el-table-column>
        
        <el-table-column prop="type" :label="$t('table.type')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="size" :label="$t('analysis.dataSize')" width="120" align="center">
          <template #default="{ row }">
            {{ formatSize(row.size) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" :label="$t('table.createdAt')" width="180" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column :label="$t('table.actions')" width="120" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewItem(row)">
              <el-icon><View /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 查看数据详情对话框 -->
    <el-dialog
      v-model="showViewDialog"
      :title="$t('viewer.title')"
      width="70%"
      destroy-on-close
    >
      <KeyValueViewer 
        :data="currentItem" 
        @back="showViewDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { format } from 'date-fns'
import KeyValueViewer from '@/components/database/KeyValueViewer.vue'
import Message from '@/utils/message'

export default {
  name: 'Analysis',
  components: {
    KeyValueViewer
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()
    
    const typeChartRef = ref(null)
    const lengthChartRef = ref(null)
    const timeChartRef = ref(null)
    
    const typeChart = ref(null)
    const lengthChart = ref(null)
    const timeChart = ref(null)
    
    const loading = ref(false)
    const searchQuery = ref('')
    const showViewDialog = ref(false)
    const currentItem = ref(null)
    
    const isLoading = ref(false)
    const isDbConnected = ref(true)
    
    // 数据统计
    const kvData = computed(() => store.state.kvData)
    const recentActivities = computed(() => store.state.recentActivities)
    
    const totalKeys = computed(() => kvData.value.length)
    
    // 按类型统计
    const typeStats = computed(() => {
      return kvData.value.reduce((stats, item) => {
        stats[item.type] = (stats[item.type] || 0) + 1
        return stats
      }, { string: 0, number: 0, object: 0, array: 0 })
    })
    
    // 添加数据大小属性
    const dataWithSize = computed(() => {
      return kvData.value.map(item => ({
        ...item,
        size: calculateSize(item.value)
      }))
    })
    
    // 过滤后的数据
    const filteredData = computed(() => {
      if (searchQuery.value === '') return dataWithSize.value
      
      return dataWithSize.value.filter(item => 
        item.key.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    })
    
    // 计算数据大小
    const calculateSize = (value) => {
      return new Blob([value]).size
    }
    
    // 格式化数据大小
    const formatSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B'
      else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
      else return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '未知时间'
      
      try {
        const date = new Date(dateString)
        return format(date, 'yyyy-MM-dd HH:mm:ss')
      } catch (e) {
        return dateString || '未知时间'
      }
    }
    
    // 获取类型标签样式
    const getTypeTagType = (type) => {
      switch (type) {
        case 'string': return ''
        case 'number': return 'success'
        case 'object': return 'warning'
        case 'array': return 'info'
        default: return 'info'
      }
    }
    
    // 查看数据详情
    const viewItem = (item) => {
      currentItem.value = item
      showViewDialog.value = true
    }
    
    // 初始化类型分布图表
    const initTypeChart = () => {
      if (!typeChartRef.value) return
      
      // 计算各种类型的数量
      const typeCount = {
        string: 0,
        number: 0,
        object: 0,
        array: 0
      }
      
      kvData.value.forEach(item => {
        if (typeCount[item.type] !== undefined) {
          typeCount[item.type]++
        }
      })
      
      const option = {
        title: {
          text: t('analysis.dataTypeDistribution'),
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: [
            t('database.string'),
            t('database.number'),
            t('database.object'),
            t('database.array')
          ]
        },
        series: [
          {
            name: t('analysis.dataType'),
            type: 'pie',
            radius: '55%',
            center: ['50%', '60%'],
            data: [
              { value: typeCount.string, name: t('database.string') },
              { value: typeCount.number, name: t('database.number') },
              { value: typeCount.object, name: t('database.object') },
              { value: typeCount.array, name: t('database.array') }
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
      
      if (!typeChart.value) {
        typeChart.value = echarts.init(typeChartRef.value)
      }
      
      typeChart.value.setOption(option)
    }
    
    // 初始化数据长度分布图表
    const initLengthChart = () => {
      if (!lengthChartRef.value) return
      
      // 计算数据长度分布
      const lengthRanges = [
        { name: '0-10B', min: 0, max: 10, count: 0 },
        { name: '10-100B', min: 10, max: 100, count: 0 },
        { name: '100B-1KB', min: 100, max: 1024, count: 0 },
        { name: '1KB-10KB', min: 1024, max: 10240, count: 0 },
        { name: '10KB+', min: 10240, max: Infinity, count: 0 }
      ]
      
      kvData.value.forEach(item => {
        const size = item.size
        
        for (const range of lengthRanges) {
          if (size >= range.min && size < range.max) {
            range.count++
            break
          }
        }
      })
      
      const option = {
        title: {
          text: t('analysis.dataSizeDistribution'),
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
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
          data: lengthRanges.map(range => range.name)
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: t('analysis.keyCount'),
            type: 'bar',
            data: lengthRanges.map(range => range.count)
          }
        ]
      }
      
      if (!lengthChart.value) {
        lengthChart.value = echarts.init(lengthChartRef.value)
      }
      
      lengthChart.value.setOption(option)
    }
    
    // 初始化创建时间分布图表
    const initTimeChart = () => {
      if (!timeChartRef.value) return
      
      // 使用真实的活动数据
      const timeData = []
      const now = new Date()
      
      // 准备过去30天的日期
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        
        timeData.push({
          date: format(date, 'yyyy-MM-dd'),
          count: 0
        })
      }
      
      // 统计添加和更新操作
      if (recentActivities.value && recentActivities.value.length > 0) {
        recentActivities.value.forEach(activity => {
          if (activity.type === 'add' || activity.type === 'update') {
            const activityDate = format(new Date(activity.timestamp), 'yyyy-MM-dd')
            const dataPoint = timeData.find(item => item.date === activityDate)
            
            if (dataPoint) {
              dataPoint.count++
            }
          }
        })
      }
      
      const option = {
        title: {
          text: t('analysis.creationTimeDistribution'),
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
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
            rotate: 45
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: t('analysis.activityCount'),
            type: 'line',
            data: timeData.map(item => item.count),
            smooth: true
          }
        ]
      }
      
      if (!timeChart.value) {
        timeChart.value = echarts.init(timeChartRef.value)
      }
      
      timeChart.value.setOption(option)
    }
    
    // 加载数据
    const loadData = async () => {
      loading.value = true
      try {
        await store.dispatch('fetchKeyValueData')
        
        // 初始化图表
        nextTick(() => {
          initTypeChart()
          initLengthChart()
          initTimeChart()
        })
      } catch (error) {
        console.error('加载数据失败:', error)
        Message.error('加载数据失败: ' + (error.message || '未知错误'))
      } finally {
        loading.value = false
      }
    }
    
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
      if (route.path === '/analysis') {
        refreshData()
      }
    })
    
    // 监听窗口大小变化，调整图表大小
    const handleResize = () => {
      if (typeChart.value) typeChart.value.resize()
      if (lengthChart.value) lengthChart.value.resize()
      if (timeChart.value) timeChart.value.resize()
    }
    
    // 监听数据变化，更新图表
    watch(() => kvData.value, () => {
      nextTick(() => {
        initTypeChart()
        initLengthChart()
        initTimeChart()
      })
    })
    
    onMounted(() => {
      // 自动加载数据
      refreshData()
      
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        
        if (typeChart.value) typeChart.value.dispose()
        if (lengthChart.value) lengthChart.value.dispose()
        if (timeChart.value) timeChart.value.dispose()
      }
    })
    
    return {
      loading,
      searchQuery,
      kvData,
      totalKeys,
      typeStats,
      filteredData,
      showViewDialog,
      currentItem,
      typeChartRef,
      lengthChartRef,
      timeChartRef,
      formatSize,
      formatDate,
      getTypeTagType,
      viewItem,
      refreshData
    }
  }
}
</script>

<style lang="scss" scoped>
.analysis-page {
  padding-bottom: 30px;
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

.overview-cards {
  margin-bottom: $spacing-lg;
}

.overview-card {
  display: flex;
  align-items: center;
  padding: $spacing-md;
  
  .overview-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: $spacing-md;
    
    &.total {
      background-color: rgba($primary-color, 0.1);
      color: $primary-color;
    }
    
    &.strings {
      background-color: rgba($success-color, 0.1);
      color: $success-color;
    }
    
    &.numbers {
      background-color: rgba($warning-color, 0.1);
      color: $warning-color;
    }
    
    &.objects {
      background-color: rgba($info-color, 0.1);
      color: $info-color;
    }
    
    .el-icon {
      font-size: 24px;
    }
  }
  
  .overview-content {
    flex: 1;
  }
  
  .overview-value {
    font-size: $font-size-xl;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .overview-label {
    font-size: $font-size-sm;
    color: $text-color-secondary;
  }
}

.chart-row {
  margin-bottom: $spacing-lg;
}

.chart-card {
  margin-bottom: $spacing-md;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }
  
  .chart-container {
    height: 300px;
  }
}

.data-table-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.key-cell {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: $primary-color;
}
</style> 