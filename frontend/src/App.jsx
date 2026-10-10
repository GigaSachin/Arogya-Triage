import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import IntakeKiosk from './components/IntakeKiosk';
import DoctorReviewDashboard from './components/DoctorReviewDashboard';
import SurveillanceDashboard from './components/SurveillanceDashboard';
import MCPGovernanceView from './components/MCPGovernanceView';
import LoginPage from './components/LoginPage';
import PatientPortal from './components/PatientPortal';
import { ESIOverrideModal, FHIRViewerModal, LabImageModal } from './components/Modals';

export default function App() {
  // Starts directly on Login Page
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('login');

  const [queue, setQueue] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [scenarioData, setScenarioData] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Modals
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [recordToOverride, setRecordToOverride] = useState(null);
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
    } else if (user.role === 'patient') {
      setCurrentTab('patient');
    } else {
      setCurrentTab('doctor');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab('login');
  };

  // Fetch live queue from backend
  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/queue');
      const data = await res.json();
      const records = data.records || [];
      setQueue(records);

      if (!selectedRecord && records.length > 0) {
        setSelectedRecord(records[0]);
      } else if (selectedRecord) {
        const updated = records.find(r => r.id === selectedRecord.id);
        if (updated) setSelectedRecord(updated);
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
    setCurrentTab('kiosk');
  };

  // Reset Engine
  const handleResetEngine = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/synthetic/load', { method: 'POST' });
      await fetchQueue();
      setScenarioData(null);
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Doctor approval
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
      console.error('Approval error:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Doctor override
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
      console.error('Override error:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenFhirModal = async (record) => {
    try {
      const res = await fetch(`/api/queue/${record.id}/fhir`);
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

  const criticalRedCount = queue.filter(q => q.urgency_code === 'RED' && q.status === 'PENDING_REVIEW').length;

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
      />

      {/* Main Views */}
      <main className="main-content">
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

        {currentTab === 'doctor' && (
          <DoctorReviewDashboard 
            queue={queue}
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

        {currentTab === 'patient' && (
          <PatientPortal 
            patientUser={currentUser}
            queue={queue}
            onOpenLabImageModal={handleOpenLabModal}
            onSwitchToKiosk={() => setCurrentTab('kiosk')}
          />
        )}

        {currentTab === 'surveillance' && (
          <SurveillanceDashboard />
        )}

        {currentTab === 'mcp' && (
          <MCPGovernanceView />
        )}
      </main>

      {/* Modals */}
      <ESIOverrideModal 
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        record={recordToOverride}
        onSubmitOverride={handleSubmitOverride}
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
