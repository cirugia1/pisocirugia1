-- =============================================
-- SCHEMA: Sistema de Ficha Clínica Quirúrgica
-- (usa IF NOT EXISTS para evitar errores si ya existe)
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'residente' CHECK (role IN ('admin','medico','residente','enfermeria')),
  specialty TEXT,
  license_number TEXT,
  hospital TEXT,
  signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.uid() = id
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
          COALESCE(NEW.raw_user_meta_data->>'role', 'residente'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- PATIENTS
-- =============================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hcl TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  sex CHAR(1) NOT NULL CHECK (sex IN ('M','F')),
  id_number TEXT,
  phone TEXT,
  address TEXT,
  bed TEXT,
  service TEXT,
  diagnosis TEXT,
  treating_doctor_id UUID REFERENCES profiles(id),
  allergies TEXT,
  surgical_history TEXT,
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo','alta','fallecido','traslado')),
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  discharge_date DATE,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON patients;
DROP POLICY IF EXISTS "Doctors can update patients" ON patients;
CREATE POLICY "Authenticated users can view patients" ON patients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert patients" ON patients FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Doctors can update patients" ON patients FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','medico','residente'))
);

-- =============================================
-- CLINICAL NOTES
-- =============================================
CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('evolucion','preoperatoria','postoperatoria','interconsulta','ingreso','egreso')),
  content TEXT NOT NULL,
  vital_signs JSONB,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  signed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view notes" ON clinical_notes;
DROP POLICY IF EXISTS "Authenticated users can insert notes" ON clinical_notes;
DROP POLICY IF EXISTS "Authors can update own notes" ON clinical_notes;
CREATE POLICY "Authenticated users can view notes" ON clinical_notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert notes" ON clinical_notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authors can update own notes" ON clinical_notes FOR UPDATE USING (
  author_id = auth.uid() AND signed = FALSE
);

-- =============================================
-- TASKS / PENDIENTES
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'rutina' CHECK (priority IN ('urgente','prioritario','rutina','diferido')),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','en_proceso','completado','cancelado')),
  assigned_to_id UUID REFERENCES profiles(id),
  created_by_id UUID REFERENCES profiles(id) NOT NULL,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Assigned or creator can update task" ON tasks;
CREATE POLICY "Authenticated users can view tasks" ON tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Assigned or creator can update task" ON tasks FOR UPDATE USING (
  auth.uid() = assigned_to_id OR auth.uid() = created_by_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','medico'))
);

-- =============================================
-- VADEMÉCUM
-- =============================================
CREATE TABLE IF NOT EXISTS vademecum (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  commercial_name TEXT NOT NULL,
  active_ingredient TEXT NOT NULL,
  presentation TEXT NOT NULL,
  concentration TEXT,
  route TEXT NOT NULL,
  usual_dose TEXT,
  category TEXT,
  controlled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vademecum ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All authenticated users can read vademecum" ON vademecum;
DROP POLICY IF EXISTS "Admins can manage vademecum" ON vademecum;
CREATE POLICY "All authenticated users can read vademecum" ON vademecum FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage vademecum" ON vademecum FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- PRESCRIPTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  author_id UUID REFERENCES profiles(id) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can manage prescriptions" ON prescriptions;
CREATE POLICY "Authenticated users can view prescriptions" ON prescriptions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Doctors can manage prescriptions" ON prescriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','medico','residente'))
);

-- =============================================
-- LAB ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS lab_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('laboratorio','imagen','anatomopatologia','otro')),
  items TEXT[] NOT NULL DEFAULT '{}',
  urgency TEXT NOT NULL DEFAULT 'electivo' CHECK (urgency IN ('urgente','de_guardia','electivo')),
  clinical_info TEXT,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  result_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON lab_orders;
DROP POLICY IF EXISTS "Doctors can manage orders" ON lab_orders;
CREATE POLICY "Authenticated users can view orders" ON lab_orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Doctors can manage orders" ON lab_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','medico','residente'))
);

-- =============================================
-- TEMPLATES
-- =============================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('nota_clinica','receta','orden','pendiente')),
  content TEXT NOT NULL,
  specialty TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own and public templates" ON templates;
DROP POLICY IF EXISTS "Users can manage own templates" ON templates;
CREATE POLICY "Users can view own and public templates" ON templates FOR SELECT USING (
  owner_id = auth.uid() OR is_public = TRUE
);
CREATE POLICY "Users can manage own templates" ON templates FOR ALL USING (owner_id = auth.uid());

-- =============================================
-- INDEXES (IF NOT EXISTS)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_treating_doctor ON patients(treating_doctor_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient ON clinical_notes(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_patient ON tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority, status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_vademecum_commercial ON vademecum USING GIN (to_tsvector('spanish', commercial_name));
CREATE INDEX IF NOT EXISTS idx_vademecum_active ON vademecum USING GIN (to_tsvector('spanish', active_ingredient));
