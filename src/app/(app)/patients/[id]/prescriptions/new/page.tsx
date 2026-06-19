'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DrugSearch from '@/components/vademecum/DrugSearch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, Printer, Save } from 'lucide-react'
import Link from 'next/link'
import type { Drug, PrescriptionItem } from '@/types'

const ROUTES = ['Oral', 'IV', 'IM', 'SC', 'Tópico', 'Inhalado', 'Sublingual', 'Rectal', 'Ocular', 'Ótico', 'Nasal']
const FREQUENCIES = ['Cada 4 horas', 'Cada 6 horas', 'Cada 8 horas', 'Cada 12 horas', 'Una vez al día', 'Dos veces al día', 'Tres veces al día', 'Según necesidad', 'Dosis única']
const DURATIONS = ['3 días', '5 días', '7 días', '10 días', '14 días', '21 días', '30 días', 'Indefinido', 'Hasta nueva orden']

interface ItemForm extends Partial<PrescriptionItem> {
  commercial_name: string
  dose: string
  route: string
  frequency: string
  duration: string
  instructions: string
}

const emptyItem = (): ItemForm => ({
  commercial_name: '', dose: '', route: 'Oral',
  frequency: 'Cada 8 horas', duration: '7 días', instructions: '',
})

export default function NewPrescriptionPage() {
  const params = useParams()
  const patientId = params.id as string
  const router = useRouter()
  const [items, setItems] = useState<ItemForm[]>([emptyItem()])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  function setItem(index: number, field: keyof ItemForm, value: string) {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it))
  }

  function applyDrug(index: number, drug: Drug) {
    setItems(prev => prev.map((it, i) => i === index ? {
      ...it,
      drug_id: drug.id,
      commercial_name: drug.commercial_name,
      route: drug.route,
      dose: drug.usual_dose ?? '',
    } : it))
  }

  function addItem() {
    setItems(prev => [...prev, emptyItem()])
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave(print = false) {
    if (items.some(it => !it.commercial_name || !it.dose)) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase.from('prescriptions').insert({
      patient_id: patientId,
      items: items.map(({ commercial_name, dose, route, frequency, duration, instructions, drug_id }) => ({
        commercial_name, dose, route, frequency, duration, instructions, drug_id
      })),
      author_id: user!.id,
      notes: notes || null,
    }).select().single()

    setLoading(false)
    if (data) {
      if (print) {
        window.open(`/patients/${patientId}/prescriptions/${data.id}/print`, '_blank')
      }
      router.push(`/patients/${patientId}/prescriptions`)
    }
  }

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/patients/${patientId}/prescriptions`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nueva Receta</h1>
      </div>

      {/* Drug items */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-600">Medicamento {index + 1}</CardTitle>
                {items.length > 1 && (
                  <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Drug search */}
              <div className="space-y-1.5">
                <Label className="text-xs">Medicamento *</Label>
                <DrugSearch
                  onSelect={drug => applyDrug(index, drug)}
                  placeholder="Buscar por nombre comercial o principio activo..."
                />
                {item.commercial_name && (
                  <Input
                    value={item.commercial_name}
                    onChange={e => setItem(index, 'commercial_name', e.target.value)}
                    placeholder="Nombre del medicamento"
                    className="mt-1"
                  />
                )}
                {!item.commercial_name && (
                  <Input
                    value={item.commercial_name}
                    onChange={e => setItem(index, 'commercial_name', e.target.value)}
                    placeholder="O escribe el nombre directamente"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Dosis *</Label>
                  <Input
                    value={item.dose}
                    onChange={e => setItem(index, 'dose', e.target.value)}
                    placeholder="Ej: 500mg, 1 tableta"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Vía</Label>
                  <Select value={item.route} onValueChange={v => setItem(index, 'route', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Frecuencia</Label>
                  <Select value={item.frequency} onValueChange={v => setItem(index, 'frequency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Duración</Label>
                  <Select value={item.duration} onValueChange={v => setItem(index, 'duration', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs">Indicaciones especiales</Label>
                  <Input
                    value={item.instructions}
                    onChange={e => setItem(index, 'instructions', e.target.value)}
                    placeholder="Ej: Tomar con alimentos, evitar alcohol..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addItem} className="w-full border-dashed">
        <Plus className="w-4 h-4" />
        Agregar otro medicamento
      </Button>

      <div className="space-y-1.5">
        <Label className="text-xs">Observaciones generales</Label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Indicaciones adicionales para el paciente..."
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={() => handleSave(false)} disabled={loading}>
          <Save className="w-4 h-4" />
          {loading ? 'Guardando...' : 'Guardar receta'}
        </Button>
        <Button variant="outline" onClick={() => handleSave(true)} disabled={loading}>
          <Printer className="w-4 h-4" />
          Guardar e imprimir
        </Button>
        <Link href={`/patients/${patientId}/prescriptions`}>
          <Button variant="ghost">Cancelar</Button>
        </Link>
      </div>
    </div>
  )
}
