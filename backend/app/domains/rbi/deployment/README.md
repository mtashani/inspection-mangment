# RBI System Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Risk-Based Inspection (RBI) Calculation System across different environments.

## System Requirements

### Minimum Requirements
- Python 3.8 or higher
- 2 GB RAM
- 5 GB available disk space
- Network connectivity (for external integrations)

### Recommended Requirements
- Python 3.10 or higher
- 4 GB RAM
- 10 GB available disk space
- PostgreSQL 12+ (for production environments)

## Supported Environments

### Development
- **Purpose**: Local development and testing
- **Database**: SQLite
- **Security**: Minimal (authentication disabled)
- **Performance**: Basic settings
- **Logging**: Debug level with console output

### Testing
- **Purpose**: Automated testing and CI/CD
- **Database**: SQLite (in-memory or file)
- **Security**: Basic authentication enabled
- **Performance**: Limited resources
- **Logging**: Warning level only

### Staging
- **Purpose**: Pre-production testing and validation
- **Database**: PostgreSQL with SSL
- **Security**: Full authentication and authorization
- **Performance**: Production-like settings
- **Logging**: Info level to files

### Production
- **Purpose**: Live production system
- **Database**: PostgreSQL with SSL and encryption
- **Security**: Full security features enabled
- **Performance**: Optimized for high throughput
- **Logging**: Warning level with rotation

## Quick Start

### 1. Basic Development Deployment

```bash
# Navigate to deployment directory
cd backend/app/domains/rbi/deployment

# Run deployment for development environment
python deploy.py --environment development
```

### 2. Production Deployment

```bash
# Set environment variables
export RBI_ENVIRONMENT=production
export DB_HOST=your-db-host
export DB_NAME=rbi_production
export DB_USER=rbi_user
export DB_PASSWORD=your-secure-password
export JWT_SECRET_KEY=your-jwt-secret-key

# Validate environment first
python deploy.py --environment production --validate-only

# Deploy if validation passes
python deploy.py --environment production
```

## Deployment Process

### Phase 1: Environment Validation
- Python version check
- System resources verification
- Network connectivity test
- Configuration validation
- Prerequisites verification

### Phase 2: Directory Setup
- Create required directories (`logs`, `data`, `temp`, `backups`)
- Set appropriate permissions
- Verify write access

### Phase 3: Database Setup
- Database connection validation
- Schema creation/migration
- Initial data seeding
- User permissions setup

### Phase 4: Security Configuration
- Authentication setup
- Authorization rules
- Audit trail configuration
- Encryption settings (if enabled)

### Phase 5: System Initialization
- Core components initialization
- Health checks
- Performance metrics setup
- Integration services startup

## Configuration

### Environment Variables

#### Database Configuration
```bash
DB_HOST=localhost          # Database host
DB_PORT=5432              # Database port
DB_NAME=rbi_system        # Database name
DB_USER=rbi_user          # Database username
DB_PASSWORD=secure_pass   # Database password
```

#### Security Configuration
```bash
JWT_SECRET_KEY=your-secret-key    # JWT signing key
RBI_ENVIRONMENT=production        # Deployment environment
```

#### API Configuration
```bash
RBI_API_HOST=0.0.0.0     # API bind address
RBI_API_PORT=8000        # API port
RBI_API_WORKERS=4        # Number of worker processes
```

### Configuration Files

#### Development Configuration
```python
# Automatically configured for development
config = DeploymentConfig(DeploymentEnvironment.DEVELOPMENT)
```

#### Custom Configuration
```python
from app.domains.rbi.deployment.deployment_config import DeploymentConfig

# Create custom configuration
config = DeploymentConfig.from_environment("production")

# Modify specific settings
config.performance.max_concurrent_calculations = 20
config.security.enable_encryption = True

# Validate configuration
errors = config.validate()
if errors:
    print("Configuration errors:", errors)
```

## Deployment Commands

### Basic Commands

```bash
# Deploy to development environment
python deploy.py --environment development

# Deploy to production environment
python deploy.py --environment production

# Validate environment only (no deployment)
python deploy.py --environment production --validate-only

# Generate deployment report
python deploy.py --environment staging --output-report staging_report.json

# Quiet deployment (minimal output)
python deploy.py --environment production --quiet
```

### Advanced Commands

```bash
# Skip prerequisites validation
python deploy.py --environment development --skip-prerequisites

# Custom output report location
python deploy.py --environment production --output-report /path/to/report.json

# Help and usage information
python deploy.py --help
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check system health
curl http://localhost:8000/health

# Verify API endpoints
curl http://localhost:8000/api/v1/system/info

# Test calculation endpoint
curl -X POST http://localhost:8000/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"equipment_id": "TEST-001", "calculation_type": "rbi"}'
```

