<template>
  <div class="right-side-container" :class="{ 'is-open': isOpen }" @wheel="handleScroll($event)">
    <!-- 属性面板的开关：桌面端是常驻面板，没有这个 X 就没法收起；
         窄屏下它是底部抽屉的头部，同样用它关闭。 -->
    <div class="panel-head" v-if="isOpen && store.currentComponentIndex !== -1">
      <span class="panel-title">题目属性</span>
      <el-button type="primary" size="small" :icon="Close" circle @click="closePanel" />
    </div>
    <!-- 关闭后的状态：给出明确提示和一个重新打开的入口，
         不然「关掉之后怎么再打开」就成了新问题。 -->
    <div v-if="!isOpen" class="content panel-empty flex flex-direction-column justify-content-center align-items-center">
      <p class="panel-empty-text">
        {{
          store.currentComponentIndex === -1
            ? '双击题目进行编辑'
            : '属性面板已关闭'
        }}
      </p>
      <el-button
        v-if="store.currentComponentIndex !== -1"
        type="primary"
        size="small"
        @click="openPanel"
      >
        重新打开属性面板
      </el-button>
    </div>
    <div v-else>
      <EditPannel :com="currentCom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { handleScroll } from '@/utils'
import EditPannel from '@/components/SurveyComs/EditItems/EditPannel.vue'

// 类型
import type { EditorStore } from '@/types'
import { useEditorStore } from '@/stores/useEditor'
const store = useEditorStore() as EditorStore
// 面板显示的是「当前选中」的那道题
const currentCom = computed(() => store.coms[store.currentComponentIndex])
// 面板开不开由 editingIndex 决定：双击题目才进入编辑（editingIndex != -1），
// 单击只是选中，不会凭空弹出面板。
const isOpen = computed(() => store.editingIndex !== -1)
// 关闭面板 = 退出编辑。保留选中态（题目仍然高亮），
// 这样再双击同一道题就能重新打开，不必先点别处取消选中。
const closePanel = () => {
  store.setEditingIndex(-1)
}
// 重新打开面板（对当前选中的题）
const openPanel = () => {
  if (store.currentComponentIndex === -1) return
  store.setEditingIndex(store.currentComponentIndex)
}
// Esc 关闭面板
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    store.setEditingIndex(-1)
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
// 右侧编辑面板的父组件提供修改状态的方法
</script>

<style scoped lang="scss">
.right-side-container {
  width: 320px;
  // 桌面端由外层 flex 容器排布，不再 absolute 浮在画布上
  flex: 0 0 320px;
  height: 100%;
  position: static;
  background-color: var(--white);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow-y: scroll;
}
.content {
  height: 100%;
}

.panel-empty {
  gap: 12px;
  padding: 20px;
  text-align: center;
  .panel-empty-text {
    font-size: 13px;
    color: var(--font-color-light);
    margin: 0;
  }
}

// 属性面板头部：桌面端是常驻面板的标题栏（带关闭开关），
// 窄屏下它固定在抽屉顶部
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-color);
  background: var(--white);
  .panel-title {
    font-size: 14px;
    font-weight: 500;
  }
}

// ============================================================
// 窄屏（≤1199px）：属性面板改成「底部抽屉」
// 原来固定 320px 贴在右边，390px 屏幕上完全在可视区之外，
// 选完题目根本看不到属性，等于改不了。
// ============================================================
@media screen and (max-width: 1199px) {
  .right-side-container {
    width: 100%;
    flex: none;
    height: 62vh;
    position: fixed;
    right: 0;
    left: 0;
    top: auto;
    bottom: 0;
    z-index: 30;
    border-radius: 12px 12px 0 0;
    border-bottom: none;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.12);
    // 默认藏在屏幕外，选中题目后升起来
    transform: translateY(100%);
    transition: transform 0.25s ease;
    &.is-open {
      transform: translateY(0);
    }
  }
  .panel-head {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 10px 12px;
  }
}
</style>
