from waitress import serve
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from calculations.livingannuity import app as living_annuity_app
from calculations.lifefuneral import app as life_funeral_app
import logging

def create_combined_app():
    return DispatcherMiddleware(
        life_funeral_app,  # fallback/default app
        {
            '/annuity': living_annuity_app,
            '/funeral': life_funeral_app,
        }
    )

def run_server():
    try:
        logging.info("Running production server on port 5005...")
        serve(create_combined_app(), host='0.0.0.0', port=5005, threads=4, ident=None)
    except Exception as e:
        logging.critical(f"Server failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    run_server()
