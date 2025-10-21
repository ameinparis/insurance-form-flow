from flask import Flask, request, jsonify
import xlwings as xw
import os
import time
import sys

app = Flask(__name__)

EXCEL_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'sheets', 'funeral.xlsm')
)

if not os.path.exists(EXCEL_FILE):
    print(f"❌ Excel file not found at: {EXCEL_FILE}", file=sys.stderr)
else:
    print(f"✅ Using Excel file: {EXCEL_FILE}")


@app.route('/health', methods=['GET'])
def health_check():
    if not os.path.exists(EXCEL_FILE):
        return jsonify({"status": "error", "message": "Missing funeral.xlsm"}), 500
    return jsonify({"status": "ok", "message": "funeral.xlsm found"})


@app.route('/calculate', methods=['POST'])
def calculate_funeral():
    try:
        data = request.get_json()
        members = data.get('members', [])
        inputs = data.get('inputs', {})

        print("📥 Received request to calculate funeral quote")
        print(f"📊 Received {len(members)} members")
        print(f"🧾 Inputs: {inputs}")

        if not members:
            return jsonify({"error": "No member data provided"}), 400

        app_excel = xw.App(visible=False)
        wb = app_excel.books.open(EXCEL_FILE)

        # --- Write members ---
        member_sheet = wb.sheets['MemberData']
        member_sheet.range("A2:F1000").clear_contents()

        for idx, member in enumerate(members):
            row = idx + 2
            member_sheet.range(f"A{row}").value = member.get("memberNumber")
            member_sheet.range(f"B{row}").value = member.get("surname")
            member_sheet.range(f"C{row}").value = member.get("firstName")
            member_sheet.range(f"D{row}").value = member.get("dob")
            member_sheet.range(f"E{row}").value = member.get("relationship")
            member_sheet.range(f"F{row}").value = member.get("gender")

        print("🧍 Member data written to MemberData sheet")

        # --- Write inputs ---
        input_sheet = wb.sheets['InputSheet']
        input_sheet.range("I6").value = float(inputs.get("profitTarget", 0)) / 100
        input_sheet.range("I7").value = inputs.get("societyName", "")
        input_sheet.range("I8").value = float(inputs.get("asAndWhenCommission", 0)) / 100
        input_sheet.range("I9").value = inputs.get("schemeType", "")
        input_sheet.range("I11").value = int(inputs.get("maxExtendedFamilyMembers") or 0)
        input_sheet.range("I12").value = int(inputs.get("maxAgeChildren") or 0)
        input_sheet.range("I13").value = int(inputs.get("currentMaxAgeChild") or 0)

        print("📝 Basic inputs written to InputSheet")

        cover_type = inputs.get("coverLevelType", "")
        if cover_type == "scheme-rules":
            input_sheet.range("I14").value = "Scheme rules benefits"
            input_sheet.range("I17").value = float(inputs.get("principalMemberCover", 0))
            input_sheet.range("I18").value = float(inputs.get("spouseCover", 0))
            input_sheet.range("I19").value = float(inputs.get("children16toMax", 0))
            input_sheet.range("I20").value = float(inputs.get("children6to15", 0))
            input_sheet.range("I21").value = float(inputs.get("children1to5", 0))
            input_sheet.range("I22").value = float(inputs.get("children0to1", 0))
            input_sheet.range("I25").value = float(inputs.get("extendedFamilyCover", 0))
            input_sheet.range("I26").value = float(inputs.get("parentsCover", 0))

            print("📘 Scheme-rules cover levels written")
        else:
            input_sheet.range("I14").value = "Member specified"
            print("📘 Member-specified selected (no fixed cover levels)")

        print("⚙️ Running Excel macro 'Pricing'...")
        wb.macro("Pricing")()
        wb.app.calculate()
        time.sleep(1)
        print("✅ Macro executed and workbook calculated")

        # --- Extract Premiums ---
        premium_sheet = wb.sheets['PremiumResults']

        # Get Quote Name from C2
        quote_name = premium_sheet.range("C2").value or ""

        # Extract values
        total_premiums = premium_sheet.range("D7:D11").value or []
        beneficiary_counts = premium_sheet.range("E7:E11").value or []
        per_member_premiums = premium_sheet.range("F7:F11").value or []

        # Try to read statuses, fallback if needed
        member_statuses = premium_sheet.range("C7:C11").value or []
        if any(s is None for s in member_statuses) or len(member_statuses) < 5:
            member_statuses = [
                "Principal member",
                "Spouse",
                "Child",
                "Adult dependent",
                "Extended"
            ]

        # Build premium output
        premium_output = {
            "quoteName": quote_name,
            "rows": []
        }
        for i in range(len(member_statuses)):
            row = {
                "status": member_statuses[i],
                "total": total_premiums[i] if i < len(total_premiums) else None,
                "count": beneficiary_counts[i] if i < len(beneficiary_counts) else None,
                "perMember": per_member_premiums[i] if i < len(per_member_premiums) else None
            }
            premium_output["rows"].append(row)


        print("📤 Premium output extracted:", premium_output)


        wb.close()
        app_excel.quit()

        return jsonify({ "output": premium_output })

    except Exception as e:
        print(f"❌ Exception during calculation: {e}")
        return jsonify({"error": str(e)}), 500
