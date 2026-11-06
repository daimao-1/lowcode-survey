<template>
  <div>
    <div class="container">
      <h1 class="font-weight-100 text-center">渡一问卷系统</h1>
      <div class="mb-15">
        <el-button type="primary" :icon="Plus" @click="goToEditor">创建问卷</el-button>
        <el-button type="success" :icon="Compass" @click="goToComMarket">组件市场</el-button>
      </div>
      <!-- 桌面端：表格视图 -->
      <div class="desktop-only">
        <el-table :data="tableData" style="width: 100%" border>
          <el-table-column
            fixed
            prop="createDate"
            label="创建日期"
            width="150"
            :formatter="formatDate"
          />
          <el-table-column prop="title" label="问卷标题" />
          <el-table-column prop="surveyCount" label="题目数" width="150" align="center" />
          <el-table-column
            prop="updateDate"
            label="最近更新日期"
            width="150"
            align="center"
            :formatter="formatDate"
          />
          <el-table-column fixed="right" label="操作" width="300" align="center">
            <template #default="scope">
              <el-button link type="primary" size="small" @click="viewSurvey(scope.row)"
                >查看问卷</el-button
              >
              <el-button link type="primary" size="small" @click="editSurvey(scope.row)"
                >编辑</el-button
              >
              <el-button link type="primary" size="small" @click="delSurvey(scope.row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 移动端：卡片视图
           表格方案在窄屏下不可用：5 列固定宽合计 830px，
           而 fixed="right" 的操作列（300px）会直接盖住
           「问卷标题 / 题目数 / 最近更新日期」三列——
           不是不好看，是看都看不到。所以窄屏换成卡片。 -->
      <div class="mobile-only">
        <div class="survey-card" v-for="row in tableData" :key="row.id">
          <div class="survey-card-head">
            <span class="survey-card-title">{{ row.title }}</span>
            <span class="survey-card-count">{{ row.surveyCount }} 题</span>
          </div>
          <div class="survey-card-meta">
            <span>创建 {{ formatDateTime(row.createDate) }}</span>
            <span>更新 {{ formatDateTime(row.updateDate) }}</span>
          </div>
          <div class="survey-card-actions">
            <el-button type="primary" @click="viewSurvey(row)">查看问卷</el-button>
            <el-button type="warning" plain @click="editSurvey(row)">编辑</el-button>
            <el-button type="danger" plain @click="delSurvey(row)">删除</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Compass } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 路由
import { useRouter } from 'vue-router'
const router = useRouter()
// 类型
import type { SurveyDBReturnData } from '@/types'
// indexedDB
import { getSurveys } from '@/db/operation'
import { seedDemoSurveys } from '@/db/seed'
// 工具方法
import { formatDate, formatDateTime } from '@/utils'
import { remove } from '@/utils/dboperate'

const tableData = ref<SurveyDBReturnData[]>([])

// 先确保示例问卷已就位，再读取列表。
// 顺序不能反：如果并行发起，getSurveys 可能先返回空数组，
// 首页就会闪一下「暂无数据」再被填充，观感不好。
function getSurveyData() {
  seedDemoSurveys()
    .then(getSurveys)
    .then((res) => {
      tableData.value = res
    })
}
getSurveyData()

const goToEditor = () => {
  localStorage.setItem('activeView', 'editor')
  router.push('/editor/survey-type')
}

const goToComMarket = () => {
  localStorage.setItem('activeView', 'materials')
  router.push('/materials')
}

const viewSurvey = (surveyInfo: SurveyDBReturnData) => {
  router.push({
    path: `/preview/${surveyInfo.id}`,
    state: { from: 'home' },
  })
}

const editSurvey = (surveyInfo: SurveyDBReturnData) => {
  router.push(`/editor/${surveyInfo.id}/survey-type`)
}

const delSurvey = (surveyInfo: SurveyDBReturnData) => {
  // 删除整份问卷是不可逆的（IndexedDB 没有回收站），
  // 原来这里直接 remove()，手机上误触一次就永久没了。
  // 删单个模块有 ElMessageBox 确认，删整份问卷反而没有，属于不一致。
  ElMessageBox.confirm(
    `确定删除问卷「${surveyInfo.title}」吗？删除后无法恢复。`,
    '删除问卷',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    },
  )
    .then(() => {
      return remove(Number(surveyInfo.id)).then(() => {
        ElMessage({ type: 'success', message: '已删除' })
        getSurveyData()
      })
    })
    .catch(() => {
      // 用户取消，不做任何事
    })
}
</script>

<style scoped>
.container {
  padding: 20px;
}

/* 移动端卡片列表 */
.survey-card {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--white);
  padding: 14px;
  margin-bottom: 12px;
}
.survey-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.survey-card-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  word-break: break-word;
}
.survey-card-count {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--font-color-light);
  background: var(--border-color);
  border-radius: 10px;
  padding: 2px 10px;
}
.survey-card-meta {
  margin-top: 8px;
  font-size: 12px;
  color: var(--font-color-light);
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}
.survey-card-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
.survey-card-actions .el-button {
  flex: 1;
  margin-left: 0;
}

/* 默认桌面可见、移动端隐藏 */
.mobile-only {
  display: none;
}
@media screen and (max-width: 768px) {
  .container {
    padding: 12px;
  }
  .desktop-only {
    display: none;
  }
  .mobile-only {
    display: block;
  }
}
</style>
