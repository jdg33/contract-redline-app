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

Edit the `.env` file in the root directory and replace:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

With your actual key:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

### Step 3: Install and Run the Backend

```bash
cd production/backend
npm install
npm run dev
```

The API will start on http://localhost:3001

### Step 4: Test the API

Open another terminal and test:
```bash
curl http://localhost:3001/health
```

You should see: `{"status":"ok","timestamp":"..."}`

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
