#!/bin/sh

echo "Waiting for database..."
while ! nc -z db 3306; do
  sleep 1
done
echo "Database is ready!"

echo "Running migrations..."
python manage.py migrate

echo "Running user profile migration..."
python manage.py migrate_user_profiles || echo "Profile migration skipped or already done"

echo "Starting server..."
python manage.py runserver 0.0.0.0:8000