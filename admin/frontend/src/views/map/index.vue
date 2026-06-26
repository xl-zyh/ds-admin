<template>
  <div>
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center">
      <h3 style="margin: 0">地标地图</h3>
      <el-button type="primary" @click="handleAdd">新增地标</el-button>
    </div>

    <!-- 地图区域 -->
    <el-card style="margin-bottom: 16px" :body-style="{ padding: 0 }">
      <MapViewer
        ref="mapRef"
        :amap-key="amapKey"
        :height="450"
        :markers="venueList"
        @marker-click="handleMarkerClick"
        @map-click="handleMapClick"
      />
    </el-card>

    <!-- 地标列表 -->
    <el-card>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
        <div style="display: flex; align-items: center; gap: 12px">
          <el-input
            v-model="keyword"
            placeholder="搜索地标名称或地址"
            clearable
            style="width: 260px"
            @input="handleSearch"
          />
          <el-button
            v-if="selectedVenues.length > 0"
            type="warning"
            size="small"
            @click="handleBatchLocate"
          >
            批量定位 ({{ selectedVenues.length }})
          </el-button>
          <el-button
            v-if="selectedVenues.length > 0"
            size="small"
            @click="clearSelection"
          >
            清除选中
          </el-button>
        </div>
        <span style="color: #999; font-size: 13px">共 {{ venueList.length }} 个地标</span>
      </div>

      <!-- 选中坐标汇总面板 -->
      <el-collapse-transition>
        <div v-if="selectedVenues.length > 0" class="selected-panel">
          <div class="selected-panel__title">已选中 {{ selectedVenues.length }} 个地标，坐标如下：</div>
          <div class="selected-panel__list">
            <el-tag
              v-for="item in selectedVenues"
              :key="item.id"
              closable
              type="danger"
              size="small"
              style="margin: 2px 4px 2px 0"
              @close="handleDeselect(item)"
            >
              {{ item.name }}: {{ item.lng.toFixed(6) }}, {{ item.lat.toFixed(6) }}
            </el-tag>
          </div>
          <el-button size="small" type="primary" link @click="copySelectedCoords">
            复制全部坐标
          </el-button>
        </div>
      </el-collapse-transition>

      <el-table
        ref="tableRef"
        :data="venueList"
        border
        stripe
        v-loading="loading"
        max-height="360"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column label="坐标" width="210">
          <template #default="{ row }">
            <code style="font-size:12px;color:#409eff">{{ row.lng.toFixed(6) }}, {{ row.lat.toFixed(6) }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="150">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleLocate(row)">定位</el-button>
            <el-button size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该地标？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button size="small" type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑地标' : '新增地标'" width="540px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入地标名称" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="点击地图自动识别，也可手动输入" />
        </el-form-item>
        <el-form-item label="坐标">
          <el-input :model-value="`${form.lng.toFixed(6)}, ${form.lat.toFixed(6)}`" readonly>
            <template #prepend>
              <el-switch
                v-model="pickingOnMap"
                active-text="地图选点"
                inactive-text="手动"
                style="--el-switch-on-color: #409eff"
              />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="!pickingOnMap" label="经度" prop="lng">
          <el-input-number v-model="form.lng" :precision="7" :step="0.001" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="!pickingOnMap" label="纬度" prop="lat">
          <el-input-number v-model="form.lat" :precision="7" :step="0.001" style="width: 100%" />
        </el-form-item>
        <el-form-item>
          <el-alert :type="pickingOnMap ? 'success' : 'info'" :closable="false" show-icon>
            <template v-if="pickingOnMap">
              地图选点模式已开启，点击地图即可标记坐标
            </template>
            <template v-else>
              切换"地图选点"模式，点击地图自动获取经纬度
            </template>
          </el-alert>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { venueApi, type VenueRecord } from '../../api/venue'
import MapViewer from '../../components/MapViewer.vue'

// 高德地图 Key — 生产环境从环境变量读取
const amapKey = import.meta.env.VITE_AMAP_KEY || 'YOUR_AMAP_KEY'

const mapRef = ref<InstanceType<typeof MapViewer>>()
const tableRef = ref()
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number>()
const keyword = ref('')
const venueList = ref<VenueRecord[]>([])
const selectedVenues = ref<VenueRecord[]>([])
const formRef = ref()
const pickingOnMap = ref(true) // 默认开启地图选点模式

const form = ref({
  name: '',
  address: '',
  lng: 116.397428,
  lat: 39.90923,
})

const rules = {
  name: [{ required: true, message: '请输入地标名称', trigger: 'blur' }],
  lng: [{ required: true, message: '请输入经度', trigger: 'blur' }],
  lat: [{ required: true, message: '请输入纬度', trigger: 'blur' }],
}

function formatTime(val: string) {
  if (!val) return '-'
  return val.replace('T', ' ').slice(0, 19)
}

/** 加载地标列表 */
async function fetchVenues() {
  loading.value = true
  try {
    venueList.value = await venueApi.list(keyword.value || undefined)
  } finally {
    loading.value = false
  }
}

/** 搜索 */
function handleSearch() {
  fetchVenues()
}

/** 点击地图标记 */
function handleMarkerClick(marker: { lng: number; lat: number; name: string; id?: number }) {
  mapRef.value?.flyTo(marker.lng, marker.lat)
}

/** 点击地图空白处 — 填充坐标到表单 */
function handleMapClick(pos: { lng: number; lat: number; address?: string }) {
  if (!dialogVisible.value || !pickingOnMap.value) return
  form.value.lng = pos.lng
  form.value.lat = pos.lat
  if (pos.address) {
    form.value.address = pos.address
  }
}

/** 定位到地标 */
function handleLocate(row: VenueRecord) {
  mapRef.value?.flyTo(row.lng, row.lat, 16)
}

/** 打开新增弹窗 */
function handleAdd() {
  isEdit.value = false
  pickingOnMap.value = true
  dialogVisible.value = true
}

/** 编辑 */
function handleEdit(row: VenueRecord) {
  isEdit.value = true
  editId.value = row.id
  form.value = {
    name: row.name,
    address: row.address || '',
    lng: row.lng,
    lat: row.lat,
  }
  dialogVisible.value = true
}

/** 保存 */
async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const data = {
      name: form.value.name,
      address: form.value.address,
      lng: form.value.lng,
      lat: form.value.lat,
    }
    if (isEdit.value && editId.value) {
      await venueApi.update(editId.value, data)
    } else {
      await venueApi.create(data)
    }
    dialogVisible.value = false
    await fetchVenues()
  } finally {
    saving.value = false
  }
}

