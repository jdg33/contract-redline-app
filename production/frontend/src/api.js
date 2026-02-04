/**
 * API client for Contract Redline Assistant
 */

// In production, use relative URLs (same server). In dev, use localhost:3001
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

/**
 * Analyze a contract against a playbook
 * @param {File} contractFile - The contract .docx file
 * @param {File|null} playbookFile - Optional playbook .docx file
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeContract(contractFile, playbookFile, options = {}) {
  const formData = new FormData();

  formData.append('contract', contractFile);

  if (playbookFile) {
    formData.append('playbook', playbookFile);
  }

  formData.append('contractType', options.contractType || 'saas');
  formData.append('organizationRole', options.organizationRole || 'customer');

  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Analysis failed');
  }

  return response.json();
}

/**
 * Generate a redlined document with tracked changes
 * @param {string} analysisId - The analysis ID from analyzeContract
 * @param {string[]} acceptedChanges - Array of change IDs to include
 * @returns {Promise<Blob>} The redlined .docx file as a Blob
 */
export async function generateRedline(analysisId, acceptedChanges) {
  const response = await fetch(`${API_URL}/api/generate-redline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      analysisId,
      acceptedChanges
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Redline generation failed');
  }

  return response.blob();
}

/**
 * Download a blob as a file
 * @param {Blob} blob - The file blob
 * @param {string} filename - The filename to save as
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Retrieve a stored analysis by ID
 * @param {string} analysisId - The analysis ID
 * @returns {Promise<Object>} The analysis data
 */
export async function getAnalysis(analysisId) {
  const response = await fetch(`${API_URL}/api/analysis/${analysisId}`);

  if (!response.ok) {
    throw new Error('Analysis not found or expired');
  }

  return response.json();
}

/**
 * Check API health
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
  const response = await fetch(`${API_URL}/health`);
  return response.json();
}
