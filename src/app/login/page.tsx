'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 to-blue-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo Cirugía General" width={48} height={48} className="rounded-full" />
          <span className="text-white font-bold text-xl">Cirugia 1 Piso</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Cirugia 1 Piso
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            Gestión integral de pacientes, notas clínicas, órdenes médicas y recetas para servicios quirúrgicos.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: 'Fichas digitales', desc: 'Notas preop/postop y evoluciones' },
              { label: 'Vademécum VE', desc: 'Fármacos con nombre comercial' },
              { label: 'Pendientes', desc: 'Por prioridad y médico asignado' },
              { label: 'Documentos PDF', desc: 'Recetas y órdenes imprimibles' },
            ].map(f => (
              <div key={f.label} className="bg-white/10 rounded-lg p-4">
                <p className="text-white font-semibold text-sm">{f.label}</p>
                <p className="text-blue-200 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-500 text-sm">
          © 2025 Cirugia 1 Piso — Sistema de gestión clínica
        </p>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Cirugia 1 Piso</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Iniciar sesión</h2>
          <p className="text-gray-500 text-sm mb-8">Ingresa tus credenciales para acceder al sistema.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="medico@hospital.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            ¿No tienes cuenta? Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  )
}
