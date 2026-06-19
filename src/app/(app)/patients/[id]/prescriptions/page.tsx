import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Plus, Pill, Printer } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default async function PrescriptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: prescriptions }, { data: patient }] = await Promise.all([
    supabase.from('prescriptions')
      .select('*, author:profiles!prescriptions_author_id_fkey(full_name)')
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
            <h1 className="text-xl font-bold text-gray-900">Recetas Médicas</h1>
            <p className="text-gray-500 text-sm">{patient?.last_name}, {patient?.first_name} · HCL: {patient?.hcl}</p>
          </div>
        </div>
        <Link href={`/patients/${id}/prescriptions/new`}>
          <Button><Plus className="w-4 h-4" />Nueva receta</Button>
        </Link>
      </div>

      {prescriptions?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Pill className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay recetas</p>
            <Link href={`/patients/${id}/prescriptions/new`} className="mt-4 inline-block">
              <Button size="sm"><Plus className="w-4 h-4" />Crear primera receta</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {prescriptions?.map((rx: any) => (
            <Card key={rx.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Pill className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        {formatDateTime(rx.created_at)}
                      </span>
                      <span className="text-xs text-gray-400">· Dr. {rx.author?.full_name}</span>
                    </div>
                    <div className="space-y-2">
                      {rx.items?.map((item: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                          <div>
                            <span className="font-medium text-gray-900">{item.commercial_name}</span>
                            <span className="text-gray-500">
                              {' '}— {item.dose} · {item.route} · {item.frequency} · {item.duration}
                            </span>
                            {item.instructions && (
                              <p className="text-xs text-gray-400 mt-0.5">{item.instructions}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {rx.notes && (
                      <p className="text-xs text-gray-500 mt-2 border-t pt-2">{rx.notes}</p>
                    )}
                  </div>
                  <Link href={`/patients/${id}/prescriptions/${rx.id}/print`} target="_blank">
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
