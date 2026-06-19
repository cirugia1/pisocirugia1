'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, FileText, Zap } from 'lucide-react'
import Link from 'next/link'
import type { Template } from '@/types'

const RichTextEditor = dynamic(() => import('@/components/clinical-notes/RichTextEditor'), { ssr: false })

const NOTE_TYPES = [
  { value: 'evolucion', label: 'Evolución' },
  { value: 'ingreso', label: 'Nota de Ingreso' },
  { value: 'preoperatoria', label: 'Nota Preoperatoria' },
  { value: 'postoperatoria', label: 'Nota Postoperatoria' },
  { value: 'interconsulta', label: 'Interconsulta' },
  { value: 'egreso', label: 'Nota de Egreso' },
]

export default function NewNotePage() {
  const params = useParams()
  const patientId = params.id as string
  const router = useRouter()
  const [type, setType] = useState('evolucion')
  const [content, setContent] = useState('')
  const [vitalSigns, setVitalSigns] = useState({ pa: '', fc: '', fr: '', temp: '', spo2: '', peso: '', talla: '' })
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('templates')
      .select('*')
      .eq('type', 'nota_clinica')
      .then(({ data }) => setTemplates((data as Template[]) ?? []))
  }, [])

  async function handleSave(sign = false) {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const vitals = Object.fromEntries(
      Object.entries(vitalSigns).filter(([, v]) => v !== '')
    )

    const { data } = await supabase.from('clinical_notes').insert({
      patient_id: patientId,
      type,
      content,
      vital_signs: Object.keys(vitals).length > 0 ? vitals : null,
      author_id: user!.id,
      signed: sign,
    }).select().single()

    setLoading(false)
    if (data) router.push(`/patients/${patientId}/notes/${data.id}`)
  }

  function applyTemplate(tmpl: Template) {
    setContent(tmpl.content)
  }

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/patients/${patientId}/notes`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nueva Nota Clínica</h1>
        </div>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {NOTE_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              type === t.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Plantillas rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {templates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => applyTemplate(tmpl)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vital signs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Signos vitales (opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { key: 'pa', label: 'PA (mmHg)', placeholder: '120/80' },
              { key: 'fc', label: 'FC (lpm)', placeholder: '72' },
              { key: 'fr', label: 'FR (rpm)', placeholder: '16' },
              { key: 'temp', label: 'Temp (°C)', placeholder: '36.5' },
              { key: 'spo2', label: 'SpO₂ (%)', placeholder: '98' },
              { key: 'peso', label: 'Peso (kg)', placeholder: '70' },
              { key: 'talla', label: 'Talla (cm)', placeholder: '170' },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  placeholder={f.placeholder}
                  value={vitalSigns[f.key as keyof typeof vitalSigns]}
                  onChange={e => setVitalSigns(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rich text editor */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Contenido de la nota *</Label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Escribe la nota clínica..."
          className="min-h-[300px]"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => handleSave(false)} disabled={loading || !content}>
          <Save className="w-4 h-4" />
          {loading ? 'Guardando...' : 'Guardar borrador'}
        </Button>
        <Button variant="success" onClick={() => handleSave(true)} disabled={loading || !content}>
          <FileText className="w-4 h-4" />
          Guardar y firmar
        </Button>
        <Link href={`/patients/${patientId}/notes`}>
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>
    </div>
  )
}
