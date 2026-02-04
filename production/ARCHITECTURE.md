# Contract Redline Assistant - Production Architecture

## Overview

This document outlines the production architecture for deploying the Contract Redline Assistant as a web application using Claude API for AI-powered contract analysis.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  React App (Next.js or Vite)                                 │   │
│  │  - File upload UI                                            │   │
│  │  - Analysis review interface                                 │   │
│  │  - Accept/reject workflow                                    │   │
│  │  - Document download                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND API                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Node.js / Python (FastAPI)                                  │   │
│  │                                                               │   │
│  │  POST /api/analyze                                           │   │
│  │    - Receives playbook + contract                            │   │
│  │    - Extracts text from .docx                                │   │
│  │    - Calls Claude API for analysis                           │   │
│  │    - Returns structured analysis                             │   │
│  │                                                               │   │
│  │  POST /api/generate-redline                                  │   │
│  │    - Receives original contract + accepted changes           │   │
│  │    - Generates .docx with tracked changes                    │   │
│  │    - Returns download URL                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │  Claude   │   │  Storage  │   │  Database │
            │   API     │   │  (S3/GCS) │   │(Optional) │
            └───────────┘   └───────────┘   └───────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (React with SSR) or Vite + React
- **Styling**: Tailwind CSS
- **State Management**: React Context or Zustand
- **File Handling**: react-dropzone

### Backend
- **Runtime**: Node.js 20+ or Python 3.11+
- **Framework**: Express.js / Fastify (Node) or FastAPI (Python)
- **Document Processing**:
  - Node: `mammoth` (read), `docx` (write)
  - Python: `python-docx`

### AI Integration
- **Provider**: Anthropic Claude API
- **Model**: claude-sonnet-4-20250514 (balance of speed/quality) or claude-opus-4-20250514 (highest quality)
- **Context**: Up to 200K tokens - can handle full contracts

### Infrastructure
- **Hosting**: Vercel (frontend) + Railway/Render (backend) or AWS/GCP
- **Storage**: S3/GCS for temporary document storage
- **Database**: PostgreSQL (optional - for audit logs, user management)

## API Endpoints

### POST /api/analyze

**Request:**
```json
{
  "playbook": "base64-encoded-docx or presigned-url",
  "contract": "base64-encoded-docx or presigned-url",
  "contractType": "saas",
  "organizationRole": "customer"
}
```

**Response:**
```json
{
  "id": "analysis-uuid",
  "analyses": [
    {
      "id": "clause-1",
      "clause": "Limitation of Liability",
      "severity": "YELLOW",
      "issue": "Liability cap set at 3 months...",
      "location": {
        "paragraph": 42,
        "text": "three (3) months"
      },
      "redline": {
        "delete": "three (3) months",
        "insert": "twelve (12) months"
      },
      "rationale": "A 3-month cap significantly limits...",
      "fallback": "If 12 months is rejected..."
    }
  ],
  "summary": {
    "red": 2,
    "yellow": 3,
    "green": 1
  }
}
```

### POST /api/generate-redline

**Request:**
```json
{
  "analysisId": "analysis-uuid",
  "originalContract": "base64-encoded-docx",
  "acceptedChanges": ["clause-1", "clause-3", "clause-5"]
}
```

**Response:**
```json
{
  "downloadUrl": "https://storage.../redlined-contract.docx",
  "expiresAt": "2024-01-15T12:00:00Z"
}
```

## Claude API Integration

### Prompt Structure

The analysis uses a structured prompt with the playbook as context:

```
You are a contract analyst for an in-house legal team. Analyze the following
contract against the organization's negotiation playbook.

<playbook>
{playbook_content}
</playbook>

<contract>
{contract_content}
</contract>

<context>
- Contract Type: {contract_type}
- Organization Role: {org_role}
</context>

For each clause that deviates from the playbook:

1. Identify the clause type (e.g., "Limitation of Liability")
2. Classify severity:
   - RED: Exceeds escalation triggers, requires senior counsel
   - YELLOW: Outside standard but within acceptable range
   - GREEN: Within standard position
3. Describe the specific issue
4. Provide the exact text to delete and insert (surgical redlines)
5. Explain the rationale
6. For YELLOW items, suggest a fallback position

Return as JSON array...
```

