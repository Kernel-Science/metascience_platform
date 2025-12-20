#!/bin/bash
# Quick deployment helper script for Render

echo "🚀 Preparing for Render deployment..."

# Check if .python-version exists
if [ ! -f ".python-version" ]; then
    echo "❌ .python-version not found!"
    exit 1
fi
echo "✅ Python version: $(cat .python-version)"

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found!"
    exit 1
fi
echo "✅ render.yaml found"

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found!"
    exit 1
fi
echo "✅ requirements.txt found"

# Check if server.py exists
if [ ! -f "server.py" ]; then
    echo "❌ server.py not found!"
    exit 1
fi
echo "✅ server.py found"

# Check environment variables (optional - for local testing)
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Warning: ANTHROPIC_API_KEY not set in environment"
    echo "   (This is OK - set it in Render dashboard after deployment)"
fi

if [ -z "$GOOGLE_API_KEY" ]; then
    echo "⚠️  Warning: GOOGLE_API_KEY not set in environment"
    echo "   (This is OK - set it in Render dashboard after deployment)"
fi

echo ""
echo "✨ All deployment files are ready!"
echo ""
echo "Next steps:"
echo "1. git add .python-version render.yaml RENDER_DEPLOYMENT.md"
echo "2. git commit -m 'Add Render deployment configuration'"
echo "3. git push"
echo "4. Go to https://dashboard.render.com/ and create a new Blueprint"
echo "5. Connect your repository and Render will auto-deploy"
echo ""
echo "📖 For detailed instructions, see: RENDER_DEPLOYMENT.md"

