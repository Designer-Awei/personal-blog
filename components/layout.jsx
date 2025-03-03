import Link from 'next/link'
import ThemeToggle from './theme-toggle'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { useEffect } from 'react'

export default function Layout({ children }) {
  // 确保在客户端渲染时应用保存的主题颜色
  useEffect(() => {
    const savedThemeColor = localStorage.getItem('themeColor');
    if (savedThemeColor) {
      document.documentElement.setAttribute('data-theme-color', savedThemeColor);
      const isDark = document.documentElement.classList.contains('dark');
      const themeColorOptions = [
        { value: 'blue', bgLight: '#f0f7ff', bgDark: '#0f172a' },
        { value: 'green', bgLight: '#f0fdf4', bgDark: '#052e16' },
        { value: 'purple', bgLight: '#faf5ff', bgDark: '#2e1065' },
        { value: 'pink', bgLight: '#fdf2f8', bgDark: '#831843' },
        { value: 'orange', bgLight: '#fff7ed', bgDark: '#7c2d12' }
      ];
      
      const colorOption = themeColorOptions.find(option => option.value === savedThemeColor);
      if (colorOption) {
        const bgColor = isDark ? colorOption.bgDark : colorOption.bgLight;
        document.documentElement.style.setProperty('--theme-bg', bgColor);
        document.body.style.backgroundColor = bgColor;
      }
    }
  }, []);

  return (
    <div className="min-h-screen">
      <motion.header 
        className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'sticky', top: 0 }}
      >
        <div className="container flex h-16 items-center justify-between py-4">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/" className="flex items-center gap-2">
              <Home size={20} />
              <h1 className="text-xl font-bold cursor-pointer">博客首页</h1>
            </Link>
          </motion.div>
          <ThemeToggle />
        </div>
      </motion.header>
      <main className="container py-6">
        {children}
      </main>
      <motion.footer 
        className="border-t py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Designer-Awei. 保留所有权利.
        </div>
      </motion.footer>
    </div>
  )
} 