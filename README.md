# Contract Redline Assistant

AI-powered contract analysis and redlining tool for legal teams.

## Getting Started

This project has two versions:

### 1. Demo Version (Simple HTML - No API Key Required)
- **File**: `contract-redline-app.html`
- **Features**: Interactive demo with sample data
- **Setup**: Open the HTML file directly in a browser
- **Best for**: Testing the UI and understanding the workflow

### 2. Production Version (Full Backend - Requires API Key)
- **Location**: `production/` folder
- **Features**: Real AI analysis using Claude API, generates actual Word redlines
- **Setup**: See instructions below
- **Best for**: Real contract analysis

## Production Setup

### Step 1: Get Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### Step 2: Add Your API Key

Your API key is already configured! Check `production/backend/.env` if you need to update it.

### Step 3: Build and Deploy

The application is ready to deploy. It's configured as a unified full-stack app:

**Local Development (Two Servers):**
```bash
# Terminal 1 - Backend
cd production/backend
npm run dev

# Terminal 2 - Frontend
cd production/frontend
npm run dev
```

**Production (Single Server):**
```bash
npm run build   # Builds everything
npm start       # Starts production server on port 3001
```

Visit http://localhost:3001 to use the app

### Step 4: Deploy to Cloud

The app is ready to deploy to any Node.js hosting platform. Set these environment variables:

- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `NODE_ENV` - Set to `production`
- `PORT` - (Optional, defaults to 3001)

**Deployment Commands:**
```bash
npm run build   # Automated during deployment
npm start       # Starts the server
```

## Project Structure

```
├── .env                           # API keys and configuration
├── contract-redline-app.html      # Demo version (no API key needed)
├── contract-redline-app.jsx       # React source for demo
└── production/                    # Production version
    ├── backend/                   # Node.js API server
    │   ├── src/
    │   │   ├── index.js          # Express server
    │   │   └── services/         # AI analysis logic
    │   └── package.json
    └── frontend/                  # Frontend integration (optional)
```

## How It Works

1. **Upload Documents**: Upload a contract (.docx) and optionally a playbook
2. **AI Analysis**: Claude analyzes the contract against legal best practices
3. **Review Changes**: See suggested redlines with severity ratings
4. **Accept/Reject**: Choose which changes to include
5. **Download**: Get a Word document with tracked changes

## Cost Estimates

- **Claude API**: $0.10-0.30 per contract (depends on document size)
- **Infrastructure**: Free for development, ~$10-50/month for production hosting

## Need Help?

- Demo Version: Just open `contract-redline-app.html` in your browser
- Production Version: See `production/README.md` for detailed setup
- API Issues: Check that your `ANTHROPIC_API_KEY` is valid

---

**Legal Disclaimer**: This tool assists with legal workflows but does not provide legal advice. All analysis must be reviewed by qualified legal professionals.
