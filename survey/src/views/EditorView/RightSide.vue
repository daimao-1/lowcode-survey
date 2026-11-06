<template>
  <div class="right-side-container" :class="{ 'is-open': isOpen }" @wheel="handleScroll($event)">
    <div
      v-if="store.currentComponentIndex === -1"
      class="content flex justify-content-center align-items-center"
    >
      点击题型进行编辑
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
const currentCom = computed(() => store.coms[store.currentComponentIndex])
// 选中题目时属性面板才打开（移动端用，移动端它是从底部升起的抽屉）
const isOpen = computed(() => store.currentComponentIndex !== -1)
// 右侧编辑面板的父组件提供修改状态的方法
</script>

<style scoped lang="scss">
.right-side-container {
  width: 320px;
  height: calc(100vh - 50px - 40px);
  position: fixed;
  right: 20px;
  top: 70px;
  background-color: var(--white);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow-y: scroll;
}
.content {
  height: 100%;
}

// ============================================================
// 移动端：属性面板改成「底部抽屉」
// 原来固定 320px 贴在右边，390px 屏幕上完全在可视区之外，
// 选完题目根本看不到属性，等于改不了。
// ============================================================
@media screen and (max-width: 768px) {
  .right-side-container {
    width: 100%;
    height: 62vh;
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
}
</style>
