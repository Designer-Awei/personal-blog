import { ThemeProvider } from '../components/theme-provider'
import '../styles/globals.css'
import { ToastProvider } from '../components/ui/toast'
import { Toaster } from 'react-hot-toast'

export default function App({ Component, pageProps }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ToastProvider>
                <Component {...pageProps} />
                <Toaster position="bottom-right" />
            </ToastProvider>
        </ThemeProvider>
    );
} 