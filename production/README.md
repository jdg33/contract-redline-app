# Contract Redline Assistant - Production

Real AI-powered contract analysis using Claude API.

## Quick Start

### 1. Add Your API Key

Get your Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)

Edit `backend/.env` and add your key:
```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

### 2. Run the Application

**Option A: Automatic Setup (Recommended)**
```bash
cd production
./start.sh
```

**Option B: Manual Setup**

Terminal 1 - Backend:
```bash
cd production/backend
npm install
npm run dev
```

Terminal 2 - Frontend:
```bash
cd production/frontend
npm install
npm run dev
```

### 3. Open Your Browser

Visit: http://localhost:5173

## How to Use

1. **Upload Documents**
   - Upload your contract (.docx file)
   - Optionally upload a playbook with your organization's standards
   - Select contract type and your role

2. **Analyze**
   - Click "Analyze Contract & Generate Redlines"
   - Claude AI will analyze the contract and suggest changes

3. **Review Changes**
   - Each issue is color-coded by severity:
     - RED: Critical issues requiring immediate attention
     - YELLOW: Negotiable items that deviate from standards
     - GREEN: Acceptable terms
   - Accept or reject each suggested change

4. **Download**
   - Go to Summary & Export
   - Download a Word document with tracked changes

### 4. Deploy (Optional)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.

**Quick Deploy Options:**

| Platform | Command |
|----------|---------|
| Railway | `railway up` |
| Docker | `docker build -t contract-redline . && docker run -p 3001:3001 contract-redline` |
| Render | Connect GitHub repo in dashboard |

## Architecture

```
production/
├── start.sh             # Launch script for both servers
├── ARCHITECTURE.md      # System design and technical decisions
├── DEPLOYMENT.md        # Deployment guide for various platforms
├── README.md            # This file
│
├── backend/             # Node.js API server
│   ├── src/
│   │   ├── index.js                    # Express server & routes
│   │   ├── services/
│   │   │   ├── analyzer.js             # Claude AI contract analysis
│   │   │   └── redlineGenerator.js     # Word document generation
│   │   └── config/
│   │       └── defaultPlaybook.js      # Default standards
│   ├── package.json
│   ├── Dockerfile
│   └── .env             # Your API key here
│
└── frontend/            # React + Vite UI
    ├── src/
    │   ├── App.jsx      # Main application
    │   ├── api.js       # API client
    │   └── main.jsx     # Entry point
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/analyze` | Analyze contract against playbook |
| POST | `/api/generate-redline` | Generate redlined .docx |
| GET | `/api/analysis/:id` | Retrieve stored analysis |

## Features

- Real AI analysis using Claude 3.5 Sonnet
- Document parsing from .docx files
- Generates Word documents with tracked changes
- Severity-based issue classification
- Interactive review and approval workflow
- Custom playbook support

## Cost

- **Claude API**: ~$0.10-0.30 per contract analysis (Sonnet)
- **Infrastructure**: ~$10-50/month (Railway/Vercel for production hosting)

## Troubleshooting

**Problem: "Analysis failed" error**
- Check that your ANTHROPIC_API_KEY is valid in backend/.env
- Verify the key starts with `sk-ant-`
- Check backend console for detailed error messages

**Problem: "CORS error"**
- Make sure both backend (port 3001) and frontend (port 5173) are running
- Check that ports are not blocked by firewall

**Problem: "Cannot read .docx file"**
- Ensure you're uploading a valid .docx file (not .doc or PDF)
- File size limit is 25MB

## Development

Backend uses:
- Express.js for API
- Anthropic SDK for AI analysis
- mammoth for reading .docx files
- docx for generating redlined documents

Frontend uses:
- React 18
- Vite for fast development
- lucide-react for icons
- Native Fetch API for backend calls

## Security Notes

- Never commit your `.env` file or API keys
- Enable HTTPS in production
- Restrict CORS to your frontend domain
- Documents are processed in memory and not persisted

## Support

- [Anthropic Documentation](https://docs.anthropic.com/)
- [Claude API Reference](https://docs.anthropic.com/claude/reference/)

---

**Disclaimer**: This tool assists with legal workflows but does not provide legal advice. All analysis should be reviewed by qualified legal professionals.
