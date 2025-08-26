# Graham Stephen Build Backend

Docker containerization for the Graham Stephen Build LinkedIn Comment Analysis Platform backend services.

## Overview

This backend service provides the API infrastructure for the LinkedIn comment analysis platform built with Next.js 15, featuring:

- **Next.js API Routes**: RESTful endpoints with TypeScript
- **PostgreSQL**: Primary database for structured data storage
- **Redis**: Caching layer for LinkedIn API responses and rate limiting
- **Authentication**: JWT-based authentication with NextAuth.js
- **Rate Limiting**: Redis-backed rate limiting for API protection
- **Docker**: Containerized deployment with Docker Compose

## Architecture

### Technology Stack

- **Runtime**: Node.js 20 with Next.js 15
- **Database**: PostgreSQL 16 with optimized schemas
- **Cache**: Redis 7 for session management and API caching
- **Reverse Proxy**: Nginx for load balancing and security
- **Container Platform**: Docker with multi-stage builds

### Key Components

1. **API Endpoints**: LinkedIn data extraction, user authentication, feedback collection
2. **Database Layer**: User management, session tracking, comment analysis
3. **Cache Layer**: LinkedIn API response caching, rate limit tracking
4. **Security**: JWT authentication, input validation, CORS protection

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for development)
- PostgreSQL client (optional, for database access)

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update the environment variables:
```bash
# Required: Set your LinkedIn API credentials
LINKEDIN_API_KEY=your_api_key_here

# Security: Change these secrets in production
JWT_SECRET=your_secure_jwt_secret
NEXTAUTH_SECRET=your_secure_nextauth_secret
SESSION_SECRET=your_session_secret

# Database: Update if needed
DATABASE_URL=postgresql://postgres:secure_password@postgres:5432/graham_db
```

### Development Deployment

1. Build and start all services:
```bash
docker-compose up --build
```

2. The backend API will be available at:
- **API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health
- **Database**: localhost:5432
- **Redis**: localhost:6379

### Production Deployment

1. Enable the production profile:
```bash
docker-compose --profile production up -d
```

2. This includes:
- Nginx reverse proxy on port 80/443
- SSL termination (configure certificates)
- Enhanced security headers
- Rate limiting and DDoS protection

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### LinkedIn Integration
- `POST /api/linkedin/extract-comments` - Extract comments from LinkedIn post
- `GET /api/linkedin/commenter/:id` - Get commenter details
- `POST /api/linkedin/validate-url` - Validate LinkedIn post URL

### Analysis
- `POST /api/analysis/relevance-score` - Calculate commenter relevance score
- `GET /api/analysis/session/:id` - Get analysis session details
- `PUT /api/analysis/session/:id` - Update session parameters

### Feedback
- `POST /api/feedback` - Submit user feedback on relevance scores
- `GET /api/feedback/session/:id` - Get feedback for a session

### System
- `GET /api/health` - Health check endpoint
- `GET /api/metrics` - System metrics (when enabled)

## Database Schema

### Core Tables

- **users**: User authentication and profile data
- **research_sessions**: LinkedIn post analysis sessions
- **commenters**: Individual commenter profiles and analysis
- **user_feedback**: User feedback on relevance scoring
- **api_rate_limits**: Rate limiting tracking
- **linkedin_cache**: Cached LinkedIn API responses

### Key Features

- UUID primary keys for security
- Automatic timestamp tracking
- JSONB columns for flexible data storage
- Optimized indexes for query performance
- Foreign key constraints for data integrity

## Configuration

### Docker Compose Services

#### Backend (Next.js)
- **Port**: 3000
- **Health Check**: `/api/health` endpoint
- **Dependencies**: PostgreSQL, Redis
- **Volumes**: Logs directory mounted

#### PostgreSQL
- **Port**: 5432
- **Version**: 16-alpine
- **Volumes**: Persistent data storage, initialization scripts
- **Health Check**: `pg_isready` command

#### Redis
- **Port**: 6379
- **Version**: 7-alpine
- **Configuration**: Custom redis.conf with optimizations
- **Persistence**: AOF enabled for durability

#### Nginx (Production)
- **Ports**: 80, 443
- **Features**: SSL termination, rate limiting, security headers
- **Configuration**: Optimized for Next.js applications

### Security Features

- **Rate Limiting**: API and authentication endpoint protection
- **Security Headers**: XSS, CSRF, clickjacking protection
- **Input Validation**: Zod schemas for request validation
- **Authentication**: JWT tokens with secure defaults
- **Network Isolation**: Docker network segmentation

### Performance Optimizations

- **Multi-stage Builds**: Optimized Docker images
- **Redis Caching**: LinkedIn API response caching
- **Database Indexes**: Query performance optimization
- **Connection Pooling**: Efficient database connections
- **Gzip Compression**: Reduced bandwidth usage

## Monitoring and Logging

### Health Checks
- **Application**: `/api/health` endpoint
- **Database**: PostgreSQL ready check
- **Cache**: Redis ping command
- **Container**: Docker health check integration

### Logging
- **Application Logs**: Structured JSON logging
- **Access Logs**: Nginx request logging
- **Error Logs**: Centralized error tracking
- **Log Rotation**: Automatic log management

### Metrics (Optional)
- **Endpoint**: `/api/metrics` (when enabled)
- **Format**: Prometheus-compatible metrics
- **Data**: Request rates, response times, error rates

## Development

### Local Development

1. Install dependencies:
```bash
cd ../graham
npm install
```

2. Set up local environment:
```bash
cp ../Graham\ Stephen\ Build-backend/.env.example ../graham/.env.local
```

3. Start development services:
```bash
docker-compose up postgres redis
```

4. Run the application:
```bash
cd ../graham
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Database Migrations

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d graham_db

# Run migration scripts
docker-compose exec postgres psql -U postgres -d graham_db -f /docker-entrypoint-initdb.d/01-init-database.sql
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Check if ports 3000, 5432, or 6379 are in use
   - Modify port mappings in docker-compose.yml

2. **Database Connection Issues**
   - Verify DATABASE_URL environment variable
   - Check PostgreSQL container health status
   - Ensure network connectivity between containers

3. **Redis Connection Issues**
   - Verify REDIS_URL environment variable
   - Check Redis container status and logs
   - Test connection with redis-cli

4. **LinkedIn API Issues**
   - Verify LINKEDIN_API_KEY is set correctly
   - Check rate limiting status
   - Review API response caching

### Logs Access

```bash
# View all service logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f backend
```

### Container Management

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache

# Scale backend service
docker-compose up --scale backend=3
```

## Security Considerations

### Production Checklist

- [ ] Change all default passwords and secrets
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall rules
- [ ] Set up backup procedures for PostgreSQL
- [ ] Enable monitoring and alerting
- [ ] Review and test disaster recovery procedures
- [ ] Configure log aggregation and analysis
- [ ] Set up automated security updates

### Environment Variables

Ensure all sensitive environment variables are properly secured:
- Use a secrets management system in production
- Never commit .env files to version control
- Rotate secrets regularly
- Use least-privilege principles for database access

## License

Copyright © 2024 Graham Stephen Build Team. All rights reserved.