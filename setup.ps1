# Setup Script for Translation Office (Windows)
# Re-created by combining user requirements and best practices.

$ErrorActionPreference = "Stop"

function Write-Header {
    param($Text, $Color = "Cyan")
    Write-Host "`n" + ("=" * 60) -ForegroundColor $Color
    Write-Host " $Text" -ForegroundColor White -BackgroundColor Blue
    Write-Host ("=" * 60) + "`n" -ForegroundColor $Color
}

function Write-Step {
    param($Text)
    Write-Host ">>> $Text" -ForegroundColor Cyan
}

function Check-And-Install {
    param($Command, $Name, $InstallCmd)
    Write-Host "Checking for $Name..." -NoNewline
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        Write-Host " Found." -ForegroundColor Green
        return $true
    }
    else {
        Write-Host " Not found." -ForegroundColor Red
        $choice = Read-Host "Do you want to install $Name via Winget? (y/n/skip)"
        if ($choice -eq 'y') {
            Write-Host "Running: $InstallCmd"
            Invoke-Expression $InstallCmd
            return $true
        }
        elseif ($choice -eq 'skip') {
            return $false
        }
        throw "Missing required dependency: $Name. Please install it to continue."
    }
}

Write-Header "TRANSLATION OFFICE - FULL STACK SETUP"

# 1. Dependency Checks (PHP, Composer, Node.js)
Write-Step "Dependency Checks"
Check-And-Install "php" "PHP" "winget install PHP.PHP"
Check-And-Install "composer" "Composer" "winget install PHP.Composer --silent"
Check-And-Install "npm" "Node.js/NPM" "winget install OpenJS.NodeJS --silent"

# Refresh path for current session if things were installed
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# 2. Setup Environment
Write-Header "CONFIGURATION" "Yellow"
$env_mode = Read-Host "Environment Mode (dev / prod) [default: dev]"
if ($env_mode -ne "prod") { $env_mode = "dev" }
Write-Host "Target mode: $env_mode" -ForegroundColor Yellow

# 3. Backend Setup
Write-Header "BACKEND SETUP"
if (Test-Path "backend") {
    Set-Location "backend"
    
    Write-Step "Configuring .env file..."
    if (-not (Test-Path ".env")) {
        if (Test-Path "env.example") {
            Copy-Item "env.example" ".env"
            Write-Host "Created .env from env.example" -ForegroundColor Green
        }
        elseif (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "Created .env from .env.example" -ForegroundColor Green
        }
    }

    $db_conn = Read-Host "Database Connection (mysql/sqlite/pgsql) [mysql]"
    if ([string]::IsNullOrWhiteSpace($db_conn)) { $db_conn = "mysql" }

    $db_name = Read-Host "Database Name [db_tmsoffice]"
    if ([string]::IsNullOrWhiteSpace($db_name)) { $db_name = "db_tmsoffice" }

    $db_user = Read-Host "Database User [root]"
    if ([string]::IsNullOrWhiteSpace($db_user)) { $db_user = "root" }

    $db_pass = Read-Host "Database Password []"

    # SMTP Prompt
    Write-Host "`nEmail/SMTP Configuration:"
    $smtp_host = Read-Host "SMTP Host [127.0.0.1]"
    if ([string]::IsNullOrWhiteSpace($smtp_host)) { $smtp_host = "127.0.0.1" }
    $smtp_port = Read-Host "SMTP Port [2525]"
    if ([string]::IsNullOrWhiteSpace($smtp_port)) { $smtp_port = "2525" }
    $smtp_user = Read-Host "SMTP User"
    $smtp_pass = Read-Host "SMTP Password"

    # Update .env
    $app_env = if ($env_mode -eq 'prod') { 'production' } else { 'local' }
    $app_debug = if ($env_mode -eq 'prod') { 'false' } else { 'true' }
    
    $content = Get-Content ".env"
    $content = $content -replace '^APP_ENV=.*', "APP_ENV=$app_env"
    $content = $content -replace '^APP_DEBUG=.*', "APP_DEBUG=$app_debug"
    $content = $content -replace '^DB_CONNECTION=.*', "DB_CONNECTION=$db_conn"
    $content = $content -replace '^DB_DATABASE=.*', "DB_DATABASE=$db_name"
    $content = $content -replace '^DB_USERNAME=.*', "DB_USERNAME=$db_user"
    $content = $content -replace '^DB_PASSWORD=.*', "DB_PASSWORD=$db_pass"
    $content = $content -replace '^MAIL_HOST=.*', "MAIL_HOST=$smtp_host"
    $content = $content -replace '^MAIL_PORT=.*', "MAIL_PORT=$smtp_port"
    $content = $content -replace '^MAIL_USERNAME=.*', "MAIL_USERNAME=$smtp_user"
    $content = $content -replace '^MAIL_PASSWORD=.*', "MAIL_PASSWORD=$smtp_pass"
    $content | Set-Content ".env"

    Write-Step "Installing PHP Dependencies (Composer)..."
    composer install

    Write-Step "Installing Node Dependencies for Backend..."
    npm install

    Write-Step "Generating Application Key..."
    php artisan key:generate

    Write-Step "Database Migration..."
    $migrate = Read-Host "Run migrations now? (y/n)"
    if ($migrate -eq 'y') {
        php artisan migrate --force
    }

    Set-Location ".."
}
else {
    Write-Host "Error: 'backend' directory not found!" -ForegroundColor Red
}

# 4. Frontend Setup
Write-Header "FRONTEND SETUP"
if (Test-Path "frontend") {
    Set-Location "frontend"
    
    if (-not (Test-Path ".env")) {
        Write-Step "Creating frontend .env..."
        "VITE_API_BASE_URL=http://localhost:8000/api`nVITE_APP_URL=http://localhost:8000" | Set-Content ".env"
    }

    Write-Step "Installing Frontend Dependencies..."
    npm install

    if ($env_mode -eq "prod") {
        Write-Step "Building frontend for production..."
        npm run build
    }

    Set-Location ".."
}
else {
    Write-Host "Error: 'frontend' directory not found!" -ForegroundColor Red
}

Write-Header "SETUP COMPLETE!" "Green"
Write-Host "You can now start the application:"
Write-Host "1. Backend: cd backend && php artisan serve"
Write-Host "2. Frontend: cd frontend && npm run dev"
Write-Host "===================================================="
