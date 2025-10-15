from flask import Flask, request, jsonify
import xlwings as xw
import os
import time
import sys

app = Flask(__name__)

EXCEL_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'sheets', 'funeral.xlsm')
)

# Sanity check
if not os.path.exists(EXCEL_FILE):
    print(f"❌ Excel file not found at: {EXCEL_FILE}", file=sys.stderr)
else:
    print(f"✅ Using Excel file: {EXCEL_FILE}")


@app.route('/health', methods=['GET'])
def health_check():
    """Check Excel file presence only."""
    if not os.path.exists(EXCEL_FILE):
        return jsonify({"status": "error", "message": "Missing funeral.xlsm"}), 500
    return jsonify({"status": "ok", "message": "funeral.xlsm found"})


@app.route('/calculate', methods=['POST'])
def calculate_funeral():
    try:
        data = request.get_json()
        members = data.get('members', [])
        inputs = data.get('inputs', {})

        if not members:
            return jsonify({"error": "No member data provided"}), 400

        app_excel = xw.App(visible=False)
        wb = app_excel.books.open(EXCEL_FILE)

        # --- Write members ---
        member_sheet = wb.sheets['MemberData']
        member_sheet.range("A2:F1000").clear_contents()

        for idx, member in enumerate(members):
            row = idx + 2  # Start from row 2 (below header)
            member_sheet.range(f"A{row}").value = member.get("memberNumber")
            member_sheet.range(f"B{row}").value = member.get("surname")
            member_sheet.range(f"C{row}").value = member.get("firstName")
            member_sheet.range(f"D{row}").value = member.get("dob")
            member_sheet.range(f"E{row}").value = member.get("relationship")
            member_sheet.range(f"F{row}").value = member.get("gender")



        # --- Write inputs ---
        input_sheet = wb.sheets['InputSheet']
        input_sheet.range("I6").value = float(inputs.get("profitTarget", 0))
        input_sheet.range("I7").value = inputs.get("societyName", "")
        input_sheet.range("I8").value = float(inputs.get("asAndWhenCommission", 0))
        input_sheet.range("I9").value = inputs.get("schemeType", "")
        input_sheet.range("I10").value = int(inputs.get("maxExtendedFamilyMembers", 0))
        input_sheet.range("I11").value = int(inputs.get("maxAgeChildren", 0))
        input_sheet.range("I12").value = int(inputs.get("currentMaxAgeChild", 0))

        cover_type = inputs.get("coverLevelType", "")
        if cover_type == "scheme-rules":
            input_sheet.range("I14").value = "Scheme rules benefits"
            input_sheet.range("I17").value = float(inputs.get("principalMemberCover", 0))
            input_sheet.range("I18").value = float(inputs.get("principalMemberCover", 0))
            input_sheet.range("I19").value = float(inputs.get("children16toMax", 0))
            input_sheet.range("I20").value = float(inputs.get("children6to15", 0))
            input_sheet.range("I21").value = float(inputs.get("children1to5", 0))
            input_sheet.range("I22").value = float(inputs.get("children0to1", 0))
            input_sheet.range("I23").value = float(inputs.get("principalMemberCover", 0))
            input_sheet.range("I24").value = float(inputs.get("parentsCover", 0))
        else:
            input_sheet.range("I14").value = "Member specified"

        # --- Run macro ---
        wb.macro("Pricing")()
        wb.app.calculate()
        time.sleep(1)

        # --- Read result ---
        premium_sheet = wb.sheets['PremiumResults']
        total_premium = premium_sheet.range("B2").value

        wb.close()
        app_excel.quit()

        return jsonify({
            "output": {
                "total_premium": round(float(total_premium or 0), 2)
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
