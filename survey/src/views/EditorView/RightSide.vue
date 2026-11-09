<template>
  <div class="right-side-container" :class="{ 'is-open': isOpen }" @wheel="handleScroll($event)">
    <!-- 窄屏下属性面板是从底部升起的抽屉，需要一个明确的关闭入口 -->
    <div class="drawer-head" v-if="isOpen">
      <span class="drawer-title">题目属性</span>
      <el-button type="primary" size="small" @click="closeDrawer">关闭</el-button>
    </div>
    <div
      v-if="store.currentComponentIndex === -1"
      class="content flex justify-content-center align-items-center"
    >
      双击题目进行编辑
    </div>
    <div v-else>
      <EditPannel :com="currentCom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
// 关闭抽屉 = 退出编辑并取消选中
const closeDrawer = () => {
  store.setEditingIndex(-1)
  store.setCurrentComponentIndex(-1)
}
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

// 抽屉头部只在窄屏出现（桌面端右栏常驻，不需要关闭按钮）
.drawer-head {
  display: none;
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
  .drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    background: var(--white);
    z-index: 2;
    .drawer-title {
      font-size: 14px;
      font-weight: 500;
    }
  }
}
</style>
