import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

/**
 * 对话框根组件
 * @param {object} props - 组件属性
 * @returns {React.ReactElement} 对话框根组件
 */
const Dialog = DialogPrimitive.Root

/**
 * 对话框触发器组件
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>>}
 */
const DialogTrigger = DialogPrimitive.Trigger

/**
 * 对话框关闭组件
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>>}
 */
const DialogClose = DialogPrimitive.Close

/**
 * 对话框门户组件
 * @param {object} props - 组件属性
 * @returns {React.ReactElement} 对话框门户组件
 */
const DialogPortal = ({
  className,
  ...props
}) => (
  <DialogPrimitive.Portal className={cn(className)} {...props} />
)
DialogPortal.displayName = DialogPrimitive.Portal.displayName

/**
 * 对话框遮罩层组件
 * @param {object} props - 组件属性
 * @returns {React.ReactElement} 对话框遮罩层组件
 */
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

/**
 * 对话框内容组件
 * @param {object} props - 组件属性
 * @returns {React.ReactElement} 对话框内容组件
 */
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full",
        className
      )}
      {...props}>
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

/**
 * 对话框头部组件
 * @param {object} props - 组件属性
 * @returns {React.ReactElement} 对话框头部组件
 */
const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props} />
)
DialogHeader.displayName = "DialogHeader"

/**
 * 对话框页脚组件
 * @param {object} props - 组件属性
 * @returns {React.ReactElement} 对话框页脚组件
 */
const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props} />
)
DialogFooter.displayName = "DialogFooter"

/**
 * 对话框标题组件
 * @param {object} props - 组件属性
 * @returns {React.ReactElement} 对话框标题组件
 */
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

/**
 * 对话框描述组件
 * @param {object} props - 组件属性
 * @returns {React.ReactElement} 对话框描述组件
 */
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} 