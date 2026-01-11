import "./globals.css"
import { ThemeProvider } from "@/src/app/components/theme/ThemeProvider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
