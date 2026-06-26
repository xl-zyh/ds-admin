<template>
  <div ref="containerRef" class="map-container" :style="{ height: height + 'px' }" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 高德地图 JS API Key */
    amapKey: string
    /** 地图容器高度 */
    height?: number
    /** 中心点经度 */
    centerLng?: number
    /** 中心点纬度 */
    centerLat?: number
    /** 缩放级别 */
    zoom?: number
    /** 标记点列表 */
    markers?: Array<{ lng: number; lat: number; name: string; id?: number }>
  }>(),
  {
    height: 500,
    centerLng: 116.397428,
    centerLat: 39.90923,
    zoom: 11,
    markers: () => [],
  },
)

const emit = defineEmits<{
  /** 点击标记点 */
  markerClick: [marker: { lng: number; lat: number; name: string; id?: number }]
  /** 地图点击（获取经纬度） */
  mapClick: [pos: { lng: number; lat: number; address?: string }]
}>()

const containerRef = ref<HTMLDivElement>()
let mapInstance: any = null
let markerInstances: any[] = []
let clickMarker: any = null
const AMap = ref<any>(null)

/** 动态加载高德 JS API 脚本 */
function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).AMap) {
      AMap.value = (window as any).AMap
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/v2/maps?v=2.0&key=${props.amapKey}&plugin=AMap.Geocoder`
    script.onload = () => {
      AMap.value = (window as any).AMap
      resolve()
    }
    script.onerror = () => reject(new Error('高德地图脚本加载失败'))
    document.head.appendChild(script)
  })
}

/** 初始化地图 */
function initMap() {
  if (!containerRef.value || !AMap.value) return
  mapInstance = new AMap.value.Map(containerRef.value, {
    zoom: props.zoom,
    center: [props.centerLng, props.centerLat],
    resizeEnable: true,
  })

  // 地图点击事件 — 参考高德官方示例 click-to-get-lnglat
  mapInstance.on('click', (e: any) => {
    const lng = e.lnglat.getLng()
    const lat = e.lnglat.getLat()

    // 移除旧点击标记，添加新标记（视觉反馈）
    if (clickMarker) mapInstance.remove(clickMarker)
    clickMarker = new AMap.value.Marker({
      position: [lng, lat],
      animation: 'AMAP_ANIMATION_DROP',
    })
    mapInstance.add(clickMarker)

    // 异步获取地址描述
    emit('mapClick', { lng, lat })
    reverseGeocode(lng, lat).then((address) => {
      emit('mapClick', { lng, lat, address })
    })
  })
}

/** 逆地理编码：根据经纬度获取地址 */
async function reverseGeocode(lng: number, lat: number): Promise<string> {
  return new Promise((resolve) => {
    try {
      if (!AMap.value?.Geocoder) {
        // 动态加载地理编码插件
        AMap.value.plugin('AMap.Geocoder', () => {
          const geocoder = new AMap.value.Geocoder()
          geocoder.getAddress([lng, lat], (status: string, result: any) => {
            if (status === 'complete' && result.regeocode) {
              resolve(result.regeocode.formattedAddress || '')
            } else {
              resolve('')
            }
          })
        })
        return
      }
      const geocoder = new AMap.value.Geocoder()
      geocoder.getAddress([lng, lat], (status: string, result: any) => {
        if (status === 'complete' && result.regeocode) {
          resolve(result.regeocode.formattedAddress || '')
        } else {
          resolve('')
        }
      })
    } catch {
      resolve('')
    }
  })
}

/** 清除已有标记 */
function clearMarkers() {
  if (mapInstance) {
    mapInstance.remove(markerInstances)
    markerInstances = []
  }
}

/** 渲染标记点 */
function renderMarkers() {
  if (!mapInstance || !AMap.value) return
  clearMarkers()
  props.markers.forEach((m) => {
    const marker = new AMap.value.Marker({
      position: [m.lng, m.lat],
      title: m.name,
      label: {
        content: m.name,
        direction: 'top',
        offset: [0, -25],
      },
    })
    marker.on('click', () => emit('markerClick', m))
    mapInstance.add(marker)
    markerInstances.push(marker)
  })
}

/** 飞行定位到指定坐标 */
function flyTo(lng: number, lat: number, zoom?: number) {
  if (!mapInstance) return
  mapInstance.setZoomAndCenter(zoom || 15, [lng, lat])
}

/** 定位并添加临时标记 */
function locateAndMark(lng: number, lat: number, name: string) {
  flyTo(lng, lat)
  if (!AMap.value) return
  const marker = new AMap.value.Marker({
    position: [lng, lat],
    title: name,
    label: { content: name, direction: 'top', offset: [0, -25] },
    animation: 'AMAP_ANIMATION_DROP',
  })
  mapInstance.add(marker)
  markerInstances.push(marker)
}

/** 适配视野：将所有点显示在可视范围内 */
function fitBounds(points: Array<{ lng: number; lat: number }>) {
  if (!mapInstance || points.length === 0) return
  if (points.length === 1) {
    mapInstance.setZoomAndCenter(15, [points[0].lng, points[0].lat])
    return
  }
  mapInstance.setBounds(new AMap.value.Bounds(
    [Math.min(...points.map((p) => p.lng)), Math.min(...points.map((p) => p.lat))],
    [Math.max(...points.map((p) => p.lng)), Math.max(...points.map((p) => p.lat))],
  ))
}

/** 高亮选中的标记点 */
function highlightMarkers(ids: number[]) {
  markerInstances.forEach((m, i) => {
    const markerData = props.markers[i]
    if (markerData && ids.includes(markerData.id!)) {
      m.setContent(`<div style="background:#f56c6c;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;white-space:nowrap">${markerData.name}</div>`)
      m.setzIndex(999)
    } else {
      m.setContent('')
      m.setzIndex(100)
    }
  })
}

/** 销毁地图 */
function destroyMap() {
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
  markerInstances = []
}

watch(
  () => props.markers,
  () => renderMarkers(),
  { deep: true },
)

onMounted(async () => {
  await loadScript()
  initMap()
  renderMarkers()
})

onUnmounted(() => {
  destroyMap()
})

defineExpose({ flyTo, locateAndMark, clearMarkers, renderMarkers, fitBounds, highlightMarkers })
</script>

<style scoped>
.map-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}
</style>