import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 是否处于移动端窄屏（默认断点 768px）。
 *
 * CSS 媒体查询能改样式，但改不了「面板要不要显示」这类逻辑
 * （比如选中题目后才弹出属性面板），所以布局判断需要一份 JS 状态。
 */
export function useIsMobile(breakpoint = 768) {
  const isMobile = ref(false)

  const update = () => {
    isMobile.value = window.innerWidth <= breakpoint
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
