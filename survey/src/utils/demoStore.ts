// demoStore.ts
// ---------------------------------------------------------------------------
// 静态演示模式的本地问卷存储
//
// 背景：这个项目原本的「发布问卷 → 在线答题」依赖后端 /api/saveQuiz 和
// /api/getQuiz/:id。把前端单独部署成静态站点做演示时，后端不在，这两个
// 接口会 404，发布出来的链接就是死的。
//
// 做法：发布时除了尝试走后端，再往 localStorage 写一份；答题页优先读后端，
// 读不到就回落到本地。这样纯静态部署也能完整演示「编辑 → 发布 → 答题」闭环。
//
// 边界（面试可能要解释）：
//   - 数据存在**当前浏览器**，换设备/清缓存就没了，所以它只是演示降级，
//     不能替代真实后端。
//   - localStorage 单域名上限约 5MB，问卷里内嵌 base64 图片会很快吃满，
//     所以写入失败要明确提示，不能静默吞掉。
// ---------------------------------------------------------------------------

const KEY_PREFIX = 'survey_demo_quiz_'

// 问卷数据的最小结构，和 /api/getQuiz/:id 的返回体保持一致，
// 这样答题页拿到的数据形状不因来源不同而变化。
export interface DemoQuizData {
  coms: string
  surveyCount: number
}

export function saveDemoQuiz(id: string, data: DemoQuizData): boolean {
  try {
    localStorage.setItem(KEY_PREFIX + id, JSON.stringify(data))
    return true
  } catch (err) {
    // 多为超出配额（内嵌图片过大）
    console.warn('[demoStore] 本地保存失败：', err)
    return false
  }
}

export function loadDemoQuiz(id: string): DemoQuizData | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + id)
    return raw ? (JSON.parse(raw) as DemoQuizData) : null
  } catch (err) {
    console.warn('[demoStore] 本地读取失败：', err)
    return null
  }
}
