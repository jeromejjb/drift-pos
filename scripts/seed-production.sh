#!/bin/bash
# Seed the demo account into production database.
# Usage: ./scripts/seed-production.sh
# Or:    DATABASE_URL="postgresql://..." ./scripts/seed-production.sh
#
# Get DATABASE_URL from Render: drift-db → Connect → Internal Database URL

set -e
cd "$(dirname "$0")/../apps/api"

if [ -z "$DATABASE_URL" ]; then
  if [ -f "../../.env" ]; then
    set -a
    source ../../.env
    set +a
  fi
  if [ -z "$DATABASE_URL" ] && [ -n "$PROD_DATABASE_URL" ]; then
    export DATABASE_URL="$PROD_DATABASE_URL"
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL or PROD_DATABASE_URL required."
  echo "Get it from Render: drift-db → Connect → Internal Database URL"
  echo ""
  echo "Run: DATABASE_URL='postgresql://...' ./scripts/seed-production.sh"
  exit 1
fi

echo "Seeding production database..."
npx prisma db seed
echo "Done. Try logging in with demo@driftpos.com / Demo123!"