### Recommended Model Settings

```javascript
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 8192,
  temperature: 0.2,  // Low for consistency
  system: "You are a precise contract analyst...",
}
```

## Document Processing

### Reading .docx Files

Extract text while preserving structure for accurate redlining:

```javascript
// Using mammoth for Node.js
const mammoth = require('mammoth');

async function extractText(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// For precise editing, extract XML structure
async function extractStructure(buffer) {
  const result = await mammoth.convertToHtml({ buffer });
  return result;
}
```

### Generating Tracked Changes

Word tracked changes require specific XML structure:

```xml
<w:del w:author="Claude" w:date="2024-01-15T10:00:00Z">
  <w:r><w:delText>three (3) months</w:delText></w:r>
</w:del>
<w:ins w:author="Claude" w:date="2024-01-15T10:00:00Z">
  <w:r><w:t>twelve (12) months</w:t></w:r>
</w:ins>
```

## Security Considerations

### Data Privacy
- **No persistent storage**: Delete uploaded documents after processing
- **Encryption in transit**: TLS 1.3 for all API calls
- **Encryption at rest**: If storing temporarily, use AES-256
- **Audit logging**: Log access but not document content

### Authentication
- **API Keys**: For internal/trusted clients
- **OAuth 2.0**: For user-facing authentication
- **Rate Limiting**: Prevent abuse (e.g., 10 analyses/hour)

### Claude API
- **API Key Security**: Use environment variables, never commit
- **Data Processing**: Review Anthropic's data retention policies
- **Enterprise**: Consider Anthropic's enterprise tier for additional controls

## Deployment Options

### Option 1: Vercel + Railway (Recommended for MVP)

```bash
# Frontend (Vercel)
vercel deploy

# Backend (Railway)
railway up
```

**Pros**: Fast deployment, auto-scaling, managed infrastructure
**Cons**: Vendor lock-in, costs scale with usage

### Option 2: AWS (Production Scale)

- **Frontend**: CloudFront + S3 (static hosting)
- **Backend**: ECS Fargate or Lambda
- **Storage**: S3 with lifecycle policies
- **Database**: RDS PostgreSQL

### Option 3: Self-Hosted (Max Control)

- **Container**: Docker + Kubernetes
- **Reverse Proxy**: Nginx or Traefik
- **Requirements**: DevOps expertise

## Cost Estimation

### Claude API Costs (per analysis)
- Average contract: ~20,000 tokens input
- Average playbook: ~10,000 tokens input
- Output: ~2,000 tokens
- **Cost per analysis**: ~$0.10-0.30 (Sonnet) or ~$0.50-1.50 (Opus)

### Infrastructure (Monthly)
- **Vercel Pro**: $20/month
- **Railway**: $5-50/month (usage-based)
- **S3**: ~$1-5/month
- **Total MVP**: ~$30-100/month + API costs

## Development Roadmap

### Phase 1: MVP (2-3 weeks)
- [ ] Backend API with Claude integration
- [ ] Document upload and text extraction
- [ ] Basic redline generation
- [ ] Deploy to staging

### Phase 2: Production Ready (2-3 weeks)
- [ ] Authentication (OAuth)
- [ ] Error handling and retry logic
- [ ] Monitoring and logging
- [ ] Rate limiting
- [ ] Production deployment

### Phase 3: Enhancements (Ongoing)
- [ ] Playbook management UI
- [ ] Analysis history
- [ ] Team collaboration
- [ ] Custom clause libraries
- [ ] Integration with CLM systems

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Add your `ANTHROPIC_API_KEY`
4. Install dependencies: `npm install`
5. Run development: `npm run dev`
6. Deploy: `npm run deploy`

---

**Note**: This tool assists with legal workflows but does not provide legal advice. All analysis should be reviewed by qualified legal professionals.
