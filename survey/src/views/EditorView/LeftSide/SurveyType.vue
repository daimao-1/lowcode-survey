<template>
  <div class="survey-type-container">
    <SurveyComGroup v-for="(group, index) in SurveyComsList" :key="index" v-bind="group" />
  </div>
</template>

<script setup lang="ts">
import SurveyComGroup from '@/components/Editor/SurveyComGroup.vue'
import { SurveyComsList } from '@/configs/SurveyGroupConfig'
// 组件名
defineOptions({
  name: 'SurveyType',
})
</script>

<style scoped lang="scss">
.survey-type-container {
  // 原来写死 calc(100vh - 50px - 40px) + overflow:hidden，
  // 题型一多（个人信息和联系方式加起来十几项）底部就被裁掉且无法滚动。
  // 改成撑满父容器、自己滚。
  height: 100%;
  overflow-y: auto;
}
</style>
