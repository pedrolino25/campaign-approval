#!/bin/bash

set -e

echo "Running PROD migration..."

# Load environment
export $(grep -v '^#' .env.prod | xargs)

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set in .env.prod"
  exit 1
fi

# Apply committed migrations only (production-safe)
npx prisma migrate deploy

echo "PROD migration completed."