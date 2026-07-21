import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Sparkles,
  PencilRuler,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { InitialsAvatar } from '@/components/ui/avatar'
import { LogoMark } from '@/components/ui/Logo'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  label: string
  icon: React.ReactNode
  to: string
  disabled?: boolean
  badge?: string
}

interface TeacherSidebarProps {
  onClose?: () => void
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, to: '/teacher/dashboard' },
  { label: 'Create Quest', icon: <PencilRuler size={18} />, to: '/teacher/quests/new' },
  { label: 'Generate Quests', icon: <Sparkles size={18} />, to: '/teacher/upload' },
  { label: 'Approve Content', icon: <CheckSquare size={18} />, to: '/teacher/approve' },
  { label: 'Students', icon: <Users size={18} />, to: '/teacher/students' },
  { label: 'Settings', icon: <Settings size={18} />, to: '/teacher/settings', disabled: true, badge: 'Soon' },
]

export function TeacherSidebar({ onClose }: TeacherSidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/teacher/login')
  }

  const handleNavClick = () => {
    onClose?.()
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-surface border-r border-border">
      {/* Logo */}
      <div className="flex items-center justify-between gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8 rounded-lg" />
          <div>
            <p className="text-sm font-bold text-foreground tracking-wide">Questigo</p>
            <p className="text-[10px] text-muted uppercase tracking-widest">Teacher Portal</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) =>
          item.disabled ? (
            <div
              key={item.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted opacity-50 cursor-not-allowed"
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="muted" className="text-[10px] px-1.5 py-0">
                  {item.badge}
                </Badge>
              )}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 group',
                  isActive
                    ? 'bg-brand/15 text-brand font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn(isActive ? 'text-brand' : 'text-muted group-hover:text-foreground')}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} className="text-brand" />}
                </>
              )}
            </NavLink>
          )
        )}
      </nav>

      <Separator />

      {/* User Footer */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <InitialsAvatar name={user?.name ?? 'Teacher'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted hover:text-danger transition-colors p-1 rounded"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
