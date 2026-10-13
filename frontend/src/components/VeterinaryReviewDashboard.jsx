import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, CheckCircle2, Clock, FileDown, 
  ShieldAlert, AlertTriangle, Eye, HeartPulse, 
  Stethoscope, Activity, User, Building2, Calendar, 
  ChevronRight, ArrowUpRight, Search, Filter 
} from 'lucide-react';
import { playBlip, playSuccessChime } from '../utils/soundEffects';

export default function VeterinaryReviewDashboard({
  queue,
  selectedRecord,
  onSelectRecord,
  onApprove,
  onOpenOverrideModal,
  isActionLoading
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [speciesFilter, setSpeciesFilter] = useState('ALL');

  // Filter queue for veterinary domain only
  const vetQueue = queue.filter(item => (item.domain === 'veterinary' || item.species));

  const filteredQueue = vetQueue.filter(item => {
    const nameMatch = (item.display_pseudonym || item.animal_tag_or_name || '').toLowerCase();
    const symptomsMatch = (item.symptoms_raw || '').toLowerCase();
    const speciesMatch = (item.species || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = nameMatch.includes(query) || symptomsMatch.includes(query) || speciesMatch.includes(query);
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSpecies = speciesFilter === 'ALL' || item.species === speciesFilter;
    return matchesSearch && matchesStatus && matchesSpecies;
  });

  // Count red cases
  const redCount = vetQueue.filter(q => q.urgency_code === 'RED' && q.status === 'PENDING_REVIEW').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(500px, 2fr)', gap: '1.5rem', alignItems: 'start' }}>
      
      {/* Left Column: Priority-Ordered Live Veterinary Queue */}
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
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--banner-red-title)' }}>
                CRITICAL VETERINARY EMERGENCY: {redCount} RED Animal Case(s)
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--banner-red-sub)' }}>
                Severe bloat / respiratory distress / hemorrhagic enteritis requiring immediate veterinary triage.
              </div>
            </div>
          </div>
        )}

        {/* Queue Control Header & Filters */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartPulse size={18} color="#10b981" />
              <h2 style={{ fontSize: '1rem', fontWeight: '700' }}>Prioritized Veterinary Queue</h2>
            </div>
            <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
              {filteredQueue.length} Active Cases
            </span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by animal tag, species, or symptoms..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2rem', fontSize: '0.8rem' }}
            />
          </div>

          {/* Filter Selects */}
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
              value={speciesFilter} 
              onChange={(e) => setSpeciesFilter(e.target.value)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', flex: 1 }}
            >
              <option value="ALL">All Species</option>
              <option value="cattle">Cattle (Bovine)</option>
              <option value="dog">Dog (Canine)</option>
              <option value="goat">Goat (Caprine)</option>
              <option value="buffalo">Buffalo (Bubaline)</option>
              <option value="cat">Cat (Feline)</option>
            </select>
          </div>
        </div>

        {/* Scrollable Animal Cases List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          {filteredQueue.length === 0 ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No matching veterinary cases in queue.
            </div>
          ) : (
            filteredQueue.map((item) => {
              const isSelected = selectedRecord && selectedRecord.id === item.id;
              const isRed = item.urgency_code === 'RED';
              const isYellow = item.urgency_code === 'YELLOW';
              const isGreen = item.urgency_code === 'GREEN';

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.018, x: 3 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    playBlip(720, 0.02);
                    onSelectRecord(item);
                  }}
                  className="glass-card"
                  style={{
                    padding: '0.85rem',
                    cursor: 'pointer',
                    borderLeft: `4px solid ${isRed ? '#ef4444' : (isYellow ? '#f59e0b' : (isGreen ? '#10b981' : '#64748b'))}`,
                    border: isSelected ? '1px solid #10b981' : undefined,
                    background: isSelected ? 'rgba(16, 185, 129, 0.08)' : undefined,
                    transition: 'border-color 0.15s ease, background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {item.display_pseudonym || item.animal_tag_or_name || 'Animal'}
                      </span>
                      <span className="badge badge-blue" style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
                        {item.species}
                      </span>
                    </div>
                    <span className={`badge ${isRed ? 'badge-red' : (isYellow ? 'badge-yellow' : (isGreen ? 'badge-green' : 'badge-yellow'))}`} style={{ fontSize: '0.7rem' }}>
                      {item.urgency_category || item.urgency_code}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.symptoms_raw}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    <span>{item.facility || item.district}</span>
                    <span style={{ fontWeight: '700', color: item.status === 'APPROVED' ? 'var(--color-green)' : (item.status === 'OVERRIDDEN' ? 'var(--color-yellow)' : 'var(--text-muted)') }}>
                      {item.status}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Detailed Animal Assessment Card */}
      <div>
        <AnimatePresence mode="wait">
        {selectedRecord && (selectedRecord.domain === 'veterinary' || selectedRecord.species) ? (
          <motion.div 
            key={selectedRecord.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card" 
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            
            {/* Header: Animal Profile & Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {selectedRecord.display_pseudonym || selectedRecord.animal_tag_or_name}
                  </h2>
                  <span className={`badge ${selectedRecord.urgency_code === 'RED' ? 'badge-red' : (selectedRecord.urgency_code === 'YELLOW' ? 'badge-yellow' : 'badge-green')}`} style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}>
                    VTI: {selectedRecord.urgency_category || selectedRecord.urgency_code}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Species: <strong style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{selectedRecord.species}</strong></span>
                  {selectedRecord.breed && <span>Breed: <strong style={{ color: 'var(--text-secondary)' }}>{selectedRecord.breed}</strong></span>}
                  {selectedRecord.age_category && <span>Age: <strong style={{ color: 'var(--text-secondary)' }}>{selectedRecord.age_category}</strong></span>}
                  <span>Owner Contact: <strong style={{ color: 'var(--text-secondary)' }}>{selectedRecord.owner_contact_masked || 'Masked / Protected'}</strong></span>
                  <span>Origin: <strong style={{ color: 'var(--text-secondary)' }}>{selectedRecord.facility}</strong></span>
                </div>
              </div>

              {/* Action Controls */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedRecord.status === 'PENDING_REVIEW' && (
                  <motion.button 
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="btn btn-success" 
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
                    onClick={() => {
                      playSuccessChime();
                      onApprove(selectedRecord.id);
                    }}
                    disabled={isActionLoading}
                  >
                    <CheckCircle2 size={15} />
                    Approve Triage
                  </motion.button>
                )}

                <motion.button 
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn btn-outline" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                  onClick={() => {
                    playBlip(750, 0.03);
                    onOpenOverrideModal(selectedRecord);
                  }}
                >
                  <AlertCircle size={15} />
                  Override VTI
                </motion.button>

                <motion.a 
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  href={`/api/veterinary/queue/${selectedRecord.id}/referral/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', textDecoration: 'none', background: 'linear-gradient(135deg, #059669, #10b981)' }}
                >
                  <FileDown size={15} />
                  DAH&VS Referral Note
                </motion.a>
              </div>
            </div>


            {/* VTI Decision Rationale Banner */}
            <div style={{
              background: selectedRecord.urgency_code === 'RED' ? 'rgba(239, 68, 68, 0.12)' : (selectedRecord.urgency_code === 'YELLOW' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)'),
              border: selectedRecord.urgency_code === 'RED' ? '1px solid rgba(239, 68, 68, 0.4)' : (selectedRecord.urgency_code === 'YELLOW' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'),
              borderRadius: '10px',
              padding: '0.85rem 1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: selectedRecord.urgency_code === 'RED' ? 'var(--color-red)' : (selectedRecord.urgency_code === 'YELLOW' ? 'var(--color-yellow)' : 'var(--color-green)') }}>
                  {selectedRecord.classification}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Recommended Wait Time: <strong>{selectedRecord.urgency_code === 'RED' ? '< 15 mins (Immediate Stabilization)' : (selectedRecord.urgency_code === 'YELLOW' ? '1 - 2 hours' : 'Routine Outpatient')}</strong>
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <strong>Deterministic Rule Rationale:</strong> {selectedRecord.reasons && selectedRecord.reasons.join(' • ')}
              </div>
            </div>

            {/* Species Physiological Vitals Matrix */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                1. Species Physiological Vitals Matrix
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.65rem' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Rectal Temp</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: Number(selectedRecord.vitals?.temperature) >= 103.5 ? 'var(--color-red)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {selectedRecord.vitals?.temperature ? `${selectedRecord.vitals.temperature}°F` : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    {selectedRecord.species === 'cattle' ? 'Norm 100.4-102.8' : 'Norm 100.5-102.5'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Heart / Pulse</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: Number(selectedRecord.vitals?.heart_rate) >= 100 ? 'var(--color-red)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {selectedRecord.vitals?.heart_rate ? `${selectedRecord.vitals.heart_rate} bpm` : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    {selectedRecord.species === 'cattle' ? 'Norm 48-84' : 'Norm 60-140'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Respiration</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: Number(selectedRecord.vitals?.respiration_rate) >= 45 ? 'var(--color-red)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {selectedRecord.vitals?.respiration_rate ? `${selectedRecord.vitals.respiration_rate} bpm` : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    {selectedRecord.species === 'cattle' ? 'Norm 15-35' : 'Norm 10-30'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Mucous Membrane</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', textTransform: 'capitalize', color: selectedRecord.vitals?.mucous_membrane_color === 'cyanotic' ? 'var(--text-highlight)' : (selectedRecord.vitals?.mucous_membrane_color === 'pale' ? 'var(--color-red)' : 'var(--color-green)') }}>
                    {selectedRecord.vitals?.mucous_membrane_color || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Coloration</div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CRT</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: Number(selectedRecord.vitals?.crt_sec) > 2.0 ? 'var(--color-red)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {selectedRecord.vitals?.crt_sec ? `${selectedRecord.vitals.crt_sec}s` : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Norm &lt;= 2.0s</div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Hydration</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {selectedRecord.vitals?.hydration_status || 'Normal'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Skin Turgor</div>
                </div>
              </div>
            </div>

            {/* Presenting Narrative & Timeline */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                2. Presenting Complaints & Chronology
              </h4>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                {selectedRecord.symptoms_raw}
              </div>
            </div>

            {/* Immediate Stabilization Actions (NO DRUGS) */}
            {selectedRecord.critical_actions && selectedRecord.critical_actions.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-green)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  3. Immediate Field Stabilization Directives (Non-Pharmacological)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedRecord.critical_actions.map((act, i) => (
                    <div key={i} style={{
                      background: 'var(--color-green-bg)',
                      border: '1px solid var(--color-green-border)',
                      borderRadius: '6px',
                      padding: '0.55rem 0.85rem',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--text-primary)'
                    }}>
                      <CheckCircle2 size={15} color="var(--color-green)" style={{ flexShrink: 0 }} />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostic Blind Spots / Missing Info */}
            {selectedRecord.missing_info && selectedRecord.missing_info.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-yellow)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  4. Diagnostic Blind Spots & Information Gaps
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedRecord.missing_info.map((gap, i) => (
                    <div key={i} style={{
                      background: 'var(--color-yellow-bg)',
                      border: '1px solid var(--color-yellow-border)',
                      borderRadius: '6px',
                      padding: '0.55rem 0.85rem',
                      fontSize: '0.76rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <strong style={{ color: 'var(--color-yellow)' }}>{gap.title || gap.field}:</strong> {gap.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer Footer */}
            <div style={{
              background: 'var(--bg-surface-elevated)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              padding: '0.65rem 0.85rem',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              lineHeight: '1.4'
            }}>
              <strong>Regulatory Notice:</strong> Decision-support tool for qualified veterinary personnel and livestock inspectors. Non-diagnostic. Does not replace in-person examination by a Registered Veterinary Practitioner. Zero automated drug prescriptions permitted.
            </div>
          </motion.div>
        ) : (
          <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <HeartPulse size={36} color="#059669" style={{ margin: '0 auto 1rem auto', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Select a Veterinary Case to Review
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
              Choose a bovine or canine case from the queue on the left to evaluate clinical findings, approve triage, or override with clinical justification.
            </p>
          </div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
