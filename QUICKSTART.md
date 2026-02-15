# 🚀 Quick Start Guide - Data Dictionary Agent

Get your Intelligent Data Dictionary Agent up and running in 15 minutes!

## Prerequisites Checklist

- [ ] Python 3.11 or higher installed
- [ ] Node.js 18 or higher installed
- [ ] Git installed
- [ ] A database to connect to (PostgreSQL, MySQL, SQL Server, or Snowflake)
- [ ] Anthropic API key (get free credits at https://console.anthropic.com)

## Step-by-Step Setup

### 1️⃣ Backend Setup (5 minutes)

```bash
# Navigate to backend directory
cd intelligent-data-dictionary-agent/backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

**Edit `.env` file:**

```env
# REQUIRED: Generate secure keys (32+ characters each)
SECRET_KEY=change-this-to-a-random-string-min-32-chars
ENCRYPTION_KEY=another-random-32-character-str!!

# OPTIONAL: Set global API key (can also be set per user)
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# These can stay as defaults
DATABASE_URL=sqlite:///./data_dictionary.db
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
DEBUG=True
LOG_LEVEL=INFO
```

**Generate secure keys (recommended):**

```python
# Run this in Python to generate random keys
import secrets
print("SECRET_KEY:", secrets.token_urlsafe(32))
print("ENCRYPTION_KEY:", secrets.token_urlsafe(24))  # Will be padded to 32
```

**Start the backend:**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ **Backend running at http://localhost:8000**
📚 **API docs available at http://localhost:8000/docs**

### 2️⃣ Frontend Setup (3 minutes)

Open a NEW terminal window:

```bash
# Navigate to frontend directory
cd intelligent-data-dictionary-agent/frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**The `.env` file should contain:**

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Data Dictionary Agent
```

**Start the frontend:**

```bash
npm run dev
```

✅ **Frontend running at http://localhost:3000**

### 3️⃣ First-Time User Setup (5 minutes)

1. **Open your browser** → http://localhost:3000

2. **Sign Up**
   - Click "Sign Up"
   - Enter your name, email, and password (min 8 characters)
   - Click "Create Account"

3. **Get Anthropic API Key** (if not set globally)
   - Visit https://console.anthropic.com
   - Sign up for free credits
   - Create an API key
   - Copy the key (starts with `sk-ant-...`)

4. **Set API Key** (skip if set in backend .env)
   - In the app, go to Settings → API Key
   - Paste your Anthropic API key
   - Click "Save"

5. **Add Database Connection**
   - Click "New Connection"
   - Fill in your database details:
     * **Name**: My Production DB
     * **Type**: PostgreSQL (or your DB type)
     * **Host**: localhost (or your DB host)
     * **Port**: 5432 (or your DB port)
     * **Database**: your_database_name
     * **Username**: your_username
     * **Password**: your_password
   - Click "Test Connection"
   - If successful, click "Save"

6. **Generate Your First Dictionary**
   - Click "Generate Dictionary"
   - Select your connection
   - Check "Include AI Descriptions" ✅
   - Check "Include Quality Analysis" ✅
   - Click "Generate"
   - Wait 1-3 minutes (depends on database size)

7. **Explore Your Data**
   - Click "View Dictionary"
   - Browse tables and columns
   - Read AI-generated descriptions
   - Check quality scores
   - Try the Chat feature!

## 🎉 You're All Set!

### What to Try Next

1. **Chat with Your Schema**
   - Ask: "What tables contain user data?"
   - Ask: "Show me the customers table schema"
   - Ask: "Which tables have quality issues?"

2. **Export Documentation**
   - Download as JSON for integration
   - Download as Markdown for docs

3. **Add More Connections**
   - Connect multiple databases
   - Compare schemas across environments

## 🐛 Troubleshooting

### Backend Won't Start

**Error: "Module not found"**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Error: "SECRET_KEY not found"**
```bash
# Make sure .env file exists in backend/ directory
# Check that .env contains SECRET_KEY and ENCRYPTION_KEY
```

### Frontend Won't Start

**Error: "Cannot find module"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Error: "VITE_API_URL not defined"**
```bash
# Make sure .env file exists in frontend/ directory
# Check that .env contains VITE_API_URL
```

### Connection Test Fails

1. **Check database is running**
2. **Verify credentials are correct**
3. **Check firewall allows connections**
4. **For PostgreSQL**: ensure `postgresql` driver is installed
5. **For MySQL**: ensure `mysql-connector-python` is installed

### AI Descriptions Not Working

1. **Check API key is set** (in app Settings or backend .env)
2. **Verify API key is valid** (test at https://console.anthropic.com)
3. **Check you have API credits** remaining
4. **Look for errors** in backend logs

## 📖 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [Backend README](backend/README.md) for API details
- Check [Frontend README](frontend/README.md) for UI development
- Explore the API at http://localhost:8000/docs

## 💡 Pro Tips

1. **Use Read-Only Credentials**: For database connections, use read-only accounts for safety

2. **Start Small**: Test with a small database first (5-10 tables)

3. **Quality Analysis**: Focus on tables with quality issues to improve data

4. **Chat Feature**: Use natural language to discover insights about your data

5. **Export Documentation**: Share Markdown exports with your team

## 🆘 Need Help?

- Check the [troubleshooting section](#-troubleshooting)
- Review error messages in backend terminal
- Check browser console for frontend errors
- Verify all services are running
- Read the detailed README files

## ✅ Success Checklist

- [ ] Backend running at http://localhost:8000
- [ ] Frontend running at http://localhost:3000
- [ ] Created user account
- [ ] Set Anthropic API key
- [ ] Added database connection
- [ ] Generated first dictionary
- [ ] Viewed dictionary successfully
- [ ] Tried chat interface

**Congratulations! You're ready to document your databases with AI! 🎊**
