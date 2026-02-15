# 🚀 Intelligent Data Dictionary Agent

An AI-powered full-stack web application that automatically generates comprehensive data dictionaries with intelligent descriptions, quality metrics, and a natural language chat interface.

![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude_AI-FF6B35?style=for-the-badge)

## ✨ Features

### 🔌 Multi-Database Support
- PostgreSQL
- MySQL
- SQL Server
- Snowflake

### 🤖 AI-Powered Documentation
- Automatic table and column descriptions using Claude AI
- Business-friendly explanations
- Context-aware insights
- Usage recommendations

### 📊 Data Quality Analysis
- Completeness metrics
- Uniqueness scoring
- Null value detection
- Automated quality issue identification

### 💬 Natural Language Chat
- Ask questions about your schema in plain English
- Context-aware responses
- Suggested follow-up questions
- Conversation history

### 📤 Export Capabilities
- JSON export for integration
- Markdown export for documentation
- Shareable reports

### 🔐 Enterprise-Ready Security
- JWT-based authentication
- Bcrypt password hashing
- AES-256 credential encryption
- CORS protection

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│     Frontend (React + TypeScript + MUI)     │
│                                             │
│  Landing → Auth → Dashboard → Dictionary   │
└──────────────────┬──────────────────────────┘
                   │ REST API + JWT
┌──────────────────┴──────────────────────────┐
│       Backend (FastAPI + Python)            │
│                                             │
│  Auth → Connections → Metadata → AI        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│    Database Layer (SQLite/PostgreSQL)       │
│                                             │
│  Users → Connections → Dictionaries        │
└─────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Anthropic API key ([Get one here](https://console.anthropic.com))

### 1. Clone Repository

```bash
git clone <repository-url>
cd intelligent-data-dictionary-agent
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your SECRET_KEY and ENCRYPTION_KEY

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**

API Documentation: **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Run frontend
npm run dev
```

Frontend will be available at: **http://localhost:3000**

## 📖 Usage Guide

### 1. Sign Up

1. Navigate to http://localhost:3000
2. Click "Sign Up"
3. Create your account

### 2. Set API Key

1. Get your Anthropic API key from https://console.anthropic.com
2. In Settings, add your API key
3. This enables AI-powered descriptions

### 3. Connect Database

1. Go to Dashboard
2. Click "New Connection"
3. Enter your database credentials:
   - Connection name
   - Database type
   - Host, port, database name
   - Username and password
4. Click "Test Connection"
5. Save connection

### 4. Generate Dictionary

1. Select a connection
2. Click "Generate Dictionary"
3. Choose options:
   - ✅ Include AI descriptions
   - ✅ Include quality analysis
   - ⬜ Include sample data (slower)
4. Wait for generation to complete (1-3 minutes)

### 5. Explore Your Data

- **View Dictionary**: Browse tables, columns, and relationships
- **Quality Metrics**: See data quality scores and issues
- **AI Descriptions**: Read business-friendly explanations
- **Chat**: Ask questions like:
  - "What tables contain customer data?"
  - "Show me the schema of the orders table"
  - "Which tables have quality issues?"

### 6. Export Documentation

- Download as JSON for programmatic use
- Download as Markdown for documentation
- Share with your team

## 🎯 User Journey

```
Landing Page
    ↓
Sign Up / Login
    ↓
Welcome Modal (Setup Guide)
    ↓
Dashboard
    ↓
Add Database Connection
    ↓
Generate Dictionary
    ↓
View & Explore Data
    ↓
Chat with Schema
    ↓
Export Documentation
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/api-key` - Update API key

### Connection Endpoints

- `POST /api/connections/test` - Test connection
- `POST /api/connections` - Create connection
- `GET /api/connections` - List connections
- `GET /api/connections/{id}` - Get connection
- `DELETE /api/connections/{id}` - Delete connection

### Dictionary Endpoints

- `POST /api/dictionaries/generate` - Generate dictionary
- `GET /api/dictionaries` - List dictionaries
- `GET /api/dictionaries/{id}` - Get dictionary
- `GET /api/dictionaries/{id}/export/json` - Export JSON
- `GET /api/dictionaries/{id}/export/markdown` - Export MD

### Chat Endpoints

- `POST /api/chat/query` - Ask question

## 🔧 Configuration

### Backend Environment Variables

```env
# Security
SECRET_KEY=your-secret-key-min-32-characters
ENCRYPTION_KEY=your-32-byte-encryption-key!!

# Database
DATABASE_URL=sqlite:///./data_dictionary.db

# AI (Optional - can be set per user)
ANTHROPIC_API_KEY=sk-ant-your-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Data Dictionary Agent
```

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI
- **Database**: SQLAlchemy with SQLite/PostgreSQL
- **AI**: Anthropic Claude API
- **Auth**: JWT + bcrypt
- **Security**: Cryptography (AES-256)

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **UI Library**: Material-UI v5
- **Routing**: React Router v6
- **HTTP**: Axios
- **Build**: Vite

### Database Drivers
- psycopg2-binary (PostgreSQL)
- mysql-connector-python (MySQL)
- pyodbc (SQL Server)
- snowflake-connector-python (Snowflake)

## 📦 Project Structure

```
intelligent-data-dictionary-agent/
├── backend/
│   ├── app/
│   │   ├── auth/           # Authentication
│   │   ├── connections/    # DB connections
│   │   ├── dictionaries/   # Dictionary generation
│   │   ├── chat/           # Chat interface
│   │   ├── services/       # Business logic
│   │   └── core/           # Config & security
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # API clients
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript types
│   └── package.json
└── README.md
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🚢 Deployment

### Production Build

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist/ folder with nginx or similar
```

## 🔒 Security Best Practices

1. **Never commit** `.env` files
2. **Rotate** SECRET_KEY and ENCRYPTION_KEY regularly
3. **Use HTTPS** in production
4. **Implement** rate limiting
5. **Regular** dependency updates
6. **Database** read-only credentials when possible

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙋‍♂️ Support

- 📖 Check the [Backend README](backend/README.md)
- 📖 Check the [Frontend README](frontend/README.md)
- 🐛 Report issues on GitHub
- 📧 Contact: support@example.com

## 🎯 Roadmap

- [ ] Google BigQuery support
- [ ] Advanced data profiling
- [ ] Team collaboration features
- [ ] Scheduled dictionary updates
- [ ] Data lineage tracking
- [ ] Custom quality rules
- [ ] API documentation generator

## ⭐ Acknowledgments

- Built with Claude by Anthropic
- Material-UI for the beautiful components
- FastAPI for the amazing framework

---

Made with ❤️ using AI-powered development
