#!/bin/bash

set -e

echo "Running DEV migration..."

# Load environment
export $(grep -v '^#' .env.dev | xargs)

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set in .env.dev"
  exit 1
fi

# Detect schema changes
MIGRATION_SQL=$(npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script 2>&1)

CLEAN_SQL=$(echo "$MIGRATION_SQL" | grep -v "^\s*--" | tr -d '[:space:]')

if [ -z "$CLEAN_SQL" ]; then
  echo "No schema changes detected."
else
  MIGRATION_NAME="auto_$(date +%Y%m%d_%H%M%S)"
  npx prisma migrate dev --name "$MIGRATION_NAME"
fi

# Apply migrations
npx prisma migrate deploy

echo "DEV migration completed."