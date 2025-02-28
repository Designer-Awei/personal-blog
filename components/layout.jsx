import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'
import { motion } from 'framer-motion'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <motion.header 
        className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container flex h-16 items-center justify-between py-4">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/">
              <h1 className="text-xl font-bold cursor-pointer">我的个人博客</h1>
            </Link>
          </motion.div>
          <ThemeToggle />
        </div>
      </motion.header>
      <main className="container py-6 gradient-bg dark:bg-background">
        {children}
      </main>
      <motion.footer 
        className="border-t py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} 我的个人博客. 保留所有权利.
        </div>
      </motion.footer>
    </div>
  )
} 