<template>
  <div class="left-side-container flex">
    <div class="tabs">
      <div
        class="tab-item"
        :class="{
          'tab-show': routeName === 'survey-type',
        }"
        @click="switchEditor"
      >
        <el-icon><Document /></el-icon>
        <span class="tab-item-title mt-5">题型</span>
      </div>
      <div
        class="tab-item"
        :class="{
          'tab-show': routeName === 'outline',
        }"
        @click="switchOutline"
      >
        <el-icon><Memo /></el-icon>
        <span class="tab-item-title mt-5">大纲</span>
      </div>
    </div>
    <router-view class="tab-pane" @wheel="handleScroll($event)"></router-view>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Document, Memo } from '@element-plus/icons-vue'
import { handleScroll } from '@/utils'
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

const routeName = computed(() => route.name)
const id = route.params.id
const switchEditor = () => {
  if (id) {
    router.push(`/editor/${id}/survey-type`)
  } else {
    router.push('/editor/survey-type')
  }
}

const switchOutline = () => {
  if (id) {
    router.push(`/editor/${id}/outline`)
  } else {
    router.push('/editor/outline')
  }
}
</script>

<style scoped lang="scss">
.left-side-container {
  width: 300px;
  // 桌面端由外层 flex 容器排布，不再 absolute 浮在画布上
  flex: 0 0 300px;
  height: 100%;
  position: static;
  background: var(--white);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  > .tabs {
    width: 20%;
    height: 100%;
    border-right: 1px solid var(--border-color);
    > .tab-item {
      width: 100%;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: var(--font-color-light);
      text-decoration: none;
      cursor: pointer;
      > .tab-item-title {
        font-size: var(--font-size-base);
      }
    }
    > .tab-show {
      color: var(--primary-color);
    }
  }
  > .tab-pane {
    width: 80%;
    // 撑满左栏高度；内部内容（题库/大纲）自己滚动
    height: 100%;
    padding: 25px;
    overflow: hidden;
    box-sizing: border-box;
  }
}

// ============================================================
// 窄屏（≤1199px，含 iPad 横屏）：左侧面板改为「顶部横向 tab + 内容区」
// 原来这里写死 300px 宽的固定定位浮层，在 390px 屏幕上被压成
// 约 28px 的竖条，「题型 / 大纲」两个字都显示不全，等于没有。
// ============================================================
@media screen and (max-width: 1199px) {
  .left-side-container {
    width: 100%;
    flex: none;
    height: auto;
    border-left: none;
    border-right: none;
    border-radius: 0;
    flex-direction: column;
    > .tabs {
      width: 100%;
      height: auto;
      display: flex;
      border-right: none;
      border-bottom: 1px solid var(--border-color);
      > .tab-item {
        width: 50%;
        height: 52px;
        flex-direction: row;
        gap: 6px;
      }
    }
    > .tab-pane {
      width: 100%;
      height: auto;
      max-height: 38vh;
      padding: 12px;
      overflow-y: auto;
      // 题库项是 60px 宽的小方块，靠 space-between 排布。
      // 面板一变宽，项之间就被拉到整屏那么开，看着散、难点。
      // 限个宽度让它按原本的紧凑方式排。
      :deep(.survey-com-group-container) {
        max-width: 340px;
        // 原本带 mc 类（margin: 0 auto）会居中，限宽后看起来整体偏右
        margin-left: 0;
        margin-right: 0;
      }
      :deep(.survey-type-container) {
        height: auto;
        max-height: none;
        overflow: visible;
      }
    }
  }
}
</style>
