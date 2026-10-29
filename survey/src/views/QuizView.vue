<template>
  <div v-if="loadFailed" class="quiz-error">
    <el-empty description="问卷不存在或已过期" />
    <p class="quiz-error-tip">
      如果你打开的是演示链接，请注意：演示模式的问卷只保存在生成它的那个浏览器里。
    </p>
  </div>
  <div v-else-if="quizData">
    <div class="quiz-container mc">
      <div class="mt-30 mb-20">题目数量：{{ quizData.surveyCount }}</div>
      <div class="content mb-10" v-for="(com, index) in quizData.coms" :key="index">
        <component
          :is="com.type"
          :status="com.status"
          :serialNum="serialNum[index]"
          @updateAnswer="updateAnswer(index, $event)"
        />
      </div>
      <div class="mt-20 mb-20 text-center">
        <el-button type="primary" @click="submitAnswers">提交答案</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { QuizData } from '@/types'
// 工具
import { restoreComponentStatus } from '@/utils'
// 组合式函数
import { useSurveyNo } from '@/utils/hooks'
// 静态演示模式的本地问卷存储（后端不可用时兜底）
import { loadDemoQuiz } from '@/utils/demoStore'
// 引入 ElementPlus 库
import { ElMessage } from 'element-plus'
// 路由
import { useRoute } from 'vue-router'
const route = useRoute()

const quizData = ref<QuizData>({
  coms: [],
  surveyCount: 0,
})
// 用于存储所有问题的答案
const answers: Ref<{ [key: number]: string | number | Date }> = ref({})
// 获取题目编号
const serialNum = computed(() => useSurveyNo(quizData.value?.coms).value)
// 试卷是否加载成功（加载失败时不渲染空白答题页，给出明确提示）
const loadFailed = ref(false)
onMounted(async () => {
  const quizId = route.params.id as string

  // 先走后端拿试卷；拿不到再回落本地（纯静态部署的演示模式）
  // 原来的写法少了 response.ok 判断：后端返回 404 时，response.json() 拿到的是
  // { message: '...' } 而不是试卷，data.coms 为 undefined，JSON.parse(undefined)
  // 直接抛错，页面白屏且看不出原因。
  let data: any = null
  try {
    const response = await fetch(`/api/getQuiz/${quizId}`)
    if (response.ok) {
      data = await response.json()
    }
  } catch (err) {
    console.warn('[QuizView] 后端不可用，尝试读取本地问卷：', err)
  }

  if (!data) {
    data = loadDemoQuiz(quizId)
  }

  if (!data || typeof data.coms !== 'string') {
    loadFailed.value = true
    ElMessage.error('问卷不存在或已过期（演示模式的问卷只保存在生成它的浏览器里）')
    return
  }

  data.coms = JSON.parse(data.coms)
  restoreComponentStatus(data.coms)
  // 拿到试题数据
  quizData.value = data
})

const updateAnswer = (index: number, answer: string | number | Date) => {
  // index是题目本来的索引，通过serialNum.value[index]获取显示的题目索引
  // 检查 serialNum.value[index] 是否为 null
  const serial = serialNum.value[index]
  if (serial !== null) {
    answers.value[serial] = answer
  } else {
    // 处理 serialNum.value[index] 为 null 的情况
    console.error(`The serial number at index ${index} is null.`)
  }
}

const submitAnswers = async () => {
  const quizId = route.params.id
  // 原来不看返回结果就提示「已提交」——后端挂了也是一句成功，属于假反馈。
  // 现在区分真实提交和演示模式，避免面试时被追问「你确定存进去了吗」。
  let submitted = false
  try {
    const res = await fetch('/api/submitAnswers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quizId, answers: answers.value }),
    })
    submitted = res.ok
  } catch {
    submitted = false
  }

  ElMessage({
    message: submitted ? '答案已提交' : '演示模式：答案未回传服务器',
    type: submitted ? 'success' : 'warning',
  })
}
</script>

<style scoped lang="scss">
.quiz-container {
  width: 800px;
}
.quiz-error {
  padding: 80px 20px;
  text-align: center;
  .quiz-error-tip {
    color: var(--font-color-light);
    font-size: var(--font-size-base);
  }
}
</style>
