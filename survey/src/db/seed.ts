// seed.ts
// ---------------------------------------------------------------------------
// 首次访问时预置示例问卷
//
// 为什么需要：
//   新部署的站点打开首页是一张「暂无数据」的空表。作为作品集链接发出去，
//   面试官点进来看到空表，第一印象就是半成品 —— 哪怕功能全都做好了。
//   预置两份问卷，首页一打开就有内容可点。
//
// 为什么不能在静态文件里写死一份 JSON：
//   问卷数据里的 com.type 是 markRaw() 包过的**真实 Vue 组件**，
//   没法序列化成 JSON。所以必须在运行时调用 configs/defaultStatus 下的
//   工厂函数来构造，这里直接复用现有工厂，不复制一份默认值。
//
// 为什么用 localStorage 打标记而不是只看表是否为空：
//   用户可能把示例问卷全删了。只看 count === 0 的话，下次刷新又会塞回来，
//   像删不掉的牛皮癣。标记只种一次，删了就删了。
// ---------------------------------------------------------------------------

import { db } from './db'
import type { Status } from '@/types'

const SEED_FLAG = 'survey_demo_seed_v1'

// ⚠️ 这里刻意**不**在文件顶部 import defaultStatus 下的工厂。
//
// 原因：那些工厂会 import 各自的 Vue 组件，而组件又反过来依赖 stores/utils，
// 与 HomeView → seed 这条链组成循环依赖。实测在静态 import 下，构建能过，
// 但浏览器入口直接抛 "Cannot access 'xx' before initialization" 并整站白屏
// （TDZ：模块还没初始化完就被访问）。
//
// 改成在函数内部动态 import，把这条链推迟到「应用已经挂载完」之后再执行，
// 循环就断开了。代价只是首次访问多一次异步加载。

// 落库前必须过一遍 JSON 序列化 —— 和 utils/dboperate.ts 里 save() 的写法保持一致。
//
// 原因：com.type 是 markRaw() 包过的 Vue 组件（本质是对象/函数），com.status 里
// 每一项的 editCom 同理。IndexedDB 用结构化克隆存数据，**函数无法被克隆**，
// 直接塞原始对象会抛 DataCloneError。JSON.stringify 会把这些字段丢掉，
// 只留下 name（'single-select' 这类字符串），读取时由 restoreComponentStatus
// 按 name 从 componentsMap 把组件重新挂回去。
function toStorable(coms: Status[]): Status[] {
  return JSON.parse(JSON.stringify(coms))
}

type Factories = {
  singleSelect: () => Status
  multiSelect: () => Status
  textInput: () => Status
  rateScore: () => Status
}

// 工厂返回的 status 是结构化配置对象，这里取宽类型方便改写具体字段
type AnyStatus = Record<string, any>

function setTitle(com: Status, title: string, desc?: string): Status {
  const status = com.status as AnyStatus
  if (status.title) status.title.status = title
  if (desc && status.desc) status.desc.status = desc
  return com
}

function setOptions(com: Status, options: string[]): Status {
  const status = com.status as AnyStatus
  if (status.options) status.options.status = options
  return com
}

function buildSurveyOne(f: Factories): Status[] {
  return [
    setTitle(
      f.singleSelect(),
      '你目前最想去的城市是？',
      '单选题：用于验证单选组件的配置化渲染',
    ),
    setOptions(
      setTitle(f.multiSelect(), '你熟悉哪些技术栈？', '多选题：可勾选多项'),
      ['Vue 3 + TypeScript', 'React', 'Node.js', 'Spring Boot', 'MySQL / Redis'],
    ),
    setTitle(f.rateScore(), '你对当前求职准备的自信程度打几分？', '评分题'),
    setTitle(f.textInput(), '留下邮箱，方便同步内推信息', '文本输入：单行文本'),
  ]
}

function buildSurveyTwo(f: Factories): Status[] {
  return [
    setOptions(
      setTitle(f.singleSelect(), '你使用过本问卷系统的哪个功能？', '单选题'),
      ['可视化编辑器', '拖拽排序', 'PDF 导出', '在线答题'],
    ),
    setTitle(f.textInput(), '你觉得哪里还可以改进？', '文本输入：可切换为多行文本'),
  ]
}

/**
 * 首次访问预置示例问卷。重复调用安全（有标记 + 有数据就跳过）。
 */
export async function seedDemoSurveys(): Promise<void> {
  if (localStorage.getItem(SEED_FLAG)) return

  try {
    // 先看有没有真实数据，有就不打扰
    if ((await db.surveys.count()) > 0) {
      localStorage.setItem(SEED_FLAG, '1')
      return
    }

    const [
      { default: singleSelect },
      { default: multiSelect },
      { default: textInput },
      { default: rateScore },
    ] = await Promise.all([
      import('@/configs/defaultStatus/SingleSelect'),
      import('@/configs/defaultStatus/MultiSelect'),
      import('@/configs/defaultStatus/TextInput'),
      import('@/configs/defaultStatus/RateScore'),
    ])
    const factories: Factories = { singleSelect, multiSelect, textInput, rateScore }

    const now = Date.now()
    await db.surveys.bulkAdd([
      {
        createDate: now - 2 * 24 * 60 * 60 * 1000,
        updateDate: now - 2 * 24 * 60 * 60 * 1000,
        title: '前端开发岗求职意向调研（示例）',
        surveyCount: 4,
        coms: toStorable(buildSurveyOne(factories)),
      },
      {
        createDate: now - 6 * 60 * 60 * 1000,
        updateDate: now - 6 * 60 * 60 * 1000,
        title: '问卷系统使用体验反馈（示例）',
        surveyCount: 2,
        coms: toStorable(buildSurveyTwo(factories)),
      },
    ])

    localStorage.setItem(SEED_FLAG, '1')
  } catch (err) {
    // 预置失败不该影响正常使用，仅记录。
    // 生产构建里错误对象会被压缩成单字母，所以把 name / message 显式取出来。
    const e = err as any
    console.warn('[seed] 示例问卷预置失败：', e?.name, e?.message || String(err))
  }
}
