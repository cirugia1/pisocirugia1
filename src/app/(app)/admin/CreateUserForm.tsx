'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Check, AlertCircle } from 'lucide-react'

export default function CreateUserForm() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'residente', specialty: '', license_number: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      user_metadata: {
        full_name: form.full_name,
        role: form.role,
      },
      email_confirm: true,
    })

    if (signUpError) {
      // Fallback: use signUp if admin API not available
      const { error: err2 } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, role: form.role } }
      })
      if (err2) {
        setError(err2.message)
        setLoading(false)
        return
      }
    }

    // Update profile with extra data
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', form.email)
      .single()

    if (existingProfile) {
      await supabase.from('profiles').update({
        role: form.role,
        specialty: form.specialty || null,
        license_number: form.license_number || null,
      }).eq('id', existingProfile.id)
    }

    setSuccess(true)
    setForm({ email: '', password: '', full_name: '', role: 'residente', specialty: '', license_number: '' })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Nombre completo *</Label>
          <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Dr. María González" required />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Correo electrónico *</Label>
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="medico@hospital.com" required />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Contraseña temporal *</Label>
          <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 caracteres" required minLength={8} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Rol *</Label>
          <Select value={form.role} onValueChange={v => set('role', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="medico">Médico</SelectItem>
              <SelectItem value="residente">Residente</SelectItem>
              <SelectItem value="enfermeria">Enfermería</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">N° de licencia</Label>
          <Input value={form.license_number} onChange={e => set('license_number', e.target.value)} placeholder="MPPS-12345" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Especialidad</Label>
          <Input value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder="Cirugía General, Urología..." />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-3 rounded-lg">
          <Check className="w-4 h-4 flex-shrink-0" /> Usuario creado exitosamente.
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        <UserPlus className="w-4 h-4" />
        {loading ? 'Creando...' : 'Crear usuario'}
      </Button>
    </form>
  )
}
