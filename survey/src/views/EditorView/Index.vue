<template>
  <div>
    <div class="header">
      <Header :isEditor="true" :id="id" />
    </div>
    <div class="container">
      <LeftSide />
      <Center />
      <RightSide />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { ElMessage } from 'element-plus'
// db
import { getSurveyById } from '@/db/operation'
import Header from '@/components/Common/Header.vue'
import LeftSide from './LeftSide/Index.vue'
import Center from './Center.vue'
import RightSide from './RightSide.vue'
// 仓库
import { useEditorStore } from '@/stores/useEditor'
const store = useEditorStore()
store.initStore() // 先初始化一次状态，保证进入编辑器时有初始状态
// 路由
import { useRoute } from 'vue-router'
const route = useRoute()
// 工具
import { restoreComponentStatus } from '@/utils'
// 数据仓库更新方法
import { dispatchStatus } from '@/stores/dispatch'
// 类型
import type { UpdateStatus, TypeStatus, OptionsStatus, GetLink, PicLink } from '@/types'

// 如果有传递过来 id，就从数据库中获取数据来初始化仓库
const id = computed(() => (route.params.id ? String(route.params.id) : undefined))
if (id.value) {
  getSurveyById(Number(id.value)).then((res) => {
    if (res) {
      restoreComponentStatus(res.coms)
      store.setStore(res)
    }
  })
}
// 向子组件提供修改状态的方法
const updateStatus: UpdateStatus = (
  configKey: string,
  payload?: number | string | boolean | object,
  isShowChange?: boolean,
) => {
  // 没有进入编辑状态，不允许改属性（双击题目才进入）
  if (store.editingIndex === -1) {
    ElMessage({
      message: '请先双击题目进入编辑状态',
      type: 'warning',
    })
    return
  }
  // 改的是面板当前显示的那道题（面板跟随选中项切换）
  const status = store.coms[store.currentComponentIndex].status as unknown as
    | TypeStatus
    | OptionsStatus
  dispatchStatus(store, status, configKey, payload, isShowChange)
}
provide('updateStatus', updateStatus)
const getPicLink: GetLink = (link: PicLink) => {
  // 拿到上传的链接地址，从而更新状态仓库
  updateStatus('options', link)
}
provide('getPicLink', getPicLink)
</script>

<style scoped lang="scss">
.header {
  width: 100%;
  background-color: var(--white);
  position: fixed;
  top: 0;
  z-index: 10;
}

// ============================================================
// 编辑器改为 flex 三栏：左题型栏 / 中画布 / 右属性栏
//
// 原来三块是各自绝对定位的写死宽度：
//   .left-side-container  { position: fixed; width: 300px; left: 20px }
//   .right-side-container { position: fixed; width: 320px; right: 20px }
//   .center-container     { width: 50%; margin: 70px auto }
// 画布的 50% 宽度跟两侧的固定宽度毫无关系，视口一旦小于约 1300px，
// 两侧面板就压在画布上（实测 1024px 时重叠 2.6 万 / 3.2 万平方像素），
// 点被压住的那半边题目，点击落到面板上，属性面板永远不触发。
//
// 现在画布用 flex 吃剩余空间，左右两栏固定宽度且不重叠。
// ============================================================
.container {
  width: 100%;
  height: calc(100vh - 50px);
  padding: 20px;
  box-sizing: border-box;
  background: url('@/assets/imgs/editor_background.png');
  position: fixed;
  top: 50px;
  display: flex;
  align-items: stretch;
  gap: 20px;
  overflow: hidden;
}

// 窄屏（含 iPad 横屏 / 笔记本窄窗口）：左右面板改为覆盖式抽屉，
// 画布铺满。断点取 1200px —— 再窄的话三栏会把画布压到没法用。
@media screen and (max-width: 1199px) {
  .container {
    padding: 0;
    display: block;
    height: auto;
    overflow: visible;
  }
}
</style>
