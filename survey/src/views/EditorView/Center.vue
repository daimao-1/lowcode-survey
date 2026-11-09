<template>
  <div ref="centerContainer" class="center-container" @click.self="clearSelection">
    <draggable v-model="store.coms" item-key="index" @start="dragstart">
      <template #item="{ element, index }">
        <div
          class="content mb-10 relative"
          :class="{
            active: store.currentComponentIndex === index,
          }"
          @click="clickHandle(index)"
          :key="element.id"
          :ref="(el) => (componentRefs[index] = el)"
        >
          <component :is="element.type" :status="element.status" :serialNum="serialNum[index]" />
          <div class="absolute delete-btn" v-show="store.currentComponentIndex === index">
            <el-button
              type="danger"
              class="ml-10"
              size="small"
              :icon="Close"
              circle
              @click.stop="removeCom(index)"
            />
          </div>
          <!-- 移动端：vuedraggable 走的是 HTML5 drag 事件，触屏上根本不会触发，
               拖不动就等于改不了顺序。所以补一组「上移 / 下移」按钮兜底。 -->
          <div class="mobile-order" v-if="isMobile && store.currentComponentIndex === index">
            <el-button size="small" @click.stop="moveCom(index, -1)">上移</el-button>
            <el-button size="small" @click.stop="moveCom(index, 1)">下移</el-button>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 拖动组件
import draggable from 'vuedraggable'
// EventBus
import EventBus from '@/utils/eventBus'
// 仓库
import { useEditorStore } from '@/stores/useEditor'
const store = useEditorStore()

// 组合式函数
import { useSurveyNo } from '@/utils/hooks'
import { useIsMobile } from '@/utils/useIsMobile'
// 是否移动端窄屏（触屏拖拽不可用，需要上移/下移兜底）
const isMobile = useIsMobile()
// 获取题目编号
const serialNum = computed(() => useSurveyNo(store.coms).value)

const centerContainer = ref<HTMLElement | null>(null) // 明确声明类型
const componentRefs = ref<(Element | ComponentPublicInstance | null)[]>([])
const clickHandle = function (index: number) {
  if (store.currentComponentIndex === index) {
    // 重复点同一道题不再取消选中。
    // 原来这里是个 toggle：点一下打开、再点一下关闭。
    // 在手机上很容易连点两下，于是「属性面板怎么都不出来」。
    return
  }
  store.setCurrentComponentIndex(index)
  // 滚动必须等 click 事件走完再执行。
  // 原来在这里直接 scrollIntoView(behavior smooth)，元素在 mouseup 之前
  // 就开始移动，浏览器判定 mousedown 与 mouseup 不在同一元素上 → click 被丢弃，
  // 表现就是「点了没反应」。
  setTimeout(() => scrollToCenter(index), 0)
}

// 点击画布空白处取消选中（桌面端没有抽屉，关不掉就没法重新选别的题）
const clearSelection = function () {
  store.setCurrentComponentIndex(-1)
}
const scrollToBottom = function () {
  nextTick(() => {
    const container = centerContainer.value
    if (container) {
      window.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      })
    }
  })
}
const scrollToCenter = function (index: number) {
  nextTick(() => {
    const element = componentRefs.value[index]
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}
EventBus.on('scrollToBottom', scrollToBottom)
EventBus.on('scrollToCenter', scrollToCenter)

function removeCom(index: number) {
  ElMessageBox.confirm('是否确定删除此模块？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      store.removeCom(index)
      store.setCurrentComponentIndex(-1)
      ElMessage({
        type: 'success',
        message: '已删除',
      })
    })
    .catch(() => {
      console.log('取消删除')
    })
}
// 拖动开始
function dragstart() {
  // 拖动开始的时候，将当前选中的组件取消选中
  store.setCurrentComponentIndex(-1)
}

// 上移 / 下移：触屏设备上拖拽排序不可用时的替代方案
function moveCom(index: number, dir: -1 | 1) {
  const target = index + dir
  if (target < 0 || target >= store.coms.length) return
  const next = [...store.coms]
  const [item] = next.splice(index, 1)
  if (!item) return
  next.splice(target, 0, item)
  store.coms = next
  // 换位后保持该题目选中，否则属性面板会直接收起
  store.setCurrentComponentIndex(target)
}
</script>

<style scoped>
.center-container {
  /* 桌面端：画布吃掉左右两栏之外的全部宽度，永不与面板重叠。
     min-width: 0 是关键 —— flex 子项默认 min-width:auto，
     内容过宽时会把容器撑破，等于又回到原来被面板压住的老问题。 */
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  margin: 20px 0;
  padding: 20px;
  background: var(--white);
  position: relative;
  .content {
    cursor: pointer;
    padding: 10px;
    background-color: var(--white);
    border-radius: var(--border-radius-sm);
    &:hover {
      transform: scale(1.01);
      transition: 0.5s;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
  }
}
.active {
  transform: scale(1.01);
  transition: 0.5s;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.delete-btn {
  right: -5px;
  top: -10px;
}
.mobile-order {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
/* 窄屏（≤1199px）：画布占满宽度，属性面板改为底部抽屉 */
@media screen and (max-width: 1199px) {
  .center-container {
    flex: none;
    width: 100%;
    height: auto;
    overflow-y: visible;
    margin: 10px auto;
    padding: 12px;
    box-sizing: border-box;
  }
}
</style>
