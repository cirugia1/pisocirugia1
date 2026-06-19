import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy') {
  return format(new Date(date), fmt, { locale: es })
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy 'a las' HH:mm", { locale: es })
}

export function calculateAge(birthDate: string): number {
  return differenceInYears(new Date(), new Date(birthDate))
}

export function priorityColor(priority: string) {
  const map: Record<string, string> = {
    urgente: 'bg-red-100 text-red-800 border-red-200',
    prioritario: 'bg-orange-100 text-orange-800 border-orange-200',
    rutina: 'bg-blue-100 text-blue-800 border-blue-200',
    diferido: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return map[priority] ?? map.rutina
}

export function priorityDot(priority: string) {
  const map: Record<string, string> = {
    urgente: 'bg-red-500',
    prioritario: 'bg-orange-400',
    rutina: 'bg-blue-500',
    diferido: 'bg-gray-400',
  }
  return map[priority] ?? map.rutina
}

export function noteTypeLabel(type: string) {
  const map: Record<string, string> = {
    evolucion: 'Evolución',
    preoperatoria: 'Nota Preoperatoria',
    postoperatoria: 'Nota Postoperatoria',
    interconsulta: 'Interconsulta',
    ingreso: 'Nota de Ingreso',
    egreso: 'Nota de Egreso',
  }
  return map[type] ?? type
}
