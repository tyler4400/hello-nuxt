// 按下某个 key 时执行 callback
export const useKeyPress = (key: string, cb: () => void) => {
  // 当前按下的键与传入的 key 相同时，执行回调
  const trigger = (event: KeyboardEvent) => {
    if (event.key === key) {
      cb()
    }
  }

  // onMounted / onUnmounted 是 Vue API，自动导入，无需 import
  // 组件挂载时绑定事件
  onMounted(() => {
    document.addEventListener('keydown', trigger)
  })

  // 组件卸载时移除事件，避免内存泄漏
  onUnmounted(() => {
    document.removeEventListener('keydown', trigger)
  })
}
