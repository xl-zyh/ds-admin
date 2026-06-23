<template>
  <el-container style="min-height: 100vh">
    <el-aside width="220px" class="aside">
      <div class="logo">Admin</div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item v-if="authStore.hasPermission('user:read')" index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasPermission('role:read')" index="/roles">
          <el-icon><Setting /></el-icon>
          <span>角色管理</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasPermission('qr-checkin:read')" index="/qr-checkin">
          <el-icon><Checked /></el-icon>
          <span>二维码签到</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasPermission('flow-summary:read')" index="/flow-summary">
          <el-icon><List /></el-icon>
          <span>客流明细</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasPermission('operation-log:read')" index="/operation-logs">
          <el-icon><Document /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="header-title">{{ route.meta.title }}</span>
        <div class="header-right">
          <span class="user-name">{{ authStore.user?.nickname || authStore.user?.username }}</span>
          <el-button type="danger" size="small" plain @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { User, Setting, Checked, List, Document } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.aside {
  background-color: #304156;
  overflow-y: auto;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  font-weight: bold;
  letter-spacing: 2px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}
.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.user-name {
  color: #666;
  font-size: 14px;
}
.main {
  background: #f0f2f5;
  padding: 20px;
}
</style>
