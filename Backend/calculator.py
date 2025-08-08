from flask import Flask, request, jsonify
import xlwings as xw
import os
import time

app = Flask(__name__)
EXCEL_FILE = os.path.join(os.getcwd(), 'annuity.xlsm')

@app.route('/calculate', methods=['POST'])
def calculate_annuity():
    data = request.json
    annuity_type = data.get('annuityType')

    age = data.get('age')
    amount = data.get('purchaseAmount')
    frequency = data.get('frequency')

    app_excel = xw.App(visible=False)
    wb = app_excel.books.open(EXCEL_FILE)

    if annuity_type == "combined":
        sheet = wb.sheets['LivingAnnuity']
        drawdown = data.get('drawdown')
        guaranteed_age = data.get('guaranteedStartAge')

        # Set inputs
        sheet.range('C3').value = age
        sheet.range('C4').value = amount
        sheet.range('C5').value = drawdown / 100  # Convert 5 to 0.05
        sheet.range('C6').value = guaranteed_age
        sheet.range('C7').value = frequency

        print("🔧 Running Macro: GoalSeek_RAAfterLA")
        print(f"Inputs → Age: {age}, Amount: {amount}, Drawdown: {drawdown}, Guaranteed Age: {guaranteed_age}, Frequency: {frequency}")
        print("C42 (Debug):", sheet.range("C42").value)

        # Run macro and recalculate
        wb.macro("GoalSeek_RAAfterLA")()
        wb.app.calculate()
        time.sleep(1)  # Optional: give Excel time to resolve everything

        # Get output values
        guarantee_period = int(sheet.range('C9').value)
        guaranteed_annuity = round(float(sheet.range('C10').value), 2)
        funds_remaining = round(float(sheet.range('C11').value), 2)
        retirement_annuity = round(float(sheet.range('C12').value), 2)


        result = {
            "guarantee_period": guarantee_period,
            "guaranteed_annuity": guaranteed_annuity,
            "funds_remaining": funds_remaining,
            "retirement_annuity": retirement_annuity,
        }

        print("✅ Excel Output:")
        for k, v in result.items():
            print(f"{k}: {v}")

    else:
        sheet = wb.sheets['LifeAnnuity']
        sheet.range('C3').value = age
        sheet.range('C4').value = amount
        sheet.range('C5').value = "Monthly"  # 👈 Force Monthly regardless of what frontend sends

        wb.macro("GoalSeekLifeAnnuity")()
        wb.app.calculate()

        result = {
            "monthly_annuity": round(float(sheet.range('C9').value), 2)
        }

        print("Life Annuity Output:")
        print(result)


    wb.close()
    app_excel.quit()

    return jsonify({"output": result})

if __name__ == '__main__':
    app.run(port=5005, debug=True)

