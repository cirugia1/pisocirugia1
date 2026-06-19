import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default async function VademecumPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; route?: string }>
}) {
  const { q, route } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('vademecum')
    .select('*')
    .order('commercial_name')
    .limit(50)

  if (q) {
    query = query.or(`commercial_name.ilike.%${q}%,active_ingredient.ilike.%${q}%,category.ilike.%${q}%`)
  }
  if (route) {
    query = query.eq('route', route)
  }

  const { data: drugs } = await query
  const { data: routes } = await supabase.from('vademecum').select('route').order('route')
  const uniqueRoutes = [...new Set(routes?.map((r: any) => r.route) ?? [])]

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          Vademécum Venezolano
        </h1>
        <p className="text-gray-500 text-sm mt-1">Base de datos de medicamentos con nombres comerciales de Venezuela</p>
      </div>

      {/* Search */}
      <form className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre comercial, principio activo o categoría..."
            className="w-full pl-4 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select
          name="route"
          defaultValue={route}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todas las vías</option>
          {uniqueRoutes.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="submit" className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Buscar
        </button>
      </form>

      {/* Results */}
      {!q && !route ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Busca un medicamento para comenzar</p>
          <p className="text-gray-300 text-sm mt-1">Escribe el nombre comercial o el principio activo</p>
        </div>
      ) : drugs?.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No se encontraron medicamentos para "{q}"</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">{drugs?.length} resultado(s) {drugs?.length === 50 ? '(mostrando primeros 50)' : ''}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {drugs?.map((drug: any) => (
              <Card key={drug.id} className="hover:shadow-md transition-all">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">{drug.commercial_name}</h3>
                        {drug.controlled && (
                          <Badge variant="destructive" className="text-xs">Controlado</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{drug.active_ingredient}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{drug.presentation}</span>
                        {drug.concentration && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{drug.concentration}</span>
                        )}
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{drug.route}</span>
                        {drug.category && (
                          <span className="text-xs text-gray-400">{drug.category}</span>
                        )}
                      </div>
                      {drug.usual_dose && (
                        <p className="text-xs text-blue-600 mt-1.5 font-medium">
                          💊 Dosis usual: {drug.usual_dose}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
