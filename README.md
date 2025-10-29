@"
# 🚀 MailSync

Real-time email management system with AI-powered classification, full-text search, and intelligent reply suggestions.

## ✨ Features

- **Real-Time Email Sync**: IMAP IDLE mode for instant multi-account synchronization (no polling!)
- **AI Classification**: Automatic email categorization using Google Gemini API
  - Categories: Interested, Meeting Booked, Not Interested, Spam, Out of Office
- **Full-Text Search**: Elasticsearch-powered search with filtering by account, folder, and labels
- **RAG Reply Suggestions**: Context-aware email replies using Qdrant vector database
- **Smart Notifications**: Automated Slack/webhook alerts for high-priority emails
- **Optimized Sync**: Fetches only last 30 days of emails (70% faster for large mailboxes)

## 🛠️ Tech Stack

- **Backend**: TypeScript, Node.js, Express.js
- **Database**: PostgreSQL
- **Search**: Elasticsearch
- **Vector DB**: Qdrant
- **AI**: Google Gemini API
- **DevOps**: Docker, Docker Compose

## 📦 Installation

\`\`\`bash
# Clone repository
git clone https://github.com/Dpruddh44/mailsync-backend.git
cd mailsync-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Start services
docker-compose up -d

# Initialize database
cat schema.sql | docker exec -i \$(docker ps -qf \"name=postgres\") psql -U postgres -d onebox_email

# Build and start
npm run build
npm run dev
\`\`\`

## 🔧 Configuration

Create a \`.env\` file with:

\`\`\`env
DATABASE_URL=postgresql://postgres:password@localhost:5432/onebox_email
ELASTICSEARCH_NODE=http://localhost:9200
QDRANT_URL=http://localhost:6333
GEMINI_API_KEY=your_gemini_api_key
ENCRYPTION_KEY=your_32_character_encryption_key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
WEBHOOK_SITE_URL=https://webhook.site/your-unique-url
\`\`\`

## 🚀 API Endpoints

### Accounts
- \`POST /api/accounts\` - Add email account
- \`GET /api/accounts\` - List all accounts
- \`POST /api/accounts/:id/sync\` - Start real-time sync

### Emails
- \`GET /api/emails\` - List emails (with filters)
- \`POST /api/emails/search\` - Search emails
- \`POST /api/emails/:id/classify\` - Classify email
- \`POST /api/emails/:id/suggest-reply\` - Get AI reply suggestion

## 📊 Architecture

\`\`\`
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Gmail     │────▶│  IMAP IDLE   │────▶│  PostgreSQL │
│   Account   │     │  Connection  │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Gemini API  │ (Classification)
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐     ┌─────────────┐
                    │Elasticsearch │     │   Qdrant    │
                    │   (Search)   │     │ (RAG/Vector)│
                    └──────────────┘     └─────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ Slack/Webhook│
                    │Notifications │
                    └──────────────┘
\`\`\`

## 🧪 Testing

\`\`\`bash
# Health check
curl http://localhost:3000/health

# Add account
curl -X POST http://localhost:3000/api/accounts \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"name\": \"My Gmail\",
    \"host\": \"imap.gmail.com\",
    \"port\": 993,
    \"username\": \"your-email@gmail.com\",
    \"password\": \"your-app-password\",
    \"useTls\": true
  }'

# Start sync
curl -X POST http://localhost:3000/api/accounts/1/sync

# Search emails
curl -X POST http://localhost:3000/api/emails/search \\
  -H \"Content-Type: application/json\" \\
  -d '{\"query\": \"meeting\", \"page\": 1, \"size\": 10}'
\`\`\`

## 📝 License

MIT

## 👤 Author

**Dpruddh44**
- GitHub: [@Dpruddh44](https://github.com/Dpruddh44)

---

⭐ Star this repo if you find it useful!
"@ | Out-File -FilePath README.md -Encoding utf8