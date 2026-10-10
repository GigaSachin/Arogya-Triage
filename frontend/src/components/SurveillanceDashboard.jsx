import React, { useState, useEffect } from 'react';
import { 
  Database, Activity, Flame, ShieldAlert, 
  MapPin, RefreshCw, BarChart3, Radio, ArrowUpRight, 
  CheckCircle2, Clock 
} from 'lucide-react';

export default function SurveillanceDashboard() {
  const [telemetryData, setTelemetryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDistrict, setActiveDistrict] = useState('Sundargarh (Rourkela)');

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry/stats');
      const data = await res.json();
      setTelemetryData(data);
    } catch (err) {
      console.error('Error fetching telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !telemetryData) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <RefreshCw size={24} className="pulse-beacon-yellow" style={{ margin: '0 auto 1rem' }} />
        <div>Connecting to Google BigQuery Health Surveillance Pipe...</div>
      </div>
    );
  }

  const districts = telemetryData?.districts || {};
  const currentDistrictStats = districts[activeDistrict] || {
    red: 0, yellow: 0, green: 0, febrile_cluster: 0, respiratory_cluster: 0, thrombocytopenia_cluster: 0
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner: BigQuery Connection & Surveillance Totals */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(17, 26, 46, 0.9), rgba(15, 23, 42, 0.9))',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <Database size={22} color="#38bdf8" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                District Syndromic Telemetry & BigQuery Live Stream
              </h2>
              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                gRPC / HTTP/2 Active
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Target Dataset: <code style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{telemetryData?.bigquery_target}</code>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Ingested Events</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {telemetryData?.total_ingested_events?.toLocaleString()}
              </div>
            </div>
            <div style={{ height: '36px', width: '1px', background: 'var(--border-subtle)' }}></div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', padding: '0.4rem 0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: '#fca5a5' }}>RED CASES</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444' }}>{telemetryData?.aggregate_counts?.red_emergent}</div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '8px', padding: '0.4rem 0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: '#fde68a' }}>YELLOW</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b' }}>{telemetryData?.aggregate_counts?.yellow_urgent}</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '0.4rem 0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: '#86efac' }}>GREEN</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>{telemetryData?.aggregate_counts?.green_non_urgent}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Odisha District Syndromic Surveillance Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(500px, 2fr)', gap: '1.5rem' }}>
        
        {/* District Selector & Heat Indicators */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <MapPin size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Odisha Surveillance Jurisdictions</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.keys(districts).map(dist => {
              const dData = districts[dist];
              const isSelected = activeDistrict === dist;
              return (
                <div 
                  key={dist}
                  onClick={() => setActiveDistrict(dist)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: isSelected ? '#1e293b' : '#0c1220',
                    border: isSelected ? '1.5px solid #38bdf8' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff' }}>
                      {dist}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Febrile: {dData.febrile_cluster} • Thrombocytopenia: {dData.thrombocytopenia_cluster}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <span className="badge badge-red" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                      {dData.red} Red
                    </span>
                    <span className="badge badge-yellow" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                      {dData.yellow}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected District Syndromic Detail */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff' }}>
                {activeDistrict} — Syndromic Cluster Monitoring
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Real-time outbreak signal detection powered by BigQuery partitioned ingest
              </p>
            </div>
            <span className="badge badge-blue">
              Live District Stream
            </span>
          </div>

          {/* Syndromic Cluster 3-Card Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            
            {/* Cluster 1: Febrile Illness */}
            <div style={{ background: '#0c1220', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                <Flame size={15} />
                <span>ACUTE FEBRILE CLUSTER</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {currentDistrictStats.febrile_cluster}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                High-grade fever presentations with chills/myalgia
              </div>
            </div>

            {/* Cluster 2: Thrombocytopenia / Hemorrhagic */}
            <div style={{ background: '#0c1220', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                <ShieldAlert size={15} />
                <span>THROMBOCYTOPENIA / BLEED</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                {currentDistrictStats.thrombocytopenia_cluster}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '0.3rem' }}>
                Platelets &lt; 50,000 / Mucosal bleeding (Dengue signal)
              </div>
            </div>

            {/* Cluster 3: Respiratory Distress */}
            <div style={{ background: '#0c1220', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                <Activity size={15} />
                <span>RESPIRATORY DISTRESS</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {currentDistrictStats.respiratory_cluster}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Hypoxemia (SpO2 &lt; 92%) &amp; acute dyspnea
              </div>
            </div>

          </div>

          {/* District Triage Breakdown Bar */}
          <div style={{ background: '#0c1220', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Acuity Stratification Ratio ({activeDistrict})
            </div>
            {(() => {
              const total = currentDistrictStats.red + currentDistrictStats.yellow + currentDistrictStats.green || 1;
              const rPct = Math.round((currentDistrictStats.red / total) * 100);
              const yPct = Math.round((currentDistrictStats.yellow / total) * 100);
              const gPct = 100 - rPct - yPct;
              return (
                <div>
                  <div style={{ height: '14px', borderRadius: '7px', display: 'flex', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ width: `${rPct}%`, background: '#ef4444' }} title={`Red: ${rPct}%`}></div>
                    <div style={{ width: `${yPct}%`, background: '#f59e0b' }} title={`Yellow: ${yPct}%`}></div>
                    <div style={{ width: `${gPct}%`, background: '#10b981' }} title={`Green: ${gPct}%`}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Red (Emergent): <strong>{currentDistrictStats.red} ({rPct}%)</strong></span>
                    <span>Yellow (Urgent): <strong>{currentDistrictStats.yellow} ({yPct}%)</strong></span>
                    <span>Green (Ambulatory): <strong>{currentDistrictStats.green} ({gPct}%)</strong></span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>

      {/* Bottom Section: Live Google BigQuery Row Streaming Console */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={16} color="#10b981" className="pulse-beacon-green" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>
              BigQuery Telemetry Live Stream Log (Schema: district_triage_telemetry)
            </h3>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Polling latency: 3.0s • Transport: HTTP/2 Chunked
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ background: '#0a0f1d', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.5rem 0.75rem' }}>Event ID</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Facility ID</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>District</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>ESI Level</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Symptom Cluster</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Latency</th>
              </tr>
            </thead>
            <tbody>
              {telemetryData?.recent_stream_log && telemetryData.recent_stream_log.length > 0 ? (
                telemetryData.recent_stream_log.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#93c5fd' }}>{row.event_id.slice(0, 12)}...</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{row.facility_id}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#ffffff' }}>{row.district}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span className={`badge ${row.color_tag === 'RED' ? 'badge-red' : (row.color_tag === 'YELLOW' ? 'badge-yellow' : 'badge-green')}`} style={{ fontSize: '0.65rem' }}>
                        ESI {row.esi_level}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#fde68a' }}>{row.symptom_cluster}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#86efac' }}>{row.streaming_status}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>{row.latency_ms} ms</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No streaming events registered yet. Submit an intake to see real-time streaming!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
