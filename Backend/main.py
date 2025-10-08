import sys
import io
from waitress import serve
from calculations.livingannuity import app
from calculations.lifefuneral import app
import logging

# Fix Windows encoding issues
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

def run_server():
    try:
        logger = logging.getLogger('waitress')
        logger.info("Starting production server via Waitress on port 5005...")
        
        serve(
            app,
            host='0.0.0.0',
            port=5005,
            threads=4,  # Optimal for most Excel workloads
            ident=None  # Important for PM2 compatibility
        )
    except Exception as e:
        logging.critical(f"Server failed: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    run_server()