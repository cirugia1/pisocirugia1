import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, CheckSquare, FileText, AlertTriangle, Clock, Activity } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime, priorityColor, priorityDot, cn } from '@/lib/utils'
import type { Task, Patient } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: totalPatients },
    { count: activePatients },
    { data: urgentTasks },
    { data: recentNotes },
    { data: myTasks },
    { data: recentPatients },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('status', 'activo'),
    supabase.from('tasks').select('*, patient:patients(first_name,last_name), assigned_to:profiles!tasks_assigned_to_id_fkey(full_name)')
      .eq('status', 'pendiente').eq('priority', 'urgente').order('created_at', { ascending: false }).limit(5),
    supabase.from('clinical_notes').select('*, patient:patients(first_name,last_name), author:profiles!clinical_notes_author_id_fkey(full_name)')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('tasks').select('*, patient:patients(first_name,last_name)')
      .eq('assigned_to_id', user!.id).eq('status', 'pendiente')
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('patients').select('*').eq('status', 'activo')
      .order('admission_date', { ascending: false }).limit(6),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Resumen del servicio quirúrgico</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pacientes activos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activePatients ?? 0}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pendientes urgentes</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{urgentTasks?.length ?? 0}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Mis pendientes</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{myTasks?.length ?? 0}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total pacientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalPatients ?? 0}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Urgent tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Pendientes urgentes
              </CardTitle>
              <Link href="/tasks" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
            </div>
          </CardHeader>
          <CardContent>
            {urgentTasks?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No hay pendientes urgentes</p>
            ) : (
              <div className="space-y-2">
                {urgentTasks?.map((task: any) => (
                  <Link key={task.id} href={`/patients/${task.patient_id}/tasks`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-50 transition-colors">
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', priorityDot(task.priority))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">
                        {task.patient?.first_name} {task.patient?.last_name}
                        {task.assigned_to && ` · ${task.assigned_to.full_name}`}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs flex-shrink-0">Urgente</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Mis pendientes
              </CardTitle>
              <Link href="/tasks" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
            </div>
          </CardHeader>
          <CardContent>
            {myTasks?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No tienes pendientes asignados</p>
            ) : (
              <div className="space-y-2">
                {myTasks?.map((task: any) => (
                  <Link key={task.id} href={`/patients/${task.patient_id}/tasks`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-50 transition-colors">
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', priorityDot(task.priority))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">
                        {task.patient?.first_name} {task.patient?.last_name}
                      </p>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0', priorityColor(task.priority))}>
                      {task.priority}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active patients */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Pacientes activos
              </CardTitle>
              <Link href="/patients" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentPatients?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No hay pacientes activos</p>
            ) : (
              <div className="space-y-2">
                {recentPatients?.map((p: any) => (
                  <Link key={p.id} href={`/patients/${p.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-700">
                        {p.first_name[0]}{p.last_name[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                      <p className="text-xs text-gray-500">HCL: {p.hcl} · Cama: {p.bed ?? 'N/A'}</p>
                    </div>
                    {p.diagnosis && (
                      <p className="text-xs text-gray-400 max-w-[120px] truncate">{p.diagnosis}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent notes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-500" />
                Notas recientes
              </CardTitle>
              <Link href="/notes" className="text-xs text-blue-600 hover:underline">Ver todas</Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentNotes?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No hay notas recientes</p>
            ) : (
              <div className="space-y-2">
                {recentNotes?.map((note: any) => (
                  <Link key={note.id} href={`/patients/${note.patient_id}/notes/${note.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {note.patient?.first_name} {note.patient?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {note.author?.full_name} · {formatDateTime(note.created_at)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">{note.type}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
