#!/bin/bash
# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"
# Wait for MongoDB to be ready
echo "Waiting for MongoDB..."
while ! nc -z mongodb 27017; do
  sleep 0.1
done
echo "MongoDB started"
# Wait for Redis to be ready
echo "Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 0.1
done
echo "Redis started"
# Run database migrations
echo "Running database migrations..."
alembic upgrade head
# Start the application
echo "Starting application..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload