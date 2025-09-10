#!/usr/bin/env python3
"""RBI System Deployment Script"""

import os
import sys
import json
import asyncio
import argparse
from pathlib import Path
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from app.domains.rbi.deployment.setup import DeploymentSetup, deploy_rbi_system
from app.domains.rbi.deployment.deployment_config import get_deployment_config, DeploymentEnvironment


def print_banner():
    """Print deployment banner"""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║              RBI System Deployment Tool                      ║
    ║                                                              ║
    ║              Risk-Based Inspection Calculation System       ║
    ║                         Version 1.0.0                       ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def print_section(title: str):
    """Print section header"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")


def print_status(message: str, status: str = "INFO"):
    """Print status message"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_colors = {
        "INFO": "\033[94m",    # Blue
        "SUCCESS": "\033[92m", # Green
        "WARNING": "\033[93m", # Yellow
        "ERROR": "\033[91m",   # Red
        "RESET": "\033[0m"     # Reset
    }
    
    color = status_colors.get(status, status_colors["INFO"])
    reset = status_colors["RESET"]
    
    print(f"[{timestamp}] {color}[{status}]{reset} {message}")


def validate_prerequisites():
    """Validate deployment prerequisites"""
    print_section("Prerequisites Validation")
    
    errors = []
    warnings = []
    
    # Python version check
    python_version = sys.version_info
    if python_version >= (3, 8):
        print_status(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro}", "SUCCESS")
    else:
        print_status(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro} (Required: 3.8+)", "ERROR")
        errors.append("Python 3.8+ is required")
    
    # Check required directories
    required_dirs = ["logs", "data", "temp"]
    for dir_name in required_dirs:
        if Path(dir_name).exists():
            print_status(f"Directory '{dir_name}' exists", "SUCCESS")
        else:
            print_status(f"Directory '{dir_name}' will be created", "WARNING")
            warnings.append(f"Directory '{dir_name}' does not exist")
    
    # Check disk space (basic check)
    try:
        import shutil
        total, used, free = shutil.disk_usage(".")
        free_gb = free // (1024**3)
        if free_gb >= 1:
            print_status(f"Available disk space: {free_gb} GB", "SUCCESS")
        else:
            print_status(f"Available disk space: {free_gb} GB (Low)", "WARNING")
            warnings.append("Low disk space available")
    except Exception as e:
        print_status(f"Could not check disk space: {str(e)}", "WARNING")
        warnings.append("Could not verify disk space")
    
    return errors, warnings


def display_configuration(config):
    """Display deployment configuration"""
    print_section("Deployment Configuration")
    
    print(f"Environment: {config.environment.value}")
    print(f"Debug Mode: {config.debug}")
    print(f"API Host: {config.api_host}")
    print(f"API Port: {config.api_port}")
    print(f"Database Type: {config.database.type.value}")
    print(f"Max Concurrent Calculations: {config.performance.max_concurrent_calculations}")
    print(f"Authentication Enabled: {config.security.enable_authentication}")
    print(f"Audit Trail Enabled: {config.security.enable_audit_trail}")
    print(f"Logging Level: {config.logging.level}")


def save_deployment_report(report: dict, output_file: str = None):
    """Save deployment report to file"""
    if output_file is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"deployment_report_{timestamp}.json"
    
    try:
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        print_status(f"Deployment report saved to: {output_file}", "SUCCESS")
    except Exception as e:
        print_status(f"Failed to save deployment report: {str(e)}", "ERROR")


