#!/bin/bash

# Deployment script for Inspection Management System Frontend
# Usage: ./scripts/deploy.sh [environment] [version]

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_REGISTRY="your-registry.com"
IMAGE_NAME="inspection-frontend"

# Default values
ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

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

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        development|staging|production)
            log_info "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if required files exist
    if [[ ! -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]]; then
        log_error "Environment file .env.$ENVIRONMENT not found"
        exit 1
    fi
    
    if [[ ! -f "$PROJECT_DIR/Dockerfile" ]]; then
        log_error "Dockerfile not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    
    cd "$PROJECT_DIR"
    
    # Build the image
    docker build \
        --build-arg BUILD_ENV="$ENVIRONMENT" \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg GIT_COMMIT="$GIT_COMMIT" \
        --build-arg VERSION="$VERSION" \
        -t "$IMAGE_NAME:$VERSION" \
        -t "$IMAGE_NAME:latest" \
        .
    
    log_success "Docker image built successfully"
}

# Tag and push image to registry
push_image() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Tagging and pushing image to registry..."
        
        # Tag for registry
        docker tag "$IMAGE_NAME:$VERSION" "$DOCKER_REGISTRY/$IMAGE_NAME:$VERSION"
        docker tag "$IMAGE_NAME:latest" "$DOCKER_REGISTRY/$IMAGE_NAME:latest"
        
        # Push to registry
        docker push "$DOCKER_REGISTRY/$IMAGE_NAME:$VERSION"
        docker push "$DOCKER_REGISTRY/$IMAGE_NAME:latest"
        
        log_success "Image pushed to registry"
    else
        log_info "Skipping registry push for $ENVIRONMENT environment"
    fi
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    cd "$PROJECT_DIR"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing dependencies..."
        npm ci
    fi
    
    # Run linting
    log_info "Running ESLint..."
    npm run lint
    
    # Run type checking
    log_info "Running TypeScript check..."
    npx tsc --noEmit
    
    # Run unit tests
    log_info "Running unit tests..."
    npm run test:ci
    
    # Run build test
    log_info "Testing build process..."
    npm run build
    
    log_success "All tests passed"
}

# Deploy to environment
deploy() {
    log_info "Deploying to $ENVIRONMENT..."
    
    case $ENVIRONMENT in
        development)
            deploy_development
            ;;
        staging)
            deploy_staging
            ;;
        production)
            deploy_production
            ;;
    esac
}

# Development deployment
deploy_development() {
    log_info "Starting development deployment..."
    
    # Use docker-compose for development
    cd "$PROJECT_DIR"
    
    # Stop existing containers
    docker-compose down
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be ready
    sleep 10
    
    # Health check
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        log_success "Development deployment successful"
    else
        log_error "Development deployment failed - health check failed"
        exit 1
    fi
}

# Staging deployment
deploy_staging() {
    log_info "Starting staging deployment..."
    
    # Deploy to staging server (example using SSH)
    if [[ -n "$STAGING_SERVER" ]]; then
        ssh "$STAGING_SERVER" << EOF
            cd /opt/inspection-system
            docker pull $DOCKER_REGISTRY/$IMAGE_NAME:$VERSION
            docker-compose -f docker-compose.staging.yml down
            docker-compose -f docker-compose.staging.yml up -d
EOF
        log_success "Staging deployment successful"
    else
        log_warning "STAGING_SERVER not configured, skipping remote deployment"
    fi
}

# Production deployment
deploy_production() {
    log_info "Starting production deployment..."
    
    # Confirmation prompt for production
    read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
    if [[ $confirm != "yes" ]]; then
        log_info "Production deployment cancelled"
        exit 0
    fi
    
    # Deploy to production servers (example using SSH)
    if [[ -n "$PRODUCTION_SERVERS" ]]; then
        IFS=',' read -ra SERVERS <<< "$PRODUCTION_SERVERS"
        for server in "${SERVERS[@]}"; do
            log_info "Deploying to $server..."
            ssh "$server" << EOF
                cd /opt/inspection-system
                docker pull $DOCKER_REGISTRY/$IMAGE_NAME:$VERSION
                docker-compose -f docker-compose.production.yml down
                docker-compose -f docker-compose.production.yml up -d
EOF
        done
        log_success "Production deployment successful"
    else
        log_warning "PRODUCTION_SERVERS not configured, skipping remote deployment"
    fi
}

# Rollback function
rollback() {
    local rollback_version="${1:-previous}"
    log_info "Rolling back to version: $rollback_version"
    
    case $ENVIRONMENT in
        staging|production)
            if [[ -n "$STAGING_SERVER" || -n "$PRODUCTION_SERVERS" ]]; then
                # Implement rollback logic here
                log_info "Rollback functionality would be implemented here"
            fi
            ;;
        *)
            log_info "Rollback not applicable for $ENVIRONMENT"
            ;;
    esac
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old versions (keep last 5)
    docker images "$IMAGE_NAME" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +2 | sort -k2 -r | tail -n +6 | awk '{print $1}' | \
        xargs -r docker rmi
    
    log_success "Cleanup completed"
}

# Main deployment flow
main() {
    log_info "Starting deployment process..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    log_info "Git Commit: $GIT_COMMIT"
    log_info "Build Date: $BUILD_DATE"
    
    validate_environment
    check_prerequisites
    
    # Skip tests for development environment
    if [[ "$ENVIRONMENT" != "development" ]]; then
        run_tests
    fi
    
    build_image
    push_image
    deploy
    cleanup
    
    log_success "Deployment completed successfully!"
    log_info "Application should be available at the configured URL"
}

# Handle script arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    rollback)
        rollback "$2"
        ;;
    cleanup)
        cleanup
        ;;
    test)
        run_tests
        ;;
    build)
        validate_environment
        check_prerequisites
        build_image
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|cleanup|test|build} [environment] [version]"
        echo "  deploy   - Full deployment process (default)"
        echo "  rollback - Rollback to previous version"
        echo "  cleanup  - Clean up old Docker images"
        echo "  test     - Run tests only"
        echo "  build    - Build Docker image only"
        echo ""
        echo "Environments: development, staging, production"
        exit 1
        ;;
esac