# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

매일일독 (Maeil1Dok) is a Bible reading tracking application for 높은뜻 푸른교회. It helps users systematically complete Bible reading with a 45-week reading schedule.

## Tech Stack

**Backend:**
- Django 4.2+ with Django REST Framework
- MySQL 8.0 database
- JWT authentication (djangorestframework-simplejwt)
- OAuth2 integration (Kakao, Google)

**Frontend:**
- Nuxt 3 with Vue 3
- Pinia for state management  
- Tailwind CSS for styling
- Axios for API calls

**Infrastructure:**
- Docker and Docker Compose for containerization
- Three containers: MySQL DB, Django backend, Nuxt frontend

## Development Commands

### Frontend (in `/frontend` directory)
```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start production server
npm run start
```

### Backend (in `/backend` directory)
```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Run tests
python manage.py test
```

### Docker Compose (from root)
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild containers
docker-compose build
```

## Architecture

### Backend Structure
- `accounts/` - User authentication and profile management
- `todos/` - Bible reading schedule and progress tracking
- `config/` - Django settings and root URL configuration
- API endpoints are versioned under `/api/v1/`

### Frontend Structure
- `pages/` - Nuxt page components with file-based routing
  - `auth/` - Authentication related pages
  - `admin/` - Admin functionality
  - `reading.vue` - Main reading tracking interface
- `components/` - Reusable Vue components
- `stores/` - Pinia state management stores
- `composables/` - Vue composition functions
- `server/middleware/` - Server-side middleware (proxy)

### Key Features
- Bible reading schedule management (`DailyBibleSchedule` model)
- User progress tracking (`UserBibleProgress` model)
- Multiple reading plans support (`BibleReadingPlan` model)
- Social login integration (Kakao, Google OAuth)
- PWA support (in development)

## Environment Configuration

Required environment variables:
- Backend: `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`
- Frontend: `KAKAO_CLIENT_ID`, `KAKAO_JS_KEY`, `GOOGLE_CLIENT_ID`, API endpoints

## API Structure

Main API endpoints:
- `/api/v1/auth/` - Authentication (login, token refresh)
- `/api/v1/todos/` - Bible reading schedules and progress
- `/api/v1/accounts/` - User profile management

## Database Models

Key models:
- `User` - Custom user model with nickname and profile image
- `DailyBibleSchedule` - Daily Bible reading assignments
- `UserBibleProgress` - Tracks user's reading completion
- `BibleReadingPlan` - Different reading plan options
- `PlanSubscription` - User's plan subscriptions