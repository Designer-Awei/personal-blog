import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from './ui/button';
import notifications from '../data/notifications';

/**
 * 公告栏组件
 * @returns {React.ReactElement} 公告栏组件
 */
export default function NotificationBar() {
  const [visible, setVisible] = useState(true);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const containerRef = useRef(null);
  const textRef = useRef(null);

  // 关闭公告栏
  const handleClose = () => {
    setVisible(false);
    // 将关闭状态保存到sessionStorage，使其在当前会话中保持关闭
    // 注意：我们不再保存关闭状态，确保每次刷新页面时公告栏都会显示
  };

  // 初始化时始终显示公告栏
  useEffect(() => {
    // 确保公告栏始终可见
    setVisible(true);
  }, []);

  // 监听容器宽度变化
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidths = () => {
      if (containerRef.current && textRef.current) {
        // 获取容器宽度（减去图标和按钮的宽度以及间距）
        const containerRect = containerRef.current.getBoundingClientRect();
        // 假设图标和按钮加间距大约占用120px
        setContainerWidth(containerRect.width - 120);
        
        // 获取文本宽度
        const textRect = textRef.current.getBoundingClientRect();
        setTextWidth(textRect.width);
      }
    };

    // 初始化时更新宽度
    updateWidths();

    // 监听窗口大小变化
    window.addEventListener('resize', updateWidths);
    
    // 在文本内容变化时更新宽度
    const observer = new MutationObserver(updateWidths);
    if (textRef.current) {
      observer.observe(textRef.current, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener('resize', updateWidths);
      observer.disconnect();
    };
  }, [currentNotificationIndex]);

  // 计算文本滚动动画的持续时间
  const calculateAnimationDuration = (textWidth, containerWidth) => {
    // 如果文本宽度小于容器宽度，则不需要滚动，只需停留足够时间
    if (textWidth <= containerWidth) {
      return 5; // 5秒停留时间
    }
    
    // 计算需要滚动的距离
    const scrollDistance = textWidth + containerWidth;
    
    // 根据滚动距离计算动画持续时间，每100像素0.8秒，最少8秒
    // 增加2秒的初始停留时间
    return Math.max(scrollDistance * 0.008, 8) + 2;
  };

  // 切换到下一条通知
  const goToNextNotification = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentNotificationIndex((prevIndex) => 
        (prevIndex + 1) % notifications.length
      );
      setIsAnimating(false);
    }, 300); // 减少切换动画的持续时间，使过渡更快
  };

  // 自动切换通知
  useEffect(() => {
    if (!visible || notifications.length <= 1 || textWidth === 0 || containerWidth === 0) return;

    const duration = calculateAnimationDuration(textWidth, containerWidth);
    
    // 文本滚动完成后切换到下一条通知
    const timer = setTimeout(goToNextNotification, duration * 1000 + 500); // 加0.5秒作为缓冲
    
    return () => clearTimeout(timer);
  }, [currentNotificationIndex, visible, textWidth, containerWidth]);

  // 如果不可见或没有通知，则不渲染
  if (!visible || notifications.length === 0) {
    return null;
  }

  const currentNotification = notifications[currentNotificationIndex];
  const animationDuration = calculateAnimationDuration(textWidth, containerWidth);
  
  // 根据文本和容器宽度决定动画
  const getAnimationProps = () => {
    // 如果文本宽度小于容器宽度，则不需要滚动
    if (textWidth <= containerWidth) {
      return {
        initial: { x: 0 },
        animate: { x: 0 },
        exit: { x: "-100%" },
        transition: { 
          duration: animationDuration,
          ease: "linear"
        }
      };
    }
    
    // 否则需要从右向左滚动，并在开始时停留2秒，然后平滑过渡
    return {
      initial: { x: 0 },
      animate: { 
        x: [
          0,                           // 开始位置
          0,                           // 保持停留
          -10,                         // 轻微开始移动
          -(textWidth - containerWidth), // 滚动到末尾
        ]
      },
      exit: { x: "-100%" },
      transition: { 
        duration: animationDuration,
        times: [0, 0.2, 0.25, 1], // 前20%停留，然后5%时间用于起步，后75%完成滚动
        ease: ["linear", "easeOut", "linear"] // 不同阶段使用不同的缓动函数
      }
    };
  };

  const animationProps = getAnimationProps();

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-primary/15 dark:bg-primary/20 border-b border-primary/20 overflow-hidden shadow-sm notification-bar w-full"
    >
      <div className="container mx-auto">
        <div className="py-2 px-4 flex items-center space-x-4 notification-container" ref={containerRef}>
          {/* 动态喇叭图标 */}
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 10, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              repeatDelay: 3
            }}
            className="flex-shrink-0 text-primary flex items-center justify-center h-6"
          >
            <Bell size={18} className="text-primary" />
          </motion.div>
          
          {/* 滚动文字容器 */}
          <div className="flex-1 overflow-hidden relative h-6 flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentNotification.id}
                {...animationProps}
                className="absolute whitespace-nowrap text-sm font-medium text-foreground dark:text-foreground notification-text leading-6"
                ref={textRef}
              >
                {currentNotification.content}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* 关闭按钮 */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0 h-6 w-6 rounded-full hover:bg-primary/20 hover:text-primary focus:ring-0 flex items-center justify-center"
            onClick={handleClose}
          >
            <X size={16} />
            <span className="sr-only">关闭通知</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 