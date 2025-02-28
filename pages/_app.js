import { ThemeProvider } from '../components/theme-provider'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Component {...pageProps} />
        </ThemeProvider>
    );
} 