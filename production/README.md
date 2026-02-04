# Contract Redline Assistant - Production

AI-powered contract analysis and redlining for in-house legal teams.

## Quick Start

### 1. Get your Anthropic API Key

Sign up at [console.anthropic.com](https://console.anthropic.com/) and create an API key.

### 2. Set up the Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start the server
npm run dev
```

The API will be available at `http://localhost:3001`

### 3. Test the API

```bash
# Health check
curl http://localhost:3001/health

# Analyze a contract (replace with your files)
curl -X POST http://localhost:3001/api/analyze \
  -F "contract=@/path/to/contract.docx" \
  -F "contractType=saas" \
  -F "organizationRole=customer"
```

### 4. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.

**Quick Deploy Options:**

| Platform | Command |
|----------|---------|
| Railway | `railway up` |
| Docker | `docker build -t contract-redline . && docker run -p 3001:3001 contract-redline` |
| Render | Connect GitHub repo in dashboard |

## Project Structure

```
production/
├── ARCHITECTURE.md      # System design and technical decisions
├── DEPLOYMENT.md        # Deployment guide for various platforms
├── README.md            # This file
│
├── backend/             # Node.js API server
│   ├── src/
│   │   ├── index.js           # Express server and routes
│   │   ├── services/
│   │   │   ├── analyzer.js    # Claude API integration
│   │   │   └── redlineGenerator.js  # Word tracked changes
│   │   └── config/
│   │       └── defaultPlaybook.js   # Fallback playbook
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
└── frontend/            # React frontend (to integrate)
    └── src/
        └── api.js       # API client functions
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/analyze` | Analyze contract against playbook |
| POST | `/api/generate-redline` | Generate redlined .docx |
| GET | `/api/analysis/:id` | Retrieve stored analysis |

## Cost

- **Claude API**: ~$0.10-0.30 per contract analysis (Sonnet)
- **Infrastructure**: ~$10-50/month (Railway/Vercel)

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
