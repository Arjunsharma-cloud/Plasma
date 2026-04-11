# Event Management System - Microservices Architecture

## Video Demonstration

https://www.youtube.com/watch?v=QTxJAg4zKBA

---

## Overview

This project is a microservices-based Event Management System built using Go, PostgreSQL, Redis, and Next.js. It supports user authentication, event creation, team management, and registrations with scalability and fault isolation.

---

## System Architecture

```
CLIENT (Browser/Postman)
        │
        ▼
LOAD BALANCER (NGINX :80)
        │
        ▼
API GATEWAY (Go :8080-8082)
        │
        ▼
RATE LIMITER (Go + Redis :8085)
        │
 ┌──────┼───────────────┬───────────────┐
 ▼      ▼               ▼               ▼
AUTH   EVENT        REGISTRATION    (Future Services)
SERVICE SERVICE      SERVICE
```

Each service owns its own database:

- Auth Service → `auth_db`
- Event Service → `event_db`
- Registration Service → `registration_db`

---

## Features

### Backend

- Microservices architecture with independent services
- JWT-based authentication
- Rate limiting using Redis (sliding window)
- Load balancing via NGINX (round-robin)
- Database per service (PostgreSQL)
- Docker-based deployment
- Health checks for all services

### Frontend

- User authentication (login/register)
- Event discovery and filtering
- Team management
- Event registration
- Organizer dashboard
- Notifications system

---

## Technology Stack

| Component             | Technology            | Port      |
|----------------------|---------------------|-----------|
| Load Balancer        | NGINX               | 80        |
| API Gateway          | Go (Gorilla Mux)    | 8080-8082 |
| Rate Limiter         | Go + Redis          | 8085      |
| Auth Service         | Go + PostgreSQL     | 8082      |
| Event Service        | Go + PostgreSQL     | 8083      |
| Registration Service | Go + PostgreSQL     | 8084      |
| Redis Cache          | Redis 7             | 6379      |
| Databases            | PostgreSQL 15       | 5432-5434 |
| Frontend             | Next.js + Tailwind  | 3000      |

---

## API Endpoints

### Base URLs

- Load Balancer: `http://localhost`
- API Gateway: `http://localhost:8080`
- Auth Service: `http://localhost:8082`
- Event Service: `http://localhost:8083`
- Registration Service: `http://localhost:8084`

---

## Auth Service APIs

### Register User

```
POST /api/auth/register
```

```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "college": "MIT University"
}
```

### Login

```
POST /api/auth/login
```

### Get Profile

```
GET /api/auth/profile/{user_id}
```

### Update Profile

```
PUT /api/auth/profile/{user_id}
```

---

## Event Service APIs

### Create Event

```
POST /api/events
```

```json
{
  "title": "Hackathon",
  "description": "Build solutions",
  "event_date": "2024-12-15T10:00:00Z",
  "capacity": 100,
  "location": "Convention Center"
}
```

---

## Registration Service APIs

### Create Team

```
POST /api/teams
```

### Register Team

```
POST /api/registrations
```

---

## Database Schema

### Auth DB

```
users (user_id, email, password_hash)
user_profiles (user_id, first_name, last_name)
```

### Event DB

```
events (event_id, title, capacity, location)
hosts (host_id, name, email)
organizations (org_id, org_name)
```

### Registration DB

```
teams (team_id, event_id)
team_members (team_id, user_id)
registrations (registration_id, status)
```

---

## Environment Variables

```
AUTH_SERVICE_URL=http://auth-service:8082
EVENT_SERVICE_URL=http://event-service:8083
REGISTRATION_SERVICE_URL=http://registration-service:8084

REDIS_ADDR=redis:6379

MAX_REQUESTS_PER_SECOND=100
```

---

## Docker Commands

### Start Services

```
docker-compose up -d
```

### Stop Services

```
docker-compose down
```

### Rebuild

```
docker-compose build --no-cache
docker-compose up -d
```

---

## Testing

### Health Checks

```
curl http://localhost/health
```

### Sample Flow

1. Register user  
2. Login  
3. Create event  
4. Create team  
5. Register team  

---

## Notes

- Each microservice is independently deployable
- Communication can be synchronous (REST) or asynchronous (Pub/Sub)
- Rate limiting prevents abuse
- Designed for scalability and fault isolation
