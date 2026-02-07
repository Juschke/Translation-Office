#!/bin/bash

echo "🔧 Complete CORS Fix - Translation Office"
echo "=========================================="
echo ""

cd /home/oem/Desktop/Translation-Office/backend

echo "1️⃣ Clearing all Laravel caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo ""
echo "2️⃣ Optimizing for development..."
php artisan config:cache

echo ""
echo "✅ Backend fixes applied!"
echo ""
echo "📋 Changes made:"
echo "   ✓ Custom CORS middleware created"
echo "   ✓ CORS enabled for API and Web routes"
echo "   ✓ Preflight OPTIONS requests handled"
echo "   ✓ Credentials support enabled"
echo "   ✓ Allowed origins: localhost:5173, localhost:3000"
echo ""
echo "🔄 IMPORTANT: Restart both servers:"
echo ""
echo "   Backend (Terminal 1):"
echo "   - Stop: Ctrl+C"
echo "   - Start: php artisan serve"
echo ""
echo "   Frontend (Terminal 2):"
echo "   - Stop: Ctrl+C  "
echo "   - Start: npm run dev"
echo ""
echo "✨ After restart, CORS errors should be resolved!"
