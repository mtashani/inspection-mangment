# Quick setup script for Inspection Management System Frontend (PowerShell)
# This script will set up the development environment and run initial tests

param(
    [Parameter(Position=0)]
    [ValidateSet("setup", "install", "test", "build", "dev")]
    [string]$Action = "setup"
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Logging functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Check if Node.js is installed
function Test-Node {
    Write-Info "Checking Node.js installation..."
    
    try {
        $nodeVersion = node --version
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        
        if ($versionNumber -lt 18) {
            Write-Error "Node.js version $nodeVersion is not supported. Please install Node.js 18 or higher."
            exit 1
        }
        
        Write-Success "Node.js $nodeVersion is installed"
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    }
}

# Check if npm is installed
function Test-Npm {
    Write-Info "Checking npm installation..."
    
    try {
        $npmVersion = npm --version
        Write-Success "npm $npmVersion is installed"
    }
    catch {
        Write-Error "npm is not installed. Please install npm."
        exit 1
    }
}

# Install dependencies
function Install-Dependencies {
    Write-Info "Installing dependencies..."
    
    try {
        if (Test-Path "package-lock.json") {
            npm ci
        } else {
            npm install
        }
        Write-Success "Dependencies installed successfully"
    }
    catch {
        Write-Error "Failed to install dependencies"
        exit 1
    }
}

# Set up environment file
function Set-Environment {
    Write-Info "Setting up environment configuration..."
    
    if (-not (Test-Path ".env.local")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env.local"
            Write-Success "Created .env.local from .env.example"
            Write-Warning "Please edit .env.local with your actual configuration values"
        } else {
            Write-Warning ".env.example not found, creating basic .env.local"
            
            $envContent = @"
# Basic configuration for development
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="Inspection Management System"
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_ENABLE_PWA=true
"@
            
            Set-Content -Path ".env.local" -Value $envContent
            Write-Success "Created basic .env.local file"
        }
    } else {
        Write-Info ".env.local already exists, skipping creation"
    }
}

# Run linting
function Invoke-Lint {
    Write-Info "Running ESLint..."
    
    try {
        npm run lint
        Write-Success "Linting passed"
    }
    catch {
        Write-Warning "Linting issues found. Run 'npm run lint:fix' to auto-fix some issues"
    }
}

# Run type checking
function Invoke-TypeCheck {
    Write-Info "Running TypeScript type checking..."
    
    try {
        npx tsc --noEmit
        Write-Success "Type checking passed"
    }
    catch {
        Write-Error "Type checking failed. Please fix TypeScript errors"
        throw
    }
}

# Run tests
function Invoke-Tests {
    Write-Info "Running tests..."
    
    # Run unit tests
    Write-Info "Running unit tests..."
    try {
        npm run test:unit -- --watchAll=false
        Write-Success "Unit tests passed"
    }
    catch {
        Write-Warning "Some unit tests failed"
    }
    
    # Run integration tests
    Write-Info "Running integration tests..."
    try {
        npm run test:integration -- --watchAll=false
        Write-Success "Integration tests passed"
    }
    catch {
        Write-Warning "Some integration tests failed"
    }
}

# Build the application
function Build-App {
    Write-Info "Building the application..."
    
    try {
        npm run build
        Write-Success "Build completed successfully"
    }
    catch {
        Write-Error "Build failed"
        throw
    }
}

# Start development server
function Start-DevServer {
    Write-Info "Starting development server..."
    Write-Info "The application will be available at http://localhost:3000"
    Write-Info "Press Ctrl+C to stop the server"
    
    npm run dev
}

# Main setup function
function Invoke-Setup {
    Write-Host "🚀 Setting up Inspection Management System Frontend" -ForegroundColor $Colors.Blue
    Write-Host "==================================================" -ForegroundColor $Colors.Blue
    
    # Change to script directory
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    Set-Location (Join-Path $scriptPath "..")
    
    # Run setup steps
    Test-Node
    Test-Npm
    Install-Dependencies
    Set-Environment
    Invoke-Lint
    Invoke-TypeCheck
    
    # Ask user what they want to do next
    Write-Host ""
    Write-Info "Setup completed! What would you like to do next?"
    Write-Host "1) Run tests"
    Write-Host "2) Build the application"
    Write-Host "3) Start development server"
    Write-Host "4) Exit"
    
    $choice = Read-Host "Enter your choice (1-4)"
    
    switch ($choice) {
        "1" {
            Invoke-Tests
        }
        "2" {
            Build-App
        }
        "3" {
            Start-DevServer
        }
        "4" {
            Write-Info "Setup complete! You can now run:"
            Write-Host "  npm run dev    # Start development server"
            Write-Host "  npm test       # Run tests"
            Write-Host "  npm run build  # Build for production"
        }
        default {
            Write-Warning "Invalid choice. Exiting..."
        }
    }
}

# Handle script arguments
switch ($Action) {
    "setup" {
        Invoke-Setup
    }
    "install" {
        Test-Node
        Test-Npm
        Install-Dependencies
    }
    "test" {
        Invoke-Tests
    }
    "build" {
        Build-App
    }
    "dev" {
        Start-DevServer
    }
    default {
        Write-Host "Usage: .\setup.ps1 [setup|install|test|build|dev]"
        Write-Host "  setup   - Full setup process (default)"
        Write-Host "  install - Install dependencies only"
        Write-Host "  test    - Run tests only"
        Write-Host "  build   - Build application only"
        Write-Host "  dev     - Start development server"
    }
}