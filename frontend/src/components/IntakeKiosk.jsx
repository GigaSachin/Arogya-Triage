import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Upload, FileText, CheckCircle2, 
  AlertTriangle, ShieldCheck, Heart, User, MapPin, 
  Sparkles, ArrowRight, Eye, RefreshCw, Volume2, Key, X 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function IntakeKiosk({ 
  onIntakeSuccess, 
  scenarioData, 
  onClearScenario 
}) {
  const { t, language } = useLanguage();

  // Facility & Patient Demographics
  const [facilityId, setFacilityId] = useState('FAC-ROU-01');
  const [patientName, setPatientName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [phone, setPhone] = useState('');
  const [consentGiven, setConsentGiven] = useState(true);

  // Vernacular Voice State (auto-sync with global language)
  const [vernacularLang, setVernacularLang] = useState(language === 'hi' ? 'hindi' : (language === 'or' ? 'odia' : 'english'));

  useEffect(() => {
    if (language === 'or') setVernacularLang('odia');
    else if (language === 'hi') setVernacularLang('hindi');
    else if (language === 'en') setVernacularLang('english');
  }, [language]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [transcribeNotice, setTranscribeNotice] = useState(null);
  const [sarvamApiKey, setSarvamApiKey] = useState(() => localStorage.getItem('sarvam_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [sarvamStatus, setSarvamStatus] = useState(null);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestReport, setKeyTestReport] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioFileInputRef = useRef(null);

  const [symptomsRaw, setSymptomsRaw] = useState('');
  const [translatedEnglish, setTranslatedEnglish] = useState('');
  const [extractedSymptoms, setExtractedSymptoms] = useState([]);
  const [symptomTimeline, setSymptomTimeline] = useState([]);

  // Lab Slip & Multimodal OCR State
  const [labFile, setLabFile] = useState(null);
  const [labImagePreview, setLabImagePreview] = useState(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [labParameters, setLabParameters] = useState({});
  const [tabularItems, setTabularItems] = useState([]);

  // Vitals State
  const [vitals, setVitals] = useState({
    spo2: '',
    pulse: '',
    systolic_bp: '',
    diastolic_bp: '',
    temperature: '',
    respiration_rate: ''
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const fileInputRef = useRef(null);

  // Sync Sarvam Voice pipeline configuration from backend
  const fetchVoiceStatus = async () => {
    try {
      const res = await fetch('/api/voice/status');
      if (res.ok) {
        const data = await res.json();
        setSarvamStatus(data);
      }
    } catch (e) {
      console.warn('Failed to fetch voice status:', e);
    }
  };

  useEffect(() => {
    fetchVoiceStatus();
  }, []);

  // Load preset scenario when triggered from Navbar or parent
  useEffect(() => {
    if (scenarioData) {
      if (scenarioData.id === 'TC-01') {
        setVernacularLang('odia');
        setPatientName('Sanjib Munda');
        setAadhaar('9821 4452 1092');
        setPhone('9876543210');
        setSymptomsRaw('ଅତ୍ୟଧିକ ଜ୍ୱର, ମୁଣ୍ଡ ଘୂରାଉଛି, ମାଢ଼ିରୁ ରକ୍ତ ପଡୁଛି (Severe fever, confusion, gum bleeding)');
        setTranslatedEnglish('Severe fever, confusion, and spontaneous gum bleeding since 3 days.');
        setExtractedSymptoms(['Severe high-grade fever', 'Acute confusion / altered sensorium', 'Gum bleeding']);
        setSymptomTimeline(['Day 1: Acute fever with rigors', 'Day 2: Worsening lethargy', 'Day 3: Disorientation and spontaneous gum bleeding']);
        setVitals({
          spo2: '89',
          pulse: '128',
          systolic_bp: '88',
          diastolic_bp: '58',
          temperature: '103.4',
          respiration_rate: '26'
        });
        setLabParameters({ platelets: 16000, hemoglobin: 11.4, wbc: 14200, dengue_ns1: 'POSITIVE' });
        setTabularItems([
          { parameter: 'Platelets Count', value: 16000, raw_text: 'Platelet Count: 16,000 /uL [CRITICAL]' },
          { parameter: 'Haemoglobin (Hb)', value: 11.4, raw_text: 'Hb: 11.4 g/dL' },
          { parameter: 'Total WBC', value: 14200, raw_text: 'WBC: 14,200 /uL [HIGH]' },
          { parameter: 'Dengue NS1', value: 'POSITIVE', raw_text: 'Dengue NS1 Ag: POSITIVE' }
        ]);
        setLabImagePreview('/api/lab/image/tc01');
      } else if (scenarioData.id === 'TC-02') {
        setVernacularLang('hindi');
        setPatientName('Sunita Devi');
        setAadhaar('8832 1109 3341');
        setPhone('9437112233');
        setSymptomsRaw('३ दिन से तेज़ बुखार, लगातार दस्त और उल्टी (3 days high fever, persistent diarrhea, vomiting)');
        setTranslatedEnglish('3 days of high-grade fever, persistent watery diarrhea, and repeated vomiting.');
        setExtractedSymptoms(['High-grade fever (3 days)', 'Persistent diarrhea', 'Frequent vomiting']);
        setSymptomTimeline(['Day 1: Sudden fever spike', 'Day 2: Watery diarrhea started', 'Day 3: Multiple episodes of vomiting']);
        setVitals({
          spo2: '97',
          pulse: '98',
          systolic_bp: '100',
          diastolic_bp: '65',
          temperature: '102.8',
          respiration_rate: '20'
        });
        setLabParameters({ platelets: 115000, hemoglobin: 13.1, wbc: 6400, dengue_ns1: 'POSITIVE' });
        setTabularItems([
          { parameter: 'Dengue NS1 Antigen', value: 'POSITIVE', raw_text: 'Dengue NS1: POSITIVE' },
          { parameter: 'Platelet Count', value: 115000, raw_text: 'Platelets: 115,000 /uL [LOW]' },
          { parameter: 'Haemoglobin', value: 13.1, raw_text: 'Hb: 13.1 g/dL' }
        ]);
        setLabImagePreview('/api/lab/image/tc02');
      } else if (scenarioData.id === 'TC-03') {
        setVernacularLang('english');
        setPatientName('Pradeep Rout');
        setAadhaar('6677 2211 9088');
        setPhone('7008123456');
        setSymptomsRaw('Superficial forearm abrasion dressing change; no fever.');
        setTranslatedEnglish('Superficial forearm abrasion dressing change; no fever.');
        setExtractedSymptoms(['Superficial forearm abrasion', 'Dressing change required', 'Afebrile']);
        setSymptomTimeline(['Yesterday: Domestic skid causing superficial abrasion', 'Today: Walk-in for routine wound dressing']);
        setVitals({
          spo2: '99',
          pulse: '74',
          systolic_bp: '118',
          diastolic_bp: '78',
          temperature: '98.4',
          respiration_rate: '16'
        });
        setLabParameters({ fasting_blood_sugar: 92, platelets: 280000, hemoglobin: 14.2 });
        setTabularItems([
          { parameter: 'Fasting Blood Sugar', value: 92, raw_text: 'FBS: 92 mg/dL' },
          { parameter: 'Platelets Count', value: 280000, raw_text: 'Platelets: 280,000 /uL' }
        ]);
        setLabImagePreview('/api/lab/image/tc03');
      }
    }
  }, [scenarioData]);

  // Real Vernacular Audio Recording using MediaRecorder & Sarvam AI STT
  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not available in this browser context. Please use the audio file upload or vernacular presets.');
        return;
      }
      setTranscribeNotice(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 200) {
          await sendAudioToTranscribe(audioBlob, mimeType);
        } else {
          setTranscribeNotice({
            type: 'warning',
            message: 'Recording was very short. Click the mic to speak again or use sample presets.'
          });
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      // Interval counter
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Browser live speech recognition (Chromium / Edge / Safari Web Speech API)
      try {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = vernacularLang === 'odia' ? 'or-IN' : (vernacularLang === 'hindi' ? 'hi-IN' : 'en-IN');
          rec.onresult = (evt) => {
            let streamWords = '';
            for (let i = 0; i < evt.results.length; ++i) {
              streamWords += evt.results[i][0].transcript + ' ';
            }
            if (streamWords.trim()) {
              setSymptomsRaw(streamWords.trim());
              setTranslatedEnglish(streamWords.trim());
            }
          };
          rec.onerror = (e) => {
            console.warn('Speech recognition interim notice:', e);
          };
          rec.start();
          recognitionRef.current = rec;
        }
      } catch (speechErr) {
        console.warn('SpeechRecognition unavailable in this context:', speechErr);
      }
    } catch (err) {
      console.error('Microphone recording error:', err);
      alert(`Could not access microphone: ${err.message || 'Permission denied'}.\nYou can also type symptoms directly into the box.`);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);

    // Auto-populate extracted symptoms from live spoken text if available
    if (symptomsRaw && symptomsRaw.trim()) {
      const tokens = symptomsRaw.split(/[,;\.\n]+/).map(s => s.trim()).filter(Boolean);
      setExtractedSymptoms(tokens.slice(0, 5));
      setSymptomTimeline([`Reported onset: ${symptomsRaw.trim()}`]);
      if (!translatedEnglish) {
        setTranslatedEnglish(symptomsRaw.trim());
      }
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  // Submit audio blob to Sarvam AI STT Endpoint (Optional Enhancement, Never overwrites user's spoken text on failure)
  const sendAudioToTranscribe = async (audioBlobOrFile, mimeType) => {
    if (!sarvamApiKey && !(sarvamStatus && sarvamStatus.sarvam_configured)) {
      // No external key needed; user's direct speech is already in symptomsRaw
      return;
    }

    setIsTranscribingAudio(true);
    const formData = new FormData();
    const ext = (mimeType && mimeType.includes('webm')) ? 'webm' : ((mimeType && mimeType.includes('wav')) ? 'wav' : 'mp3');
    formData.append('file', audioBlobOrFile, `patient_voice_${Date.now()}.${ext}`);
    formData.append('language', vernacularLang);
    if (sarvamApiKey) {
      formData.append('api_key', sarvamApiKey);
    }

    try {
      const headers = {};
      if (sarvamApiKey) {
        headers['X-Sarvam-Key'] = sarvamApiKey;
      }
      const res = await fetch('/api/voice/transcribe-audio', {
        method: 'POST',
        headers: headers,
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.transcription) {
        setSymptomsRaw(data.transcription);
        if (data.translated_english) setTranslatedEnglish(data.translated_english);
        if (data.extracted_symptoms) setExtractedSymptoms(data.extracted_symptoms);
        if (data.timeline) setSymptomTimeline(data.timeline);
      }
    } catch (err) {
      console.warn('Backend audio enhancement skipped, preserving spoken input:', err);
      // NEVER override user's live transcribed text with presets!
    } finally {
      setIsTranscribingAudio(false);
    }
  };

  const handleAudioFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    sendAudioToTranscribe(file, file.type || 'audio/wav');
  };

  const handleSaveApiKey = async (keyToSave) => {
    const trimmed = (keyToSave || '').trim();
    localStorage.setItem('sarvam_api_key', trimmed);
    setSarvamApiKey(trimmed);

    try {
      await fetch('/api/voice/configure-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: trimmed })
      });
      await fetchVoiceStatus();
    } catch (e) {
      console.warn('Failed to sync key to backend:', e);
    }
    setIsKeyModalOpen(false);
  };

  const handleClearApiKey = async () => {
    localStorage.removeItem('sarvam_api_key');
    setSarvamApiKey('');
    setTempApiKey('');
    try {
      await fetch('/api/voice/configure-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: '' })
      });
      await fetchVoiceStatus();
    } catch (e) {}
    setIsKeyModalOpen(false);
  };

  const handleTestApiKey = async (keyToTest) => {
    setIsTestingKey(true);
    setKeyTestReport(null);
    try {
      const active = (keyToTest || sarvamApiKey || '').trim();
      const res = await fetch('/api/voice/test-sarvam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: active || undefined })
      });
      const data = await res.json();
      setKeyTestReport(data);
    } catch (err) {
      setKeyTestReport({ valid: false, error: err.message });
    } finally {
      setIsTestingKey(false);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectVoicePreset = async (presetId) => {
    try {
      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_preset: presetId })
      });
      const data = await res.json();
      setSymptomsRaw(data.transcription || data.vernacular_script);
      setTranslatedEnglish(data.translated_english);
      setExtractedSymptoms(data.extracted_symptoms || []);
      setSymptomTimeline(data.timeline || []);
    } catch (err) {
      console.error('Error fetching voice preset:', err);
    }
  };

  // Lab image upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLabFile(file);
    setIsProcessingOCR(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/ocr/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setLabParameters(data.parameters || {});
      setTabularItems(data.tabular_items || []);
      setLabImagePreview(data.image_url);
    } catch (err) {
      console.error('OCR processing error:', err);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleSelectSyntheticSlip = (tcId) => {
    if (tcId === 'TC-01') {
      setLabImagePreview('/api/lab/image/tc01');
      setLabParameters({ platelets: 16000, hemoglobin: 11.4, wbc: 14200, dengue_ns1: 'POSITIVE' });
      setTabularItems([
        { parameter: 'Platelets Count', value: 16000, raw_text: 'Platelet Count: 16,000 /uL [CRITICAL]' },
        { parameter: 'Haemoglobin (Hb)', value: 11.4, raw_text: 'Hb: 11.4 g/dL' },
        { parameter: 'Total WBC', value: 14200, raw_text: 'WBC: 14,200 /uL [HIGH]' }
      ]);
    } else if (tcId === 'TC-02') {
      setLabImagePreview('/api/lab/image/tc02');
      setLabParameters({ platelets: 115000, hemoglobin: 13.1, wbc: 6400, dengue_ns1: 'POSITIVE' });
      setTabularItems([
        { parameter: 'Dengue NS1 Antigen', value: 'POSITIVE', raw_text: 'Dengue NS1: POSITIVE' },
        { parameter: 'Platelet Count', value: 115000, raw_text: 'Platelets: 115,000 /uL [LOW]' }
      ]);
    } else {
      setLabImagePreview('/api/lab/image/tc03');
      setLabParameters({ fasting_blood_sugar: 92, platelets: 280000, hemoglobin: 14.2 });
      setTabularItems([
        { parameter: 'Fasting Blood Sugar', value: 92, raw_text: 'FBS: 92 mg/dL' },
        { parameter: 'Platelet Count', value: 280000, raw_text: 'Platelets: 280,000 /uL' }
      ]);
    }
  };

  // Submit triage intake
  const handleSubmitIntake = async (e) => {
    e.preventDefault();
    if (!symptomsRaw.trim()) {
      alert('Please enter or record patient symptoms.');
      return;
    }
    if (!consentGiven) {
      alert('Patient consent is required per clinical protocol.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: patientName,
        aadhaar: aadhaar,
        phone: phone,
        facility_id: facilityId,
        vernacular_language: vernacularLang,
        symptoms_raw: symptomsRaw,
        vitals: {
          spo2: vitals.spo2 ? parseFloat(vitals.spo2) : null,
          pulse: vitals.pulse ? parseFloat(vitals.pulse) : null,
          systolic_bp: vitals.systolic_bp ? parseFloat(vitals.systolic_bp) : null,
          diastolic_bp: vitals.diastolic_bp ? parseFloat(vitals.diastolic_bp) : null,
          temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
          respiration_rate: vitals.respiration_rate ? parseFloat(vitals.respiration_rate) : null
        },
        labs: labParameters,
        lab_image_path: labImagePreview
      };

      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setSubmissionResult(data);
      if (onIntakeSuccess) {
        onIntakeSuccess(data);
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to submit triage intake.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setPatientName('');
    setAadhaar('');
    setPhone('');
    setSymptomsRaw('');
    setTranslatedEnglish('');
    setExtractedSymptoms([]);
    setSymptomTimeline([]);
    setLabParameters({});
    setTabularItems([]);
    setLabImagePreview(null);
    setVitals({ spo2: '', pulse: '', systolic_bp: '', diastolic_bp: '', temperature: '', respiration_rate: '' });
    setSubmissionResult(null);
    if (onClearScenario) onClearScenario();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
      {/* Left Column: Multimodal Intake Console */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Card 1: Facility & Frontline Consent Header */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="#38bdf8" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{t('kiosk.demographics_title', 'Triage Intake Node & Demographics')}</h2>
              <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Live Human Operator Mode</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#86efac', fontSize: '0.75rem', fontWeight: '600' }}>
              <ShieldCheck size={16} />
              <span>In-Flight PII Masking Active</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Healthcare Facility / Center
              </label>
              <select 
                className="form-select" 
                value={facilityId} 
                onChange={(e) => setFacilityId(e.target.value)}
              >
                <option value="FAC-ROU-01">Community Health Center (CHC) Panposh, Rourkela</option>
                <option value="FAC-ROU-02">Ispat General Hospital (IGH) Casualty, Rourkela</option>
                <option value="FAC-BBSR-01">Primary Health Center (PHC) Chandrasekharpur</option>
                <option value="FAC-BBSR-02">Capital Hospital Emergency Wing, Bhubaneswar</option>
                <option value="FAC-CTC-01">SCB Medical College & Hospital Triage, Cuttack</option>
                <option value="FAC-CAMP-01">BPUT Campus Health & Wellness Center</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                {t('kiosk.name_label', 'Patient Legal Name (Masked for Public Surveillance)')}
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Sanjib Munda" 
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                {t('kiosk.aadhaar_label', '12-Digit Aadhaar (Masked to XXXX)')}
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 9821 4452 1092" 
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                {t('kiosk.mobile_label', '10-Digit Mobile Phone')}
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 9876543210" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div style={{ paddingTop: '1.2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <input 
                  type="checkbox" 
                  checked={consentGiven} 
                  onChange={(e) => setConsentGiven(e.target.checked)} 
                  style={{ accentColor: '#3b82f6', width: '15px', height: '15px' }}
                />
                <span>Informed triage consent affirmed</span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: Vernacular Voice Recorder & Transcription Review Box (PRD FR-1.1 & FR-1.4) */}
        <div className="glass-card">
          <input 
            type="file" 
            ref={audioFileInputRef} 
            accept="audio/*" 
            style={{ display: 'none' }} 
            onChange={handleAudioFileUpload} 
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 size={18} color="#3b82f6" />
              <h2 style={{ fontSize: '1rem', fontWeight: '700' }}>{t('kiosk.voice_title', 'Voice & Chief Complaints')}</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Language Selector */}
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-surface-elevated)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <button 
                  type="button"
                  onClick={() => setVernacularLang('odia')}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '6px',
                    border: 'none',
                    background: vernacularLang === 'odia' ? 'var(--color-blue)' : 'transparent',
                    color: vernacularLang === 'odia' ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  ଓଡ଼ିଆ (Odia)
                </button>
                <button 
                  type="button"
                  onClick={() => setVernacularLang('hindi')}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '6px',
                    border: 'none',
                    background: vernacularLang === 'hindi' ? 'var(--color-blue)' : 'transparent',
                    color: vernacularLang === 'hindi' ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  हिन्दी (Hindi)
                </button>
                <button 
                  type="button"
                  onClick={() => setVernacularLang('english')}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '6px',
                    border: 'none',
                    background: vernacularLang === 'english' ? 'var(--color-blue)' : 'transparent',
                    color: vernacularLang === 'english' ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {/* Voice Recording Interactive Bar */}
          <div style={{
            background: isRecording ? 'var(--color-red-bg)' : 'var(--bg-surface-elevated)',
            border: isRecording ? '1px solid var(--color-red-border)' : '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
            transition: 'all 0.2s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                type="button" 
                className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                style={{ width: '46px', height: '46px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={handleToggleRecord}
                title={isRecording ? 'Stop Recording' : 'Start Speaking'}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: isRecording ? 'var(--color-red)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {isRecording ? (
                    <>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }}></span>
                      <span>{t('kiosk.voice_btn_stop', 'Listening... keep speaking, text types below')} ({formatTimer(recordingSeconds)})</span>
                    </>
                  ) : (
                    <span>{t('kiosk.voice_btn_start', 'Click mic to speak symptoms — speech directly types below')}</span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {t('kiosk.voice_sub', 'Supports spoken Hindi, Odia, or English with live realtime transcription')}
                </div>
              </div>
            </div>

            {/* Soundwave animation or action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isRecording ? (
                <div style={{ display: 'flex', alignItems: 'center', height: '28px' }}>
                  <span className="wave-bar" style={{ animationDelay: '0.1s' }}></span>
                  <span className="wave-bar" style={{ animationDelay: '0.3s' }}></span>
                  <span className="wave-bar" style={{ animationDelay: '0.2s' }}></span>
                  <span className="wave-bar" style={{ animationDelay: '0.5s' }}></span>
                  <span className="wave-bar" style={{ animationDelay: '0.15s' }}></span>
                  <span className="wave-bar" style={{ animationDelay: '0.4s' }}></span>
                  <span className="wave-bar" style={{ animationDelay: '0.25s' }}></span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={() => audioFileInputRef.current && audioFileInputRef.current.click()}
                    title="Upload recorded audio note from patient (.wav, .mp3, .m4a, .webm)"
                  >
                    <Upload size={12} /> {t('kiosk.voice_upload', 'Upload Audio File')}
                  </button>
                  {symptomsRaw && (
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                      onClick={() => {
                        setSymptomsRaw('');
                        setTranslatedEnglish('');
                        setExtractedSymptoms([]);
                        setSymptomTimeline([]);
                      }}
                      title="Clear spoken text"
                    >
                      {t('kiosk.voice_clear', 'Clear Spoken Text')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Client-Side Review Box */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {t('kiosk.review_box', 'Client-Side Review Box (Transcribed Vernacular Text - Editable)')}
              </label>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>
                Health worker manual verification enabled
              </span>
            </div>
            <textarea 
              className="form-textarea" 
              rows={3}
              value={symptomsRaw}
              onChange={(e) => setSymptomsRaw(e.target.value)}
              placeholder="Captured patient voice transcription will appear here. You can manually adjust or type symptoms..."
            />
          </div>

          {/* Clinical English Normalization & Extracted Symptoms Chips */}
          {translatedEnglish && (
            <div style={{ background: 'var(--color-blue-bg)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-blue-border)', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-blue)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                {t('kiosk.normalized_translation', 'Normalized Clinical Translation:')}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {translatedEnglish}
              </div>
              {extractedSymptoms.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {extractedSymptoms.map((sym, idx) => (
                    <span key={idx} className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                      {sym}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chronological Symptom Timeline */}
          {symptomTimeline.length > 0 && (
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px dashed var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.3rem' }}>
                Chronological Symptom Progression:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.78rem' }}>
                {symptomTimeline.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }}></span>
                    <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Multimodal Lab Slip Drag-and-Drop Ingestion (PRD FR-1.2 & FR-1.3) */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#06b6d4" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{t('kiosk.ocr_title', 'Multimodal Lab Slip Ingestion & OCR')}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                Tabular OCR Parser Ready
              </span>
              {labImagePreview && (
                <button 
                  type="button"
                  className="btn btn-outline" 
                  style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                  onClick={() => {
                    setLabImagePreview(null);
                    setLabParameters({});
                    setTabularItems([]);
                    setLabFile(null);
                  }}
                  title="Remove uploaded lab slip"
                >
                  Clear Slip
                </button>
              )}
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/png, image/jpeg, application/pdf" 
            style={{ display: 'none' }} 
          />

          <div 
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: '10px',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--bg-surface-elevated)',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <Upload size={28} color="#64748b" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {t('kiosk.ocr_dropzone', 'Drag & drop physical lab report or click to browse')}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {t('kiosk.ocr_hint', 'Supports PNG, JPEG, PDF up to 5MB • Tabular parameter parser with ICMR thresholds')}
            </div>
          </div>

          {/* OCR Processing Indicator */}
          {isProcessingOCR && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', color: '#2563eb', fontSize: '0.85rem' }}>
              <RefreshCw size={16} className="pulse-beacon-yellow" />
              <span>{t('kiosk.ocr_scanning', 'Scanning report slip, isolating tabular entries & verifying units...')}</span>
            </div>
          )}

          {/* Tabular Parameters Extracted Preview */}
          {tabularItems.length > 0 && (
            <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2563eb', marginBottom: '0.35rem' }}>
                OCR Tabular Extraction Findings:
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.4rem' }}>Investigation</th>
                    <th style={{ padding: '0.4rem' }}>Value</th>
                    <th style={{ padding: '0.4rem' }}>Clinical Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tabularItems.map((item, idx) => {
                    const isCrit = item.parameter.toLowerCase().includes('platelet') && Number(item.value) < 20000;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.4rem', fontWeight: '500', color: 'var(--text-primary)' }}>{item.parameter}</td>
                        <td style={{ padding: '0.4rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: isCrit ? '#dc2626' : 'var(--text-primary)' }}>
                          {item.value}
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          {isCrit ? (
                            <span className="badge badge-red" style={{ fontSize: '0.68rem' }}>
                              CRITICAL THROMBOCYTOPENIA
                            </span>
                          ) : (
                            <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
                              EXTRACTED OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Physiological Vitals & Submission Console */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Vitals Capture Matrix */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Heart size={18} color="#ef4444" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{t('kiosk.vitals_title', 'Physiological Vitals Ingestion')}</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* SpO2 */}
            <div style={{
              background: vitals.spo2 && parseFloat(vitals.spo2) < 90 ? 'var(--color-red-bg)' : 'var(--bg-surface-elevated)',
              border: vitals.spo2 && parseFloat(vitals.spo2) < 90 ? '1px solid var(--color-red-border)' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <span>{t('kiosk.spo2_label', 'SpO2 (Pulse Oximetry)')}</span>
                <span>%</span>
              </div>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 89" 
                value={vitals.spo2}
                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}
              />
              <span style={{ fontSize: '0.68rem', color: vitals.spo2 && parseFloat(vitals.spo2) < 90 ? 'var(--color-red)' : 'var(--text-muted)' }}>
                Danger Zone: &lt; 90% (Hypoxemia)
              </span>
            </div>

            {/* Pulse */}
            <div style={{
              background: vitals.pulse && parseFloat(vitals.pulse) >= 120 ? 'var(--color-red-bg)' : 'var(--bg-surface-elevated)',
              border: vitals.pulse && parseFloat(vitals.pulse) >= 120 ? '1px solid var(--color-red-border)' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <span>{t('kiosk.pulse_label', 'Pulse / Heart Rate')}</span>
                <span>bpm</span>
              </div>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 128" 
                value={vitals.pulse}
                onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}
              />
              <span style={{ fontSize: '0.68rem', color: vitals.pulse && parseFloat(vitals.pulse) >= 120 ? 'var(--color-red)' : 'var(--text-muted)' }}>
                Danger Zone: &gt;= 120 bpm (Tachycardia)
              </span>
            </div>

            {/* Blood Pressure Systolic */}
            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <span>{t('kiosk.bp_systolic', 'Systolic BP')}</span>
                <span>mmHg</span>
              </div>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 88" 
                value={vitals.systolic_bp}
                onChange={(e) => setVitals({ ...vitals, systolic_bp: e.target.value })}
                style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Shock Warning: &lt; 90 mmHg
              </span>
            </div>

            {/* Blood Pressure Diastolic */}
            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <span>{t('kiosk.bp_diastolic', 'Diastolic BP')}</span>
                <span>mmHg</span>
              </div>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 58" 
                value={vitals.diastolic_bp}
                onChange={(e) => setVitals({ ...vitals, diastolic_bp: e.target.value })}
                style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Normal: 60 - 80 mmHg
              </span>
            </div>

            {/* Temperature */}
            <div style={{
              background: vitals.temperature && parseFloat(vitals.temperature) >= 101.5 ? 'var(--color-yellow-bg)' : 'var(--bg-surface-elevated)',
              border: vitals.temperature && parseFloat(vitals.temperature) >= 101.5 ? '1px solid var(--color-yellow-border)' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <span>{t('kiosk.temp_label', 'Core Temperature')}</span>
                <span>°F</span>
              </div>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                placeholder="e.g. 103.4" 
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}
              />
              <span style={{ fontSize: '0.68rem', color: vitals.temperature && parseFloat(vitals.temperature) >= 101.5 ? 'var(--color-yellow)' : 'var(--text-muted)' }}>
                Febrile: &gt;= 101.5°F
              </span>
            </div>

            {/* Respiration Rate */}
            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <span>{t('kiosk.resp_label', 'Respiration Rate')}</span>
                <span>/min</span>
              </div>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 26" 
                value={vitals.respiration_rate}
                onChange={(e) => setVitals({ ...vitals, respiration_rate: e.target.value })}
                style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Tachypnea: &gt;= 24 /min
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ flex: '1' }}
              onClick={handleClearForm}
            >
              {t('kiosk.clear_btn', 'Clear Form')}
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ flex: '2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={handleSubmitIntake}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="pulse-beacon-yellow" />
                  {t('kiosk.submitting_btn', 'Calculating MCP Triage...')}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {t('kiosk.submit_btn', 'Submit to Priority Queue')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Submission Confirmation & Quick Queue Launcher */}
        {submissionResult && (
          <div className="glass-card" style={{
            border: submissionResult.urgency_code === 'RED' ? '1px solid #ef4444' : (submissionResult.urgency_code === 'YELLOW' ? '1px solid #f59e0b' : '1px solid #10b981'),
            background: submissionResult.urgency_code === 'RED' ? 'rgba(239, 68, 68, 0.1)' : (submissionResult.urgency_code === 'YELLOW' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)')
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle2 size={18} color={submissionResult.urgency_code === 'RED' ? '#ef4444' : '#10b981'} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Triage Record Registered</h3>
            </div>
            
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Record ID: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{submissionResult.record_id}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.85rem' }}>Assigned Clinical Priority:</span>
              <span className={`badge ${submissionResult.urgency_code === 'RED' ? 'badge-red' : (submissionResult.urgency_code === 'YELLOW' ? 'badge-yellow' : 'badge-green')}`} style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
                ESI LEVEL {submissionResult.esi_level} ({submissionResult.urgency_code})
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
              Anonymized event streamed to Google BigQuery surveillance table. PII redacting applied to patient identifiers.
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', fontSize: '0.8rem' }}
              onClick={() => onIntakeSuccess && onIntakeSuccess(submissionResult)}
            >
              Open in Doctor Review Queue <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Paper Lab Slip Image Thumbnail Preview */}
        {labImagePreview && (
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Ingested Physical Lab Slip Preview
              </span>
              <a 
                href={labImagePreview} 
                target="_blank" 
                rel="noreferrer" 
                style={{ fontSize: '0.72rem', color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Eye size={12} /> View Fullslip
              </a>
            </div>
            <img 
              src={labImagePreview} 
              alt="Lab Report Slip" 
              style={{
                width: '100%',
                maxHeight: '220px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)'
              }}
            />
          </div>
        )}
      </div>

      {/* Sarvam AI Speech-to-Text API Key Configuration Modal */}
      {isKeyModalOpen && (
        <div className="modal-overlay" onClick={() => setIsKeyModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.5rem', borderRadius: '10px' }}>
                  <Key size={20} color="#38bdf8" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Sarvam AI Indic Speech & Language API</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    STT (`saaras:v3`) • Translation (`od/hi/en`) • TTS (`bulbul:v3`)
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsKeyModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
              Paste your Sarvam AI Subscription Key to activate real-time speech recognition in 
              <strong style={{ color: 'var(--text-primary)' }}> Odia (od-IN)</strong>, <strong style={{ color: 'var(--text-primary)' }}>Hindi (hi-IN)</strong>, and <strong style={{ color: 'var(--text-primary)' }}>English (en-IN)</strong>, with automated translation & voice feedback.
            </p>

            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span style={{ color: (sarvamApiKey || (sarvamStatus && sarvamStatus.sarvam_configured)) ? 'var(--color-green)' : 'var(--color-yellow)', fontWeight: '600' }}>
                  {(sarvamApiKey || (sarvamStatus && sarvamStatus.sarvam_configured)) ? '✓ Key Configured & Active' : '⚠ Demo Fallback Active'}
                </span>
              </div>
              {sarvamStatus?.api_key_masked && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Active Key: {sarvamStatus.api_key_masked}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>
                Sarvam API Subscription Key (`api-subscription-key`)
              </label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter your Sarvam AI Subscription Key..." 
                value={tempApiKey !== '' ? tempApiKey : sarvamApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                Get your key from dashboard.sarvam.ai. Key is saved locally in your browser and synced with the backend engine.
              </span>
            </div>

            {/* Test Connection Diagnostic Box */}
            {keyTestReport && (
              <div style={{ 
                background: keyTestReport.valid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${keyTestReport.valid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
                fontSize: '0.76rem'
              }}>
                <div style={{ fontWeight: '600', color: keyTestReport.valid ? '#10b981' : '#ef4444', marginBottom: '0.3rem' }}>
                  {keyTestReport.valid ? '✓ Sarvam AI Connection Verified & Ready' : '✕ Connection Error'}
                </div>
                {keyTestReport.services && (
                  <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div>• <strong>Speech-to-Text:</strong> {keyTestReport.services.speech_to_text?.model} ({keyTestReport.services.speech_to_text?.status})</div>
                    <div>• <strong>Translation:</strong> {keyTestReport.services.translation?.status} ({keyTestReport.services.translation?.latency_ms}ms)</div>
                    <div>• <strong>Text-to-Speech:</strong> {keyTestReport.services.text_to_speech?.model} ({keyTestReport.services.text_to_speech?.status})</div>
                  </div>
                )}
                {keyTestReport.error && (
                  <div style={{ color: '#ef4444', marginTop: '0.2rem' }}>{keyTestReport.error}</div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                  onClick={() => handleTestApiKey(tempApiKey !== '' ? tempApiKey : sarvamApiKey)}
                  disabled={isTestingKey}
                >
                  {isTestingKey ? 'Testing...' : 'Test Connection'}
                </button>
                {sarvamApiKey && (
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                    onClick={handleClearApiKey}
                  >
                    Clear Key
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => setIsKeyModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => handleSaveApiKey(tempApiKey !== '' ? tempApiKey : sarvamApiKey)}
                >
                  Save & Activate Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
