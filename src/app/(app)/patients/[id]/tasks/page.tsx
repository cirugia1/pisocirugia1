'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Check, Circle, UserCheck } from 'lucide-react'
import { cn, priorityDot, formatDate } from '@/lib/utils'
import type { Profile } from '@/types'

const PRIORITY_LABELS = [
  { value: 'urgente', label: '🔴 Urgente' },
  { value: 'prioritario', label: '🟡 Prioritario' },
  { value: 'rutina', label: '🔵 Rutina' },
  { value: 'diferido', label: '⚪ Diferido' },
]

const TASK_CATEGORIES = [
  'Exámenes', 'Interconsulta', 'Alta', 'Materiales', 'Fijar', 'Cura',
]

export default function PatientTasksPage() {
  const params = useParams()
  const patientId = params.id as string

  const [tasks, setTasks] = useState<any[]>([])
  const [doctors, setDoctors] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [tab, setTab] = useState<'pendientes' | 'realizados'>('pendientes')
  const [open, setOpen] = useState(false)
  const [reassignOpen, setReassignOpen] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', priority: 'rutina',
    assigned_to_id: '', due_date: '',
  })

  const loadTasks = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_to:profiles!tasks_assigned_to_id_fkey(full_name),
        created_by:profiles!tasks_created_by_id_fkey(full_name),
        completed_by:profiles!tasks_completed_by_id_fkey(full_name)
      `)
      .eq('patient_id', patientId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
    setTasks(data ?? [])
  }, [patientId])

  useEffect(() => {
    loadTasks()
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user))
    supabase.from('profiles').select('id, full_name, role, specialty, email, license_number, created_at')
      .in('role', ['medico', 'residente', 'admin', 'enfermeria'])
      .then(({ data }) => setDoctors((data as Profile[]) ?? []))
  }, [loadTasks])

  async function createTask() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('tasks').insert({
      patient_id: patientId,
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      assigned_to_id: form.assigned_to_id || null,
      due_date: form.due_date || null,
      created_by_id: user!.id,
    })
    setForm({ title: '', description: '', priority: 'rutina', assigned_to_id: '', due_date: '' })
    setOpen(false)
    setLoading(false)
    loadTasks()
  }

  async function markCompleted(taskId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('tasks').update({
      status: 'completado',
      completed_at: new Date().toISOString(),
      completed_by_id: user!.id,
    }).eq('id', taskId)
    loadTasks()
  }

  async function reassign(taskId: string, newAssigneeId: string) {
    const supabase = createClient()
    await supabase.from('tasks').update({
      assigned_to_id: newAssigneeId || null,
    }).eq('id', taskId)
    setReassignOpen(null)
    loadTasks()
  }

  async function updateStatus(taskId: string, status: string) {
    const supabase = createClient()
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    loadTasks()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pending = tasks.filter(t => t.status === 'pendiente' || t.status === 'en_proceso')
  const completedToday = tasks.filter(t =>
    t.status === 'completado' && t.completed_at && new Date(t.completed_at) >= today
  )

  const borderColor = (priority: string) =>
    priority === 'urgente' ? 'border-l-red-500' :
    priority === 'prioritario' ? 'border-l-orange-400' :
    priority === 'rutina' ? 'border-l-blue-500' : 'border-l-gray-300'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/patients/${patientId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pendientes</h1>
            <p className="text-gray-500 text-sm">{pending.length} activo(s) · {completedToday.length} realizados hoy</p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" />Nuevo pendiente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar pendiente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Quick categories */}
              <div className="space-y-1.5">
                <Label>Categoría rápida</Label>
                <div className="flex flex-wrap gap-2">
                  {TASK_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, title: cat }))}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-colors',
                        form.title === cat
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tarea *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="O escribe una tarea personalizada..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Descripción (opcional)</Label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-none"
                  placeholder="Detalles adicionales..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Prioridad *</Label>
                  <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_LABELS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha límite</Label>
                  <Input type="datetime-local" value={form.due_date}
                    onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Asignar a</Label>
                <Select value={form.assigned_to_id} onValueChange={v => setForm(p => ({ ...p, assigned_to_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {doctors.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name} {d.specialty ? `· ${d.specialty}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={createTask} disabled={loading || !form.title}>
                {loading ? 'Guardando...' : 'Guardar pendiente'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('pendientes')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'pendientes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Pendientes ({pending.length})
        </button>
        <button
          onClick={() => setTab('realizados')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'realizados'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Realizados hoy ({completedToday.length})
        </button>
      </div>

      {/* PENDIENTES TAB */}
      {tab === 'pendientes' && (
        <>
          {pending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Check className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No hay pendientes activos</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(['urgente', 'prioritario', 'rutina', 'diferido'] as const).map(priority => {
                const group = pending.filter(t => t.priority === priority)
                if (group.length === 0) return null
                return (
                  <div key={priority}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn('w-2 h-2 rounded-full', priorityDot(priority))} />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {priority} ({group.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.map((task: any) => (
                        <Card key={task.id} className={cn('border-l-4', borderColor(task.priority))}>
                          <CardContent className="py-3">
                            <div className="flex items-start gap-3">
                              {/* Complete button */}
                              <button
                                onClick={() => markCompleted(task.id)}
                                title="Marcar como realizado"
                                className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500 hover:bg-green-50 transition-colors flex-shrink-0"
                              >
                                <Circle className="w-2.5 h-2.5 text-gray-300" />
                              </button>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                                {task.description && (
                                  <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-gray-400">
                                  {task.assigned_to && (
                                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                                      {task.assigned_to.full_name}
                                    </span>
                                  )}
                                  {task.due_date && (
                                    <span>Vence: {formatDate(task.due_date)}</span>
                                  )}
                                  {task.created_by && (
                                    <span>por {task.created_by.full_name}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-1 items-end flex-shrink-0">
                                <Badge variant="secondary" className="text-xs capitalize">{task.status}</Badge>
                                <div className="flex gap-1">
                                  {/* Reassign */}
                                  <Dialog open={reassignOpen === task.id} onOpenChange={o => setReassignOpen(o ? task.id : null)}>
                                    <DialogTrigger asChild>
                                      <button className="text-xs px-2 py-1 rounded text-blue-500 hover:bg-blue-50 transition-colors flex items-center gap-1">
                                        <UserCheck className="w-3 h-3" />Reasignar
                                      </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-xs">
                                      <DialogHeader>
                                        <DialogTitle>Reasignar tarea</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-3 mt-2">
                                        <p className="text-sm text-gray-600 font-medium">{task.title}</p>
                                        <Select
                                          defaultValue={task.assigned_to_id ?? ''}
                                          onValueChange={v => reassign(task.id, v)}
                                        >
                                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="">Sin asignar</SelectItem>
                                            {doctors.map(d => (
                                              <SelectItem key={d.id} value={d.id}>
                                                {d.full_name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  <button
                                    onClick={() => updateStatus(task.id, 'cancelado')}
                                    className="text-xs px-2 py-1 rounded text-gray-400 hover:bg-gray-50 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* REALIZADOS HOY TAB */}
      {tab === 'realizados' && (
        <>
          {completedToday.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-400">No hay pendientes realizados hoy</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {completedToday.map((task: any) => (
                <Card key={task.id} className="border-l-4 border-l-green-400">
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-gray-400">
                          {task.completed_by && (
                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              Realizado por: {task.completed_by.full_name}
                            </span>
                          )}
                          {task.completed_at && (
                            <span>
                              a las {new Date(task.completed_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 text-xs flex-shrink-0">Realizado</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
