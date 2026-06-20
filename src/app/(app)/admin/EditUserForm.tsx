'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Check, AlertCircle } from 'lucide-react'

const PREFIXES = ['R1', 'R2', 'R3', 'R4', 'Adjunto', 'Jefe de Residentes', 'Jefe de Servicio']

interface Props {
  profile: any
}

export default function EditUserForm({ profile }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    alias: profile.alias ?? '',
    prefix: profile.prefix ?? '',
    role: profile.role ?? 'residente',
    specialty: profile.specialty ?? '',
    license_number: profile.license_number ?? '',
  })

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    setSuccess(false)
    const supabase = createClient()
    const { error: err } = await supabase.from('profiles').update({
      full_name: form.full_name,
      alias: form.alias || null,
      prefix: form.prefix || null,
      role: form.role,
      specialty: form.specialty || null,
      license_number: form.license_number || null,
    }).eq('id', profile.id)

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      setOpen(false)
      setSuccess(false)
      router.refresh()
    }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded hover:bg-gray-200 transition-colors" title="Editar usuario">
          <Pencil className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre completo *</Label>
            <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Dr. María González" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Prefijo / Cargo</Label>
              <Select value={form.prefix} onValueChange={v => set('prefix', v)}>
                <SelectTrigger><SelectValue placeholder="Sin prefijo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin prefijo</SelectItem>
                  {PREFIXES.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Alias / Apodo</Label>
              <Input value={form.alias} onChange={e => set('alias', e.target.value)} placeholder="Ej: Mafe, Pipe..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <Label className="text-xs">N° Licencia</Label>
              <Input value={form.license_number} onChange={e => set('license_number', e.target.value)} placeholder="MPPS-12345" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Especialidad</Label>
            <Input value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder="Cirugía General..." />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />Guardado exitosamente
            </div>
          )}

          <Button className="w-full" onClick={handleSave} disabled={loading || !form.full_name}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
