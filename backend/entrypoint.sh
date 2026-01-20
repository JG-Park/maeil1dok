#!/bin/sh

DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-3306}

echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
while ! nc -z ${DB_HOST} ${DB_PORT}; do
  sleep 1
done
echo "Database is ready!"

echo "Running migrations..."
python manage.py migrate

echo "Starting server..."
python manage.py runserver 0.0.0.0:8000