### 2. Monitor System

```bash
# Check logs
tail -f logs/rbi_system.log

# Monitor system resources
htop  # or Task Manager on Windows

# Check database connections
# (Database-specific commands)
```

### 3. Backup Configuration

```bash
# Backup configuration files
cp -r config/ backups/config_$(date +%Y%m%d)/

# Backup database (PostgreSQL example)
pg_dump rbi_production > backups/db_backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```
Error: Database connectivity check failed
```

**Solutions:**
- Verify database server is running
- Check connection parameters (host, port, credentials)
- Ensure database exists and user has proper permissions
- Test network connectivity to database server

#### 2. Port Already in Use
```
Error: Port 8000 is not available
```

**Solutions:**
- Change API port in configuration
- Stop service using the port
- Use `netstat` or `lsof` to identify conflicting process

#### 3. Permission Denied
```
Error: Permission denied when creating directories
```

**Solutions:**
- Run deployment with appropriate permissions
- Check directory ownership and permissions
- Ensure user has write access to deployment location

#### 4. Missing Dependencies
```
Error: Module 'xyz' not found
```

**Solutions:**
- Install required Python packages: `pip install -r requirements.txt`
- Verify Python environment is activated
- Check Python path configuration

### Log Analysis

#### Log Locations
- Development: `logs/rbi_dev.log`
- Testing: `logs/rbi_test.log`
- Staging: `logs/rbi_staging.log`
- Production: `logs/rbi_production.log`

#### Log Levels
- **DEBUG**: Detailed diagnostic information
- **INFO**: General operational messages
- **WARNING**: Warning messages for potential issues
- **ERROR**: Error messages for failures
- **CRITICAL**: Critical errors requiring immediate attention

### Performance Tuning

#### Database Optimization
```sql
-- PostgreSQL optimization examples
CREATE INDEX idx_equipment_id ON calculations(equipment_id);
CREATE INDEX idx_calculation_date ON calculations(calculation_date);

-- Connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
```

#### Application Optimization
```python
# Increase concurrent calculations for high-load environments
config.performance.max_concurrent_calculations = 50

# Adjust timeout for complex calculations
config.performance.calculation_timeout_seconds = 60

# Enable caching for better performance
config.performance.cache_enabled = True
config.performance.cache_ttl_minutes = 30
```

## Security Considerations

### Production Security Checklist

- [ ] Strong JWT secret key configured
- [ ] Database connections use SSL/TLS
- [ ] Authentication and authorization enabled
- [ ] Audit trail enabled and configured
- [ ] Regular security updates applied
- [ ] Network access properly restricted
- [ ] Backup encryption enabled
- [ ] Log files properly secured

### Security Best Practices

1. **Use strong, unique passwords** for all accounts
2. **Enable SSL/TLS** for all network communications
3. **Regularly update** system components and dependencies
4. **Monitor audit logs** for suspicious activities
5. **Implement proper backup** and disaster recovery procedures
6. **Restrict network access** using firewalls and VPNs
7. **Use environment variables** for sensitive configuration
8. **Regular security assessments** and penetration testing

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor system health and performance
- Check error logs for issues
- Verify backup completion

#### Weekly
- Review audit trail logs
- Update system metrics dashboards
- Check disk space and cleanup old logs

#### Monthly
- Apply security updates
- Review and rotate log files
- Performance optimization review
- Backup verification and testing

#### Quarterly
- Full system health assessment
- Security audit and review
- Disaster recovery testing
- Configuration review and updates

### Backup and Recovery

#### Backup Strategy
```bash
#!/bin/bash
# Daily backup script example

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/rbi_system/$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
pg_dump rbi_production > "$BACKUP_DIR/database.sql"

# Backup configuration
cp -r config/ "$BACKUP_DIR/config/"

# Backup logs (last 7 days)
find logs/ -name "*.log" -mtime -7 -exec cp {} "$BACKUP_DIR/logs/" \;

# Compress backup
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

#### Recovery Procedures
1. **Stop the RBI system service**
2. **Restore database from backup**
3. **Restore configuration files**
4. **Verify system integrity**
5. **Start system and perform health checks**
6. **Validate functionality with test calculations**

## Support and Documentation

### Getting Help
- Check this deployment guide first
- Review system logs for error details
- Consult the API documentation
- Contact system administrator

### Additional Resources
- API Documentation: `/docs` endpoint when system is running
- System Health Dashboard: `/health` endpoint
- Configuration Reference: `deployment_config.py`
- Example Configurations: `examples/` directory

### Version Information
- **System Version**: 1.0.0
- **Deployment Guide Version**: 1.0.0
- **Last Updated**: 2025-01-01

---

For additional support or questions, please contact the system administrator or refer to the project documentation.