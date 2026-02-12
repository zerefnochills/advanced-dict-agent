# Data Dictionary Agent - Backend

AI-powered Data Dictionary Agent backend built with FastAPI and Python.

## Features

- 🔐 **Authentication**: Secure JWT-based authentication with bcrypt password hashing
- 🔌 **Multi-Database Support**: PostgreSQL, MySQL, SQL Server, Snowflake
- 🤖 **AI-Powered Descriptions**: Claude API integration for intelligent documentation
- 📊 **Data Quality Analysis**: Automatic quality metrics and issue detection
- 💬 **Chat Interface**: Natural language queries about your database schema
- 📤 **Export Functionality**: JSON and Markdown export formats

## Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## Installation

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

```env
# Required
SECRET_KEY=your-secret-key-min-32-characters-change-this
ENCRYPTION_KEY=your-32-byte-encryption-key-here!!

# Optional - can be set per user in the application
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Customize if needed
DATABASE_URL=sqlite:///./data_dictionary.db
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Important Security Notes:**
- `SECRET_KEY`: Used for JWT token signing. Generate a secure random string (min 32 characters)
- `ENCRYPTION_KEY`: Used for encrypting database credentials. Must be exactly 32 characters
- Never commit your `.env` file to version control

### 4. Initialize Database

The database will be created automatically on first run. Tables are created using SQLAlchemy models.

## Running the Application

### Development Mode

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/api-key` - Update Anthropic API key

### Connections
- `POST /api/connections/test` - Test database connection
- `POST /api/connections` - Create new connection
- `GET /api/connections` - List all connections
- `GET /api/connections/{id}` - Get specific connection
- `DELETE /api/connections/{id}` - Delete connection
- `GET /api/connections/{id}/tables` - List tables in database

### Dictionaries
- `POST /api/dictionaries/generate` - Generate data dictionary
- `GET /api/dictionaries` - List all dictionaries
- `GET /api/dictionaries/{id}` - Get dictionary details
- `DELETE /api/dictionaries/{id}` - Delete dictionary
- `GET /api/dictionaries/{id}/export/json` - Export as JSON
- `GET /api/dictionaries/{id}/export/markdown` - Export as Markdown

### Chat
- `POST /api/chat/query` - Ask questions about schema

## Database Drivers

The application supports multiple database types. Ensure you have the appropriate drivers:

### PostgreSQL
```bash
pip install psycopg2-binary
```

### MySQL
```bash
pip install mysql-connector-python
```

### SQL Server
```bash
# Requires ODBC Driver 17 for SQL Server
pip install pyodbc
```

### Snowflake
```bash
pip install snowflake-connector-python
```

## Project Structure

```
backend/
├── app/
│   ├── auth/              # Authentication module
│   ├── connections/       # Database connection management
│   ├── dictionaries/      # Dictionary generation
│   ├── chat/             # Chat interface
│   ├── database/         # Database configuration
│   ├── services/         # Business logic services
│   ├── core/             # Core utilities (config, security)
│   └── main.py           # FastAPI application
├── tests/                # Unit tests
├── requirements.txt      # Python dependencies
└── .env.example          # Environment variables template
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds = 12
- **JWT Tokens**: Signed with HS256 algorithm
- **Credential Encryption**: AES-256 encryption for database passwords
- **API Key Encryption**: Secure storage of Anthropic API keys
- **CORS Protection**: Whitelist-based origin control

## Troubleshooting

### "Module not found" errors
Ensure virtual environment is activated and all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Database connection errors
Check that:
1. Database server is running
2. Credentials are correct
3. Firewall allows connections
4. Appropriate driver is installed

### AI description generation fails
Verify:
1. Anthropic API key is set (in .env or user settings)
2. API key is valid
3. Internet connection is available

## Development

### Adding New Database Types

1. Update `connections/schemas.py` to add new database type
2. Implement connector in `services/database_connector.py`
3. Update metadata extraction logic in `services/metadata_extractor.py`

### Running Tests

```bash
pytest tests/
```

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check API documentation at `/docs`
