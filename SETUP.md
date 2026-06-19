# ClínicaQ — Instrucciones de Configuración

## 1. Crear proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta gratuita
2. Crea un nuevo proyecto (elige la región más cercana)
3. Espera a que el proyecto inicialice (~2 minutos)
4. Ve a **Settings → API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
# Edita .env.local con tus valores de Supabase
```

## 3. Crear el schema de la base de datos

1. En Supabase, ve a **SQL Editor**
2. Copia y pega el contenido de `supabase/schema.sql`
3. Ejecuta el script (botón RUN)

## 4. Cargar el vademécum venezolano

1. En Supabase, ve a **SQL Editor**
2. Copia y pega el contenido de `supabase/seed_vademecum.sql`
3. Ejecuta el script (~130 fármacos incluidos)

## 5. Crear el primer usuario administrador

1. En Supabase, ve a **Authentication → Users → Add User**
2. Ingresa email y contraseña del admin
3. Ve a **Table Editor → profiles**
4. Busca el usuario y cambia el campo `role` a `admin`

## 6. Ejecutar en desarrollo

```bash
npm install
npm run dev
```
Abre http://localhost:3000

## 7. Deploy en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Agregar variables de entorno en vercel.com o con:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Estructura del proyecto

```
src/
├── app/
│   ├── (app)/              # Área autenticada
│   │   ├── dashboard/      # Panel principal
│   │   ├── patients/       # Gestión de pacientes
│   │   │   └── [id]/
│   │   │       ├── notes/       # Notas clínicas
│   │   │       ├── tasks/       # Pendientes
│   │   │       ├── prescriptions/ # Recetas
│   │   │       └── orders/      # Órdenes de exámenes
│   │   ├── tasks/          # Vista global de pendientes
│   │   ├── vademecum/      # Búsqueda de medicamentos
│   │   └── admin/          # Administración de usuarios
│   └── login/              # Página de inicio de sesión
├── components/
│   ├── ui/                 # Componentes base
│   ├── layout/             # Sidebar, Header
│   ├── clinical-notes/     # Editor rich text
│   └── vademecum/          # Búsqueda de fármacos
├── lib/
│   ├── supabase/           # Clientes Supabase (client/server)
│   └── utils.ts            # Utilidades
└── types/                  # Tipos TypeScript
supabase/
├── schema.sql              # Schema completo de BD
└── seed_vademecum.sql      # ~130 fármacos venezolanos iniciales
```

## Agregar más fármacos al vademécum

Puedes agregar fármacos directamente desde:
- **Admin → Vademécum** (próximamente en el panel admin)
- **Supabase Table Editor → vademecum**
- Ejecutando SQL con nuevos `INSERT INTO vademecum...`

## Roles del sistema

| Rol | Permisos |
|-----|----------|
| `admin` | Todo + gestión de usuarios + vademécum |
| `medico` | Crear/editar pacientes, notas, recetas, órdenes |
| `residente` | Igual que médico |
| `enfermeria` | Ver pacientes, ver/completar pendientes |
