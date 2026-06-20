'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

export default function EditPatientPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('patients').select('*').eq('id', patientId).single().then(({ data }) => {
      if (!data) return
      const fe = data.functional_exam ?? {}
      const pe = data.physical_exam ?? {}
      // Parse spo2 back to value + source
      let spo2_value = ''
      let spo2_source = 'ambiente'
      if (fe.spo2) {
        const match = fe.spo2.match(/^([\d.]+)%\s*\((.+)\)$/)
        if (match) { spo2_value = match[1]; spo2_source = match[2] }
        else spo2_value = fe.spo2
      }
      setForm({
        hcl: data.hcl ?? '',
        first_name: data.first_name ?? '',
        last_name: data.last_name ?? '',
        birth_date: data.birth_date ?? '',
        sex: data.sex ?? '',
        id_number: data.id_number ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
        bed: data.bed ?? '',
        service: data.service ?? '',
        diagnosis: data.diagnosis ?? '',
        admission_date: data.admission_date ?? '',
        allergies: data.allergies ?? '',
        surgical_history: data.surgical_history ?? '',
        personal_history: data.personal_history ?? '',
        family_history: data.family_history ?? '',
        psychobiological_habits: data.psychobiological_habits ?? '',
        anamnesis: data.anamnesis ?? '',
        blood_pressure: fe.blood_pressure ?? '',
        heart_rate: fe.heart_rate ?? '',
        respiratory_rate: fe.respiratory_rate ?? '',
        spo2_value,
        spo2_source,
        exam_skin: pe.skin ?? '',
        exam_head_neck: pe.head_neck ?? '',
        exam_thorax: pe.thorax ?? '',
        exam_abdomen: pe.abdomen ?? '',
        exam_extremities: pe.extremities ?? '',
        exam_neuro: pe.neuro ?? '',
      })
    })
  }, [patientId])

  function set(field: string, value: string) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const functional_exam = {
      blood_pressure: form.blood_pressure,
      heart_rate: form.heart_rate,
      respiratory_rate: form.respiratory_rate,
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

    const supabase = createClient()
    const { error: err } = await supabase.from('patients').update({
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
    }).eq('id', patientId)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    router.push(`/patients/${patientId}`)
  }

  if (!form) return (
    <div className="p-6 text-gray-500 text-sm">Cargando datos del paciente...</div>
  )

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/patients/${patientId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Paciente</h1>
          <p className="text-gray-500 text-sm">Modifica los datos de la historia clínica</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos identificatorios */}
        <Card>
          <CardHeader><CardTitle className="text-base">Datos Identificatorios</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Historia Clínica (HCL) *</Label>
              <Input value={form.hcl} onChange={e => set('hcl', e.target.value)} placeholder="HC-00001" required />
            </div>
            <div className="space-y-1.5">
              <Label>Cédula / Documento</Label>
              <Input value={form.id_number} onChange={e => set('id_number', e.target.value)} placeholder="V-12345678" />
            </div>
            <div className="space-y-1.5">
              <Label>Nombres *</Label>
              <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Apellidos *</Label>
              <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de nacimiento *</Label>
              <Input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Sexo *</Label>
              <Select value={form.sex} onValueChange={v => set('sex', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0412-1234567" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Dirección</Label>
              <Input value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Hospitalización */}
        <Card>
          <CardHeader><CardTitle className="text-base">Datos de Hospitalización</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fecha de ingreso *</Label>
              <Input type="date" value={form.admission_date} onChange={e => set('admission_date', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Servicio</Label>
              <Input value={form.service} onChange={e => set('service', e.target.value)} placeholder="Cirugía General..." />
            </div>
            <div className="space-y-1.5">
              <Label>Cama / Habitación</Label>
              <Input value={form.bed} onChange={e => set('bed', e.target.value)} placeholder="304-A" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Diagnóstico de ingreso</Label>
              <Input value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Antecedentes */}
        <Card>
          <CardHeader><CardTitle className="text-base">Antecedentes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Antecedentes Personales</Label>
              <Textarea value={form.personal_history} onChange={(e: any) => set('personal_history', e.target.value)}
                placeholder="HTA, DM, cardiopatías, enfermedades crónicas..." />
            </div>
            <div className="space-y-1.5">
              <Label>Antecedentes Familiares</Label>
              <Textarea value={form.family_history} onChange={(e: any) => set('family_history', e.target.value)}
                placeholder="Enfermedades hereditarias, antecedentes oncológicos familiares..." />
            </div>
            <div className="space-y-1.5">
              <Label>Antecedentes Quirúrgicos</Label>
              <Textarea value={form.surgical_history} onChange={(e: any) => set('surgical_history', e.target.value)}
                placeholder="Cirugías previas, fechas, complicaciones..." />
            </div>
            <div className="space-y-1.5">
              <Label>Alergias</Label>
              <Textarea value={form.allergies} onChange={(e: any) => set('allergies', e.target.value)}
                placeholder="Penicilina, AINEs, látex..." />
            </div>
            <div className="space-y-1.5">
              <Label>Hábitos Psicobiológicos</Label>
              <Textarea value={form.psychobiological_habits} onChange={(e: any) => set('psychobiological_habits', e.target.value)}
                placeholder="Tabaquismo, alcoholismo, drogas, dieta, actividad física..." />
            </div>
          </CardContent>
        </Card>

        {/* Anamnesis */}
        <Card>
          <CardHeader><CardTitle className="text-base">Anamnesis</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={form.anamnesis} onChange={(e: any) => set('anamnesis', e.target.value)}
              placeholder="Motivo de consulta, inicio, evolución, síntomas asociados..."
              rows={5} />
          </CardContent>
        </Card>

        {/* Examen Funcional */}
        <Card>
          <CardHeader><CardTitle className="text-base">Examen Funcional</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Presión Arterial</Label>
              <Input value={form.blood_pressure} onChange={e => set('blood_pressure', e.target.value)} placeholder="120/80 mmHg" />
            </div>
            <div className="space-y-1.5">
              <Label>Frec. Cardíaca</Label>
              <Input value={form.heart_rate} onChange={e => set('heart_rate', e.target.value)} placeholder="80 lpm" />
            </div>
            <div className="space-y-1.5">
              <Label>Frec. Respiratoria</Label>
              <Input value={form.respiratory_rate} onChange={e => set('respiratory_rate', e.target.value)} placeholder="18 rpm" />
            </div>
            <div className="space-y-1.5">
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
              { field: 'exam_head_neck', label: 'Cabeza y Cuello', placeholder: 'Cráneo, cara, ojos, cuello, tiroides, pulsos...' },
              { field: 'exam_thorax', label: 'Tórax', placeholder: 'Pulmones, ruidos respiratorios, corazón...' },
              { field: 'exam_abdomen', label: 'Abdomen', placeholder: 'Inspección, palpación, percusión, auscultación...' },
              { field: 'exam_extremities', label: 'Extremidades', placeholder: 'Pulsos periféricos, edemas, fuerza, movilidad...' },
              { field: 'exam_neuro', label: 'Neurológico', placeholder: 'Conciencia, orientación, pares craneales, reflejos...' },
            ].map(({ field, label, placeholder }) => (
              <div key={field} className="space-y-1.5">
                <Label>{label}</Label>
                <Textarea value={form[field]} onChange={(e: any) => set(field, e.target.value)} placeholder={placeholder} />
              </div>
            ))}
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>
        )}

        <div className="flex gap-3 pb-8">
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <Link href={`/patients/${patientId}`}>
            <Button variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
