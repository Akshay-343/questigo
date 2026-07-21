import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { TeacherSidebar } from './TeacherSidebar'
import { LogoMark } from '@/components/ui/Logo'

export function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <TeacherSidebar />
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile slide-in sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <TeacherSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <LogoMark className="h-7 w-7 rounded-lg" />
            <span className="text-sm font-bold">Questigo</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
