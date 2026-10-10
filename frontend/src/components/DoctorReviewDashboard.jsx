import React, { useState } from 'react';
import { 
  AlertCircle, CheckCircle2, Clock, FileDown, 
  Share2, ShieldAlert, AlertTriangle, Eye, 
  Stethoscope, Activity, User, Building2, Calendar, 
  ChevronRight, ArrowUpRight, Search, Filter 
} from 'lucide-react';

export default function DoctorReviewDashboard({
  queue,
  selectedRecord,
  onSelectRecord,
  onApprove,
  onOpenOverrideModal,
  onOpenFhirModal,
  onOpenLabImageModal,
  isActionLoading
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');

  // Filter queue
  const filteredQueue = queue.filter(item => {
    const matchesSearch = 
      item.display_pseudonym.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.symptoms_raw && item.symptoms_raw.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.translated_english && item.translated_english.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesDistrict = districtFilter === 'ALL' || item.district === districtFilter;
    return matchesSearch && matchesStatus && matchesDistrict;
  });

  // Count red cases
  const redCount = queue.filter(q => q.urgency_code === 'RED' && q.status === 'PENDING_REVIEW').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(500px, 2fr)', gap: '1.5rem', alignItems: 'start' }}>
      
      {/* Left Column: Priority-Ordered Live Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Urgent Emergency Alert Banner if Red Cases Pending */}
        {redCount > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)'
          }}>
            <span className="pulse-beacon-red" style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }}></span>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fca5a5' }}>
                CRITICAL EMERGENCY ALERT: {redCount} RED Case(s)
              </div>
              <div style={{ fontSize: '0.72rem', color: '#fecaca' }}>
                Severe hemodynamic instability or critical thrombocytopenia. Immediate triage action required.
              </div>
            </div>
          </div>
        )}

        {/* Queue Control Header & Filters */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Stethoscope size={18} color="#38bdf8" />
              <h2 style={{ fontSize: '1rem', fontWeight: '700' }}>Prioritized Live Queue</h2>
            </div>
            <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
              {filteredQueue.length} Active Patients
            </span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by patient ID or symptoms..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2rem', fontSize: '0.8rem' }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select 
              className="form-select" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', flex: 1 }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="OVERRIDDEN">Overridden</option>
            </select>

            <select 
              className="form-select" 
              value={districtFilter} 
              onChange={(e) => setDistrictFilter(e.target.value)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', flex: 1 }}
            >
              <option value="ALL">All Districts</option>
              <option value="Sundargarh (Rourkela)">Sundargarh</option>
              <option value="Khordha (Bhubaneswar)">Khordha</option>
              <option value="Cuttack">Cuttack</option>
            </select>
          </div>
        </div>

        {/* Priority-Ordered Queue List Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '72vh', overflowY: 'auto' }}>
          {filteredQueue.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No triage cases match the selected filters.
            </div>
          ) : (
            filteredQueue.map(item => {
              const isSelected = selectedRecord && selectedRecord.id === item.id;
              const isRed = item.urgency_code === 'RED';
              const isYellow = item.urgency_code === 'YELLOW';

              let borderColor = 'rgba(255, 255, 255, 0.08)';
              let bgStyle = 'var(--bg-card)';

              if (isSelected) {
                borderColor = isRed ? '#ef4444' : (isYellow ? '#f59e0b' : '#10b981');
                bgStyle = 'var(--bg-surface-elevated)';
              }

              return (
                <div 
                  key={item.id}
                  onClick={() => onSelectRecord(item)}
                  style={{
                    background: bgStyle,
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? (isRed ? 'var(--shadow-glow-red)' : 'var(--shadow-md)') : 'var(--shadow-sm)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = borderColor;
                  }}
                >
                  {/* Card Header: ESI Badge & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isRed && (
                        <span className="pulse-beacon-red" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                      )}
                      <span className={`badge ${isRed ? 'badge-red' : (isYellow ? 'badge-yellow' : 'badge-green')}`} style={{ fontSize: '0.72rem' }}>
                        ESI LEVEL {item.esi_level} • {item.urgency_code}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: item.status === 'APPROVED' ? '#86efac' : (item.status === 'OVERRIDDEN' ? '#fde68a' : 'var(--text-muted)')
                    }}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Patient Name & Demographics */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#ffffff' }}>
                      {item.display_pseudonym}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {item.id}
                    </span>
                  </div>

                  {/* Complaint / Vernacular summary */}
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.translated_english || item.symptoms_raw}
                  </p>

                  {/* Vitals Summary Pill */}
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    {item.vitals && item.vitals.spo2 && (
                      <span style={{ color: Number(item.vitals.spo2) < 90 ? '#ef4444' : 'inherit', fontWeight: Number(item.vitals.spo2) < 90 ? '700' : 'normal' }}>
                        SpO2: {item.vitals.spo2}%
                      </span>
                    )}
                    {item.vitals && item.vitals.pulse && (
                      <span style={{ color: Number(item.vitals.pulse) >= 120 ? '#ef4444' : 'inherit', fontWeight: Number(item.vitals.pulse) >= 120 ? '700' : 'normal' }}>
                        Pulse: {item.vitals.pulse} bpm
                      </span>
                    )}
                    {item.vitals && item.vitals.temperature && (
                      <span>Temp: {item.vitals.temperature}°F</span>
                    )}
                    {item.labs && item.labs.platelets && (
                      <span style={{ color: Number(item.labs.platelets) < 20000 ? '#ef4444' : 'inherit', fontWeight: Number(item.labs.platelets) < 20000 ? '700' : 'normal' }}>
                        PLT: {Number(item.labs.platelets).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Detailed Patient Assessment Card (PRD FR-3.2) */}
      <div>
        {selectedRecord ? (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Header: Patient Profile & Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff' }}>
                    {selectedRecord.display_pseudonym}
                  </h2>
                  <span className={`badge ${selectedRecord.urgency_code === 'RED' ? 'badge-red' : (selectedRecord.urgency_code === 'YELLOW' ? 'badge-yellow' : 'badge-green')}`} style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}>
                    ESI LEVEL {selectedRecord.esi_level} • {selectedRecord.urgency_code}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>ABHA ID: <strong style={{ color: 'var(--text-secondary)' }}>{selectedRecord.abha_id}</strong></span>
                  <span>Origin: <strong style={{ color: 'var(--text-secondary)' }}>{selectedRecord.facility}</strong></span>
                  <span>District: <strong style={{ color: 'var(--text-secondary)' }}>{selectedRecord.district}</strong></span>
                </div>
              </div>

              {/* Single-Action Controls (PRD FR-3.3) */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedRecord.status === 'PENDING_REVIEW' && (
                  <button 
                    className="btn btn-success" 
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
                    onClick={() => onApprove(selectedRecord.id)}
                    disabled={isActionLoading}
                  >
                    <CheckCircle2 size={15} />
                    Approve Triage
                  </button>
                )}

                <button 
                  className="btn btn-outline" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                  onClick={() => onOpenOverrideModal(selectedRecord)}
                >
                  <AlertCircle size={15} />
                  Override ESI
                </button>

                <a 
                  href={`/api/queue/${selectedRecord.id}/referral/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', textDecoration: 'none' }}
                >
                  <FileDown size={15} />
                  ABDM Referral PDF
                </a>

                <button 
                  className="btn btn-outline" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                  onClick={() => onOpenFhirModal(selectedRecord)}
                  title="View interoperable HL7/FHIR Composition bundle"
                >
                  <Share2 size={15} />
                  FHIR JSON
                </button>
              </div>
            </div>

            {/* ESI Decision Rationale Banner */}
            <div style={{
              background: selectedRecord.urgency_code === 'RED' ? 'rgba(239, 68, 68, 0.12)' : (selectedRecord.urgency_code === 'YELLOW' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)'),
              border: selectedRecord.urgency_code === 'RED' ? '1px solid rgba(239, 68, 68, 0.4)' : (selectedRecord.urgency_code === 'YELLOW' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'),
              borderRadius: '10px',
              padding: '0.85rem 1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: selectedRecord.urgency_code === 'RED' ? '#fca5a5' : (selectedRecord.urgency_code === 'YELLOW' ? '#fde68a' : '#86efac') }}>
                  {selectedRecord.classification}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Recommended Wait Time: <strong>{selectedRecord.urgency_code === 'RED' ? '< 10 mins (Immediate)' : (selectedRecord.urgency_code === 'YELLOW' ? '30 - 60 mins' : '120+ mins')}</strong>
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <strong>Deterministic Rule:</strong> {selectedRecord.reasons && selectedRecord.reasons.join(' • ')}
              </div>
            </div>

            {/* Physiological Vitals Matrix */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                1. Physiological Vitals Matrix
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.65rem' }}>
                <div style={{ background: '#0c1220', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>SpO2</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: Number(selectedRecord.vitals.spo2) < 90 ? '#ef4444' : '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {selectedRecord.vitals.spo2 || 'N/A'}%
                  </div>
                  <div style={{ fontSize: '0.62rem', color: Number(selectedRecord.vitals.spo2) < 90 ? '#fca5a5' : 'var(--text-muted)' }}>
                    {Number(selectedRecord.vitals.spo2) < 90 ? 'CRITICAL LOW' : 'Normal >= 94%'}
                  </div>
                </div>

                <div style={{ background: '#0c1220', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Pulse Rate</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: Number(selectedRecord.vitals.pulse) >= 120 ? '#ef4444' : '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {selectedRecord.vitals.pulse || 'N/A'} <span style={{ fontSize: '0.75rem' }}>bpm</span>
                  </div>
                  <div style={{ fontSize: '0.62rem', color: Number(selectedRecord.vitals.pulse) >= 120 ? '#fca5a5' : 'var(--text-muted)' }}>
                    {Number(selectedRecord.vitals.pulse) >= 120 ? 'TACHYCARDIA' : '60 - 100 bpm'}
                  </div>
                </div>

                <div style={{ background: '#0c1220', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Blood Pressure</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {selectedRecord.vitals.systolic_bp || '-'}/{selectedRecord.vitals.diastolic_bp || '-'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>mmHg</div>
                </div>

                <div style={{ background: '#0c1220', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Temperature</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: Number(selectedRecord.vitals.temperature) >= 101.5 ? '#f59e0b' : '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {selectedRecord.vitals.temperature || 'N/A'}°F
                  </div>
                  <div style={{ fontSize: '0.62rem', color: Number(selectedRecord.vitals.temperature) >= 101.5 ? '#fde68a' : 'var(--text-muted)' }}>
                    {Number(selectedRecord.vitals.temperature) >= 101.5 ? 'HIGH FEBRILE' : 'Normal 98.6°F'}
                  </div>
                </div>

                <div style={{ background: '#0c1220', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Resp Rate</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {selectedRecord.vitals.respiration_rate || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>/min</div>
                </div>
              </div>
            </div>

            {/* Chronological Symptom Progression */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                2. Chronological Clinical Progression
              </h4>
              <div style={{ background: '#0c1220', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                {selectedRecord.timeline && selectedRecord.timeline.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {selectedRecord.timeline.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <span style={{
                          background: '#1e3a8a',
                          color: '#93c5fd',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No chronological milestones isolated.</span>
                )}
              </div>
            </div>

            {/* Multimodal Lab Values & Critical Cutoffs */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  3. Multimodal Laboratory Analysis (OCR Validated)
                </h4>
                {selectedRecord.lab_image_path && (
                  <button 
                    className="btn btn-outline" 
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => onOpenLabImageModal(selectedRecord.lab_image_path)}
                  >
                    <Eye size={12} /> View Uploaded Slip
                  </button>
                )}
              </div>

              <div style={{ background: '#0c1220', borderRadius: '8px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#111a2e', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.55rem 0.85rem' }}>Parameter</th>
                      <th style={{ padding: '0.55rem 0.85rem' }}>Observed Result</th>
                      <th style={{ padding: '0.55rem 0.85rem' }}>ICMR Reference Range</th>
                      <th style={{ padding: '0.55rem 0.85rem' }}>Clinical Evaluation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecord.lab_analysis && selectedRecord.lab_analysis.all_evaluated && selectedRecord.lab_analysis.all_evaluated.length > 0 ? (
                      selectedRecord.lab_analysis.all_evaluated.map((item, idx) => {
                        const isCrit = item.status && item.status.includes('CRITICAL');
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <td style={{ padding: '0.55rem 0.85rem', fontWeight: '600', color: '#ffffff' }}>
                              {item.parameter}
                            </td>
                            <td style={{ padding: '0.55rem 0.85rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: isCrit ? '#ef4444' : '#ffffff' }}>
                              {item.value} {item.unit}
                            </td>
                            <td style={{ padding: '0.55rem 0.85rem', color: 'var(--text-muted)' }}>
                              {item.reference_range}
                            </td>
                            <td style={{ padding: '0.55rem 0.85rem' }}>
                              {isCrit ? (
                                <span className="badge badge-red" style={{ fontSize: '0.68rem' }}>
                                  {item.status}
                                </span>
                              ) : (
                                <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                                  {item.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No acute lab abnormalities recorded for this encounter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Automated Doctor Inquiries & Missing Information Blindspots (PRD FR-3.2) */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={15} color="#38bdf8" />
                4. Automated Follow-Up Inquiries for Attending Doctor
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedRecord.missing_info && selectedRecord.missing_info.length > 0 ? (
                  selectedRecord.missing_info.map((info, idx) => (
                    <div key={idx} style={{
                      background: info.importance === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      border: info.importance === 'HIGH' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem'
                    }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: info.importance === 'HIGH' ? '#fca5a5' : '#93c5fd', marginBottom: '0.2rem' }}>
                        [{info.title}]
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {info.prompt}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ background: '#0c1220', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#86efac' }}>
                    All standard vitals and baseline clinical parameters recorded. No blind spots flagged.
                  </div>
                )}
              </div>
            </div>

            {/* Overridden History Notification if Applicable */}
            {selectedRecord.status === 'OVERRIDDEN' && (
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fde68a', marginBottom: '0.25rem' }}>
                  Clinical Override Recorded: Previous ESI Level {selectedRecord.previous_esi_level} → New ESI Level {selectedRecord.esi_level}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#ffffff' }}>
                  <strong>Physician Rationale:</strong> {selectedRecord.override_reason}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Reviewed by: {selectedRecord.reviewer_doctor} at {new Date(selectedRecord.reviewed_at).toLocaleString()}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <Stethoscope size={48} color="#334155" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Select a Patient from the Prioritized Queue
            </h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
              Click any patient card on the left to review physiological vitals, OCR lab extractions, chronological timeline, and single-action escalation controls.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
