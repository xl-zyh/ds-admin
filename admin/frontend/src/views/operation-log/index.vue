<template>
  <div>
    <h3 style="margin: 0 0 16px">操作日志</h3>

    <el-card style="margin-bottom: 16px">
      <el-form :inline="true" :model="filters" size="default">
        <el-form-item label="操作人">
          <el-input v-model="filters.username" placeholder="用户名" clearable style="width: 130px" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="filters.action" placeholder="全部" clearable style="width: 110px">
            <el-option label="新增" value="CREATE" />
            <el-option label="修改" value="UPDATE" />
            <el-option label="删除" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作模块">
          <el-select v-model="filters.resource" placeholder="全部" clearable style="width: 120px">
            <el-option label="用户管理" value="用户管理" />
            <el-option label="角色管理" value="角色管理" />
            <el-option label="二维码签到" value="二维码签到" />
            <el-option label="客流明细" value="客流明细" />
            <el-option label="操作日志" value="操作日志" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="username" label="用户名" width="100" />
      <el-table-column prop="nickname" label="昵称" width="100">
        <template #default="{ row }">{{ row.nickname || row.username }}</template>
      </el-table-column>
      <el-table-column prop="action" label="操作类型" width="80">
        <template #default="{ row }">
          <el-tag :type="actionTag(row.action)" size="small">{{ actionLabel(row.action) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="resource" label="操作模块" width="100" />
      <el-table-column prop="detail" label="操作详情" min-width="200" show-overflow-tooltip />
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="createdAt" label="操作时间" width="160">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center">
      <span style="color: #909399; font-size: 13px">日志保留 7 天，每日 23:50 自动清理过期数据</span>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="fetchData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { operationLogApi, type OperationLogRecord } from '../../api/operation-log'

const loading = ref(false)
const tableData = ref<OperationLogRecord[]>([])
const pagination = ref({ page: 1, pageSize: 20, total: 0 })

const filters = ref({
  username: '',
  action: '',
  resource: '',
  dateRange: null as [string, string] | null,
})

function formatTime(val: string) {
  if (!val) return '-'
  return val.replace('T', ' ').slice(0, 19)
}

function actionLabel(action: string) {
  const map: Record<string, string> = { CREATE: '新增', UPDATE: '修改', DELETE: '删除' }
  return map[action] || action
}

function actionTag(action: string) {
  const map: Record<string, string> = { CREATE: 'success', UPDATE: 'warning', DELETE: 'danger' }
  return map[action] || 'info'
}

async function fetchData() {
  loading.value = true
  try {
    const [startDate, endDate] = filters.value.dateRange || ['', '']
    const res = await operationLogApi.list({
      username: filters.value.username || undefined,
      action: filters.value.action || undefined,
      resource: filters.value.resource || undefined,
      startDate: startDate || undefined,
      endDate: endDate ? `${endDate} 23:59:59` : undefined,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    })
    tableData.value = res.list
    pagination.value.total = res.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.value.page = 1
  fetchData()
}

function handleReset() {
  filters.value = { username: '', action: '', resource: '', dateRange: null }
  pagination.value.page = 1
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>