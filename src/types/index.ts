export type UserRole = 'admin' | 'medico' | 'residente' | 'enfermeria'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  specialty?: string
  license_number?: string
  signature_url?: string
  hospital?: string
  created_at: string
}

export interface Patient {
  id: string
  hcl: string // Historia clínica
  first_name: string
  last_name: string
  birth_date: string
  sex: 'M' | 'F'
  id_number?: string
  phone?: string
  address?: string
  bed?: string
  service?: string
  diagnosis?: string
  treating_doctor_id?: string
  treating_doctor?: Profile
  allergies?: string
  surgical_history?: string
  status: 'activo' | 'alta' | 'fallecido' | 'traslado'
  admission_date: string
  discharge_date?: string
  created_by: string
  created_at: string
  age?: number
}

export interface ClinicalNote {
  id: string
  patient_id: string
  patient?: Patient
  type: 'evolucion' | 'preoperatoria' | 'postoperatoria' | 'interconsulta' | 'ingreso' | 'egreso'
  content: string // rich text HTML
  vital_signs?: VitalSigns
  author_id: string
  author?: Profile
  signed: boolean
  created_at: string
  updated_at: string
}

export interface VitalSigns {
  pa?: string
  fc?: number
  fr?: number
  temp?: number
  spo2?: number
  peso?: number
  talla?: number
}

export type TaskPriority = 'urgente' | 'prioritario' | 'rutina' | 'diferido'
export type TaskStatus = 'pendiente' | 'en_proceso' | 'completado' | 'cancelado'

export interface Task {
  id: string
  patient_id: string
  patient?: Patient
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  assigned_to_id?: string
  assigned_to?: Profile
  created_by_id: string
  created_by?: Profile
  due_date?: string
  completed_at?: string
  created_at: string
}

export interface Drug {
  id: string
  commercial_name: string
  active_ingredient: string
  presentation: string
  concentration?: string
  route: string
  usual_dose?: string
  category?: string
  controlled: boolean
}

export interface PrescriptionItem {
  drug_id: string
  drug?: Drug
  commercial_name: string
  dose: string
  route: string
  frequency: string
  duration?: string
  instructions?: string
}

export interface Prescription {
  id: string
  patient_id: string
  patient?: Patient
  items: PrescriptionItem[]
  author_id: string
  author?: Profile
  notes?: string
  created_at: string
}

export type OrderType = 'laboratorio' | 'imagen' | 'anatomopatologia' | 'otro'
export type OrderUrgency = 'urgente' | 'de_guardia' | 'electivo'

export interface LabOrder {
  id: string
  patient_id: string
  patient?: Patient
  type: OrderType
  items: string[]
  urgency: OrderUrgency
  clinical_info?: string
  author_id: string
  author?: Profile
  result_url?: string
  notes?: string
  created_at: string
}

export interface Template {
  id: string
  name: string
  type: 'nota_clinica' | 'receta' | 'orden' | 'pendiente'
  content: string
  specialty?: string
  is_public: boolean
  owner_id: string
  owner?: Profile
  created_at: string
  updated_at: string
}
