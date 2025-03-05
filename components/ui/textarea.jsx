import * as React from "react"
import { cn } from "../../lib/utils"

/**
 * 文本区域组件，支持自动调整高度
 * @param {object} props - 组件属性
 * @returns {React.ReactElement} 文本区域组件
 */
const Textarea = React.forwardRef(({ className, maxRows = 5, ...props }, ref) => {
  const textareaRef = React.useRef(null)
  const combinedRef = useCombinedRefs(ref, textareaRef)
  
  // 调整文本区域高度的函数
  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    // 重置高度以获取正确的scrollHeight
    textarea.style.height = 'auto'
    
    // 计算新高度，但不超过maxRows行
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
    const maxHeight = lineHeight * maxRows
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    
    textarea.style.height = `${newHeight}px`
    
    // 如果内容超出maxRows，显示滚动条
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [maxRows])
  
  // 监听输入变化，调整高度
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    adjustHeight()
    
    // 监听窗口大小变化，重新调整高度
    window.addEventListener('resize', adjustHeight)
    return () => window.removeEventListener('resize', adjustHeight)
  }, [adjustHeight])
  
  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-y-hidden",
        className
      )}
      ref={combinedRef}
      onChange={(e) => {
        adjustHeight()
        props.onChange?.(e)
      }}
      rows={1}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

/**
 * 合并多个refs的工具函数
 * @param {...React.Ref} refs - 要合并的refs
 * @returns {React.Ref} 合并后的ref
 */
function useCombinedRefs(...refs) {
  const targetRef = React.useRef()

  React.useEffect(() => {
    refs.forEach(ref => {
      if (!ref) return
      
      if (typeof ref === 'function') {
        ref(targetRef.current)
      } else {
        ref.current = targetRef.current
      }
    })
  }, [refs])

  return targetRef
}

export { Textarea } 