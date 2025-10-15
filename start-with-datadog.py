#!/usr/bin/env python3
"""
Script to start the FastAPI application with Datadog monitoring.
"""
import os
import sys
import subprocess
from pathlib import Path

def setup_datadog():
    """Setup Datadog environment variables and start the application."""
    
    # Check if DD_API_KEY is set
    if not os.getenv('DD_API_KEY'):
        print("❌ DD_API_KEY environment variable not set!")
        print("Please set your Datadog API key:")
        print("export DD_API_KEY=your_api_key_here")
        return False
    
    # Set default Datadog environment variables
    datadog_env = {
        'DD_SITE': os.getenv('DD_SITE', 'datadoghq.com'),
        'DD_SERVICE': os.getenv('DD_SERVICE', 'video-membership-api'),
        'DD_ENV': os.getenv('DD_ENV', 'development'),
        'DD_VERSION': os.getenv('DD_VERSION', '1.0.0'),
        'DD_TRACE_ENABLED': 'true',
        'DD_LOGS_ENABLED': 'true',
        'DD_RUNTIME_METRICS_ENABLED': 'true',
    }
    
    # Update environment
    for key, value in datadog_env.items():
        os.environ[key] = value
    
    print("✅ Datadog environment configured")
    print(f"   Service: {os.environ['DD_SERVICE']}")
    print(f"   Environment: {os.environ['DD_ENV']}")
    print(f"   Site: {os.environ['DD_SITE']}")
    
    return True

def install_dependencies():
    """Install required dependencies."""
    print("📦 Installing Datadog dependencies...")
    
    try:
        subprocess.run([
            sys.executable, '-m', 'pip', 'install', 
            'ddtrace', 'datadog', 'psutil'
        ], check=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def start_application():
    """Start the FastAPI application with Datadog tracing."""
    print("🚀 Starting FastAPI application with Datadog monitoring...")
    
    try:
        # Start with ddtrace-run
        subprocess.run([
            'ddtrace-run', 'uvicorn', 'app.main:app', 
            '--reload', '--host', '0.0.0.0', '--port', '8000'
        ], cwd=Path(__file__).parent)
    except KeyboardInterrupt:
        print("\n👋 Application stopped")
    except Exception as e:
        print(f"❌ Failed to start application: {e}")

def main():
    """Main function."""
    print("🔍 Datadog Setup for Video Membership Project")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path('app/main.py').exists():
        print("❌ Please run this script from the video-membership directory")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Setup Datadog
    if not setup_datadog():
        sys.exit(1)
    
    # Start application
    start_application()

if __name__ == "__main__":
    main()
