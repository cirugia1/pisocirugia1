'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, AlertCircle, User } from 'lucide-react'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', alias: '', specialty: '', license_number: '' })
  const [prefix, setPrefix] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: p }) => {
        if (!p) return
        setForm({
          full_name: p.full_name ?? '',
          alias: p.alias ?? '',
          specialty: p.specialty ?? '',
          license_number: p.license_number ?? '',
        })
        setPrefix(p.prefix ?? '')
        setRole(p.role ?? '')
        setLoading(false)
      })
    })
  }, [])

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('profiles').update({
      full_name: form.full_name,
      alias: form.alias || null,
      specialty: form.specialty || null,
      license_number: form.license_number || null,
    }).eq('id', user!.id)

    if (err) { setError(err.message); setSaving(false); return }
    setSuccess(true)
    setSaving(false)
  }

  if (loading) return <div className="p-6 text-gray-500 text-sm">Cargando perfil...</div>

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-sm text-gray-500 capitalize">{role}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Información personal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre completo *</Label>
              <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Alias / Apodo</Label>
              <Input value={form.alias} onChange={e => set('alias', e.target.value)} placeholder="Ej: Mafe, Pipe, Lugo..." />
              <p className="text-xs text-gray-400">Se mostrará en el sidebar en lugar de tu nombre completo.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Especialidad</Label>
              <Input value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder="Cirugía General..." />
            </div>
            <div className="space-y-1.5">
              <Label>N° de licencia</Label>
              <Input value={form.license_number} onChange={e => set('license_number', e.target.value)} placeholder="MPPS-12345" />
            </div>
            {prefix && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <span className="text-xs text-blue-600 font-medium">Prefijo asignado por el administrador:</span>
                <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">{prefix}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            <Check className="w-4 h-4 flex-shrink-0" />Perfil actualizado correctamente.
          </div>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>
    </div>
  )
}
