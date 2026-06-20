import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PatientStatusActions from '@/components/patients/PatientStatusActions'
import {
  ArrowLeft, FileText, CheckSquare, Pill, FlaskConical,
  AlertTriangle, Calendar, Bed, Phone, User, Edit,
  Heart, Wind, Activity, Droplets
} from 'lucide-react'
import { formatDate, calculateAge } from '@/lib/utils'

function InfoField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{value}</p>
    </div>
  )
}

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: patient } = await supabase
    .from('patients')
    .select('*, treating_doctor:profiles!patients_treating_doctor_id_fkey(full_name, specialty)')
    .eq('id', id)
    .single()

  if (!patient) notFound()

  const [
    { data: recentNotes, count: noteCount },
    { data: pendingTasks, count: taskCount },
  ] = await Promise.all([
    supabase.from('clinical_notes')
      .select('*, author:profiles!clinical_notes_author_id_fkey(full_name)', { count: 'exact' })
      .eq('patient_id', id).order('created_at', { ascending: false }).limit(3),
    supabase.from('tasks')
      .select('*', { count: 'exact' })
      .eq('patient_id', id).eq('status', 'pendiente').order('created_at', { ascending: false }).limit(4),
  ])

  const fe = patient.functional_exam ?? {}
  const pe = patient.physical_exam ?? {}

  const statusColor = patient.status === 'activo'
    ? 'bg-green-100 text-green-800'
    : patient.status === 'alta'
    ? 'bg-blue-100 text-blue-800'
    : patient.status === 'traslado'
    ? 'bg-orange-100 text-orange-800'
    : 'bg-gray-100 text-gray-600'

  const tabs = [
    { href: `/patients/${id}/notes`, label: 'Notas', icon: FileText, count: noteCount },
    { href: `/patients/${id}/tasks`, label: 'Pendientes', icon: CheckSquare, count: taskCount },
    { href: `/patients/${id}/prescriptions`, label: 'Recetas', icon: Pill, count: null },
    { href: `/patients/${id}/orders`, label: 'Órdenes', icon: FlaskConical, count: null },
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/patients">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">{patient.first_name[0]}{patient.last_name[0]}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {patient.last_name}, {patient.first_name}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary">HCL: {patient.hcl}</Badge>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                  {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                </span>
                <span className="text-sm text-gray-500">
                  {calculateAge(patient.birth_date)} años · {patient.sex === 'M' ? 'Masculino' : 'Femenino'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PatientStatusActions patientId={patient.id} currentStatus={patient.status} />
          <Link href={`/patients/${id}/edit`}>
            <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-1" />Editar</Button>
          </Link>
        </div>
      </div>

      {/* Datos generales */}
      <Card>
        <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Ingreso:</span>
            <span className="font-medium">{formatDate(patient.admission_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Bed className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Cama:</span>
            <span className="font-medium">{patient.bed ?? 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Servicio:</span>
            <span className="font-medium">{patient.service ?? 'N/A'}</span>
          </div>
          {patient.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{patient.phone}</span>
            </div>
          )}
          {patient.diagnosis && (
            <div className="col-span-2 md:col-span-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Diagnóstico</p>
              <p className="text-sm text-gray-900">{patient.diagnosis}</p>
            </div>
          )}
          {patient.treating_doctor && (
            <div className="col-span-2 md:col-span-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Médico tratante</p>
              <p className="text-sm text-gray-900">
                Dr. {patient.treating_doctor.full_name}
                {patient.treating_doctor.specialty && <span className="text-gray-500"> · {patient.treating_doctor.specialty}</span>}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alergias */}
      {patient.allergies && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Alergias</p>
            <p className="text-sm text-red-800 mt-0.5">{patient.allergies}</p>
          </div>
        </div>
      )}

      {/* Quick action tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.map(({ href, label, icon: Icon, count }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md hover:border-blue-100 transition-all cursor-pointer h-full">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  {count !== null && <p className="text-xs text-gray-500">{count} registro(s)</p>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Antecedentes */}
      {(patient.personal_history || patient.family_history || patient.surgical_history || patient.psychobiological_habits) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Antecedentes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <InfoField label="Antecedentes Personales" value={patient.personal_history} />
            <InfoField label="Antecedentes Familiares" value={patient.family_history} />
            <InfoField label="Antecedentes Quirúrgicos" value={patient.surgical_history} />
            <InfoField label="Hábitos Psicobiológicos" value={patient.psychobiological_habits} />
          </CardContent>
        </Card>
      )}

      {/* Anamnesis */}
      {patient.anamnesis && (
        <Card>
          <CardHeader><CardTitle className="text-base">Anamnesis</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{patient.anamnesis}</p>
          </CardContent>
        </Card>
      )}

      {/* Examen Funcional */}
      {(fe.blood_pressure || fe.heart_rate || fe.respiratory_rate || fe.spo2) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Examen Funcional</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fe.blood_pressure && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50">
                <Activity className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">Presión Arterial</p>
                  <p className="text-sm font-bold text-gray-900">{fe.blood_pressure}</p>
                </div>
              </div>
            )}
            {fe.heart_rate && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-pink-50">
                <Heart className="w-5 h-5 text-pink-500" />
                <div>
                  <p className="text-xs text-gray-500">Frec. Cardíaca</p>
                  <p className="text-sm font-bold text-gray-900">{fe.heart_rate}</p>
                </div>
              </div>
            )}
            {fe.respiratory_rate && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50">
                <Wind className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Frec. Respiratoria</p>
                  <p className="text-sm font-bold text-gray-900">{fe.respiratory_rate}</p>
                </div>
              </div>
            )}
            {fe.spo2 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-cyan-50">
                <Droplets className="w-5 h-5 text-cyan-500" />
                <div>
                  <p className="text-xs text-gray-500">SpO₂</p>
                  <p className="text-sm font-bold text-gray-900">{fe.spo2}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Examen Físico */}
      {Object.values(pe).some(v => v) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Examen Físico</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <InfoField label="Piel" value={pe.skin} />
            <InfoField label="Cabeza y Cuello" value={pe.head_neck} />
            <InfoField label="Tórax" value={pe.thorax} />
            <InfoField label="Abdomen" value={pe.abdomen} />
            <InfoField label="Extremidades" value={pe.extremities} />
            <InfoField label="Neurológico" value={pe.neuro} />
          </CardContent>
        </Card>
      )}

      {/* Notas recientes */}
      {recentNotes && recentNotes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Últimas notas clínicas</CardTitle>
              <Link href={`/patients/${id}/notes`} className="text-xs text-blue-600 hover:underline">Ver todas</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotes.map((note: any) => (
              <div key={note.id} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="secondary" className="text-xs">{note.type}</Badge>
                  <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
                </div>
                <div className="text-sm text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: note.content.substring(0, 200) }} />
                <p className="text-xs text-gray-400 mt-1">Dr. {note.author?.full_name}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pendientes activos */}
      {pendingTasks && pendingTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pendientes activos</CardTitle>
              <Link href={`/patients/${id}/tasks`} className="text-xs text-blue-600 hover:underline">Ver todos</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingTasks.map((task: any) => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  task.priority === 'urgente' ? 'bg-red-500' :
                  task.priority === 'prioritario' ? 'bg-orange-400' : 'bg-blue-500'
                }`} />
                <p className="text-sm text-gray-900 flex-1">{task.title}</p>
                <Badge variant={task.priority === 'urgente' ? 'destructive' : 'secondary'} className="text-xs">
                  {task.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
