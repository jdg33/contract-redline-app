import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { config } from 'dotenv';
import { analyzeContract } from './services/analyzer.js';
import { generateRedline } from './services/redlineGenerator.js';

config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only .docx files are allowed'));
    }
  }
});

// Store analyses in memory (use Redis/DB in production)
const analysisStore = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /api/analyze
 * Analyze a contract against a playbook using Claude
 */
app.post('/api/analyze', upload.fields([
  { name: 'playbook', maxCount: 1 },
  { name: 'contract', maxCount: 1 }
]), async (req, res) => {
  try {
    const contractFile = req.files?.contract?.[0];
    const playbookFile = req.files?.playbook?.[0];

    if (!contractFile) {
      return res.status(400).json({ error: 'Contract file is required' });
    }

    const { contractType = 'saas', organizationRole = 'customer' } = req.body;

    console.log(`Analyzing contract: ${contractFile.originalname}`);
    console.log(`Playbook: ${playbookFile?.originalname || 'Using defaults'}`);

    // Run analysis
    const result = await analyzeContract({
      contractBuffer: contractFile.buffer,
      playbookBuffer: playbookFile?.buffer,
      contractType,
      organizationRole
    });

    // Store for later redline generation
    analysisStore.set(result.id, {
      ...result,
      contractBuffer: contractFile.buffer,
      createdAt: new Date()
    });

    // Clean up old analyses (keep for 1 hour)
    cleanupOldAnalyses();

    res.json({
      id: result.id,
      analyses: result.analyses,
      summary: result.summary
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * POST /api/generate-redline
 * Generate a redlined .docx with tracked changes
 */
app.post('/api/generate-redline', async (req, res) => {
  try {
    const { analysisId, acceptedChanges } = req.body;

    if (!analysisId || !acceptedChanges) {
      return res.status(400).json({
        error: 'analysisId and acceptedChanges are required'
      });
    }

    const analysis = analysisStore.get(analysisId);
    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found or expired'
      });
    }

    // Filter to only accepted changes
    const changesToApply = analysis.analyses.filter(a =>
      acceptedChanges.includes(a.id)
    );

    console.log(`Generating redline with ${changesToApply.length} changes`);

    // Generate the redlined document
    const redlinedBuffer = await generateRedline({
      contractBuffer: analysis.contractBuffer,
      changes: changesToApply
    });

    // Send as downloadable file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="redlined-contract.docx"');
    res.send(redlinedBuffer);

  } catch (error) {
    console.error('Redline generation error:', error);
    res.status(500).json({
      error: 'Redline generation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/analysis/:id
 * Retrieve a stored analysis
 */
app.get('/api/analysis/:id', (req, res) => {
  const analysis = analysisStore.get(req.params.id);

  if (!analysis) {
    return res.status(404).json({ error: 'Analysis not found' });
  }

  res.json({
    id: analysis.id,
    analyses: analysis.analyses,
    summary: analysis.summary,
    createdAt: analysis.createdAt
  });
});

// Cleanup analyses older than 1 hour
function cleanupOldAnalyses() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [id, analysis] of analysisStore.entries()) {
    if (analysis.createdAt.getTime() < oneHourAgo) {
      analysisStore.delete(id);
    }
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Contract Redline API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
