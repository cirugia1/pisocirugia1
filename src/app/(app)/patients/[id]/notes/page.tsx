import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Plus, FileText, Printer } from 'lucide-react'
import { formatDateTime, noteTypeLabel } from '@/lib/utils'

export default async function PatientNotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: notes } = await supabase
    .from('clinical_notes')
    .select('*, author:profiles!clinical_notes_author_id_fkey(full_name, specialty)')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })

  const { data: patient } = await supabase
    .from('patients')
    .select('first_name, last_name, hcl')
    .eq('id', id)
    .single()

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/patients/${id}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notas Clínicas</h1>
            <p className="text-gray-500 text-sm">
              {patient?.last_name}, {patient?.first_name} · HCL: {patient?.hcl}
            </p>
          </div>
        </div>
        <Link href={`/patients/${id}/notes/new`}>
          <Button><Plus className="w-4 h-4" />Nueva nota</Button>
        </Link>
      </div>

      {notes?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay notas clínicas</p>
            <Link href={`/patients/${id}/notes/new`} className="mt-4 inline-block">
              <Button size="sm"><Plus className="w-4 h-4" />Agregar primera nota</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes?.map((note: any) => (
            <Card key={note.id} className="hover:shadow-md transition-all">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary">{noteTypeLabel(note.type)}</Badge>
                      {note.signed && <Badge variant="success" className="text-xs">Firmada</Badge>}
                      <span className="text-xs text-gray-400">{formatDateTime(note.created_at)}</span>
                    </div>
                    <div
                      className="text-sm text-gray-700 prose prose-sm max-w-none line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                    {note.vital_signs && Object.keys(note.vital_signs).length > 0 && (
                      <div className="flex gap-3 mt-2 flex-wrap">
                        {note.vital_signs.pa && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">PA: {note.vital_signs.pa}</span>}
                        {note.vital_signs.fc && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">FC: {note.vital_signs.fc} lpm</span>}
                        {note.vital_signs.temp && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">T: {note.vital_signs.temp}°C</span>}
                        {note.vital_signs.spo2 && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">SpO₂: {note.vital_signs.spo2}%</span>}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Dr. {note.author?.full_name}
                      {note.author?.specialty && ` · ${note.author.specialty}`}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Link href={`/patients/${id}/notes/${note.id}`}>
                      <Button variant="ghost" size="sm">Ver</Button>
                    </Link>
                    <Link href={`/patients/${id}/notes/${note.id}/print`} target="_blank">
                      <Button variant="ghost" size="icon">
                        <Printer className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
