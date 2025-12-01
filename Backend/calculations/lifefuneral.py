from flask import Flask, request, jsonify
import xlwings as xw
import os
import sys
import traceback

app = Flask(__name__)

# ------------------------------------------------------------
#  Excel workbook location
# ------------------------------------------------------------
EXCEL_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "sheets", "exclusive-funeral.xlsm")
)

if not os.path.exists(EXCEL_FILE):
    print(f"Excel file not found at: {EXCEL_FILE}", file=sys.stderr)
else:
    print(f"Using Excel file: {EXCEL_FILE}")


# ------------------------------------------------------------
#  Helper functions
# ------------------------------------------------------------
def _to_float(v, default=0.0):
    try:
        if v is None or v == "":
            return float(default)
        return float(v)
    except (TypeError, ValueError):
        return float(default)


def _to_int(v, default=0):
    try:
        if v is None or v == "":
            return int(default)
        return int(float(v))
    except (TypeError, ValueError):
        return int(default)


def _cover_thousands(v, lo=5000, hi=50000, allow_zero=True):
    """Snap to nearest 1 000 and clamp to [lo, hi]."""
    x = _to_float(v, 0)
    x = int(round(x / 1000.0)) * 1000
    if x == 0 and not allow_zero:
        x = lo
    if x != 0:
        if x < lo:
            x = lo
        if x > hi:
            x = hi
    return int(x)


# ------------------------------------------------------------
#  Health-check endpoint
# ------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    if not os.path.exists(EXCEL_FILE):
        return jsonify({"status": "error", "message": "Missing exclusive-funeral.xlsm"}), 500
    try:
        app_excel = xw.App(visible=False)
        app_excel.display_alerts = False
        app_excel.screen_updating = False
        wb = app_excel.books.open(EXCEL_FILE)
        sheets = [s.name for s in wb.sheets]
        required = {"MemberData", "InputSheet", "PremiumResults"}
        missing = list(required - set(sheets))
        wb.close()
        app_excel.quit()
        if missing:
            return jsonify({"status": "error", "message": f"Missing sheets: {missing}"}), 500
        return jsonify({"status": "ok", "sheets": sheets})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ------------------------------------------------------------
#  Main calculator endpoint
# ------------------------------------------------------------
@app.route("/calculate", methods=["POST"])
def calculate_funeral():
    app_excel = None
    wb = None
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        payload = request.get_json()
        members = payload.get("members", [])
        inputs = payload.get("inputs", {})

        if not isinstance(members, list) or len(members) == 0:
            return jsonify({"error": "No member data provided"}), 400

        cover_type = (inputs.get("coverLevelType") or "").strip()
        cover_text = "Scheme Rules Benefits" if cover_type == "scheme-rules" else "Member Specified"

        # ---------- Open Excel silently ----------
        app_excel = xw.App(visible=False)
        app_excel.display_alerts = False
        app_excel.screen_updating = False
        wb = app_excel.books.open(EXCEL_FILE)

        # ---------- Write MemberData (BULK WRITE) ----------
        md = wb.sheets["MemberData"]
        # Clear old data once
        md.range("A2:G100000").clear_contents()

        # Build a 2D list of rows for Excel
        values = []
        for m in members:
            values.append([
                m.get("memberNumber"),
                m.get("surname"),
                m.get("firstName"),
                m.get("dob"),
                m.get("relationship"),
                m.get("gender"),
                float(_to_float(m.get("coverAmount"), 0.0)),
            ])

        # Write everything in one go starting at A2
        if values:
            md.range("A2").value = values

        # number of rows written
        written = len(values)

        # ---------- Write InputSheet ----------
        inp = wb.sheets["InputSheet"]

        profit_target = _to_float(inputs.get("profitTarget"), 0.0) / 100.0
        as_when = _to_float(inputs.get("asAndWhenCommission"), 0.0) / 100.0

        inp.range("I6").api.Value = profit_target
        inp.range("I7").value = inputs.get("societyName", "")
        inp.range("I8").api.Value = as_when
        inp.range("I9").value = inputs.get("schemeType", "")
        inp.range("I10").api.Value = int(written)
        inp.range("I11").api.Value = _to_int(inputs.get("maxExtendedFamilyMembers"), 0)
        inp.range("I12").api.Value = _to_int(inputs.get("maxAgeChildren"), 0)
        inp.range("I13").api.Value = _to_int(inputs.get("currentMaxAgeChild"), 0)
        inp.range("I14").value = cover_text

        # ---------- Write cover levels ----------
        cover_cells = {
            "I17": inputs.get("principalMemberCover"),
            "I18": inputs.get("spouseCover"),
            "I19": inputs.get("children16toMax"),
            "I20": inputs.get("children6to15"),
            "I21": inputs.get("children1to5"),
            "I22": inputs.get("children0to1"),
            "I25": inputs.get("extendedFamilyCover"),
            "I26": inputs.get("parentsCover"),
        }

        for addr, val in cover_cells.items():
            num = _cover_thousands(val)
            inp.range(addr).api.Value = float(num)

        # ---------- Debug print ----------
        print("==== DEBUG: InputSheet values written to Excel ====")
        for addr in ("I6","I7","I8","I9","I10","I11","I12","I13","I14",
                     "I17","I18","I19","I20","I21","I22","I25","I26"):
            val = inp.range(addr).value
            print(f"{addr}: {val!r}")
        print("====================================================")

        # ---------- Activate InputSheet & run macro ----------
        inp.activate()
        wb.app.calculate()
        wb.macro("Pricing")()   # Correctly runs macro
        wb.app.calculate()

        # FIXED: indentation of the following block
        # ---------- Extract results (C7:F7, C10:F10, C11:F11, C12:F12) ----------
        prs = wb.sheets["PremiumResults"]

        output = {
            "quoteName": prs.range("C2").value or "",
            "rows": [
                {
                    "memberStatus": str(prs.range("C7").value or "").strip(),
                    "totalPremium": float(prs.range("D7").value or 0),
                    "numberOfBeneficiaries": int(prs.range("E7").value or 0),
                    "premiumPerBeneficiary": float(prs.range("F7").value or 0),
                },
                {
                    "memberStatus": str(prs.range("C10").value or "").strip(),
                    "totalPremium": float(prs.range("D10").value or 0),
                    "numberOfBeneficiaries": int(prs.range("E10").value or 0),
                    "premiumPerBeneficiary": float(prs.range("F10").value or 0),
                },
                {
                    "memberStatus": str(prs.range("C11").value or "").strip(),
                    "totalPremium": float(prs.range("D11").value or 0),
                    "numberOfBeneficiaries": int(prs.range("E11").value or 0),
                    "premiumPerBeneficiary": float(prs.range("F11").value or 0),
                },
                {
                    "memberStatus": str(prs.range("C12").value or "").strip(),
                    "totalPremium": float(prs.range("D12").value or 0),
                    "numberOfBeneficiaries": int(prs.range("E12").value or 0),
                    "premiumPerBeneficiary": float(prs.range("F12").value or 0),
                },
            ],
        }

        # best practice: respond only with `output`
        return jsonify({"output": output})

    except Exception as e:
        print("Exception:", e, file=sys.stderr)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            if wb is not None:
                wb.close()
        except Exception as _e:
            print("close wb:", _e, file=sys.stderr)
        try:
            if app_excel is not None:
                app_excel.quit()
        except Exception as _e:
            print("quit app:", _e, file=sys.stderr)


# ------------------------------------------------------------
#  Run directly
# ------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=False)
