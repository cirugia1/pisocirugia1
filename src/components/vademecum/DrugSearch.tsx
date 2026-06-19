'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import type { Drug } from '@/types'

interface DrugSearchProps {
  onSelect: (drug: Drug) => void
  placeholder?: string
}

export default function DrugSearch({ onSelect, placeholder = 'Buscar medicamento...' }: DrugSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Drug[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timeout = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('vademecum')
        .select('*')
        .or(`commercial_name.ilike.%${query}%,active_ingredient.ilike.%${query}%`)
        .order('commercial_name')
        .limit(12)
      setResults((data as Drug[]) ?? [])
      setLoading(false)
      setOpen(true)
    }, 250)
    return () => clearTimeout(timeout)
  }, [query])

  function handleSelect(drug: Drug) {
    onSelect(drug)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {results.map(drug => (
            <button
              key={drug.id}
              type="button"
              onClick={() => handleSelect(drug)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{drug.commercial_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {drug.active_ingredient} · {drug.presentation}
                    {drug.concentration && ` · ${drug.concentration}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{drug.route}</span>
                  {drug.controlled && (
                    <span className="block text-xs text-red-600 mt-0.5">Controlado</span>
                  )}
                </div>
              </div>
              {drug.usual_dose && (
                <p className="text-xs text-blue-600 mt-1">Dosis usual: {drug.usual_dose}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg p-4 text-center">
          <p className="text-sm text-gray-400">No se encontró "{query}" en el vademécum</p>
          <p className="text-xs text-gray-300 mt-1">Puedes escribir el medicamento manualmente</p>
        </div>
      )}
    </div>
  )
}
