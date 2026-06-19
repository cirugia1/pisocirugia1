import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CheckSquare } from 'lucide-react'
import { cn, priorityDot, priorityColor } from '@/lib/utils'

export default async function AllTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ priority?: string; mine?: string }>
}) {
  const { priority, mine } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('tasks')
    .select(`
      *,
      patient:patients(first_name, last_name, hcl, bed),
      assigned_to:profiles!tasks_assigned_to_id_fkey(full_name),
      created_by:profiles!tasks_created_by_id_fkey(full_name)
    `)
    .in('status', ['pendiente', 'en_proceso'])
    .order('created_at', { ascending: false })

  if (priority) query = query.eq('priority', priority)
  if (mine === '1') query = query.eq('assigned_to_id', user!.id)

  const { data: tasks } = await query

  const grouped: Record<string, any[]> = {
    urgente: [],
    prioritario: [],
    rutina: [],
    diferido: [],
  }
  tasks?.forEach((t: any) => { if (grouped[t.priority]) grouped[t.priority].push(t) })

  const priorityOrder = ['urgente', 'prioritario', 'rutina', 'diferido']
  const priorityLabels: Record<string, string> = {
    urgente: '🔴 Urgente',
    prioritario: '🟡 Prioritario',
    rutina: '🔵 Rutina',
    diferido: '⚪ Diferido',
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-blue-600" />
          Pendientes del Servicio
        </h1>
        <p className="text-gray-500 text-sm">{tasks?.length ?? 0} pendiente(s) activo(s)</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/tasks" className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!priority && !mine ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
          Todos
        </Link>
        <Link href="/tasks?mine=1" className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${mine === '1' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
          Mis pendientes
        </Link>
        {priorityOrder.map(p => (
          <Link key={p} href={`/tasks?priority=${p}`} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${priority === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
            {priorityLabels[p]}
          </Link>
        ))}
      </div>

      {tasks?.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <p className="text-gray-400">No hay pendientes activos</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {priorityOrder.map(p => {
            const group = grouped[p]
            if (group.length === 0) return null
            return (
              <div key={p}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('w-2.5 h-2.5 rounded-full', priorityDot(p))} />
                  <h2 className="text-sm font-bold text-gray-700">{priorityLabels[p]} ({group.length})</h2>
                </div>
                <div className="space-y-2">
                  {group.map((task: any) => (
                    <Link key={task.id} href={`/patients/${task.patient_id}/tasks`}>
                      <Card className={cn('border-l-4 hover:shadow-md transition-all cursor-pointer',
                        p === 'urgente' ? 'border-l-red-500' :
                        p === 'prioritario' ? 'border-l-orange-400' :
                        p === 'rutina' ? 'border-l-blue-500' : 'border-l-gray-300'
                      )}>
                        <CardContent className="py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{task.title}</p>
                              {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-gray-400">
                                <span className="font-medium text-gray-700">
                                  {task.patient?.last_name}, {task.patient?.first_name}
                                </span>
                                {task.patient?.bed && <span>· Cama {task.patient.bed}</span>}
                                {task.patient?.hcl && <span>· HCL: {task.patient.hcl}</span>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              {task.assigned_to && (
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                                  Dr. {task.assigned_to.full_name}
                                </span>
                              )}
                              <Badge variant="secondary" className="text-xs">{task.status}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