def display_deployment_results(report: dict):
    """Display deployment results"""
    print_section("Deployment Results")
    
    overall_status = report.get('deployment_summary', {}).get('overall_status', 'unknown')
    
    if overall_status == 'completed_successfully':
        print_status("Deployment completed successfully!", "SUCCESS")
    elif overall_status == 'completed_with_warnings':
        print_status("Deployment completed with warnings", "WARNING")
    elif overall_status == 'failed':
        print_status("Deployment failed", "ERROR")
    else:
        print_status(f"Deployment status: {overall_status}", "INFO")
    
    # Display setup results
    setup_results = report.get('setup_results', {})
    
    for step_name, step_result in setup_results.items():
        if isinstance(step_result, dict) and 'status' in step_result:
            status = step_result['status']
            if status == 'success':
                print_status(f"{step_name.replace('_', ' ').title()}: Success", "SUCCESS")
            elif status == 'error':
                print_status(f"{step_name.replace('_', ' ').title()}: Error", "ERROR")
                errors = step_result.get('errors', [])
                for error in errors:
                    print_status(f"  - {error}", "ERROR")
            elif status == 'warning':
                print_status(f"{step_name.replace('_', ' ').title()}: Warning", "WARNING")
    
    # Display recommendations
    recommendations = report.get('recommendations', [])
    if recommendations:
        print_section("Recommendations")
        for rec in recommendations:
            print_status(rec, "INFO")
    
    # Display next steps
    next_steps = report.get('next_steps', [])
    if next_steps:
        print_section("Next Steps")
        for step in next_steps:
            print_status(step, "INFO")


async def main():
    """Main deployment function"""
    parser = argparse.ArgumentParser(
        description="RBI System Deployment Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python deploy.py --environment development
  python deploy.py --environment production --validate-only
  python deploy.py --environment staging --output-report staging_deployment.json
        """
    )
    
    parser.add_argument(
        "--environment", "-e",
        choices=["development", "testing", "staging", "production"],
        default="development",
        help="Deployment environment (default: development)"
    )
    
    parser.add_argument(
        "--validate-only", "-v",
        action="store_true",
        help="Only validate environment without performing deployment"
    )
    
    parser.add_argument(
        "--skip-prerequisites",
        action="store_true",
        help="Skip prerequisites validation"
    )
    
    parser.add_argument(
        "--output-report", "-o",
        help="Output file for deployment report"
    )
    
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Quiet mode - minimal output"
    )
    
    args = parser.parse_args()
    
    if not args.quiet:
        print_banner()
    
    try:
        # Load configuration
        config = get_deployment_config(args.environment)
        
        if not args.quiet:
            display_configuration(config)
        
        # Validate prerequisites
        if not args.skip_prerequisites:
            errors, warnings = validate_prerequisites()
            
            if errors:
                print_status("Prerequisites validation failed", "ERROR")
                for error in errors:
                    print_status(f"  - {error}", "ERROR")
                return 1
            
            if warnings and not args.quiet:
                print_status("Prerequisites validation completed with warnings", "WARNING")
                for warning in warnings:
                    print_status(f"  - {warning}", "WARNING")
        
        # Perform deployment or validation
        if args.validate_only:
            print_section("Environment Validation")
            setup = DeploymentSetup(config)
            validation_result = setup.validate_environment()
            
            if validation_result['overall_status'] == 'pass':
                print_status("Environment validation passed", "SUCCESS")
                return 0
            elif validation_result['overall_status'] == 'warning':
                print_status("Environment validation passed with warnings", "WARNING")
                for warning in validation_result.get('warnings', []):
                    print_status(f"  - {warning}", "WARNING")
                return 0
            else:
                print_status("Environment validation failed", "ERROR")
                for error in validation_result.get('errors', []):
                    print_status(f"  - {error}", "ERROR")
                return 1
        
        else:
            # Full deployment
            print_section("Starting Deployment")
            print_status(f"Deploying RBI system for {args.environment} environment", "INFO")
            
            deployment_report = await deploy_rbi_system(args.environment)
            
            if not args.quiet:
                display_deployment_results(deployment_report)
            
            # Save deployment report
            if args.output_report or not args.quiet:
                save_deployment_report(deployment_report, args.output_report)
            
            # Determine exit code
            overall_status = deployment_report.get('deployment_summary', {}).get('overall_status', 'unknown')
            
            if overall_status == 'completed_successfully':
                return 0
            elif overall_status == 'completed_with_warnings':
                return 0
            else:
                return 1
    
    except KeyboardInterrupt:
        print_status("Deployment interrupted by user", "WARNING")
        return 130
    
    except Exception as e:
        print_status(f"Deployment failed with error: {str(e)}", "ERROR")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)