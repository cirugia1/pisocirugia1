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

function Textarea({ id, value, onChange, placeholder, rows = 3 }: any) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
    />
  )
}

export default function NewPatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    hcl: '', first_name: '', last_name: '', birth_date: '',
    sex: '', id_number: '', phone: '', address: '',
    bed: '', service: '', diagnosis: '',
    admission_date: new Date().toISOString().split('T')[0],
    // Antecedentes
    allergies: '',
    surgical_history: '',
    personal_history: '',
    family_history: '',
    psychobiological_habits: '',
    // Anamnesis
    anamnesis: '',
    // Examen funcional
    blood_pressure: '',
    respiratory_rate: '',
    heart_rate: '',
    spo2_value: '',
    spo2_source: 'ambiente',
    // Examen físico
    exam_skin: '',
    exam_head_neck: '',
    exam_thorax: '',
    exam_abdomen: '',
    exam_extremities: '',
    exam_neuro: '',
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

    const functional_exam = {
      blood_pressure: form.blood_pressure,
      respiratory_rate: form.respiratory_rate,
      heart_rate: form.heart_rate,
      spo2: form.spo2_value ? `${form.spo2_value}% (${form.spo2_source})` : '',
    }

    const physical_exam = {
      skin: form.exam_skin,
      head_neck: form.exam_head_neck,
      thorax: form.exam_thorax,
      abdomen: form.exam_abdomen,
      extremities: form.exam_extremities,
      neuro: form.exam_neuro,
    }

    const { data, error: err } = await supabase.from('patients').insert({
      hcl: form.hcl,
      first_name: form.first_name,
      last_name: form.last_name,
      birth_date: form.birth_date,
      sex: form.sex,
      id_number: form.id_number || null,
      phone: form.phone || null,
      address: form.address || null,
      bed: form.bed || null,
      service: form.service || null,
      diagnosis: form.diagnosis || null,
      admission_date: form.admission_date,
      allergies: form.allergies || null,
      surgical_history: form.surgical_history || null,
      personal_history: form.personal_history || null,
      family_history: form.family_history || null,
      psychobiological_habits: form.psychobiological_habits || null,
      anamnesis: form.anamnesis || null,
      functional_exam,
      physical_exam,
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
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Paciente</h1>
          <p className="text-gray-500 text-sm">Historia clínica de ingreso</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos identificatorios */}
        <Card>
          <CardHeader><CardTitle className="text-base">Datos Identificatorios</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hcl">Historia Clínica (HCL) *</Label>
              <Input id="hcl" value={form.hcl} onChange={e => set('hcl', e.target.value)} placeholder="HC-00001" required />
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
              <Select value={form.sex} onValueChange={v => set('sex', v)}>
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

        {/* Hospitalización */}
        <Card>
          <CardHeader><CardTitle className="text-base">Datos de Hospitalización</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="admission_date">Fecha de ingreso *</Label>
              <Input id="admission_date" type="date" value={form.admission_date} onChange={e => set('admission_date', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service">Servicio</Label>
              <Input id="service" value={form.service} onChange={e => set('service', e.target.value)} placeholder="Cirugía General..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bed">Cama / Habitación</Label>
              <Input id="bed" value={form.bed} onChange={e => set('bed', e.target.value)} placeholder="304-A" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="diagnosis">Diagnóstico de ingreso</Label>
              <Input id="diagnosis" value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} placeholder="Diagnóstico principal" />
            </div>
          </CardContent>
        </Card>

        {/* Antecedentes */}
        <Card>
          <CardHeader><CardTitle className="text-base">Antecedentes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="personal_history">Antecedentes Personales</Label>
              <Textarea id="personal_history" value={form.personal_history} onChange={(e: any) => set('personal_history', e.target.value)}
                placeholder="HTA, DM, cardiopatías, enfermedades crónicas..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="family_history">Antecedentes Familiares</Label>
              <Textarea id="family_history" value={form.family_history} onChange={(e: any) => set('family_history', e.target.value)}
                placeholder="Enfermedades hereditarias, antecedentes oncológicos familiares..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="surgical_history">Antecedentes Quirúrgicos</Label>
              <Textarea id="surgical_history" value={form.surgical_history} onChange={(e: any) => set('surgical_history', e.target.value)}
                placeholder="Cirugías previas, fechas, complicaciones..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="allergies">Alergias</Label>
              <Textarea id="allergies" value={form.allergies} onChange={(e: any) => set('allergies', e.target.value)}
                placeholder="Penicilina, AINEs, látex, medios de contraste..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="psychobiological_habits">Hábitos Psicobiológicos</Label>
              <Textarea id="psychobiological_habits" value={form.psychobiological_habits} onChange={(e: any) => set('psychobiological_habits', e.target.value)}
                placeholder="Tabaquismo, alcoholismo, drogas, dieta, actividad física, sueño..." />
            </div>
          </CardContent>
        </Card>

        {/* Anamnesis */}
        <Card>
          <CardHeader><CardTitle className="text-base">Anamnesis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="anamnesis">Anamnesis Próxima y Remota</Label>
              <Textarea id="anamnesis" value={form.anamnesis} onChange={(e: any) => set('anamnesis', e.target.value)}
                placeholder="Motivo de consulta, inicio, evolución, síntomas asociados, tratamientos previos..."
                rows={5} />
            </div>
          </CardContent>
        </Card>

        {/* Examen Funcional */}
        <Card>
          <CardHeader><CardTitle className="text-base">Examen Funcional</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="blood_pressure">Presión Arterial</Label>
              <Input id="blood_pressure" value={form.blood_pressure} onChange={e => set('blood_pressure', e.target.value)} placeholder="120/80 mmHg" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="heart_rate">Frec. Cardíaca</Label>
              <Input id="heart_rate" value={form.heart_rate} onChange={e => set('heart_rate', e.target.value)} placeholder="80 lpm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="respiratory_rate">Frec. Respiratoria</Label>
              <Input id="respiratory_rate" value={form.respiratory_rate} onChange={e => set('respiratory_rate', e.target.value)} placeholder="18 rpm" />
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <Label>SpO₂</Label>
              <div className="flex gap-2">
                <Input value={form.spo2_value} onChange={e => set('spo2_value', e.target.value)} placeholder="98%" className="w-20" />
                <Select value={form.spo2_source} onValueChange={v => set('spo2_source', v)}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambiente">Ambiente</SelectItem>
                    <SelectItem value="O2 complementario">O₂ Complem.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examen Físico */}
        <Card>
          <CardHeader><CardTitle className="text-base">Examen Físico</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { field: 'exam_skin', label: 'Piel', placeholder: 'Coloración, hidratación, turgencia, lesiones...' },
              { field: 'exam_head_neck', label: 'Cabeza y Cuello', placeholder: 'Cráneo, cara, ojos, oídos, nariz, boca, cuello, tiroides, pulsos...' },
              { field: 'exam_thorax', label: 'Tórax', placeholder: 'Pulmones, ruidos respiratorios, corazón, ruidos cardíacos...' },
              { field: 'exam_abdomen', label: 'Abdomen', placeholder: 'Inspección, palpación, percusión, auscultación, puntos dolorosos...' },
              { field: 'exam_extremities', label: 'Extremidades', placeholder: 'Pulsos periféricos, edemas, fuerza, movilidad...' },
              { field: 'exam_neuro', label: 'Neurológico', placeholder: 'Conciencia, orientación, pares craneales, sensibilidad, reflejos...' },
            ].map(({ field, label, placeholder }) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field}>{label}</Label>
                <Textarea id={field} value={(form as any)[field]} onChange={(e: any) => set(field, e.target.value)} placeholder={placeholder} />
              </div>
            ))}
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>
        )}

        <div className="flex gap-3 pb-8">
          <Button type="submit" disabled={loading || !form.hcl || !form.first_name || !form.last_name || !form.birth_date || !form.sex}>
            <Save className="w-4 h-4 mr-1" />
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
