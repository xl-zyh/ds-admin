<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">后台管理系统</h2>

      <el-form ref="formRef" :model="form" :rules="loginRules" @keyup.enter="handleLogin" label-width="0">
        <!-- 错误提示：位于表单顶部，红色文本，符合 WCAG 2.1 AA 对比度 -->
        <transition name="error-fade">
          <div v-if="error" class="login-error" role="alert" aria-live="assertive">
            {{ error }}
          </div>
        </transition>

        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            prefix-icon="User"
            @input="clearError"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @input="clearError"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleLogin" style="width:100%">
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 提示：不开放公开注册，由管理员创建账号 -->
      <p class="login-hint">
        没有账号？请联系管理员开通
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const error = ref('')

const form = reactive({ username: '', password: '' })

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

/** 用户修改输入时自动清除错误提示 */
function clearError() {
  if (error.value) {
    error.value = ''
  }
}

async function handleLogin() {
  error.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await auth.login(form.username, form.password)
    router.push('/')
  } catch (e: any) {
    const status = e.response?.status
    const message = e.response?.data?.message || ''

    // 401：用户名或密码错误 → 统一提示，不区分具体原因（防账户枚举）
    if (status === 401) {
      error.value = '用户名或密码错误'
    }
    // 403：账号状态异常（未激活/锁定/禁用/离职）→ 保留具体原因
    else if (status === 403) {
      error.value = message || '账号状态异常'
    }
    // 其他错误
    else {
      error.value = '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
}

/* 错误提示 — 红色居中，满足 WCAG 2.1 AA 对比度 */
.login-error {
  color: #d43030;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 6px;
  text-align: center;
  padding: 10px 16px;
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.5;
}

/* 错误提示淡入动画 */
.error-fade-enter-active {
  transition: opacity 0.3s ease;
}
.error-fade-leave-active {
  transition: opacity 0.2s ease;
}
.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
}

.login-hint {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: #999;
}
</style>