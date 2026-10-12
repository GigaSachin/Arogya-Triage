import React, { useState, useEffect } from 'react';
import { 
  Cpu, ShieldAlert, CheckCircle2, History, 
  Terminal, Play, ArrowRight, Layers, Lock 
} from 'lucide-react';

export default function MCPGovernanceView() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedTool, setSelectedTool] = useState('compute_esi_triage');
  const [toolInput, setToolInput] = useState(
    JSON.stringify({
      vitals: { spo2: 89, pulse: 128, systolic_bp: 88 },
      red_flags: ["Severe fever", "confusion", "gum bleeding"],
      symptoms: ["Severe fever", "confusion", "gum bleeding"],
      labs: { platelets: 16000 }
    }, null, 2)
  );
  const [toolOutput, setToolOutput] = useState(null);
  const [isRunningTool, setIsRunningTool] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit/logs');
      const data = await res.json();
      setAuditLogs(data.audit_logs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleRunTool = async () => {
    setIsRunningTool(true);
    setToolOutput(null);
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(toolInput);
      } catch (e) {
        alert('Invalid JSON input syntax');
        setIsRunningTool(false);
        return;
      }

      const res = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: selectedTool,
          arguments: parsedArgs
        })
      });
      const data = await res.json();
      setToolOutput(data);
    } catch (err) {
      console.error('Tool execution error:', err);
      setToolOutput({ error: 'Failed to execute tool' });
    } finally {
      setIsRunningTool(false);
    }
  };

  const handleSelectToolPreset = (toolName) => {
    setSelectedTool(toolName);
    if (toolName === 'compute_esi_triage') {
      setToolInput(JSON.stringify({
        vitals: { spo2: 89, pulse: 128, systolic_bp: 88 },
        red_flags: ["Severe fever", "confusion", "gum bleeding"],
        symptoms: ["Severe fever", "confusion", "gum bleeding"],
        labs: { platelets: 16000 }
      }, null, 2));
    } else if (toolName === 'validate_lab_parameters') {
      setToolInput(JSON.stringify({
        labs: { platelets: 16000, hemoglobin: 6.8, fasting_blood_sugar: 310, wbc: 15400 }
      }, null, 2));
    } else if (toolName === 'identify_missing_info') {
      setToolInput(JSON.stringify({
        symptoms: ["Patient has acute fever and vomiting for 2 days"],
        vitals_present: { pulse: 98, systolic_bp: 110 },
        labs_present: {}
      }, null, 2));
    } else if (toolName === 'generate_abdm_fhir_bundle') {
      setToolInput(JSON.stringify({
        triage_record: {
          id: "TRIAGE-DEMO-01",
          facility: "CHC Panposh, Rourkela",
          esi_level: 2,
          urgency_code: "RED",
          display_pseudonym: "Patient-OD-001",
          vitals: { spo2: 89, pulse: 128 },
          symptoms: ["Severe fever", "Gum bleeding"],
          labs: { platelets: 16000 }
        }
      }, null, 2));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner: Architecture & Hallucination Isolation Concept */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25), rgba(15, 23, 42, 0.8))',
        border: '1px solid rgba(59, 130, 246, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            background: '#2563eb',
            borderRadius: '10px',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(37, 99, 235, 0.6)'
          }}>
            <Cpu size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>
              Model Context Protocol (MCP) Deterministic Architecture
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#93c5fd' }}>
              Isolating generative language models from emergency triage scoring to achieve 0% hallucination risk
            </p>
          </div>
        </div>

        {/* Visual Architecture Flow Diagram */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginTop: '1rem',
          background: 'rgba(11, 15, 25, 0.7)',
          padding: '1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* Step 1 */}
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: '700', marginBottom: '0.25rem' }}>STEP 1: INTAKE</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.35rem' }}>
              Multimodal Ingestion
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Vernacular voice notes (Odia/Hindi) + Tabular lab slips + Objective vital signs
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700', marginBottom: '0.25rem' }}>STEP 2: PRIVACY</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.35rem' }}>
              In-Flight PII Masking
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              12-digit Aadhaar &amp; 10-digit mobile phone sanitization before any external routing
            </div>
          </div>

          {/* Step 3 (MCP Core) */}
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.2)', border: '1.5px solid #3b82f6', boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }}>
            <div style={{ fontSize: '0.7rem', color: '#93c5fd', fontWeight: '800', marginBottom: '0.25rem' }}>STEP 3: CLINICAL MCP</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.35rem' }}>
              Deterministic Rule Core
            </div>
            <div style={{ fontSize: '0.72rem', color: '#bfdbfe' }}>
              Isolated from LLM hallucinations: Rule-bound ESI v4 scoring &amp; ICMR lab reference cutoff checks
            </div>
          </div>

          {/* Step 4 */}
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: '700', marginBottom: '0.25rem' }}>STEP 4: GOVERNANCE</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.35rem' }}>
              Human-in-the-Loop
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Doctor review, mandatory override audit justification, &amp; ABDM FHIR referral export
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Interactive MCP Tool Sandbox & Live Testing */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(400px, 1.3fr)', gap: '1.5rem' }}>
        
        {/* Tool Selector & Input Console */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Clinical MCP Tool Sandbox</h3>
            </div>
            <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
              Standard MCP v1.0
            </span>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Select Registered MCP Tool
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <button 
                type="button"
                className="btn" 
                style={{
                  fontSize: '0.75rem',
                  padding: '0.45rem',
                  background: selectedTool === 'compute_esi_triage' ? '#2563eb' : '#0f172a',
                  color: '#ffffff',
                  border: '1px solid var(--border-subtle)'
                }}
                onClick={() => handleSelectToolPreset('compute_esi_triage')}
              >
                compute_esi_triage
              </button>
              <button 
                type="button"
                className="btn" 
                style={{
                  fontSize: '0.75rem',
                  padding: '0.45rem',
                  background: selectedTool === 'validate_lab_parameters' ? '#2563eb' : '#0f172a',
                  color: '#ffffff',
                  border: '1px solid var(--border-subtle)'
                }}
                onClick={() => handleSelectToolPreset('validate_lab_parameters')}
              >
                validate_lab_params
              </button>
              <button 
                type="button"
                className="btn" 
                style={{
                  fontSize: '0.75rem',
                  padding: '0.45rem',
                  background: selectedTool === 'identify_missing_info' ? '#2563eb' : '#0f172a',
                  color: '#ffffff',
                  border: '1px solid var(--border-subtle)'
                }}
                onClick={() => handleSelectToolPreset('identify_missing_info')}
              >
                identify_missing_info
              </button>
              <button 
                type="button"
                className="btn" 
                style={{
                  fontSize: '0.75rem',
                  padding: '0.45rem',
                  background: selectedTool === 'generate_abdm_fhir_bundle' ? '#2563eb' : '#0f172a',
                  color: '#ffffff',
                  border: '1px solid var(--border-subtle)'
                }}
                onClick={() => handleSelectToolPreset('generate_abdm_fhir_bundle')}
              >
                generate_abdm_fhir
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Tool Arguments (JSON Payload)
            </label>
            <textarea 
              className="form-textarea" 
              rows={8}
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
            />
          </div>

          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ width: '100%', fontSize: '0.85rem' }}
            onClick={handleRunTool}
            disabled={isRunningTool}
          >
            <Play size={15} />
            {isRunningTool ? 'Executing Tool in MCP Sandbox...' : `Execute ${selectedTool}`}
          </button>
        </div>

        {/* Tool Output Console */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Deterministic Output Inspector</h3>
            <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
              0% Hallucination Guarantee
            </span>
          </div>

          <div style={{
            background: '#090d16',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            padding: '1rem',
            flex: 1,
            maxHeight: '380px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem'
          }}>
            {toolOutput ? (
              <pre style={{ margin: 0, color: '#38bdf8', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(toolOutput, null, 2)}
              </pre>
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 1rem' }}>
                Click "Execute Tool" on the left to invoke the deterministic MCP tool layer.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Section: Clinical Override Audit Trail (PRD FR-3.3) */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>
              Clinical Override Audit Log (Mandatory Physician Justification)
            </h3>
          </div>
          <button 
            type="button" 
            className="btn btn-outline" 
            style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
            onClick={fetchAuditLogs}
          >
            Refresh Logs
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: 'var(--table-header-bg)', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.55rem 0.85rem' }}>Record ID</th>
                <th style={{ padding: '0.55rem 0.85rem' }}>Transition</th>
                <th style={{ padding: '0.55rem 0.85rem' }}>Mandatory Clinical Justification</th>
                <th style={{ padding: '0.55rem 0.85rem' }}>Reviewer Medical Officer</th>
                <th style={{ padding: '0.55rem 0.85rem' }}>Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.55rem 0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-highlight)' }}>
                      {log.record_id}
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem' }}>
                      <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>
                        ESI {log.previous_esi} → ESI {log.new_esi}
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {log.justification_reason}
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem', color: 'var(--text-secondary)' }}>
                      {log.doctor_name}
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No doctor overrides recorded yet. Any ESI change made on the Reviewer Dashboard will be permanently audited here.
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
