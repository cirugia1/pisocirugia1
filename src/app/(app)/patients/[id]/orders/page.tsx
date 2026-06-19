import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Plus, FlaskConical, Printer } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const URGENCY_COLORS: Record<string, string> = {
  urgente: 'destructive',
  de_guardia: 'warning',
  electivo: 'secondary',
}

export default async function OrdersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: orders }, { data: patient }] = await Promise.all([
    supabase.from('lab_orders')
      .select('*, author:profiles!lab_orders_author_id_fkey(full_name)')
      .eq('patient_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('patients').select('first_name,last_name,hcl').eq('id', id).single(),
  ])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/patients/${id}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Órdenes de Exámenes</h1>
            <p className="text-gray-500 text-sm">{patient?.last_name}, {patient?.first_name} · HCL: {patient?.hcl}</p>
          </div>
        </div>
        <Link href={`/patients/${id}/orders/new`}>
          <Button><Plus className="w-4 h-4" />Nueva orden</Button>
        </Link>
      </div>

      {orders?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay órdenes de exámenes</p>
            <Link href={`/patients/${id}/orders/new`} className="mt-4 inline-block">
              <Button size="sm"><Plus className="w-4 h-4" />Crear primera orden</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders?.map((order: any) => (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary">{order.type}</Badge>
                      <Badge variant={URGENCY_COLORS[order.urgency] as any}>{order.urgency}</Badge>
                      <span className="text-xs text-gray-400">{formatDateTime(order.created_at)}</span>
                      <span className="text-xs text-gray-400">· Dr. {order.author?.full_name}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                      {order.items?.map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-sm text-gray-700">
                          <span className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                    {order.clinical_info && (
                      <p className="text-xs text-gray-500 mt-2 border-t pt-2">{order.clinical_info}</p>
                    )}
                  </div>
                  <Link href={`/patients/${id}/orders/${order.id}/print`} target="_blank">
                    <Button variant="outline" size="sm">
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
