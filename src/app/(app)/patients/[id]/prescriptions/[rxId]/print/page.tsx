import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate, formatDateTime, calculateAge } from '@/lib/utils'

export default async function PrintPrescriptionPage({
  params,
}: {
  params: Promise<{ id: string; rxId: string }>
}) {
  const { id, rxId } = await params
  const supabase = await createClient()

  const [{ data: rx }, { data: patient }] = await Promise.all([
    supabase.from('prescriptions')
      .select('*, author:profiles!prescriptions_author_id_fkey(*)')
      .eq('id', rxId).single(),
    supabase.from('patients').select('*').eq('id', id).single(),
  ])

  if (!rx || !patient) notFound()

  return (
    <html lang="es">
      <head>
        <title>Receta Médica - {patient.last_name}, {patient.first_name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; font-size: 12px; color: #1a1a1a; background: white; }
          .page { max-width: 210mm; margin: 0 auto; padding: 20mm 15mm; min-height: 297mm; }
          .header { border-bottom: 2px solid #1e40af; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo-area h1 { font-size: 18px; color: #1e40af; font-weight: bold; }
          .logo-area p { font-size: 10px; color: #666; margin-top: 2px; }
          .doctor-info { text-align: right; font-size: 10px; color: #444; }
          .doctor-info strong { display: block; font-size: 13px; color: #1a1a1a; }
          .patient-box { background: #f0f4ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px 12px; margin-bottom: 16px; }
          .patient-box .row { display: flex; gap: 20px; flex-wrap: wrap; }
          .patient-box .field { flex: 1; min-width: 120px; }
          .patient-box .label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .patient-box .value { font-size: 12px; font-weight: 600; color: #1a1a1a; margin-top: 1px; }
          .rx-title { font-size: 15px; font-weight: bold; color: #1e40af; margin: 16px 0 10px; display: flex; align-items: center; gap: 6px; }
          .rx-symbol { font-size: 22px; font-style: italic; color: #1e40af; }
          .drug-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .drug-item:last-child { border-bottom: none; }
          .drug-number { display: inline-block; width: 20px; height: 20px; background: #1e40af; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-size: 10px; font-weight: bold; margin-right: 8px; flex-shrink: 0; }
          .drug-name { font-size: 13px; font-weight: bold; color: #1a1a1a; }
          .drug-details { color: #374151; margin-left: 28px; margin-top: 3px; }
          .drug-posology { font-size: 11px; }
          .drug-instructions { font-size: 10px; color: #6b7280; font-style: italic; margin-top: 2px; }
          .notes { margin-top: 14px; padding: 8px 10px; background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 3px; font-size: 11px; color: #78350f; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .signature-area { text-align: center; }
          .signature-line { width: 180px; border-top: 1px solid #1a1a1a; margin: 0 auto 4px; }
          .signature-label { font-size: 10px; color: #666; }
          .date-area { font-size: 10px; color: #666; }
          .allergy-warning { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 6px 10px; margin-bottom: 12px; font-size: 10px; color: #dc2626; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
        `}</style>
      </head>
      <body>
        <div className="no-print" style={{ position: 'fixed', top: 10, right: 10, zIndex: 999, display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
          >
            🖨️ Imprimir / Guardar PDF
          </button>
          <button
            onClick={() => window.close()}
            style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
          >
            Cerrar
          </button>
        </div>

        <div className="page">
          {/* Header */}
          <div className="header">
            <div className="logo-area">
              <h1>ClínicaQ</h1>
              <p>Sistema de Ficha Clínica Quirúrgica</p>
              {rx.author?.hospital && <p>{rx.author.hospital}</p>}
            </div>
            <div className="doctor-info">
              <strong>Dr. {rx.author?.full_name}</strong>
              {rx.author?.specialty && <span>{rx.author.specialty}</span>}
              <br />
              {rx.author?.license_number && (
                <span>Licencia: {rx.author.license_number}</span>
              )}
            </div>
          </div>

          {/* Patient info */}
          {patient.allergies && (
            <div className="allergy-warning">
              ⚠️ <strong>ALERGIAS:</strong> {patient.allergies}
            </div>
          )}

          <div className="patient-box">
            <div className="row">
              <div className="field">
                <div className="label">Paciente</div>
                <div className="value">{patient.last_name}, {patient.first_name}</div>
              </div>
              <div className="field">
                <div className="label">HCL</div>
                <div className="value">{patient.hcl}</div>
              </div>
              <div className="field">
                <div className="label">Edad</div>
                <div className="value">{calculateAge(patient.birth_date)} años</div>
              </div>
              <div className="field">
                <div className="label">Fecha</div>
                <div className="value">{formatDate(rx.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Rx */}
          <div className="rx-title">
            <span className="rx-symbol">℞</span>
            PRESCRIPCIÓN MÉDICA
          </div>

          <div>
            {rx.items?.map((item: any, i: number) => (
              <div key={i} className="drug-item">
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span className="drug-number">{i + 1}</span>
                  <div>
                    <div className="drug-name">{item.commercial_name}</div>
                    <div className="drug-details">
                      <div className="drug-posology">
                        <strong>Dosis:</strong> {item.dose} · <strong>Vía:</strong> {item.route} ·{' '}
                        <strong>Frecuencia:</strong> {item.frequency} · <strong>Duración:</strong> {item.duration}
                      </div>
                      {item.instructions && (
                        <div className="drug-instructions">📌 {item.instructions}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {rx.notes && (
            <div className="notes">
              <strong>Observaciones:</strong> {rx.notes}
            </div>
          )}

          {/* Footer with signature */}
          <div className="footer">
            <div className="date-area">
              Emitida el {formatDateTime(rx.created_at)}
            </div>
            <div className="signature-area">
              <div className="signature-line" />
              <div className="signature-label">Dr. {rx.author?.full_name}</div>
              {rx.author?.specialty && (
                <div className="signature-label">{rx.author.specialty}</div>
              )}
              {rx.author?.license_number && (
                <div className="signature-label">Lic: {rx.author.license_number}</div>
              )}
            </div>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          document.querySelector('.no-print button:first-child').addEventListener('click', () => window.print());
        `}} />
      </body>
    </html>
  )
}
