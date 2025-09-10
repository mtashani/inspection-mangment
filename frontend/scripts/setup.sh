#!/bin/bash

# Quick setup script for Inspection Management System Frontend
# This script will set up the development environment and run initial tests

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    log_info "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version $NODE_VERSION is not supported. Please install Node.js 18 or higher."
        exit 1
    fi
    
    log_success "Node.js $(node --version) is installed"
}

# Check if npm is installed
check_npm() {
    log_info "Checking npm installation..."
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    log_success "npm $(npm --version) is installed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    log_success "Dependencies installed successfully"
}

# Set up environment file
setup_environment() {
    log_info "Setting up environment configuration..."
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            log_success "Created .env.local from .env.example"
            log_warning "Please edit .env.local with your actual configuration values"
        else
            log_warning ".env.example not found, creating basic .env.local"
            cat > .env.local << EOF
# Basic configuration for development
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="Inspection Management System"
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_ENABLE_PWA=true
EOF
            log_success "Created basic .env.local file"
        fi
    else
        log_info ".env.local already exists, skipping creation"
    fi
}

# Run linting
run_lint() {
    log_info "Running ESLint..."
    
    if npm run lint; then
        log_success "Linting passed"
    else
        log_warning "Linting issues found. Run 'npm run lint:fix' to auto-fix some issues"
    fi
}

# Run type checking
run_type_check() {
    log_info "Running TypeScript type checking..."
    
    if npx tsc --noEmit; then
        log_success "Type checking passed"
    else
        log_error "Type checking failed. Please fix TypeScript errors"
        return 1
    fi
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Run unit tests
    log_info "Running unit tests..."
    if npm run test:unit -- --watchAll=false; then
        log_success "Unit tests passed"
    else
        log_warning "Some unit tests failed"
    fi
    
    # Run integration tests
    log_info "Running integration tests..."
    if npm run test:integration -- --watchAll=false; then
        log_success "Integration tests passed"
    else
        log_warning "Some integration tests failed"
    fi
}

# Build the application
build_app() {
    log_info "Building the application..."
    
    if npm run build; then
        log_success "Build completed successfully"
    else
        log_error "Build failed"
        return 1
    fi
}

# Start development server
start_dev_server() {
    log_info "Starting development server..."
    log_info "The application will be available at http://localhost:3000"
    log_info "Press Ctrl+C to stop the server"
    
    npm run dev
}

# Main setup function
main() {
    echo "🚀 Setting up Inspection Management System Frontend"
    echo "=================================================="
    
    # Change to script directory
    cd "$(dirname "$0")/.."
    
    # Run setup steps
    check_node
    check_npm
    install_dependencies
    setup_environment
    run_lint
    run_type_check
    
    # Ask user what they want to do next
    echo ""
    log_info "Setup completed! What would you like to do next?"
    echo "1) Run tests"
    echo "2) Build the application"
    echo "3) Start development server"
    echo "4) Exit"
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            run_tests
            ;;
        2)
            build_app
            ;;
        3)
            start_dev_server
            ;;
        4)
            log_info "Setup complete! You can now run:"
            echo "  npm run dev    # Start development server"
            echo "  npm test       # Run tests"
            echo "  npm run build  # Build for production"
            ;;
        *)
            log_warning "Invalid choice. Exiting..."
            ;;
    esac
}

# Handle script arguments
case "${1:-setup}" in
    setup)
        main
        ;;
    install)
        check_node
        check_npm
        install_dependencies
        ;;
    test)
        run_tests
        ;;
    build)
        build_app
        ;;
    dev)
        start_dev_server
        ;;
    *)
        echo "Usage: $0 {setup|install|test|build|dev}"
        echo "  setup   - Full setup process (default)"
        echo "  install - Install dependencies only"
        echo "  test    - Run tests only"
        echo "  build   - Build application only"
        echo "  dev     - Start development server"
        exit 1
        ;;
esac