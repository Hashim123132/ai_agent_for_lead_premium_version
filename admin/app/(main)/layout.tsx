import Sidebar from "@/components/layout/sidebar"
import Navbar from "@/components/landing/Navbar"
import Footer from "@/components/landing/Footer"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar variant="app" />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
