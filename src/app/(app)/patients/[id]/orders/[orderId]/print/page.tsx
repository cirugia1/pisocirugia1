import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate, formatDateTime, calculateAge } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  laboratorio: 'ORDEN DE LABORATORIO',
  imagen: 'ORDEN DE IMÁGENES / RADIOLOGÍA',
  anatomopatologia: 'ORDEN DE ANATOMOPATOLOGÍA',
  otro: 'ORDEN MÉDICA',
}

const URGENCY_LABELS: Record<string, string> = {
  urgente: '🔴 URGENTE',
  de_guardia: '🟡 DE GUARDIA',
  electivo: '🔵 ELECTIVO',
}

export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ id: string; orderId: string }>
}) {
  const { id, orderId } = await params
  const supabase = await createClient()

  const [{ data: order }, { data: patient }] = await Promise.all([
    supabase.from('lab_orders')
      .select('*, author:profiles!lab_orders_author_id_fkey(*)')
      .eq('id', orderId).single(),
    supabase.from('patients').select('*').eq('id', id).single(),
  ])

  if (!order || !patient) notFound()

  return (
    <html lang="es">
      <head>
        <title>{TYPE_LABELS[order.type]} - {patient.last_name}, {patient.first_name}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: white; }
          .page { max-width: 210mm; margin: 0 auto; padding: 20mm 15mm; min-height: 297mm; }
          .header { border-bottom: 2px solid #1e40af; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo-area h1 { font-size: 18px; color: #1e40af; font-weight: bold; }
          .logo-area p { font-size: 10px; color: #666; }
          .doctor-info { text-align: right; font-size: 10px; color: #444; }
          .doctor-info strong { display: block; font-size: 13px; color: #1a1a1a; }
          .patient-box { background: #f0f4ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px 12px; margin-bottom: 16px; }
          .row { display: flex; gap: 20px; flex-wrap: wrap; }
          .field .label { font-size: 9px; color: #6b7280; text-transform: uppercase; }
          .field .value { font-size: 12px; font-weight: 600; margin-top: 1px; }
          .order-title { font-size: 16px; font-weight: bold; color: #1e40af; margin: 16px 0 4px; }
          .urgency-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; margin-bottom: 14px;
            background: ${order.urgency === 'urgente' ? '#fef2f2' : order.urgency === 'de_guardia' ? '#fffbeb' : '#eff6ff'};
            color: ${order.urgency === 'urgente' ? '#dc2626' : order.urgency === 'de_guardia' ? '#b45309' : '#1d4ed8'};
            border: 1px solid ${order.urgency === 'urgente' ? '#fca5a5' : order.urgency === 'de_guardia' ? '#fcd34d' : '#bfdbfe'};
          }
          .items-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin: 10px 0; }
          .item { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px dotted #e5e7eb; font-size: 11px; }
          .item-num { width: 20px; height: 20px; background: #1e40af; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; flex-shrink: 0; }
          .clinical-info { margin-top: 14px; padding: 8px 10px; background: #f8fafc; border-left: 3px solid #94a3b8; border-radius: 3px; font-size: 11px; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
          .signature-area { text-align: center; }
          .signature-line { width: 180px; border-top: 1px solid #1a1a1a; margin: 0 auto 4px; }
          .signature-label { font-size: 10px; color: #666; }
          @media print { .no-print { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        `}</style>
      </head>
      <body>
        <div className="no-print" style={{ position: 'fixed', top: 10, right: 10, zIndex: 999, display: 'flex', gap: 8 }}>
          <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            🖨️ Imprimir / PDF
          </button>
          <button onClick={() => window.close()} style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            Cerrar
          </button>
        </div>

        <div className="page">
          <div className="header">
            <div className="logo-area">
              <h1>Cirugia 1 Piso</h1>
              <p>Cirugia 1 Piso</p>
              {order.author?.hospital && <p>{order.author.hospital}</p>}
            </div>
            <div className="doctor-info">
              <strong>Dr. {order.author?.full_name}</strong>
              {order.author?.specialty && <span>{order.author.specialty}<br /></span>}
              {order.author?.license_number && <span>Lic: {order.author.license_number}</span>}
            </div>
          </div>

          <div className="patient-box">
            <div className="row">
              <div className="field"><div className="label">Paciente</div><div className="value">{patient.last_name}, {patient.first_name}</div></div>
              <div className="field"><div className="label">HCL</div><div className="value">{patient.hcl}</div></div>
              <div className="field"><div className="label">Edad</div><div className="value">{calculateAge(patient.birth_date)} años</div></div>
              <div className="field"><div className="label">Fecha</div><div className="value">{formatDate(order.created_at)}</div></div>
              {patient.bed && <div className="field"><div className="label">Cama</div><div className="value">{patient.bed}</div></div>}
            </div>
          </div>

          <div className="order-title">{TYPE_LABELS[order.type]}</div>
          <div className="urgency-badge">{URGENCY_LABELS[order.urgency]}</div>

          <div className="items-grid">
            {order.items?.map((item: string, i: number) => (
              <div key={i} className="item">
                <div className="item-num">{i + 1}</div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {order.clinical_info && (
            <div className="clinical-info">
              <strong>Información clínica:</strong> {order.clinical_info}
            </div>
          )}

          {order.notes && (
            <div className="clinical-info" style={{ marginTop: 8, borderColor: '#f59e0b' }}>
              <strong>Observaciones:</strong> {order.notes}
            </div>
          )}

          <div className="footer">
            <div style={{ fontSize: 10, color: '#666' }}>Emitida el {formatDateTime(order.created_at)}</div>
            <div className="signature-area">
              <div className="signature-line" />
              <div className="signature-label">Dr. {order.author?.full_name}</div>
              {order.author?.specialty && <div className="signature-label">{order.author.specialty}</div>}
              {order.author?.license_number && <div className="signature-label">Lic: {order.author.license_number}</div>}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
