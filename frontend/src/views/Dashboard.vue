<template>
  <div class="dashboard-page">
    <h1 class="title">{{ $t('dashboard.title') }}</h1>
    
    <div class="dashboard-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value">{{ kvData.length }}</div>
            <div class="stat-label">{{ $t('dashboard.totalKeys') }}</div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value">{{ typeStats.string || 0 }}</div>
            <div class="stat-label">{{ $t('dashboard.stringType') }}</div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value">{{ typeStats.object || 0 }}</div>
            <div class="stat-label">{{ $t('dashboard.objectType') }}</div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value">{{ recentUpdates }}</div>
            <div class="stat-label">{{ $t('dashboard.recentUpdates') }}</div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <div class="dashboard-content">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>{{ $t('dashboard.typeDistribution') }}</span>
              </div>
            </template>
            <div ref="typeChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card class="activity-card">
            <template #header>
              <div class="card-header">
                <span>{{ $t('dashboard.recentActivity') }}</span>
              </div>
            </template>
            <div v-if="recentActivities.length > 0" class="activity-list">
              <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
                <div class="activity-icon">
                  <el-icon :class="getActivityIconClass(activity.type)">
                    <component :is="getActivityIcon(activity.type)"></component>
                  </el-icon>
                </div>
                <div class="activity-content">
                  <div class="activity-title">
                    {{ activity.type === 'add' ? '添加了键' : activity.type === 'update' ? '更新了键' : '删除了键' }}
                    <span class="key-name">{{ activity.key }}</span>
                  </div>
                  <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无活动记录"></el-empty>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <div class="dashboard-recent">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>{{ $t('dashboard.recentItems') }}</span>
            <el-button class="button" type="text" @click="$router.push('/database/browse')">{{ $t('dashboard.viewAll') }}</el-button>
          </div>
        </template>
        <el-table :data="recentItems" style="width: 100%">
          <el-table-column prop="key" label="键名" width="180">
            <template #default="{ row }">
              <span class="key-cell">{{ row.key }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="180" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="viewItem(row)">{{ $t('dashboard.view') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    
    <el-dialog
      v-model="showViewer"
      :title="$t('dashboard.dataDetails')"
      width="60%"
    >
      <KeyValueViewer v-if="currentItem" :data="currentItem" />
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import KeyValueViewer from '@/components/database/KeyValueViewer.vue'
import { ElMessage } from 'element-plus'

// 注册必要的组件
echarts.use([TitleComponent, TooltipComponent, LegendComponent, PieChart, CanvasRenderer])

export default {
  name: 'DashboardPage',
  components: {
    KeyValueViewer
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const { t, locale } = useI18n()
    
    const typeChartRef = ref(null)
    let typeChart = null
    
    const kvData = computed(() => store.getters.getKvData)
    
    const typeStats = computed(() => {
      const stats = {}
      kvData.value.forEach(item => {
        stats[item.type] = (stats[item.type] || 0) + 1
      })
      return stats
    })
    
    const recentUpdates = computed(() => {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))
      return kvData.value.filter(item => new Date(item.updatedAt) >= thirtyDaysAgo).length
    })
    
    const recentItems = computed(() => {
      return [...kvData.value]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5)
    })
    
    const recentActivities = computed(() => store.getters.getRecentActivities)
    
    const getActivityIcon = (type) => {
      const iconMap = {
        'add': 'Plus',
        'update': 'Edit',
        'delete': 'Delete'
      }
      return iconMap[type] || 'Info'
    }
    
    const getActivityIconClass = (type) => {
      return `activity-icon-${type}`
    }
    
    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return date.toLocaleString()
    }
    
    const getTypeTagType = (type) => {
      const typeMap = {
        'string': '',
        'number': 'success',
        'object': 'warning',
        'array': 'info'
      }
      return typeMap[type] || 'info'
    }
    
    const showViewer = ref(false)
    const currentItem = ref(null)
    
    const viewItem = (item) => {
      currentItem.value = item
      showViewer.value = true
    }
    
    const initTypeChart = () => {
      if (typeChart) {
        typeChart.dispose()
      }
      
      typeChart = echarts.init(typeChartRef.value)
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: Object.keys(typeStats.value)
        },
        series: [
          {
            name: '数据类型',
            type: 'pie',
            radius: '70%',
            center: ['60%', '50%'],
            data: Object.entries(typeStats.value).map(([name, value]) => ({ name, value })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: {
              formatter: '{b}: {c} ({d}%)'
            }
          }
        ],
        color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
      }
      
      typeChart.setOption(option)
    }
    
    onMounted(() => {
      // 获取所有键值对数据
      store.dispatch('fetchAllItems').then(() => {
        initTypeChart()
      }).catch(error => {
        ElMessage.error('获取数据失败')
        console.error(error)
      })
      
      // 获取最近活动
      store.dispatch('fetchRecentActivities').catch(error => {
        console.error('获取最近活动失败:', error)
      })
      
      window.addEventListener('resize', () => {
        typeChart && typeChart.resize()
      })
    })
    
    // 监听语言变化，重新初始化图表
    watch(locale, () => {
      initTypeChart()
    })
    
    return {
      kvData,
      typeStats,
      recentUpdates,
      recentItems,
      recentActivities,
      typeChartRef,
      getActivityIcon,
      getActivityIconClass,
      formatTime,
      getTypeTagType,
      showViewer,
      currentItem,
      viewItem
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-page {
  padding-bottom: 30px;
}

.dashboard-stats {
  margin-top: 20px;
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  
  .stat-value {
    font-size: 36px;
    font-weight: 600;
    color: $primary-color;
    margin-bottom: 10px;
  }
  
  .stat-label {
    font-size: 14px;
    color: $text-color-secondary;
  }
}

.dashboard-content {
  margin-bottom: 30px;
}

.chart-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .chart-container {
    height: 300px;
  }
}

.activity-card {
  height: 100%;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid $border-color;
  
  &:last-child {
    border-bottom: none;
  }
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  
  .el-icon {
    font-size: 18px;
  }
}

.activity-icon-add {
  color: $success-color;
}

.activity-icon-update {
  color: $primary-color;
}

.activity-icon-delete {
  color: $error-color;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  margin-bottom: 4px;
  
  .key-name {
    font-weight: 600;
    color: $primary-color;
    font-family: 'Courier New', monospace;
  }
}

.activity-time {
  font-size: 12px;
  color: $text-color-light;
}

.key-cell {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #409eff;
}

.dashboard-recent {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style> 