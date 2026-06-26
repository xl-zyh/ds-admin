<template>
  <div>
    <h3 style="margin: 0 0 16px">超管操作密钥</h3>

    <el-alert
      v-if="detail.needReset"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    >
      当前密钥为旧版本格式，无法查看明文，请重新设置密钥。
    </el-alert>

    <el-alert
      v-if="needRotation && !detail.needReset"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    >
      密钥已超过 90 天未更换（已使用 {{ detail.daysSinceSet }} 天），请立即更换。
    </el-alert>

    <el-card v-if="detail.initialized">
      <template #header>密钥信息</template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="设置时间">
          {{ formatDate(detail.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="设置人">{{ detail.setBy }}</el-descriptions-item>
        <el-descriptions-item label="已使用天数">{{ detail.daysSinceSet }} 天</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detail.needRotation ? 'danger' : 'success'">
            {{ detail.needRotation ? '需要更换' : '正常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前密钥" :span="2">
          <div style="display: flex; align-items: center; gap: 12px">
            <el-input
              :model-value="detail.key"
              type="password"
              :show-password="showKey"
              readonly
              style="flex: 1; min-width: 400px"
            />
            <el-button type="text" @click="showKey = !showKey">
              {{ showKey ? '隐藏' : '显示' }}
            </el-button>
            <el-button type="text" @click="copyKey">复制</el-button>
          </div>
        </el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 16px">
        <el-form ref="verifyFormRef" :model="verifyForm" label-width="120px" inline>
          <el-form-item label="验证密钥" prop="key">
            <el-input
              v-model="verifyForm.key"
              type="password"
              show-password
              placeholder="输入当前密钥验证"
              style="width: 300px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="verifying" @click="handleVerify">
              验证
            </el-button>
          </el-form-item>
        </el-form>
        <div v-if="verifyResult !== null" style="margin-top: 8px">
          <el-tag :type="verifyResult ? 'success' : 'danger'">
            {{ verifyResult ? '验证通过' : '验证失败' }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <el-card>
      <template #header>{{ detail.initialized ? '更换密钥' : '初始化密钥' }}</template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="新密钥" prop="key">
          <el-input
            v-model="form.key"
            type="password"
            show-password
            placeholder="≥16 位，含大小写字母、数字、特殊字符"
          />
        </el-form-item>
        <el-form-item label="确认密钥" prop="confirmKey">
          <el-input
            v-model="form.confirmKey"
            type="password"
            show-password
            placeholder="再次输入新密钥"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">
            {{ detail.initialized ? '更换密钥' : '初始化密钥' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 16px">
      <template #header>规则说明</template>
      <ul style="color: #606266; line-height: 2">
        <li>口令长度不低于 16 位</li>
        <li>必须包含大写字母、小写字母、数字、特殊字符</li>
        <li>每 90 天强制更换一次</li>
        <li>新口令不得与前 5 次口令重复</li>
        <li>修改或删除超管账号时，必须输入此密钥验证</li>
      </ul>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { superAdminApi } from '../../api/super-admin'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

const formRef = ref<FormInstance>()
const verifyFormRef = ref<FormInstance>()
const saving = ref(false)
const verifying = ref(false)
const showKey = ref(false)
const detail = ref({ initialized: false, needRotation: false, daysSinceSet: 0, createdAt: undefined, setBy: undefined, key: undefined, needReset: false })

const form = ref({ key: '', confirmKey: '' })
const verifyForm = ref({ key: '' })
const verifyResult = ref<boolean | null>(null)

const needRotation = computed(() => detail.value.needRotation)

const KEY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{16,}$/

const rules = {
  key: [
    { required: true, message: '请输入密钥', trigger: 'blur' },
    {
      validator: (_: any, val: string, cb: any) => {
        if (!KEY_PATTERN.test(val)) {
          cb(new Error('需 ≥16 位，含大小写字母、数字、特殊字符'))
        } else {
          cb()
        }
      },
      trigger: 'blur',
    },
  ],
  confirmKey: [
    { required: true, message: '请再次输入密钥', trigger: 'blur' },
    {
      validator: (_: any, val: string, cb: any) => {
        if (val !== form.value.key) {
          cb(new Error('两次输入的密钥不一致'))
        } else {
          cb()
        }
      },
      trigger: 'blur',
    },
  ],
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchDetail() {
  try {
    detail.value = await superAdminApi.getDetail()
  } catch (err: any) {
    if (err?.response?.status === 403) {
      ElMessage.warning('仅超级管理员有权限查看')
    }
  }
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await superAdminApi.setKey(form.value.key)
    ElMessage.success('操作密钥已更新')
    form.value = { key: '', confirmKey: '' }
    verifyResult.value = null
    await fetchDetail()
  } finally {
    saving.value = false
  }
}

async function handleVerify() {
  if (!verifyForm.value.key) {
    ElMessage.warning('请输入密钥')
    return
  }
  verifying.value = true
  try {
    const { valid } = await superAdminApi.verifyKey(verifyForm.value.key)
    verifyResult.value = valid
  } finally {
    verifying.value = false
  }
}

function copyKey() {
  if (detail.value.key) {
    navigator.clipboard.writeText(detail.value.key)
    ElMessage.success('已复制到剪贴板')
  }
}

onMounted(fetchDetail)
</script>