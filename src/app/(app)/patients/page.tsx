import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UserPlus, Search, Bed, Calendar, User } from 'lucide-react'
import { formatDate, calculateAge } from '@/lib/utils'

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status = 'activo' } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('patients')
    .select('*, treating_doctor:profiles!patients_treating_doctor_id_fkey(full_name)')
    .eq('status', status)
    .order('admission_date', { ascending: false })

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,hcl.ilike.%${q}%`)
  }

  const { data: patients } = await query

  const statusOptions = [
    { value: 'activo', label: 'Activos', color: 'bg-green-500' },
    { value: 'alta', label: 'Alta', color: 'bg-gray-400' },
    { value: 'fallecido', label: 'Fallecido', color: 'bg-slate-600' },
    { value: 'traslado', label: 'Traslado', color: 'bg-orange-400' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm">{patients?.length ?? 0} paciente(s) encontrado(s)</p>
        </div>
        <Link href="/patients/new">
          <Button>
            <UserPlus className="w-4 h-4" />
            Nuevo paciente
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status filter */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
          {statusOptions.map(opt => (
            <Link
              key={opt.value}
              href={`/patients?status=${opt.value}${q ? `&q=${q}` : ''}`}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                status === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <form className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre o HCL..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <input type="hidden" name="status" value={status} />
          </div>
        </form>
      </div>

      {/* Patient list */}
      {patients?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No se encontraron pacientes</p>
            <p className="text-gray-400 text-sm mt-1">
              {q ? 'Intenta con otro término de búsqueda' : 'Agrega el primer paciente'}
            </p>
            <Link href="/patients/new" className="mt-4 inline-block">
              <Button size="sm">
                <UserPlus className="w-4 h-4" />
                Agregar paciente
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {patients?.map((patient: any) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <Card className="hover:shadow-md hover:border-blue-100 transition-all cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {patient.last_name}, {patient.first_name}
                        </h3>
                        <Badge variant="secondary" className="text-xs">HCL: {patient.hcl}</Badge>
                        {patient.sex === 'M' ? (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">Masculino</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-pink-600 border-pink-200">Femenino</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                        <span>{calculateAge(patient.birth_date)} años · {formatDate(patient.birth_date)}</span>
                        {patient.bed && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-3 h-3" /> Cama {patient.bed}
                          </span>
                        )}
                        {patient.service && <span>Servicio: {patient.service}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Ingreso: {formatDate(patient.admission_date)}
                        </span>
                      </div>
                      {patient.diagnosis && (
                        <p className="text-sm text-gray-600 mt-1 truncate">{patient.diagnosis}</p>
                      )}
                    </div>

                    {/* Doctor */}
                    <div className="hidden md:block text-right flex-shrink-0">
                      {patient.treating_doctor && (
                        <p className="text-xs text-gray-500">
                          Dr. {patient.treating_doctor.full_name}
                        </p>
                      )}
                      <Badge
                        variant={patient.status === 'activo' ? 'success' : 'secondary'}
                        className="mt-1"
                      >
                        {patient.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
