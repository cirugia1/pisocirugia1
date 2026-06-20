'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogOut, Truck, RefreshCw } from 'lucide-react'

interface Props {
  patientId: string
  currentStatus: string
}

export default function PatientStatusActions({ patientId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split('T')[0])
  const [openDialog, setOpenDialog] = useState<'alta' | 'traslado' | 'reingreso' | null>(null)

  async function changeStatus(status: string, extraFields?: Record<string, any>) {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('patients').update({
      status,
      ...extraFields,
    }).eq('id', patientId)
    setLoading(false)
    setOpenDialog(null)
    router.refresh()
  }

  if (currentStatus === 'activo') {
    return (
      <div className="flex gap-2">
        {/* Alta */}
        <Dialog open={openDialog === 'alta'} onOpenChange={o => setOpenDialog(o ? 'alta' : null)}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-green-700 border-green-300 hover:bg-green-50">
              <LogOut className="w-4 h-4 mr-1" />Alta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xs">
            <DialogHeader><DialogTitle>Dar de alta</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label>Fecha de alta</Label>
                <Input type="date" value={dischargeDate} onChange={e => setDischargeDate(e.target.value)} />
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700" disabled={loading}
                onClick={() => changeStatus('alta', { discharge_date: dischargeDate })}>
                {loading ? 'Guardando...' : 'Confirmar alta'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Traslado */}
        <Dialog open={openDialog === 'traslado'} onOpenChange={o => setOpenDialog(o ? 'traslado' : null)}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-orange-700 border-orange-300 hover:bg-orange-50">
              <Truck className="w-4 h-4 mr-1" />Traslado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xs">
            <DialogHeader><DialogTitle>Registrar traslado</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <p className="text-sm text-gray-500">El paciente será marcado como trasladado.</p>
              <Button className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}
                onClick={() => changeStatus('traslado', { discharge_date: new Date().toISOString().split('T')[0] })}>
                {loading ? 'Guardando...' : 'Confirmar traslado'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Paciente dado de alta o trasladado — opción de reingreso
  return (
    <Dialog open={openDialog === 'reingreso'} onOpenChange={o => setOpenDialog(o ? 'reingreso' : null)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-blue-700 border-blue-300 hover:bg-blue-50">
          <RefreshCw className="w-4 h-4 mr-1" />Reingreso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader><DialogTitle>Registrar reingreso</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label>Fecha de reingreso</Label>
            <Input type="date" value={dischargeDate} onChange={e => setDischargeDate(e.target.value)} />
          </div>
          <Button className="w-full" disabled={loading}
            onClick={() => changeStatus('activo', { admission_date: dischargeDate, discharge_date: null })}>
            {loading ? 'Guardando...' : 'Confirmar reingreso'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
