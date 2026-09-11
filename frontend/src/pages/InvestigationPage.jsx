import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiArrowLeft, HiDownload, HiSave, HiTrash, HiShieldExclamation,
  HiShieldCheck, HiExclamation, HiBriefcase, HiRefresh, HiChevronDown, HiChevronUp
} from 'react-icons/hi';
import { getCase, updateCase, deleteCase, reopenCase, getReport, getCaseReport } from '../services/api';

import EvidenceChain from '../components/threat/EvidenceChain';
import ThreatSeverityMatrix from '../components/threat/ThreatSeverityMatrix';
import SecurityScorecard from '../components/threat/SecurityScorecard';
import InvestigationAssessment from '../components/threat/InvestigationAssessment';
import ModelDecisionCenter from '../components/threat/ModelDecisionCenter';
import CaseTimeline from '../components/threat/CaseTimeline';

// Phase 13 — Intelligence Fusion
import ThreatEvidenceSummary from '../components/fusion/ThreatEvidenceSummary';
import AttackIndicators from '../components/fusion/AttackIndicators';
import ModelEvidencePanel from '../components/fusion/ModelEvidencePanel';
import ThreatReasoningGraph from '../components/fusion/ThreatReasoningGraph';
import AnalystDecisionAssistant from '../components/fusion/AnalystDecisionAssistant';
import MissingEvidencePanel from '../components/fusion/MissingEvidencePanel';

