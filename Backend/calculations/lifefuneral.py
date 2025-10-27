from flask import Flask, request, jsonify
import xlwings as xw
import os
import time
import sys

app = Flask(__name__)

EXCEL_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'sheets', 'exclusive-funeral.xlsm')
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

        print("🧝 Member data written to MemberData sheet")

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

        # Set cover type in I14
        cover_type = inputs.get("coverLevelType", "")
        input_sheet.range("I14").value = (
            "Scheme rules benefits" if cover_type == "scheme-rules" else "Member specified"
        )

        def parse_number(val):
            try:
                return float(str(val).replace(",", ""))
            except:
                return 0

        input_sheet.range("I17").value = parse_number(inputs.get("principalMemberCover"))
        input_sheet.range("I18").value = parse_number(inputs.get("spouseCover"))
        input_sheet.range("I19").value = parse_number(inputs.get("children16toMax"))
        input_sheet.range("I20").value = parse_number(inputs.get("children6to15"))
        input_sheet.range("I21").value = parse_number(inputs.get("children1to5"))
        input_sheet.range("I22").value = parse_number(inputs.get("children0to1"))
        input_sheet.range("I25").value = parse_number(inputs.get("extendedFamilyCover"))
        input_sheet.range("I26").value = parse_number(inputs.get("parentsCover"))

        print("📘 Cover levels written (I17–I26)")

        # --- Run Macro ---
        print("⚙️ Running Excel macro 'Pricing'...")
        wb.macro("Pricing")()
        wb.app.calculate()
        time.sleep(1)
        print("✅ Macro executed and workbook calculated")

      # --- Extract Premiums (explicit visible rows only) ---
        premium_sheet = wb.sheets['PremiumResults']
        quote_name = premium_sheet.range("C2").value or ""

        # Explicit visible rows
        visible_rows = [7, 10, 11, 12]

        rows = []
        for r in visible_rows:
            status = premium_sheet.range(f"C{r}").value
            total = premium_sheet.range(f"D{r}").value
            count = premium_sheet.range(f"E{r}").value
            per_member = premium_sheet.range(f"F{r}").value

            if status and str(status).strip():
                rows.append({
                    "memberStatus": str(status).strip(),
                    "totalPremium": float(total or 0),
                    "numberOfBeneficiaries": int(count or 0),
                    "premiumPerBeneficiary": float(per_member or 0),
                })

        premium_output = {
            "quoteName": quote_name,
            "rows": rows
        }

        print("📤 Premium output extracted:", premium_output)


        wb.close()
        app_excel.quit()

        return jsonify({"output": premium_output})

    except Exception as e:
        print(f"❌ Exception during calculation: {e}")
        return jsonify({"error": str(e)}), 500
