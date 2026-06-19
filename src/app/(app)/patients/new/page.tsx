'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewPatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    hcl: '', first_name: '', last_name: '', birth_date: '',
    sex: '', id_number: '', phone: '', address: '',
    bed: '', service: '', diagnosis: '', allergies: '',
    surgical_history: '', admission_date: new Date().toISOString().split('T')[0],
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: err } = await supabase.from('patients').insert({
      ...form,
      created_by: user!.id,
    }).select().single()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push(`/patients/${data.id}`)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Paciente</h1>
          <p className="text-gray-500 text-sm">Ingresa los datos del paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Datos Identificatorios</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hcl">Historia Clínica (HCL) *</Label>
              <Input id="hcl" value={form.hcl} onChange={e => set('hcl', e.target.value)} placeholder="Ej: HC-00001" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="id_number">Cédula / Documento</Label>
              <Input id="id_number" value={form.id_number} onChange={e => set('id_number', e.target.value)} placeholder="V-12345678" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Nombres *</Label>
              <Input id="first_name" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Juan Carlos" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Apellidos *</Label>
              <Input id="last_name" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Pérez García" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Fecha de nacimiento *</Label>
              <Input id="birth_date" type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Sexo *</Label>
              <Select value={form.sex} onValueChange={v => set('sex', v)} required>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0412-1234567" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Dirección de habitación" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Datos de Hospitalización</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="admission_date">Fecha de ingreso *</Label>
              <Input id="admission_date" type="date" value={form.admission_date} onChange={e => set('admission_date', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service">Servicio</Label>
              <Input id="service" value={form.service} onChange={e => set('service', e.target.value)} placeholder="Cirugía General, Urología..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bed">Cama / Habitación</Label>
              <Input id="bed" value={form.bed} onChange={e => set('bed', e.target.value)} placeholder="Ej: 304-A" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="diagnosis">Diagnóstico de ingreso</Label>
              <Input id="diagnosis" value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} placeholder="Diagnóstico principal" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Antecedentes</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="allergies">Alergias</Label>
              <textarea
                id="allergies"
                value={form.allergies}
                onChange={e => set('allergies', e.target.value)}
                placeholder="Ej: Penicilina, AINEs, látex..."
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="surgical_history">Antecedentes quirúrgicos</Label>
              <textarea
                id="surgical_history"
                value={form.surgical_history}
                onChange={e => set('surgical_history', e.target.value)}
                placeholder="Cirugías previas, fechas, complicaciones..."
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Guardar paciente'}
          </Button>
          <Link href="/patients">
            <Button variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
