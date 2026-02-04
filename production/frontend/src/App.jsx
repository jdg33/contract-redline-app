import React, { useState, useCallback } from 'react';
import { FileText, Upload, AlertTriangle, CheckCircle, AlertCircle, Download, Loader2, BookOpen, Scale, Shield, Clock, Globe, Lock, FileCheck, Check, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { analyzeContract, generateRedline, downloadBlob } from './api.js';

const SeverityBadge = ({ severity }) => {
  const styles = {
    GREEN: 'bg-green-100 text-green-800 border-green-200',
    YELLOW: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    RED: 'bg-red-100 text-red-800 border-red-200'
  };

  const icons = {
    GREEN: <CheckCircle className="w-3 h-3" />,
    YELLOW: <AlertTriangle className="w-3 h-3" />,
    RED: <AlertCircle className="w-3 h-3" />
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[severity]}`}>
      {icons[severity]}
      {severity}
    </span>
  );
};

const DecisionBadge = ({ decision }) => {
  if (decision === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border bg-blue-100 text-blue-800 border-blue-200">
        <Check className="w-3 h-3" />
        Accepted
      </span>
    );
  }
  if (decision === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border bg-gray-100 text-gray-600 border-gray-300">
        <X className="w-3 h-3" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border bg-orange-100 text-orange-800 border-orange-200">
      Pending Review
    </span>
  );
};

const clauseIcons = {
  'Limitation of Liability': Scale,
  'Indemnification': Shield,
  'Intellectual Property': FileCheck,
  'Data Protection': Lock,
  'Term and Termination': Clock,
  'Governing Law': Globe,
};

const FileUpload = ({ label, description, onFileSelect, file, accept = ".docx" }) => {
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.docx')) {
      onFileSelect(droppedFile);
    }
  }, [onFileSelect]);

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
        file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input
        type="file"
        accept={accept}
        onChange={(e) => e.target.files[0] && onFileSelect(e.target.files[0])}
        className="hidden"
        id={`file-${label}`}
      />
      <label htmlFor={`file-${label}`} className="cursor-pointer">
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-blue-500" />
            <span className="font-medium text-blue-700">{file.name}</span>
            <span className="text-sm text-gray-500">Click to change</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-10 h-10 text-gray-400" />
            <span className="font-medium text-gray-700">{label}</span>
            <span className="text-sm text-gray-500">{description}</span>
          </div>
        )}
      </label>
    </div>
  );
};

const AnalysisCard = ({ id, clause, severity, issue, redline, rationale, fallback, decision, onDecision }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = clauseIcons[clause] || FileText;

  const cardStyles = {
    accepted: 'border-l-4 border-l-blue-500 bg-blue-50/30',
    rejected: 'border-l-4 border-l-gray-400 bg-gray-50/50 opacity-75',
    pending: ''
  };

  return (
    <div className={`border rounded-lg overflow-hidden bg-white shadow-sm transition-all ${cardStyles[decision || 'pending']}`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-gray-900">{clause}</h4>
            <p className="text-sm text-gray-500 line-clamp-1">{issue}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <SeverityBadge severity={severity} />
          <DecisionBadge decision={decision} />
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t p-4 bg-gray-50 space-y-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">Issue Identified</h5>
            <p className="text-sm text-gray-600">{issue}</p>
          </div>

          {redline.delete && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Proposed Redline</h5>
              <div className={`bg-white p-3 rounded border text-sm ${decision === 'rejected' ? 'opacity-50' : ''}`}>
                <span className="line-through text-red-600">{redline.delete}</span>
                {' → '}
                <span className="text-green-600 underline">{redline.insert}</span>
              </div>
            </div>
          )}

          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">Rationale</h5>
            <p className="text-sm text-gray-600">{rationale}</p>
          </div>

          {fallback && severity === 'YELLOW' && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Fallback Position</h5>
              <p className="text-sm text-gray-600 italic">{fallback}</p>
            </div>
          )}

          {redline.delete && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-gray-600 mr-2">Include this change?</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDecision(id, 'accepted'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  decision === 'accepted'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDecision(id, 'rejected'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  decision === 'rejected'
                    ? 'bg-gray-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X className="w-4 h-4" />
                Reject
              </button>
              {decision && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDecision(id, null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 ml-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SummaryStats = ({ analyses, decisions }) => {
  const counts = analyses.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {});

  const accepted = Object.values(decisions).filter(d => d === 'accepted').length;
  const rejected = Object.values(decisions).filter(d => d === 'rejected').length;
  const pending = analyses.filter(a => a.redline.delete).length - accepted - rejected;

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{counts.RED || 0}</div>
          <div className="text-sm text-red-600">Critical Issues</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">{counts.YELLOW || 0}</div>
          <div className="text-sm text-yellow-600">Negotiable Items</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{counts.GREEN || 0}</div>
          <div className="text-sm text-green-600">Acceptable</div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Your Decisions:</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-blue-700 font-medium">{accepted} Accepted</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              <span className="text-gray-600 font-medium">{rejected} Rejected</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              <span className="text-orange-700 font-medium">{pending} Pending</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [playbook, setPlaybook] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractType, setContractType] = useState('saas');
  const [userRole, setUserRole] = useState('customer');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [activeTab, setActiveTab] = useState('upload');
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleAnalyze = async () => {
    if (!contract) return;

    setIsAnalyzing(true);
    setActiveTab('results');
    setDecisions({});
    setError(null);

    try {
      const result = await analyzeContract(contract, playbook, {
        contractType,
        organizationRole: userRole
      });

      setAnalysisId(result.id);
      setAnalyses(result.analyses);
    } catch (err) {
      setError(err.message);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDecision = (id, decision) => {
    setDecisions(prev => {
      const newDecisions = { ...prev };
      if (decision === null) {
        delete newDecisions[id];
      } else {
        newDecisions[id] = decision;
      }
      return newDecisions;
    });
  };

  const handleAcceptAll = () => {
    const newDecisions = {};
    analyses.forEach(a => {
      if (a.redline.delete) {
        newDecisions[a.id] = 'accepted';
      }
    });
    setDecisions(newDecisions);
  };

  const handleRejectAll = () => {
    const newDecisions = {};
    analyses.forEach(a => {
      if (a.redline.delete) {
        newDecisions[a.id] = 'rejected';
      }
    });
    setDecisions(newDecisions);
  };

  const handleDownloadRedline = async () => {
    const acceptedChanges = analyses
      .filter(a => decisions[a.id] === 'accepted')
      .map(a => a.id);

    if (acceptedChanges.length === 0) {
      alert('Please accept at least one change before downloading.');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const blob = await generateRedline(analysisId, acceptedChanges);
      downloadBlob(blob, 'redlined-contract.docx');
    } catch (err) {
      setError(err.message);
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const resetAnalysis = () => {
    setAnalyses(null);
    setAnalysisId(null);
    setDecisions({});
    setActiveTab('upload');
    setError(null);
  };

  const acceptedAnalyses = analyses?.filter(a => decisions[a.id] === 'accepted') || [];
  const rejectedAnalyses = analyses?.filter(a => decisions[a.id] === 'rejected') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Contract Redline Assistant</h1>
              <p className="text-sm text-gray-500">AI-powered contract analysis against your negotiation playbook</p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> This tool assists with legal workflows but does not provide legal advice.
              All analysis should be reviewed by qualified legal professionals before use.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            1. Upload Documents
          </button>
          <button
            onClick={() => analyses && setActiveTab('results')}
            disabled={!analyses}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'results'
                ? 'bg-blue-600 text-white'
                : analyses
                  ? 'bg-white text-gray-600 hover:bg-gray-100'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            2. Review Analysis
          </button>
          <button
            onClick={() => analyses && setActiveTab('summary')}
            disabled={!analyses}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white'
                : analyses
                  ? 'bg-white text-gray-600 hover:bg-gray-100'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            3. Summary & Export
          </button>
        </div>

        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Step 1: Upload Your Negotiation Playbook
              </h2>
              <FileUpload
                label="Upload Playbook (.docx)"
                description="Your organization's negotiation standards and acceptable positions"
                file={playbook}
                onFileSelect={setPlaybook}
              />
              {!playbook && (
                <p className="mt-3 text-sm text-gray-500">
                  Don't have a playbook? The system will analyze against general commercial standards.
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Step 2: Upload Contract to Review
              </h2>
              <FileUpload
                label="Upload Contract (.docx)"
                description="The third-party contract to analyze and redline"
                file={contract}
                onFileSelect={setContract}
              />

              {contract && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Type
                    </label>
                    <select
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="saas">SaaS Agreement</option>
                      <option value="services">Services Agreement</option>
                      <option value="license">Software License</option>
                      <option value="procurement">Procurement Contract</option>
                      <option value="nda">NDA</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Organization's Role
                    </label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="customer">Customer / Buyer</option>
                      <option value="vendor">Vendor / Seller</option>
                      <option value="licensee">Licensee</option>
                      <option value="licensor">Licensor</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!contract || isAnalyzing}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                contract && !isAnalyzing
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Contract...
                </>
              ) : (
                <>
                  <Scale className="w-5 h-5" />
                  Analyze Contract & Generate Redlines
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-4">
            {isAnalyzing ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Contract</h3>
                <p className="text-gray-500">Comparing against playbook positions...</p>
              </div>
            ) : analyses ? (
              <>
                <SummaryStats analyses={analyses} decisions={decisions} />

                <div className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Clause-by-Clause Analysis</h3>
                      <p className="text-sm text-gray-500">Review each change and accept or reject it</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAcceptAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        Accept All
                      </button>
                      <button
                        onClick={handleRejectAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                      >
                        <X className="w-4 h-4" />
                        Reject All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {analyses.filter(a => a.severity === 'RED').map((analysis) => (
                      <AnalysisCard
                        key={analysis.id}
                        {...analysis}
                        decision={decisions[analysis.id]}
                        onDecision={handleDecision}
                      />
                    ))}
                    {analyses.filter(a => a.severity === 'YELLOW').map((analysis) => (
                      <AnalysisCard
                        key={analysis.id}
                        {...analysis}
                        decision={decisions[analysis.id]}
                        onDecision={handleDecision}
                      />
                    ))}
                    {analyses.filter(a => a.severity === 'GREEN').map((analysis) => (
                      <AnalysisCard
                        key={analysis.id}
                        {...analysis}
                        decision={decisions[analysis.id]}
                        onDecision={handleDecision}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetAnalysis}
                    className="flex-1 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    ← Back to Upload
                  </button>
                  <button
                    onClick={() => setActiveTab('summary')}
                    className="flex-1 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    View Summary & Export →
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {activeTab === 'summary' && analyses && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h2>
              <p className="text-gray-700 leading-relaxed">
                This contract presents <strong className="text-red-600">{analyses.filter(a => a.severity === 'RED').length} critical issues</strong> requiring
                immediate attention and <strong className="text-yellow-600">{analyses.filter(a => a.severity === 'YELLOW').length} negotiable items</strong> where
                the proposed terms deviate from organizational standards.
                {acceptedAnalyses.length > 0 && (
                  <> You have accepted <strong className="text-blue-600">{acceptedAnalyses.length} changes</strong> for inclusion in the redlined document.</>
                )}
                {rejectedAnalyses.length > 0 && (
                  <> You have rejected <strong className="text-gray-600">{rejectedAnalyses.length} proposed changes</strong>.</>
                )}
              </p>
            </div>

            {acceptedAnalyses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-blue-600" />
                  Accepted Changes ({acceptedAnalyses.length})
                </h2>
                <div className="space-y-3">
                  {acceptedAnalyses.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <SeverityBadge severity={a.severity} />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{a.clause}:</span>{' '}
                        <span className="text-gray-600">{a.issue}</span>
                        <div className="mt-1 text-sm">
                          <span className="line-through text-red-600">{a.redline.delete}</span>
                          {' → '}
                          <span className="text-green-600">{a.redline.insert}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rejectedAnalyses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <X className="w-5 h-5 text-gray-500" />
                  Rejected Changes ({rejectedAnalyses.length})
                </h2>
                <div className="space-y-2">
                  {rejectedAnalyses.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
                      <SeverityBadge severity={a.severity} />
                      <span className="font-medium text-gray-700">{a.clause}:</span>
                      <span className="text-gray-500">{a.issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Download Redlined Contract</h3>
                  <p className="text-blue-100 text-sm">
                    {acceptedAnalyses.length > 0
                      ? `Includes ${acceptedAnalyses.length} accepted change${acceptedAnalyses.length !== 1 ? 's' : ''} as Word tracked changes`
                      : 'No changes accepted yet - go back to accept changes'}
                  </p>
                </div>
                <button
                  onClick={handleDownloadRedline}
                  disabled={acceptedAnalyses.length === 0 || isDownloading}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    acceptedAnalyses.length > 0 && !isDownloading
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-500 text-blue-200 cursor-not-allowed'
                  }`}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download .docx
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={resetAnalysis}
              className="w-full py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ← Start New Analysis
            </button>
          </div>
        )}
      </main>

      <footer className="border-t bg-white mt-12">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <p className="text-center text-sm text-gray-500">
            Contract Redline Assistant • AI-powered analysis for in-house legal teams •
            <span className="text-amber-600"> Not legal advice - review by qualified professionals required</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
