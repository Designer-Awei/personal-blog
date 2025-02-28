import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { useToast } from "./use-toast"

const ToastProvider = ({ children }) => {
  const { toasts } = useToast()

  return (
    <>
      {children}
      <div className="fixed top-0 right-0 z-50 flex flex-col p-4 gap-2 w-full max-w-sm">
        <AnimatePresence>
          {toasts.map(function ({ id, title, description, variant, open }) {
            return (
              <Toast key={id} open={open} variant={variant}>
                <div className="grid gap-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && (
                    <ToastDescription>{description}</ToastDescription>
                  )}
                </div>
                <ToastClose />
              </Toast>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}

const Toast = React.forwardRef(({ className, variant, open, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ 
        duration: 0.3,
        ease: "easeInOut"
      }}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg transition-all",
        variant === "default" && "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
        variant === "destructive" && "bg-red-600 text-white border-red-600",
        className
      )}
      {...props}
    />
  )
})
Toast.displayName = "Toast"

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-medium", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

const ToastClose = React.forwardRef(({ className, ...props }, ref) => {
  const { dismiss } = useToast()
  return (
    <button
      ref={ref}
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-gray-500 opacity-0 transition-opacity hover:text-gray-900 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 dark:text-gray-400 dark:hover:text-gray-100",
        className
      )}
      onClick={() => dismiss()}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  )
})
ToastClose.displayName = "ToastClose"

export { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose } 