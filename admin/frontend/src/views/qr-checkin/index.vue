<template>
  <div>
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between">
      <h3 style="margin: 0">二维码签到数据</h3>
    </div>

    <!-- 筛选栏 -->
    <el-card style="margin-bottom: 16px">
      <el-form :inline="true" :model="filters" size="default">
        <el-form-item label="日期">
          <el-date-picker v-model="filters.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 160px" />
        </el-form-item>
        <el-form-item label="场馆">
          <el-input v-model="filters.venueId" placeholder="场馆编号" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="filters.provinceId" placeholder="省份编号" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="filters.cityId" placeholder="城市编号" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="数据列表" name="list">
        <el-table :data="tableData" border stripe v-loading="loading">
          <el-table-column prop="acqTime" label="采集时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.acqTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="venueId" label="场馆编号" width="120" />
          <el-table-column prop="provinceId" label="省份" width="80" />
          <el-table-column prop="cityId" label="城市" width="80" />
          <el-table-column prop="districtId" label="区县" width="80" />
          <el-table-column prop="acqNumOfPeople" label="入场人数" width="100" />
          <el-table-column prop="leaNumOfPeople" label="出场人数" width="100" />
          <el-table-column prop="deviceId" label="设备编号" width="120" />
          <el-table-column prop="isCoreArea" label="核心免低" width="90">
            <template #default="{ row }">
              <el-tag :type="row.isCoreArea === 1 ? 'success' : 'info'" size="small">
                {{ row.isCoreArea === 1 ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top: 16px; display: flex; justify-content: flex-end">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @change="fetchList"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="按小时统计" name="hour">
        <el-table :data="hourStats" border stripe v-loading="statsLoading">
          <el-table-column prop="hour" label="时段" width="180">
            <template #default="{ row }">
              {{ formatTime(row.hour) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalIn" label="入场总人数" width="120" />
          <el-table-column prop="totalOut" label="出场总人数" width="120" />
          <el-table-column label="在场人数" width="120">
            <template #default="{ row }">
              {{ row.totalIn - row.totalOut }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="按场馆统计" name="venue">
        <el-table :data="venueStats" border stripe v-loading="statsLoading">
          <el-table-column prop="venueId" label="场馆编号" width="140" />
          <el-table-column prop="totalIn" label="入场总人数" width="120" />
          <el-table-column prop="totalOut" label="出场总人数" width="120" />
          <el-table-column label="在场人数" width="120">
            <template #default="{ row }">
              {{ row.totalIn - row.totalOut }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { qrCheckinApi, type QrCheckinRecord } from '../../api/qr-checkin'

const activeTab = ref('list')
const loading = ref(false)
const statsLoading = ref(false)
const tableData = ref<QrCheckinRecord[]>([])
const hourStats = ref<any[]>([])
const venueStats = ref<any[]>([])

const pagination = ref({ page: 1, pageSize: 20, total: 0 })

const today = new Date().toISOString().slice(0, 10)
const filters = ref({ date: today, venueId: '', provinceId: '', cityId: '' })

function formatTime(val: string) {
  if (!val) return '-'
  return val.replace('T', ' ').slice(0, 19)
}

async function fetchList() {
  loading.value = true
  try {
    const res = await qrCheckinApi.list({
      venueId: filters.value.venueId || undefined,
      provinceId: filters.value.provinceId ? Number(filters.value.provinceId) : undefined,
      cityId: filters.value.cityId ? Number(filters.value.cityId) : undefined,
      startTime: filters.value.date ? `${filters.value.date} 00:00:00` : undefined,
      endTime: filters.value.date ? `${filters.value.date} 23:59:59` : undefined,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    })
    tableData.value = res.list
    pagination.value.total = res.total
  } finally {
    loading.value = false
  }
}

async function fetchHourStats() {
  if (!filters.value.date) return
  statsLoading.value = true
  try {
    hourStats.value = await qrCheckinApi.statsByHour(filters.value.date, {
      venueId: filters.value.venueId || undefined,
      provinceId: filters.value.provinceId ? Number(filters.value.provinceId) : undefined,
      cityId: filters.value.cityId ? Number(filters.value.cityId) : undefined,
    })
  } finally {
    statsLoading.value = false
  }
}

async function fetchVenueStats() {
  if (!filters.value.date) return
  statsLoading.value = true
  try {
    venueStats.value = await qrCheckinApi.statsByVenue(filters.value.date, {
      provinceId: filters.value.provinceId ? Number(filters.value.provinceId) : undefined,
      cityId: filters.value.cityId ? Number(filters.value.cityId) : undefined,
    })
  } finally {
    statsLoading.value = false
  }
}

function handleTabChange(tab: string) {
  if (tab === 'hour') fetchHourStats()
  else if (tab === 'venue') fetchVenueStats()
  else fetchList()
}

function handleSearch() {
  pagination.value.page = 1
  if (activeTab.value === 'list') fetchList()
  else if (activeTab.value === 'hour') fetchHourStats()
  else if (activeTab.value === 'venue') fetchVenueStats()
}

function handleReset() {
  filters.value = { date: today, venueId: '', provinceId: '', cityId: '' }
  pagination.value.page = 1
  handleSearch()
}

onMounted(() => {
  fetchList()
})
</script>