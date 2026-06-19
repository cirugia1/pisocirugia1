'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, CheckSquare, Pill,
  FlaskConical, BookOpen, Settings, LogOut, Stethoscope, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/notes', label: 'Notas Clínicas', icon: FileText },
  { href: '/tasks', label: 'Pendientes', icon: CheckSquare },
  { href: '/prescriptions', label: 'Recetas', icon: Pill },
  { href: '/orders', label: 'Órdenes', icon: FlaskConical },
  { href: '/vademecum', label: 'Vademécum', icon: BookOpen },
]

const adminItems = [
  { href: '/admin', label: 'Administración', icon: Settings },
]

interface SidebarProps {
  profile: Profile
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">ClínicaQ</p>
          <p className="text-xs text-slate-400">Sistema Quirúrgico</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-lg bg-slate-800">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">
          {profile.role === 'admin' ? 'Administrador' :
           profile.role === 'medico' ? 'Médico' :
           profile.role === 'residente' ? 'Residente' : 'Enfermería'}
        </p>
        <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
        {profile.specialty && (
          <p className="text-xs text-slate-400 truncate">{profile.specialty}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Principal</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-70" />}
            </Link>
          )
        })}

        {profile.role === 'admin' && (
          <>
            <p className="px-3 py-1 mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistema</p>
            {adminItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
