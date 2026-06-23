<template>
  <div>
    <h3 style="margin: 0 0 16px">客流明细</h3>

    <el-card style="margin-bottom: 16px">
      <el-form :inline="true" :model="filters" size="default">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item label="场馆名称">
          <el-input v-model="filters.venueId" placeholder="场馆编号" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="filters.provinceId" placeholder="省份编号" clearable style="width: 110px" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="filters.cityId" placeholder="城市编号" clearable style="width: 110px" />
        </el-form-item>
        <el-form-item label="区县">
          <el-input v-model="filters.districtId" placeholder="区县编号" clearable style="width: 110px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="equipmentCode" label="场馆中文名称" width="160" />
      <el-table-column prop="time" label="日期" width="180">
        <template #default="{ row }">{{ formatTime(row.time) }}</template>
      </el-table-column>
      <el-table-column prop="inCount" label="总进客流量" width="120" />
      <el-table-column prop="outCount" label="总出客流量" width="120" />
      <el-table-column prop="provinceId" label="省份编号" width="90" />
      <el-table-column prop="cityId" label="城市编号" width="90" />
      <el-table-column prop="districtId" label="区县编号" width="90" />
      <el-table-column prop="venueId" label="场馆编号" width="130" />
      <el-table-column label="净流量" width="100">
        <template #default="{ row }">
          <span :style="{ color: row.inCount - row.outCount >= 0 ? '#67c23a' : '#f56c6c' }">
            {{ row.inCount - row.outCount }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 16px; display: flex; justify-content: flex-end">
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
import { flowSummaryApi, type FlowSummaryRecord } from '../../api/flow-summary'

const loading = ref(false)
const tableData = ref<FlowSummaryRecord[]>([])
const pagination = ref({ page: 1, pageSize: 20, total: 0 })

const filters = ref({
  dateRange: null as [string, string] | null,
  venueId: '',
  provinceId: '',
  cityId: '',
  districtId: '',
})

function formatTime(val: string) {
  if (!val) return '-'
  return val.replace('T', ' ').slice(0, 19)
}

async function fetchData() {
  loading.value = true
  try {
    const [startDate, endDate] = filters.value.dateRange || ['', '']
    const res = await flowSummaryApi.list({
      venueId: filters.value.venueId || undefined,
      provinceId: filters.value.provinceId ? Number(filters.value.provinceId) : undefined,
      cityId: filters.value.cityId ? Number(filters.value.cityId) : undefined,
      districtId: filters.value.districtId ? Number(filters.value.districtId) : undefined,
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
  filters.value = { dateRange: null, venueId: '', provinceId: '', cityId: '', districtId: '' }
  pagination.value.page = 1
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>