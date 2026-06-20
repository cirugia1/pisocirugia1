import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, Shield, Activity } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import CreateUserForm from './CreateUserForm'
import EditUserForm from './EditUserForm'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: profiles }, { count: patientCount }, { count: drugCount }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('vademecum').select('*', { count: 'exact', head: true }),
  ])

  const roleColors: Record<string, any> = {
    admin: 'destructive',
    medico: 'default',
    residente: 'secondary',
    enfermeria: 'success',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Administración
        </h1>
        <p className="text-gray-500 text-sm">Panel de administración del sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{profiles?.length}</p>
                <p className="text-xs text-gray-500">Usuarios registrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{patientCount}</p>
                <p className="text-xs text-gray-500">Total pacientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{drugCount}</p>
                <p className="text-xs text-gray-500">Fármacos en vademécum</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* User list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuarios del sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profiles?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {p.prefix && (
                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          {p.prefix}
                        </span>
                      )}
                      <p className="text-sm font-medium text-gray-900">{p.full_name}</p>
                      {p.alias && <span className="text-xs text-gray-400">({p.alias})</span>}
                    </div>
                    <p className="text-xs text-gray-500">{p.email}</p>
                    {p.specialty && <p className="text-xs text-gray-400">{p.specialty}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <Badge variant={roleColors[p.role] ?? 'secondary'}>{p.role}</Badge>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(p.created_at)}</p>
                    </div>
                    <EditUserForm profile={p} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Create user */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crear nuevo usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateUserForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
