import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="/">
              <h1 className="text-xl font-bold cursor-pointer">我的个人博客</h1>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="container py-6">{children}</main>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} 我的个人博客. 保留所有权利.
        </div>
      </footer>
    </div>
  )
} 