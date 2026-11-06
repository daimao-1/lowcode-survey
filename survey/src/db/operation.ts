import { db } from './db'
import type { SurveyDBData, SurveyDBReturnData } from '@/types'

// 添加数据
export async function saveSurvey(survey: SurveyDBData) {
  return await db.surveys.add(survey)
}

// 查询数据
// 返回类型补上 SurveyDBReturnData：Dexie 主键是自增 id，
// 运行时每条记录都带 id，但原来的返回类型只声明了 SurveyDBData，
// 于是「按 id 删/跳转」这些操作在类型上无据可依（之前靠 el-table 的
// any 蒙混过去，列表换成 v-for 后就直接报错）。
export async function getSurveys(): Promise<SurveyDBReturnData[]> {
  const allSurveys = await db.surveys.toArray()
  return allSurveys as SurveyDBReturnData[]
}

// 获取单个数据
export async function getSurveyById(id: number) {
  const survey = await db.surveys.get(id)
  return survey
}

// 更新数据
export async function updateSurvey(id: number, updatedSurvey: Partial<SurveyDBData>) {
  await db.surveys.update(id, updatedSurvey)
}

// 删除数据
export async function deleteSurvey(id: number) {
  return await db.surveys.delete(id)
}