/** 删除 */
async function handleDelete(id: number) {
  await venueApi.remove(id)
  await fetchVenues()
}

/** 重置表单 */
function resetForm() {
  form.value = { name: '', address: '', lng: 116.397428, lat: 39.90923 }
  isEdit.value = false
  editId.value = undefined
  pickingOnMap.value = true
}

/** 表格多选变化 — 同步地图高亮 */
function handleSelectionChange(rows: VenueRecord[]) {
  selectedVenues.value = rows
  const ids = rows.map((r) => r.id)
  mapRef.value?.highlightMarkers(ids)
}

/** 批量定位：视野适配所有选中地标 */
function handleBatchLocate() {
  if (selectedVenues.value.length === 0) return
  mapRef.value?.fitBounds(selectedVenues.value.map((v) => ({ lng: v.lng, lat: v.lat })))
}

/** 取消单个选中 */
function handleDeselect(item: VenueRecord) {
  tableRef.value?.toggleRowSelection(item, false)
}

/** 清除所有选中 */
function clearSelection() {
  tableRef.value?.clearSelection()
}

/** 复制选中坐标到剪贴板 */
async function copySelectedCoords() {
  const text = selectedVenues.value
    .map((v) => `${v.name}: ${v.lng.toFixed(6)}, ${v.lat.toFixed(6)}`)
    .join('\n')
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('已复制到剪贴板')
  }
}

onMounted(() => {
  fetchVenues()
})
</script>

<style scoped>
.selected-panel {
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 12px;
}
.selected-panel__title {
  font-size: 13px;
  color: #f56c6c;
  margin-bottom: 8px;
  font-weight: 500;
}
.selected-panel__list {
  margin-bottom: 8px;
  line-height: 2;
}
</style>