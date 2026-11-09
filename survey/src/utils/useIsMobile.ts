import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 是否处于「需要移动端处理」的状态。
 *
 * 两种情况任一成立即为真：
 * 1) 视口窄于断点（默认 1199px，和编辑器窄屏布局的断点保持一致；
 *    之前的 768 太窄，漏掉了笔记本窄窗口和 iPad 横屏这一整段，
 *    那段宽度下左右面板会压在画布上）；
 * 2) 主指针是 coarse（触屏设备）—— 触屏上 HTML5 拖拽不可用，
 *    不管屏幕多宽都得靠上移/下移按钮排序。
 *
 * CSS 媒体查询能改样式，但改不了「面板要不要显示」这类逻辑，
 * 所以布局判断需要一份 JS 状态。
 */
export function useIsMobile(breakpoint = 1199) {
  const isMobile = ref(false)

  const update = () => {
    const coarse =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches
    isMobile.value = window.innerWidth <= breakpoint || coarse
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return isMobile
}
