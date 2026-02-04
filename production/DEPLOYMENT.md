# Deployment Guide

This guide walks through deploying the Contract Redline Assistant to production.

## Prerequisites

- Node.js 20+ installed
- Anthropic API key (get one at https://console.anthropic.com/)
- Git installed
- (Optional) Docker for containerized deployment

---

## Option 1: Quick Deploy with Railway (Recommended for MVP)

Railway provides simple, fast deployment with automatic CI/CD.

### Step 1: Prepare the Code

```bash
# Navigate to backend directory
cd production/backend

# Initialize git if needed
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your repository
4. Add environment variables:
   - `ANTHROPIC_API_KEY` = your API key
   - `PORT` = 3001
   - `NODE_ENV` = production

Railway will automatically:
- Detect Node.js
- Install dependencies
- Start the server
- Provide a public URL

### Step 3: Deploy Frontend

For the React frontend, deploy to Vercel:

1. Go to [vercel.com](https://vercel.com)
2. Import your frontend repository
3. Set environment variable:
   - `VITE_API_URL` = your Railway backend URL
4. Deploy

---

## Option 2: Deploy with Docker

### Build and Run Locally

```bash
cd production/backend

# Build the image
docker build -t contract-redline-api .

# Run with environment variables
docker run -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your-api-key \
  -e NODE_ENV=production \
  contract-redline-api
```

### Deploy to Cloud Run (GCP)

```bash
# Authenticate with GCP
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/contract-redline-api

# Deploy
gcloud run deploy contract-redline-api \
  --image gcr.io/YOUR_PROJECT_ID/contract-redline-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=your-api-key
```

### Deploy to AWS ECS

```bash
# Create ECR repository
aws ecr create-repository --repository-name contract-redline-api

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag contract-redline-api:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/contract-redline-api:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/contract-redline-api:latest

# Create ECS service (use AWS Console or Terraform)
```

---

## Option 3: Traditional VPS Deployment

### On Ubuntu/Debian

```bash
# SSH into your server
ssh user@your-server.com

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your code
git clone https://github.com/your-repo/contract-redline.git
cd contract-redline/production/backend

# Install dependencies
npm ci --only=production

# Create environment file
cp .env.example .env
nano .env  # Add your API key

# Install PM2 for process management
sudo npm install -g pm2

# Start the application
pm2 start src/index.js --name contract-redline-api

# Set PM2 to start on boot
pm2 startup
pm2 save
```

### Setting Up Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/contract-redline
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;

        # File upload size
        client_max_body_size 25M;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/contract-redline /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Add SSL with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## Frontend Integration

Update your React frontend to use the production API:

### Update API Configuration

```javascript
// src/config.js
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### Example API Calls

```javascript
// Analyze contract
async function analyzeContract(playbookFile, contractFile, options) {
  const formData = new FormData();
  if (playbookFile) formData.append('playbook', playbookFile);
  formData.append('contract', contractFile);
  formData.append('contractType', options.contractType);
  formData.append('organizationRole', options.organizationRole);

  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) throw new Error('Analysis failed');
  return response.json();
}

// Generate redline
async function downloadRedline(analysisId, acceptedChanges) {
  const response = await fetch(`${API_URL}/api/generate-redline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, acceptedChanges })
  });

  if (!response.ok) throw new Error('Redline generation failed');

  // Download the file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'redlined-contract.docx';
  a.click();
}
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Your Anthropic API key |
| `PORT` | No | 3001 | Server port |
| `NODE_ENV` | No | development | Environment mode |
| `CORS_ORIGINS` | No | * | Allowed CORS origins |
| `LOG_LEVEL` | No | info | Logging verbosity |

---

## Security Checklist

Before going to production, ensure:

- [ ] API key is stored securely (environment variables, not in code)
- [ ] HTTPS is enabled (SSL certificate configured)
- [ ] CORS is restricted to your frontend domain
- [ ] Rate limiting is configured
- [ ] File size limits are appropriate
- [ ] Error messages don't leak sensitive info
- [ ] Uploaded files are validated and scanned
- [ ] Access logging is enabled

---

## Monitoring

### Health Checks

The API exposes a health endpoint:

```bash
curl https://api.yourdomain.com/health
# {"status":"ok","timestamp":"2024-01-15T10:00:00.000Z"}
```

### Recommended Monitoring Tools

- **Uptime**: UptimeRobot, Better Uptime
- **APM**: New Relic, Datadog
- **Logging**: Logtail, Papertrail
- **Error Tracking**: Sentry

---

## Cost Estimation

### Claude API Costs

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| claude-sonnet-4-20250514 | $3.00 | $15.00 |
| claude-opus-4-20250514 | $15.00 | $75.00 |

Average contract analysis: ~30K input tokens, ~2K output tokens
**Cost per analysis**: ~$0.12 (Sonnet) or ~$0.60 (Opus)

### Infrastructure Costs (Monthly)

| Service | Cost |
|---------|------|
| Railway (backend) | $5-20 |
| Vercel (frontend) | $0-20 |
| Domain + SSL | $10-15/year |
| **Total MVP** | ~$10-50/month + API usage |

---

## Support

For issues or questions:
1. Check the logs: `pm2 logs contract-redline-api`
2. Test the health endpoint
3. Verify environment variables are set
4. Check Anthropic API status: https://status.anthropic.com/