export default function InvestigationPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [status, setStatus] = useState('NEW');
  const [notes, setNotes] = useState('');
  const [assessment, setAssessment] = useState('');
  const [resolution, setResolution] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // UI state
  const [evidenceExpanded, setEvidenceExpanded] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReopening, setIsReopening] = useState(false);

  const NOTES_MAX_CHARS = 2000;
  const ASSESSMENT_MAX_CHARS = 2000;

  useEffect(() => {
    fetchInvestigationDetails();
  }, [caseId]);

  const fetchInvestigationDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getCase(caseId);
      setCaseData(c);
      setStatus(c.status || 'NEW');
      setNotes(c.analyst_notes || '');
      setAssessment(c.assessment || '');
      setResolution(c.resolution || '');
      setResolutionNotes(c.resolution_notes || '');

      // Fetch linked scan record for features and model predictions
      if (c.scan_id) {
        try {
          const s = await getReport(c.scan_id);
          setScanData(s);
          if (!c.assessment) {
            // Set default assessment text if none exists
            setAssessment(
              `The target URL ${c.url} was analyzed and classified as ${c.verdict} with a risk score of ${c.risk_score}/100. ` +
              `Decision derived deterministically from extracted URL structural features.`
            );
          }
        } catch (err) {
          console.warn('Scan record details could not be loaded:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load case:', err);
      setError(err.response?.data?.detail || 'Investigation case not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvestigation = async () => {
    setSavingNotes(true);
    setSaveSuccessMsg(null);
    try {
      const updated = await updateCase(caseId, {
        status,
        analyst_notes: notes.slice(0, NOTES_MAX_CHARS),
        assessment: assessment.slice(0, ASSESSMENT_MAX_CHARS),
        resolution,
        resolution_notes: resolutionNotes,
      });
      setCaseData(updated);
      setSaveSuccessMsg('Investigation updates saved successfully to database.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to save updates:', err);
      alert('Failed to save investigation updates.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleReopenCase = async () => {
    setIsReopening(true);
    try {
      const updated = await reopenCase(caseId);
      setCaseData(updated);
      setStatus(updated.status);
      setSaveSuccessMsg('Case reopened successfully and set to INVESTIGATING.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to reopen case:', err);
      alert('Failed to reopen investigation case.');
    } finally {
      setIsReopening(false);
    }
  };

  const handleDeleteCase = async () => {
    setIsDeleting(true);
    try {
      await deleteCase(caseId);
      navigate('/cases');
    } catch (err) {
      console.error('Failed to delete case:', err);
      alert('Failed to delete case. Please try again.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDownloadPdfReport = async () => {
    try {
      const blobData = await getCaseReport(caseId, 'pdf');
      const blob = new Blob([blobData], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `PhishGuard-Report-${caseData?.case_number || 'case'}.pdf`;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download PDF report:', err);
      alert('Could not download PDF report. Downloading JSON report fallback instead.');
      handleExportEvidence();
    }
  };

  const handleExportEvidence = () => {
    const dataToExport = {
      case: caseData,
      scan: scanData,
      exported_at: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `evidence-summary-${caseData?.case_number || 'case'}.json`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '400px' }}>
        <div className="spinner" />
        <span style={{ marginTop: '14px', color: 'var(--text-muted)' }}>Loading SOC investigation case workspace...</span>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Investigation Case Not Found</h3>
        <p>{error || 'The requested case ID does not exist.'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/cases')}>
          Return to Cases List
        </button>
      </div>
    );
  }

  const confidencePct = scanData?.confidence
    ? (scanData.confidence * 100).toFixed(1)
    : `${caseData.risk_score}.0`;

  const isResolvedOrClosed = ['RESOLVED', 'CONFIRMED THREAT', 'FALSE POSITIVE'].includes(caseData.status);

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
      {/* Navigation & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button className="btn btn-outline" style={{ fontSize: '13px' }} onClick={() => navigate('/cases')}>
          <HiArrowLeft /> Back to Cases
        </button>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isResolvedOrClosed && (
            <button
              className="btn btn-outline"
              style={{ color: 'var(--accent-yellow)', borderColor: 'var(--accent-yellow)' }}
              onClick={handleReopenCase}
              disabled={isReopening}
            >
              <HiRefresh /> {isReopening ? 'Reopening...' : 'REOPEN CASE'}
            </button>
          )}

          <button className="btn btn-outline" onClick={handleExportEvidence} title="Export evidence JSON blob">
            <HiDownload /> EXPORT CASE (JSON)
          </button>

          <button className="btn btn-primary" onClick={handleDownloadPdfReport} title="Download official PDF Threat Report">
            <HiDownload /> GENERATE SECURITY REPORT (PDF)
          </button>

          <button
            className="btn btn-outline"
            style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
            onClick={() => setShowDeleteModal(true)}
            title="Permanently delete case"
          >
            <HiTrash /> DELETE CASE
          </button>
        </div>
      </div>

      {/* Case Header Banner */}
      <motion.div
        className="report-section card-glass"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginBottom: '24px',
          borderTop: `4px solid ${
            caseData.verdict === 'Phishing'
              ? 'var(--accent-red)'
              : caseData.verdict === 'Suspicious'
              ? 'var(--accent-yellow)'
              : 'var(--accent-green)'
          }`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="font-mono" style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-cyan)', letterSpacing: '0.08em' }}>
                CASE #{caseData.case_number}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Assigned: {caseData.assigned_analyst || 'Security Analyst'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Created: {caseData.created_at ? new Date(caseData.created_at).toLocaleString() : 'N/A'}
              </span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
              SOC PHISHING THREAT INVESTIGATION
            </h1>

            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              TARGET URL: <span className="font-mono" style={{ color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>{caseData.url}</span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--bg-elevated)', padding: '12px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>FINAL VERDICT</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: caseData.verdict === 'Phishing' ? 'var(--accent-red)' : caseData.verdict === 'Suspicious' ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>
                {caseData.verdict.toUpperCase()}
              </div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', padding: '12px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RISK SCORE</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: caseData.risk_score > 70 ? 'var(--accent-red)' : caseData.risk_score > 30 ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>
                {caseData.risk_score} / 100
              </div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', padding: '12px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MODEL PROBABILITY</div>
              <div className="font-mono" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                {confidencePct}%
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Workflow Status Bar & Save Trigger */}
      <div className="report-section card-glass" style={{ marginBottom: '24px', background: 'var(--bg-elevated)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '8px' }}>
                INVESTIGATION STATUS:
              </span>
              <select
                id="investigation-status-select"
                className="filter-select"
                style={{ fontWeight: '700', padding: '8px 14px' }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="NEW">NEW</option>
                <option value="INVESTIGATING">INVESTIGATING</option>
                <option value="CONFIRMED THREAT">CONFIRMED THREAT</option>
                <option value="FALSE POSITIVE">FALSE POSITIVE</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '8px' }}>
                RESOLUTION DISPOSITION:
              </span>
              <select
                id="investigation-resolution-select"
                className="filter-select"
                style={{ padding: '8px 14px' }}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              >
                <option value="">Pending Resolution</option>
                <option value="Confirmed phishing">Confirmed Phishing</option>
                <option value="False positive">False Positive</option>
                <option value="Resolved">Resolved</option>
                <option value="Requires further investigation">Requires Further Investigation</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSaveInvestigation} disabled={savingNotes}>
            <HiSave /> {savingNotes ? 'Saving Updates...' : 'Save Case Updates'}
          </button>
        </div>

        {saveSuccessMsg && (
          <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-green)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-green)', fontSize: '12px' }}>
            ✓ {saveSuccessMsg}
          </div>
        )}
      </div>

      {/* Expandable Evidence Section */}
      <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setEvidenceExpanded(!evidenceExpanded)}
        >
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiBriefcase style={{ color: 'var(--accent-cyan)' }} /> FORENSIC EVIDENCE CHAIN & DIMENSIONS
          </h3>
          <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }}>
            {evidenceExpanded ? <><HiChevronUp /> Collapse Evidence</> : <><HiChevronDown /> Expand Evidence</>}
          </button>
        </div>

        {evidenceExpanded && (
          <div style={{ marginTop: '20px' }}>
            {/* 4. Evidence Chain */}
            <EvidenceChain scan={scanData || caseData} />

            {/* 5. Threat Severity Matrix */}
            <ThreatSeverityMatrix features={scanData?.features} />

            {/* 6. Security Scorecard */}
            <SecurityScorecard
              features={scanData?.features}
              overallScore={caseData.risk_score}
              overallLevel={caseData.severity}
            />
          </div>
        )}
      </div>

      {/* AI Security Assessment Component */}
      <InvestigationAssessment scan={scanData || caseData} />

      {/* Model Decision Center */}
      <ModelDecisionCenter
        modelPredictions={scanData?.model_predictions}
        bestModelName={scanData?.best_model_name}
        confidence={scanData?.confidence}
        riskScore={caseData.risk_score}
      />

      {/* ══════════════════════════════════════════════════
          PHASE 13 — INTELLIGENCE FUSION ENGINE (CASE VIEW)
      ═════════════════════════════════════════════════ */}
      {scanData && (
        <>
          <ThreatEvidenceSummary scanReport={scanData} />
          <AttackIndicators scanReport={scanData} />
          <ModelEvidencePanel scanReport={scanData} />
          <ThreatReasoningGraph scanReport={scanData} />
          <AnalystDecisionAssistant scanReport={scanData} />
          <MissingEvidencePanel scanReport={scanData} />
        </>
      )}

      {/* Editable Analyst Assessment & Notes Section */}
      <div className="report-section card-glass" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px' }}>
          ✍️ ANALYST ASSESSMENT & INVESTIGATION NOTES
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Editable Analyst Assessment */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                Analyst Security Assessment
              </label>
              <span className="font-mono" style={{ fontSize: '11px', color: assessment.length > NOTES_MAX_CHARS ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                {assessment.length} / {ASSESSMENT_MAX_CHARS}
              </span>
            </div>
            <textarea
              id="analyst-assessment-textarea"
              rows={5}
              style={{
                width: '100%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                padding: '12px',
                fontFamily: 'inherit',
                fontSize: '13px',
                resize: 'vertical',
              }}
              placeholder="Enter technical summary of findings, feature impact, and threat evaluation..."
              value={assessment}
              onChange={(e) => setAssessment(e.target.value.slice(0, ASSESSMENT_MAX_CHARS))}
            />
          </div>

          {/* Analyst Technical Notes */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                Analyst Notes & Technical Observations
              </label>
              <span className="font-mono" style={{ fontSize: '11px', color: notes.length > NOTES_MAX_CHARS ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                {notes.length} / {NOTES_MAX_CHARS}
              </span>
            </div>
            <textarea
              id="analyst-notes-textarea"
              rows={5}
              style={{
                width: '100%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                padding: '12px',
                fontFamily: 'inherit',
                fontSize: '13px',
                resize: 'vertical',
              }}
              placeholder="Enter registrar info, WHOIS records, IP geolocation, or mitigation notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX_CHARS))}
            />
          </div>
        </div>

        {/* Resolution Notes */}
        <div style={{ marginTop: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Resolution Notes & Mitigation Actions
          </label>
          <textarea
            id="resolution-notes-textarea"
            rows={3}
            style={{
              width: '100%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              padding: '12px',
              fontFamily: 'inherit',
              fontSize: '13px',
              resize: 'vertical',
            }}
            placeholder="Enter blocklist addition details, endpoint remediation, or user notifications sent..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn btn-primary" onClick={handleSaveInvestigation} disabled={savingNotes}>
            <HiSave /> {savingNotes ? 'Saving...' : 'Save Case Updates'}
          </button>
        </div>
      </div>

      {/* Case Timeline Component */}
      <CaseTimeline caseData={caseData} scanData={scanData} />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-glass"
              style={{
                maxWidth: '480px',
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--accent-red)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)', fontSize: '20px' }}>
                  <HiTrash />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    DELETE CASE?
                  </h3>
                  <span className="font-mono" style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>
                    Case #{caseData.case_number}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Are you sure you want to permanently delete this investigation case record?
              </p>

              <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TARGET URL</div>
                <div className="font-mono" style={{ fontSize: '12px', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                  {caseData.url}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--accent-yellow)', marginBottom: '20px' }}>
                ⚠️ This action cannot be undone. <em>(Note: The underlying scan record will remain preserved in scan history.)</em>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  CANCEL
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
                  onClick={handleDeleteCase}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'DELETING...' : 'DELETE CASE'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
