import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, AlertTriangle, ShieldCheck, CheckCircle2, 
  MapPin, RefreshCw, ArrowRight, FileDown, Eye, AlertOctagon,
  Clock, Stethoscope, Sparkles, HelpCircle, HeartPulse, ChevronRight,
  Mic, MicOff
} from 'lucide-react';

export default function VeterinaryIntakeKiosk({ 
  onIntakeSuccess, 
  scenarioData, 
  onClearScenario 
}) {
  // Facility & Basic Animal Demographics
  const [facilityId, setFacilityId] = useState('FAC-ROU-01');
  const [species, setSpecies] = useState('cattle');
  const [breed, setBreed] = useState('');
  const [ageCategory, setAgeCategory] = useState('Adult');
  const [animalTagOrName, setAnimalTagOrName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [durationText, setDurationText] = useState('3 hours');
  const [history, setHistory] = useState('');

  // Voice recording state for farmer field intake
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  // Symptoms & Red Flags
  const [symptomsRaw, setSymptomsRaw] = useState('');
  const [redFlags, setRedFlags] = useState([]);

  // Physiological Vitals
  const [vitals, setVitals] = useState({
    temperature: '',
    heart_rate: '',
    respiration_rate: '',
    mucous_membrane_color: 'pink',
    crt_sec: '1.5',
    hydration_status: 'normal'
  });

  // UI & Response States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Species physiological references for live operator feedback
  const speciesNorms = {
    cattle: {
      label: 'Bovine / Cattle (Bos indicus / taurus)',
      temp: '100.4 – 102.8 °F (Crit > 104.5 / < 99.0)',
      hr: '48 – 84 bpm (Crit > 100)',
      rr: '15 – 35 breaths/min (Crit > 50)',
      crt: 'Normal <= 2.0s',
      status: 'SUPPORTED_MVP'
    },
    dog: {
      label: 'Canine / Dog (Canis lupus familiaris)',
      temp: '100.5 – 102.5 °F (Crit > 104.0 / < 98.5)',
      hr: '60 – 140 bpm (Crit > 160)',
      rr: '10 – 30 breaths/min (Crit > 40)',
      crt: 'Normal <= 2.0s',
      status: 'SUPPORTED_MVP'
    },
    goat: {
      label: 'Caprine / Goat (Capra hircus)',
      temp: '101.5 – 104.0 °F',
      hr: '70 – 90 bpm',
      rr: '15 – 30 breaths/min',
      crt: 'Normal <= 2.0s',
      status: 'BETA_UNCERTAINTY'
    },
    buffalo: {
      label: 'Bubaline / Buffalo (Bubalus bubalis)',
      temp: '100.0 – 102.0 °F',
      hr: '40 – 60 bpm',
      rr: '15 – 25 breaths/min',
      crt: 'Normal <= 2.0s',
      status: 'BETA_UNCERTAINTY'
    },
    cat: {
      label: 'Feline / Cat (Felis catus)',
      temp: '100.5 – 102.5 °F',
      hr: '140 – 220 bpm',
      rr: '20 – 40 breaths/min',
      crt: 'Normal <= 2.0s',
      status: 'BETA_UNCERTAINTY'
    }
  };

  // Preset Scenario Loader
  const loadScenario = (presetKey) => {
    setErrorMessage(null);
    setSubmissionResult(null);

    if (presetKey === 'VET-TC-01') {
      setSpecies('cattle');
      setBreed('Red Sindhi Cross');
      setAgeCategory('Adult (5 years)');
      setAnimalTagOrName('Cattle #OD-9921');
      setOwnerPhone('+91-9876547712');
      setDurationText('2 hours');
      setHistory('Grazed on lush damp clover pasture 3 hours ago; no previous bloat history.');
      setSymptomsRaw('Acute severe left paralumbar fossa distension (bloat), grunting, rapid labored open-mouth breathing, recumbency.');
      setRedFlags(['Severe left flank distension / Bloat', 'Respiratory distress / Open mouth breathing', 'Recumbent / Unable to stand']);
      setVitals({
        temperature: '102.2',
        heart_rate: '96',
        respiration_rate: '54',
        mucous_membrane_color: 'cyanotic',
        crt_sec: '2.8',
        hydration_status: 'mild dehydration'
      });
    } else if (presetKey === 'VET-TC-02') {
      setSpecies('dog');
      setBreed('Indie Hound Mix');
      setAgeCategory('Puppy (4 months)');
      setAnimalTagOrName("Puppy 'Bruno'");
      setOwnerPhone('+91-9437119821');
      setDurationText('24 hours');
      setHistory('Unvaccinated rescue adopted 2 weeks ago; skipped deworming.');
      setSymptomsRaw('Severe foul-smelling bloody diarrhea, persistent vomiting for 24h, extreme lethargy, won\'t drink water.');
      setRedFlags(['Severe hemorrhagic bloody diarrhea', 'Persistent vomiting', 'Extreme lethargy / depression']);
      setVitals({
        temperature: '103.8',
        heart_rate: '152',
        respiration_rate: '32',
        mucous_membrane_color: 'pale',
        crt_sec: '2.5',
        hydration_status: 'severe skin tenting'
      });
    } else if (presetKey === 'VET-TC-03') {
      setSpecies('dog');
      setBreed('Golden Retriever');
      setAgeCategory('Adult (2 years)');
      setAnimalTagOrName("Dog 'Leo'");
      setOwnerPhone('+91-7008123310');
      setDurationText('1 day');
      setHistory('Fully vaccinated up to date; regular deworming; healthy appetite.');
      setSymptomsRaw('Routine annual Rabies booster check-up and minor superficial ear pinna scratch; healthy appetite and normal activity.');
      setRedFlags([]);
      setVitals({
        temperature: '101.5',
        heart_rate: '84',
        respiration_rate: '18',
        mucous_membrane_color: 'pink',
        crt_sec: '1.2',
        hydration_status: 'normal'
      });
    } else if (presetKey === 'VET-TC-04') {
      setSpecies('goat');
      setBreed('Black Bengal Goat');
      setAgeCategory('Young (1 year)');
      setAnimalTagOrName('Caprine Goat #BB-109');
      setOwnerPhone('+91-9876541209');
      setDurationText('24 hours');
      setHistory('Grazing herd; other goats normal; appetite decreased.');
      setSymptomsRaw('Goat has been weak and lying down with reduced appetite since yesterday.');
      setRedFlags([]);
      setVitals({
        temperature: '102.5',
        heart_rate: '',
        respiration_rate: '',
        mucous_membrane_color: 'pink',
        crt_sec: '1.5',
        hydration_status: 'normal'
      });
    }
  };

  useEffect(() => {
    if (scenarioData && scenarioData.id) {
      loadScenario(scenarioData.id);
    }
  }, [scenarioData]);

  const toggleRedFlag = (flag) => {
    setRedFlags(prev => 
      prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]
    );
  };

  const handleClearForm = () => {
    setSpecies('cattle');
    setBreed('');
    setAgeCategory('Adult');
    setAnimalTagOrName('');
    setOwnerPhone('');
    setDurationText('');
    setHistory('');
    setSymptomsRaw('');
    setRedFlags([]);
    setVitals({
      temperature: '',
      heart_rate: '',
      respiration_rate: '',
      mucous_membrane_color: 'pink',
      crt_sec: '1.5',
      hydration_status: 'normal'
    });
    setSubmissionResult(null);
    setErrorMessage(null);
    if (onClearScenario) onClearScenario();
  };

  // Farmer / Paravet Voice Recording Handler
  const handleToggleVoiceRecord = async () => {
    if (isRecordingVoice) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      setIsRecordingVoice(false);
    } else {
      try {
        // Live speech recognition stream
        try {
          const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRec) {
            const rec = new SpeechRec();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-IN';
            rec.onresult = (evt) => {
              let streamWords = '';
              for (let i = 0; i < evt.results.length; ++i) {
                streamWords += evt.results[i][0].transcript + ' ';
              }
              if (streamWords.trim()) {
                setSymptomsRaw(streamWords.trim());
              }
            };
            rec.start();
            recognitionRef.current = rec;
          }
        } catch (speechErr) {
          console.warn('Browser SpeechRec not available:', speechErr);
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          let mimeType = 'audio/webm';
          if (typeof MediaRecorder !== 'undefined') {
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
              mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
              mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/wav')) {
              mimeType = 'audio/wav';
            }
          }
          const recorder = new MediaRecorder(stream, { mimeType });
          audioChunksRef.current = [];
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          recorder.onstop = async () => {
            const blob = new Blob(audioChunksRef.current, { type: mimeType });
            const key = localStorage.getItem('sarvam_api_key') || '';
            if (blob.size > 200 && key) {
              setIsTranscribingVoice(true);
              const formData = new FormData();
              formData.append('file', blob, `farmer_voice_${Date.now()}.webm`);
              formData.append('language', 'odia');
              formData.append('api_key', key);
              try {
                const res = await fetch('/api/voice/transcribe-audio', {
                  method: 'POST',
                  headers: { 'X-Sarvam-Key': key },
                  body: formData
                });
                const data = await res.json();
                const transcript = data.transcription || data.vernacular_script;
                if (transcript) {
                  setSymptomsRaw(transcript);
                }
              } catch (err) {
                console.warn('Backend audio transcription skipped:', err);
              } finally {
                setIsTranscribingVoice(false);
              }
            }
          };
          recorder.start(250);
          mediaRecorderRef.current = recorder;
        }
        setIsRecordingVoice(true);
      } catch (err) {
        console.error('Vet microphone error:', err);
        alert('Could not start microphone: ' + (err.message || 'Permission denied'));
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!symptomsRaw.trim()) {
      setErrorMessage('Presenting symptoms description is mandatory for veterinary triage evaluation.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        species: species.toLowerCase(),
        breed: breed.trim() || undefined,
        age_category: ageCategory || undefined,
        animal_tag_or_name: animalTagOrName.trim() || undefined,
        symptoms_raw: symptomsRaw.trim(),
        duration_text: durationText.trim() || undefined,
        history: history.trim() || undefined,
        owner_phone: ownerPhone.trim() || undefined,
        facility_id: facilityId,
        red_flags: redFlags,
        vitals: {
          temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
          heart_rate: vitals.heart_rate ? parseFloat(vitals.heart_rate) : null,
          respiration_rate: vitals.respiration_rate ? parseFloat(vitals.respiration_rate) : null,
          mucous_membrane_color: vitals.mucous_membrane_color || null,
          crt_sec: vitals.crt_sec ? parseFloat(vitals.crt_sec) : null,
          hydration_status: vitals.hydration_status || null
        }
      };

      const res = await fetch('/api/veterinary/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${res.status}`);
      }

      const result = await res.json();
      setSubmissionResult(result);

      if (onIntakeSuccess) {
        onIntakeSuccess(result);
      }
    } catch (err) {
      console.error('Veterinary triage submission error:', err);
      setErrorMessage(err.message || 'Failed to submit veterinary triage intake.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeNorm = speciesNorms[species] || { label: 'Unsupported Species', status: 'UNSUPPORTED' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}>
      
      {/* Left Column: Multimodal Veterinary Intake Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Header Banner */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
              }}>
                <HeartPulse size={18} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Veterinary Emergency & Livestock Triage Node
                </h2>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  DAH&VS / ICAR Clinical Standards • Companion Animals & Bovine Herd Triage
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-green)', fontSize: '0.75rem', fontWeight: '600' }}>
              <ShieldCheck size={16} />
              <span>Owner Phone In-Flight Masking Active</span>
            </div>
          </div>

          {/* Human Field Examination Protocol Banner */}
          <div style={{
            background: 'var(--color-green-bg)',
            borderRadius: '8px',
            padding: '0.65rem 0.85rem',
            border: '1px solid var(--color-green-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-green)' }}></span>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-green)' }}>
                Field Paravet & Veterinary Officer Intake Console
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              All animal physiological vitals and farmer complaints entered live by attending operator
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Card 1: Facility & Animal Demographics */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Species & Animal Identification
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Target Species *
                </label>
                <select
                  className="form-select"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                >
                  <option value="cattle">Bovine / Cattle (Bos indicus / taurus) [Supported]</option>
                  <option value="dog">Canine / Dog (Canis lupus familiaris) [Supported]</option>
                  <option value="goat">Caprine / Goat (Capra hircus) [Beta Testing]</option>
                  <option value="buffalo">Bubaline / Buffalo (Bubalus bubalis) [Beta Testing]</option>
                  <option value="cat">Feline / Cat (Felis catus) [Beta Testing]</option>
                  <option value="iguana">Exotic / Other [Unsupported - Auto-Flags Uncertainty]</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Ear Tag / Animal Pseudonym / Pet Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ear Tag #OD-9921 or Bruno"
                  value={animalTagOrName}
                  onChange={(e) => setAnimalTagOrName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Breed (if known)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Red Sindhi, Indie Hound, Jersey"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Age Category / Stage
                </label>
                <select
                  className="form-select"
                  value={ageCategory}
                  onChange={(e) => setAgeCategory(e.target.value)}
                >
                  <option value="Neonate / Calf / Puppy">Neonate / Calf / Puppy (&lt; 6 months)</option>
                  <option value="Young / Juvenile">Young / Juvenile (6–18 months)</option>
                  <option value="Adult">Adult (Prime productive / mature)</option>
                  <option value="Senior / Geriatric">Senior / Geriatric</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Owner / Farmer Mobile (Masked In-Flight)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91-XXXXX-XXXXX"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Veterinary Center / Dispensary
                </label>
                <select
                  className="form-select"
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                >
                  <option value="FAC-ROU-01">Govt Veterinary Hospital Panposh, Rourkela</option>
                  <option value="FAC-ROU-02">Block Veterinary Dispensary Bisra</option>
                  <option value="FAC-BBSR-01">Central Veterinary Clinic Saheed Nagar, Bhubaneswar</option>
                  <option value="FAC-CTC-01">District Veterinary Polyclinic, Cuttack</option>
                </select>
              </div>
            </div>

            {/* Species Physiological Reference Callout */}
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '0.65rem 0.95rem',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <strong style={{ color: '#1d4ed8' }}>{activeNorm.label}</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  Physiological Baseline Norms:
                </span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>
                  Temp: {activeNorm.temp || 'N/A'} • HR: {activeNorm.hr || 'N/A'} • RR: {activeNorm.rr || 'N/A'}
                </span>
              </div>
              <span className={`badge ${activeNorm.status === 'SUPPORTED_MVP' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.68rem' }}>
                {activeNorm.status === 'SUPPORTED_MVP' ? 'Validated Rule Engine' : 'Uncertainty Protected State'}
              </span>
            </div>
          </div>

          {/* Card 2: Symptoms, Clinical Narrative & History */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              2. Presenting Complaints & Timeline
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Presenting Symptoms Description *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn ${isRecordingVoice ? 'btn-danger pulse-beacon-red' : 'btn-outline'}`}
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={handleToggleVoiceRecord}
                    disabled={isTranscribingVoice}
                    title={isRecordingVoice ? 'Stop Recording' : 'Record farmer description via mic (Odia/Hindi)'}
                  >
                    {isRecordingVoice ? <MicOff size={13} /> : (isTranscribingVoice ? <RefreshCw size={13} className="spinning-icon" /> : <Mic size={13} />)}
                    <span>{isRecordingVoice ? 'Recording (Click to stop)' : (isTranscribingVoice ? 'Transcribing...' : 'Record Farmer Voice')}</span>
                  </button>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    English or Vernacular (Odia/Hindi) supported
                  </span>
                </div>
              </div>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describe presenting symptoms, behavior change, feed intake, standing posture, etc."
                value={symptomsRaw}
                onChange={(e) => setSymptomsRaw(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Duration Since Onset
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2 hours, 24 hours, 3 days"
                  value={durationText}
                  onChange={(e) => setDurationText(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Relevant History (Diet change, deworming, recent calving, vaccination)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Grazed wet clover this morning; vaccinated for FMD/HS 3 months ago"
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                />
              </div>
            </div>

            {/* Emergency Red Flags Checklist */}
            <div>
              <label style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: '700', display: 'block', marginBottom: '0.45rem' }}>
                ⚠️ Emergency Warning Signs (Check any actively observed):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
                {[
                  'Severe left flank distension / Bloat',
                  'Respiratory distress / Open mouth breathing',
                  'Recumbent / Unable to stand',
                  'Severe hemorrhagic bloody diarrhea',
                  'Persistent vomiting',
                  'Severe cyanosis (blue/purple gums)',
                  'Suspected Rabies / Aggression / Neurologic signs',
                  'Active seizures or sudden collapse'
                ].map((flag) => {
                  const isChecked = redFlags.includes(flag);
                  return (
                    <div
                      key={flag}
                      onClick={() => toggleRedFlag(flag)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: isChecked ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                        background: isChecked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        color: isChecked ? '#fca5a5' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ cursor: 'pointer', accentColor: '#ef4444' }}
                      />
                      <span>{flag}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Physiological Vitals Matrix */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              3. Objective Physiological Vitals (Field Examination)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Rectal Temp (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 102.2"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  step="1"
                  className="form-input"
                  placeholder="e.g. 84"
                  value={vitals.heart_rate}
                  onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Respiration (bpm)
                </label>
                <input
                  type="number"
                  step="1"
                  className="form-input"
                  placeholder="e.g. 24"
                  value={vitals.respiration_rate}
                  onChange={(e) => setVitals({ ...vitals, respiration_rate: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Capillary Refill (s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 1.8"
                  value={vitals.crt_sec}
                  onChange={(e) => setVitals({ ...vitals, crt_sec: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Mucous Membrane
                </label>
                <select
                  className="form-select"
                  value={vitals.mucous_membrane_color}
                  onChange={(e) => setVitals({ ...vitals, mucous_membrane_color: e.target.value })}
                >
                  <option value="pink">Pink (Normal)</option>
                  <option value="pale">Pale (Shock / Blood loss)</option>
                  <option value="white">White (Extreme anemia)</option>
                  <option value="cyanotic">Cyanotic / Blue (Hypoxia)</option>
                  <option value="brick red">Brick Red (Sepsis)</option>
                  <option value="icteric">Icteric / Yellow (Jaundice)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Hydration Status
                </label>
                <select
                  className="form-select"
                  value={vitals.hydration_status}
                  onChange={(e) => setVitals({ ...vitals, hydration_status: e.target.value })}
                >
                  <option value="normal">Normal Skin Turgor</option>
                  <option value="mild dehydration">Mild Dehydration (5-6%)</option>
                  <option value="severe skin tenting">Severe Dehydration (&gt; 8%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: '#fca5a5',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertOctagon size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClearForm}
              disabled={isSubmitting}
            >
              <RefreshCw size={14} />
              Reset Form
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem', background: 'linear-gradient(135deg, #059669, #10b981)' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="pulse-beacon-yellow" />
                  Running Deterministic Veterinary Safety Rules...
                </>
              ) : (
                <>
                  <HeartPulse size={16} />
                  Evaluate Veterinary Triage
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Structured Veterinary Triage Result Card */}
      <div>
        {submissionResult ? (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            
            {/* Header: Urgency Category & Identification */}
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Veterinary Triage Index (VTI)
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {submissionResult.animal_tag_or_name || `${submissionResult.species?.toUpperCase()} Record`}
                  </h3>
                </div>

                <span className={`badge ${submissionResult.urgency_code === 'RED' ? 'badge-red' : (submissionResult.urgency_code === 'YELLOW' ? 'badge-yellow' : (submissionResult.urgency_code === 'GREEN' ? 'badge-green' : 'badge-yellow'))}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                  {submissionResult.urgency_category} • CODE {submissionResult.urgency_code}
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Case Record ID: <strong style={{ color: 'var(--text-highlight)', fontFamily: 'var(--font-mono)' }}>{submissionResult.record_id}</strong> • Species: <strong style={{ textTransform: 'capitalize' }}>{submissionResult.species}</strong>
              </div>
            </div>

            {/* Critical Emergency Banner if Red */}
            {(submissionResult.urgency_code === 'RED' || submissionResult.urgency_category === 'CRITICAL') && (
              <div style={{
                background: 'var(--color-red-bg)',
                border: '1px solid var(--color-red-border)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span className="pulse-beacon-red" style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-red)', flexShrink: 0 }}></span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--banner-red-title)' }}>
                    CRITICAL EMERGENCY: Immediate Veterinary Officer Intervention Required
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--banner-red-sub)' }}>
                    High risk of rapid mortality without decompression or immediate hemodynamic stabilization.
                  </div>
                </div>
              </div>
            )}

            {/* Uncertainty Banner if Beta or Unsupported */}
            {submissionResult.is_uncertain && (
              <div style={{
                background: 'var(--color-yellow-bg)',
                border: '1px solid var(--color-yellow-border)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertTriangle size={18} color="var(--color-yellow)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--banner-yellow-title)' }}>
                    CLINICAL UNCERTAINTY STATE (Non-Guessing Safety Protocol)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--banner-yellow-sub)' }}>
                    Algorithmic safety rules recommend direct in-person evaluation by a qualified Veterinary Practitioner rather than automated scoring.
                  </div>
                </div>
              </div>
            )}

            {/* Clinical Classification & Reasons */}
            <div style={{
              background: 'var(--bg-surface-elevated)',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {submissionResult.classification}
              </div>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {submissionResult.reasons && submissionResult.reasons.map((r, i) => (
                  <li key={i} style={{ marginBottom: '0.2rem' }}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Immediate Stabilization Actions (NO DRUGS) */}
            {submissionResult.critical_actions && submissionResult.critical_actions.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-green)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Immediate Stabilization Actions (Non-Pharmacological):
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {submissionResult.critical_actions.map((act, i) => (
                    <div key={i} style={{
                      background: 'var(--color-green-bg)',
                      border: '1px solid var(--color-green-border)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.76rem',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <CheckCircle2 size={14} color="var(--color-green)" style={{ flexShrink: 0 }} />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostic Blind Spots / Missing Info */}
            {submissionResult.missing_info && submissionResult.missing_info.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fde68a', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Diagnostic Blind Spots & Clinical Gaps:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {submissionResult.missing_info.map((gap, i) => (
                    <div key={i} style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '6px',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <strong style={{ color: '#fde68a' }}>{gap.title}:</strong> {gap.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regulatory Disclaimer */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '0.6rem 0.85rem',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              lineHeight: '1.4'
            }}>
              <strong>Regulatory Notice:</strong> {submissionResult.disclaimer}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <a
                href={`/api/veterinary/queue/${submissionResult.record_id}/referral/pdf`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', textDecoration: 'none', background: 'linear-gradient(135deg, #059669, #10b981)' }}
              >
                <FileDown size={14} />
                Download DAH&VS Referral PDF
              </a>

              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                onClick={handleClearForm}
              >
                Intake Another Animal
              </button>
            </div>
          </div>
        ) : (
          /* Empty / Default Guidance Panel */
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <Stethoscope size={24} color="#10b981" />
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Awaiting Veterinary Case Intake
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Fill out the intake console on the left or select a pre-calibrated benchmark vector (VET-01..04) to evaluate species-specific triage safety rules.
            </p>

            <div style={{
              background: 'var(--bg-surface-elevated)',
              borderRadius: '8px',
              padding: '0.85rem',
              textAlign: 'left',
              fontSize: '0.72rem',
              border: '1px solid var(--border-subtle)',
              lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: '700', color: 'var(--color-green)', marginBottom: '0.35rem' }}>
                🛡️ Operational Guardrails Enforced:
              </div>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-muted)' }}>
                <li>Zero automated drug prescriptions or dosage calculators.</li>
                <li>Human ESI scores are NEVER applied to animals.</li>
                <li>Unsupported and Beta species trigger transparent Uncertainty states.</li>
                <li>Generates official DAH&VS veterinary clinical transfer PDFs.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
