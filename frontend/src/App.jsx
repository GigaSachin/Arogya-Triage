import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import LandingGateway from './components/LandingGateway';
import ECGMonitor from './components/ECGMonitor';
import IntakeKiosk from './components/IntakeKiosk';
import VeterinaryIntakeKiosk from './components/VeterinaryIntakeKiosk';
import DoctorReviewDashboard from './components/DoctorReviewDashboard';
import VeterinaryReviewDashboard from './components/VeterinaryReviewDashboard';
import SurveillanceDashboard from './components/SurveillanceDashboard';
import MCPGovernanceView from './components/MCPGovernanceView';
import LoginPage from './components/LoginPage';
import PatientPortal from './components/PatientPortal';
import { ESIOverrideModal, VeterinaryOverrideModal, FHIRViewerModal, LabImageModal } from './components/Modals';

export default function App() {
  // Theme state: default to crisp modern Clinical Light mode
  const [theme, setTheme] = useState(() => localStorage.getItem('arogya_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('arogya_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Starts directly on Landing Gateway for immediate dual-pathway wow factor
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('gateway');

  const [queue, setQueue] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedVetRecord, setSelectedVetRecord] = useState(null);
  const [scenarioData, setScenarioData] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Modals
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [recordToOverride, setRecordToOverride] = useState(null);

  const [isVetOverrideModalOpen, setIsVetOverrideModalOpen] = useState(false);
  const [recordToVetOverride, setRecordToVetOverride] = useState(null);

  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false);
  const [activeFhirBundle, setActiveFhirBundle] = useState(null);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [activeLabImageUrl, setActiveLabImageUrl] = useState(null);

  // Handle Login & Auto Route
  const handleLogin = (user) => {
    setCurrentUser(user);

    if (user.role === 'doctor') {
      setCurrentTab('doctor');
    } else if (user.role === 'anm_gnm') {
      setCurrentTab('kiosk');
    } else if (user.role === 'vet_officer') {
      setCurrentTab('vet_dashboard');
    } else if (user.role === 'paravet') {
      setCurrentTab('vet_kiosk');
    } else if (user.role === 'patient') {
      setCurrentTab('patient');
    } else {
      setCurrentTab('gateway');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab('gateway');
  };

  // Fetch live queue from backend
  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/queue');
      const data = await res.json();
      const records = data.records || [];
      setQueue(records);

      // Select default records for both domains
      const humanRecords = records.filter(r => r.domain === 'human' || !r.domain);
      const vetRecords = records.filter(r => r.domain === 'veterinary' || r.species);

      if (!selectedRecord && humanRecords.length > 0) {
        setSelectedRecord(humanRecords[0]);
      } else if (selectedRecord) {
        const updated = records.find(r => r.id === selectedRecord.id);
        if (updated) setSelectedRecord(updated);
      }

      if (!selectedVetRecord && vetRecords.length > 0) {
        setSelectedVetRecord(vetRecords[0]);
      } else if (selectedVetRecord) {
        const updatedVet = records.find(r => r.id === selectedVetRecord.id);
        if (updatedVet) setSelectedVetRecord(updatedVet);
      }
    } catch (err) {
      console.error('Error fetching triage queue:', err);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3500);
    return () => clearInterval(interval);
  }, []);

  // Quick scenario triggers
  const handleLoadScenario = (tcId) => {
    setScenarioData({ id: tcId });
    if (tcId.startsWith('VET')) {
      setCurrentTab('vet_kiosk');
    } else {
      setCurrentTab('kiosk');
    }
  };

  // Clear Queue / Fresh Human Session
  const handleResetEngine = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/queue/clear', { method: 'POST' });
      await fetchQueue();
      setScenarioData(null);
    } catch (err) {
      console.error('Clear queue error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Human Doctor approval
  const handleApprove = async (recordId) => {
    setIsActionLoading(true);
    const doctorName = currentUser?.name || "Dr. S. Mohanty";
    try {
      const res = await fetch(`/api/queue/${recordId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_name: doctorName })
      });
      if (res.ok) {
        await fetchQueue();
      }
    } catch (err) {
      console.error('Human approval error:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Veterinary Officer approval
  const handleVetApprove = async (recordId) => {
    setIsActionLoading(true);
    const vetName = currentUser?.name || "Dr. A. K. Nayak, Veterinary Officer";
    try {
      const res = await fetch(`/api/veterinary/queue/${recordId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_name: vetName })
      });
      if (res.ok) {
        await fetchQueue();
      }
    } catch (err) {
      console.error('Veterinary approval error:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Human Doctor override
  const handleSubmitOverride = async (recordId, newESI, reason, doctorName) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/queue/${recordId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_esi: newESI,
          justification_reason: reason,
          doctor_name: doctorName || currentUser?.name || "Dr. S. Mohanty"
        })
      });
      if (res.ok) {
        await fetchQueue();
      }
    } catch (err) {
      console.error('Human override error:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Veterinary Officer override
  const handleSubmitVetOverride = async (recordId, newUrgency, reason, reviewerName) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/veterinary/queue/${recordId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_urgency: newUrgency,
          justification_reason: reason,
          doctor_name: reviewerName || currentUser?.name || "Dr. A. K. Nayak"
        })
      });
      if (res.ok) {
        await fetchQueue();
      }
    } catch (err) {
      console.error('Veterinary override error:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenFhirModal = async (record) => {
    try {
      const res = await fetch(`/api/queue/${record.id}/fhir`);
      if (!res.ok) {
        alert("FHIR document is available for human patients only.");
        return;
      }
      const bundle = await res.json();
      setActiveFhirBundle(bundle);
      setIsFhirModalOpen(true);
    } catch (err) {
      console.error('Error fetching FHIR bundle:', err);
    }
  };

  const handleOpenLabModal = (imageUrl) => {
    setActiveLabImageUrl(imageUrl);
    setIsLabModalOpen(true);
  };

  const handleIntakeSuccess = (result) => {
    fetchQueue().then(() => {
      const found = queue.find(q => q.id === result.record_id);
      if (found) setSelectedRecord(found);
      setCurrentTab('doctor');
    });
  };

  const handleVetIntakeSuccess = (result) => {
    fetchQueue().then(() => {
      const found = queue.find(q => q.id === result.record_id);
      if (found) setSelectedVetRecord(found);
      setCurrentTab('vet_dashboard');
    });
  };

  const criticalRedCount = queue.filter(q => q.urgency_code === 'RED' && q.status === 'PENDING_REVIEW').length;
  const humanCount = queue.filter(q => q.domain === 'human' || !q.domain).length;
  const vetCount = queue.filter(q => q.domain === 'veterinary' || q.species).length;

  return (
    <div className="app-container">
      {/* Minimal Top Navbar */}
      <Navbar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onOpenLogin={() => setCurrentTab('login')}
        onLogout={handleLogout}
        onLoadScenario={handleLoadScenario}
        onResetEngine={handleResetEngine}
        activeQueueCount={queue.length}
        criticalRedCount={criticalRedCount}
        isResetting={isResetting}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSetTheme={setTheme}
      />

      {/* Main Views with Live Clinical ECG Telemetry Strip */}
      <main className="main-content">
        <ECGMonitor criticalRedCount={criticalRedCount} />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 12, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.995 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%' }}
          >
            {currentTab === 'gateway' && (
              <LandingGateway 
                onSelectPathway={(tab) => setCurrentTab(tab)}
                onLoadScenario={handleLoadScenario}
                onResetEngine={handleResetEngine}
                activeQueueCount={queue.length}
                criticalRedCount={criticalRedCount}
                isResetting={isResetting}
                humanCount={humanCount}
                vetCount={vetCount}
              />
            )}

            {currentTab === 'login' && (
              <LoginPage 
                onLogin={handleLogin}
              />
            )}

            {currentTab === 'kiosk' && (
              <IntakeKiosk 
                onIntakeSuccess={handleIntakeSuccess}
                scenarioData={scenarioData}
                onClearScenario={() => setScenarioData(null)}
              />
            )}

            {currentTab === 'vet_kiosk' && (
              <VeterinaryIntakeKiosk 
                onIntakeSuccess={handleVetIntakeSuccess}
                scenarioData={scenarioData}
                onClearScenario={() => setScenarioData(null)}
              />
            )}

            {currentTab === 'doctor' && (
              <DoctorReviewDashboard 
                queue={queue.filter(q => q.domain === 'human' || !q.domain)}
                selectedRecord={selectedRecord}
                onSelectRecord={(rec) => setSelectedRecord(rec)}
                onApprove={handleApprove}
                onOpenOverrideModal={(rec) => {
                  setRecordToOverride(rec);
                  setIsOverrideModalOpen(true);
                }}
                onOpenFhirModal={handleOpenFhirModal}
                onOpenLabImageModal={handleOpenLabModal}
                isActionLoading={isActionLoading}
              />
            )}

            {currentTab === 'vet_dashboard' && (
              <VeterinaryReviewDashboard 
                queue={queue.filter(q => q.domain === 'veterinary' || q.species)}
                selectedRecord={selectedVetRecord}
                onSelectRecord={(rec) => setSelectedVetRecord(rec)}
                onApprove={handleVetApprove}
                onOpenOverrideModal={(rec) => {
                  setRecordToVetOverride(rec);
                  setIsVetOverrideModalOpen(true);
                }}
                isActionLoading={isActionLoading}
              />
            )}

            {currentTab === 'patient' && (
              <PatientPortal 
                patientUser={currentUser}
                queue={queue}
                onOpenLabImageModal={handleOpenLabModal}
                onSwitchToKiosk={() => setCurrentTab('kiosk')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <ESIOverrideModal 
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        record={recordToOverride}
        onSubmitOverride={handleSubmitOverride}
      />

      <VeterinaryOverrideModal 
        isOpen={isVetOverrideModalOpen}
        onClose={() => setIsVetOverrideModalOpen(false)}
        record={recordToVetOverride}
        onSubmitOverride={handleSubmitVetOverride}
      />

      <FHIRViewerModal 
        isOpen={isFhirModalOpen}
        onClose={() => setIsFhirModalOpen(false)}
        fhirBundle={activeFhirBundle}
      />

      <LabImageModal 
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        imageUrl={activeLabImageUrl}
      />
    </div>
  );
}
