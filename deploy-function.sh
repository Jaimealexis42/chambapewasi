#!/bin/bash

# PresupIA Edge Function Deployment Script
# This script deploys the validar-analisis function to Supabase

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ID="tnrqdyagfecceeebocvn"
PROJECT_URL="https://${PROJECT_ID}.supabase.co"

echo "================================"
echo "PresupIA Edge Function Deployment"
echo "================================"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Project URL: $PROJECT_URL"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"
echo ""

# Check if authenticated
echo "Checking authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not authenticated with Supabase"
    echo ""
    echo "Run: supabase login"
    echo "Then: supabase link --project-ref $PROJECT_ID"
    exit 1
fi

echo "✅ Authenticated with Supabase"
echo ""

# Navigate to project directory
cd "$PROJECT_DIR"

# Run migrations
echo "📦 Running database migrations..."
if supabase migration up; then
    echo "✅ Migrations completed"
else
    echo "⚠️  Migration check (may already be applied)"
fi

echo ""

# Deploy the function
echo "🚀 Deploying Edge Function: validar-analisis"
if supabase functions deploy validar-analisis; then
    echo "✅ Function deployed successfully!"
    echo ""
    echo "Function URL:"
    echo "   $PROJECT_URL/functions/v1/validar-analisis"
    echo ""

    # Test the function
    echo "🧪 Testing function..."
    RESPONSE=$(curl -s -X POST "$PROJECT_URL/functions/v1/validar-analisis" \
      -H "Content-Type: application/json" \
      -d '{"user_id": null, "device_id": "test-device-'"$(date +%s)"'"}')

    if echo "$RESPONSE" | grep -q "permitido"; then
        echo "✅ Function is working!"
        echo "Response: $RESPONSE"
    else
        echo "⚠️  Function deployed but test failed"
        echo "Check logs: supabase functions logs validar-analisis"
        exit 1
    fi

    echo ""
    echo "================================"
    echo "✅ Deployment Complete!"
    echo "================================"
    echo ""
    echo "Next steps:"
    echo "1. Test with the app: npm run android / npm run ios"
    echo "2. Try: Create account → Do 3 analyses → 4th should fail"
    echo "3. Monitor: supabase functions logs validar-analisis"
    echo ""
else
    echo "❌ Function deployment failed"
    echo "Check logs: supabase functions logs validar-analisis"
    exit 1
fi
