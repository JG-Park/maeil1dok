FROM node:18-alpine

WORKDIR /app

# 환경 변수 설정 (기본값은 development)
ENV NODE_ENV=development

# Install dependencies
COPY package*.json ./

# npm ci를 사용하여 더 안정적인 의존성 설치
RUN npm ci

# Copy project files
COPY . .

# 개발 환경과 운영 환경을 구분하여 빌드 진행
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm run build; \
    fi

# Expose port
EXPOSE 3000

# Start command는 docker-compose.yml에서 결정됨
CMD ["npm", "run", "dev"] 