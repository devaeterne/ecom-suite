import AuthGuard from "@/components/auth/AuthGuard"
import Sidebar from "@/components/sidebar/Sidebar"
import Topbar from "@/components/topbar/Topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto p-6 bg-ui-bg-subtle">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
