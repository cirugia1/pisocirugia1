'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, X, Printer, Save } from 'lucide-react'
import Link from 'next/link'

const LAB_PRESETS: Record<string, string[]> = {
  'Hematología': ['Hematología completa (HC)', 'Reticulocitos', 'Velocidad de sedimentación globular (VSG)', 'Tiempo de protrombina (TP)', 'Tiempo parcial de tromboplastina (TPT)', 'INR', 'Fibrinógeno', 'Dímero D'],
  'Química': ['Glicemia', 'Urea', 'Creatinina', 'Ácido úrico', 'TGO (AST)', 'TGP (ALT)', 'Fosfatasa alcalina', 'GGT', 'Bilirrubina total y fraccionada', 'Proteínas totales', 'Albúmina', 'LDH'],
  'Electrolitos': ['Sodio (Na)', 'Potasio (K)', 'Cloro (Cl)', 'Calcio (Ca)', 'Fósforo', 'Magnesio'],
  'Cardiaco': ['Troponina I', 'CK-MB', 'Pro-BNP', 'CPK total', 'Mioglobina'],
  'Imagen': ['Radiografía de tórax PA y lateral', 'Radiografía de abdomen simple', 'Ecografía abdominal', 'Ecografía pélvica', 'Tomografía de tórax', 'Tomografía de abdomen y pelvis', 'Resonancia magnética', 'Ecocardiograma'],
  'Orina': ['Examen de orina (EGO)', 'Urocultivo y antibiograma', 'Proteinuria 24h', 'Depuración de creatinina'],
  'Microbiología': ['Hemocultivo x2', 'Cultivo de herida', 'Cultivo de esputo', 'Gram y cultivo de secreción'],
  'Preoperatorio': ['HC completa', 'Glicemia', 'Urea', 'Creatinina', 'TP', 'TPT', 'INR', 'Grupo sanguíneo y Rh', 'ECG', 'Radiografía de tórax PA', 'Examen de orina'],
}

const ORDER_TYPES = [
  { value: 'laboratorio', label: 'Laboratorio' },
  { value: 'imagen', label: 'Imágenes / Radiología' },
  { value: 'anatomopatologia', label: 'Anatomopatología' },
  { value: 'otro', label: 'Otro' },
]

const URGENCIES = [
  { value: 'urgente', label: '🔴 Urgente' },
  { value: 'de_guardia', label: '🟡 De guardia' },
  { value: 'electivo', label: '🔵 Electivo' },
]

export default function NewOrderPage() {
  const params = useParams()
  const patientId = params.id as string
  const router = useRouter()
  const [type, setType] = useState('laboratorio')
  const [urgency, setUrgency] = useState('electivo')
  const [items, setItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')
  const [clinicalInfo, setClinicalInfo] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  function addItem(item: string) {
    const trimmed = item.trim()
    if (trimmed && !items.includes(trimmed)) {
      setItems(prev => [...prev, trimmed])
    }
    setNewItem('')
  }

  function removeItem(item: string) {
    setItems(prev => prev.filter(i => i !== item))
  }

  function addPreset(preset: string[]) {
    setItems(prev => {
      const next = [...prev]
      preset.forEach(p => { if (!next.includes(p)) next.push(p) })
      return next
    })
  }

  async function handleSave(print = false) {
    if (items.length === 0) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase.from('lab_orders').insert({
      patient_id: patientId,
      type,
      items,
      urgency,
      clinical_info: clinicalInfo || null,
      notes: notes || null,
      author_id: user!.id,
    }).select().single()

    setLoading(false)
    if (data) {
      if (print) window.open(`/patients/${patientId}/orders/${data.id}/print`, '_blank')
      router.push(`/patients/${patientId}/orders`)
    }
  }

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/patients/${patientId}/orders`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nueva Orden de Exámenes</h1>
      </div>

      {/* Type and urgency */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo de orden</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Urgencia</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {URGENCIES.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presets */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Plantillas rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(LAB_PRESETS).map(([group, items]) => (
              <button
                key={group}
                type="button"
                onClick={() => addPreset(items)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                + {group}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Exámenes solicitados ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem(newItem))}
              placeholder="Escribir examen y presionar Enter..."
            />
            <Button type="button" onClick={() => addItem(newItem)} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">
              Usa las plantillas rápidas o escribe los exámenes uno a uno
            </p>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg group">
                  <span className="text-sm text-gray-800">
                    <span className="text-blue-600 font-mono text-xs mr-2">{i + 1}.</span>
                    {item}
                  </span>
                  <button onClick={() => removeItem(item)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <Label>Información clínica</Label>
        <textarea
          value={clinicalInfo}
          onChange={e => setClinicalInfo(e.target.value)}
          placeholder="Diagnóstico, motivo de la solicitud, datos relevantes para el laboratorio..."
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={() => handleSave(false)} disabled={loading || items.length === 0}>
          <Save className="w-4 h-4" />
          {loading ? 'Guardando...' : 'Guardar orden'}
        </Button>
        <Button variant="outline" onClick={() => handleSave(true)} disabled={loading || items.length === 0}>
          <Printer className="w-4 h-4" />
          Guardar e imprimir
        </Button>
      </div>
    </div>
  )
}
