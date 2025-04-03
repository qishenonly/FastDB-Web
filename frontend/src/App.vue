<template>
  <div id="app" class="app-container">
    <Header />
    <div class="main-content">
      <Sidebar />
      <div class="page-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import Header from './components/common/Header.vue'
import Sidebar from './components/common/Sidebar.vue'

export default {
  name: 'App',
  components: {
    Header,
    Sidebar
  }
}
</script>

<style lang="scss">
@import './styles/main.scss';

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style> 