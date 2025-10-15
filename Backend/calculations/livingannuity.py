from flask import Flask, request, jsonify
import xlwings as xw
import os
import time
import sys

app = Flask(__name__)
# Path to annuity.xlsm inside sheets folder
EXCEL_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'sheets', 'annuity.xlsm')
    
)
# Sanity check
if not os.path.exists(EXCEL_FILE):
    print(f" Excel file not found at: {EXCEL_FILE}", file=sys.stderr)
else:
    print(f"Using Excel file: {EXCEL_FILE}")

# Health check endpoint
@app.route('/health', methods=['GET'])
def deep_health_check():
    """Check if Excel file + sheets/macros are accessible."""
    if not os.path.exists(EXCEL_FILE):
        return jsonify({"status": "error", "message": f"Excel file not found at {EXCEL_FILE}"}), 500

    try:
        app_excel = xw.App(visible=False)
        wb = app_excel.books.open(EXCEL_FILE)

        # Verify sheet names
        sheets = [s.name for s in wb.sheets]
        required_sheets = ["LivingAnnuity", "LifeAnnuity"]
        missing_sheets = [s for s in required_sheets if s not in sheets]

        wb.close()
        app_excel.quit()

        if missing_sheets:
            return jsonify({
                "status": "error",
                "message": f"Missing required sheets: {missing_sheets}"
            }), 500

        return jsonify({
            "status": "ok",
            "message": "Excel file and required sheets found",
            "sheets": sheets
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/calculatesss', methods=['POST'])
def calculate_annuity():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
            
        data = request.get_json()
        annuity_type = data.get('annuityType')

        # Validate required fields
        if not all([annuity_type, data.get('age'), data.get('purchaseAmount')]):
            return jsonify({"error": "Missing required parameters"}), 400

        print("\n Starting calculation...")
        print(f"Annuity Type: {annuity_type}")
        
        app_excel = None
        try:
            app_excel = xw.App(visible=False)
            wb = app_excel.books.open(EXCEL_FILE)
            
            if annuity_type == "combined":
                return handle_combined_annuity(wb, data)
            else:
                return handle_life_annuity(wb, data)
                
        except Exception as e:
            print(f"Error: {str(e)}", file=sys.stderr)
            return jsonify({"error": str(e)}), 500
        finally:
            if app_excel:
                wb.close()
                app_excel.quit()

    except Exception as e:
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        return jsonify({"error": "Internal server error"}), 500

def handle_combined_annuity(wb, data):
    sheet = wb.sheets['LivingAnnuity']
    age = data['age']
    amount = data['purchaseAmount']
    drawdown = data.get('drawdown', 5)  # Default 5%
    guaranteed_age = data.get('guaranteedStartAge', 75)  # Default 75
    frequency = data.get('frequency', 'Monthly')

    # Set inputs
    sheet.range('C3').value = age
    sheet.range('C4').value = amount
    sheet.range('C5').value = drawdown / 100  # Convert 5 to 0.05
    sheet.range('C6').value = guaranteed_age
    sheet.range('C7').value = frequency

    print("Running Macro: GoalSeek_RAAfterLA")
    print(f"Inputs → Age: {age}, Amount: {amount}, Drawdown: {drawdown}%")
    print(f"Guaranteed Age: {guaranteed_age}, Frequency: {frequency}")

    # Run macro and recalculate
    wb.macro("GoalSeek_RAAfterLA")()
    wb.app.calculate()
    time.sleep(1)  # Allow Excel to process

    # Get outputs
    result = {
        "guarantee_period": int(sheet.range('C9').value),
        "guaranteed_annuity": round(float(sheet.range('C10').value), 2),
        "funds_remaining": round(float(sheet.range('C11').value), 2),
        "retirement_annuity": round(float(sheet.range('C12').value), 2)
    }

    print("Results:", result)
    return jsonify({"output": result})

def handle_life_annuity(wb, data):
    sheet = wb.sheets['LifeAnnuity']
    sheet.range('C3').value = data['age']
    sheet.range('C4').value = data['purchaseAmount']
    sheet.range('C5').value = "Monthly"  # Force Monthly

    wb.macro("GoalSeekLifeAnnuity")()
    wb.app.calculate()

    result = {
        "monthly_annuity": round(float(sheet.range('C10').value), 2)
    }

    print("Life Annuity Result:", result)
    return jsonify({"output": result})

