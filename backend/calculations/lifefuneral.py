from flask import Flask, request, jsonify
import xlwings as xw
import os
import sys
import traceback
from datetime import datetime, timedelta  

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


def _to_excel_date(v):
    """
    Normalize incoming DOB values to a real date Excel will understand.
    Handles:
      - Excel serial numbers (int/float)
      - 'dd/mm/yyyy'
      - 'yyyy/mm/dd'
      - 'yyyy-mm-dd'
    Falls back to the raw string if nothing matches.
    """
    if v is None or v == "":
        return ""

    # Excel serial date (from xlsx)
    if isinstance(v, (int, float)):
        try:
            base = datetime(1899, 12, 30)  # Excel day 0 (with 1900 bug)
            return (base + timedelta(days=float(v))).date()
        except Exception:
            # fall through to string handling
            pass

    s = str(v).strip()

    # Try common string formats
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue

    # Last resort: return raw string so at least we can see it in logs/Excel
    return s


def _safe_named_value(wb, name):
    """
    Safely read a workbook-level named range value.
    If it doesn't exist or errors, log and return None.
    This NEVER writes to the workbook.
    """
    try:
        rng = wb.names[name].refers_to_range
        val = rng.value
        print(f"[NAMED] {name} -> {val!r}")
        return val
    except Exception as e:
        print(f"[NAMED] Could not read {name}: {e}", file=sys.stderr)
        return None
    
def _is_blank(v):
    return v is None or str(v).strip() == ""

def _require_inputs(inputs, required_keys):
    missing = [k for k in required_keys if _is_blank(inputs.get(k))]
    return missing


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
            print("[ERROR] Non-JSON request received", file=sys.stderr)
            return jsonify({"error": "Request must be JSON"}), 400

        payload = request.get_json()
        members = payload.get("members", [])
        inputs = payload.get("inputs", {})
        # ---------- Early validation (STOP before Excel) ----------
        required = [
            "profitTarget",
            "societyName",
            "asAndWhenCommission",
            "schemeType",
            "maxExtendedFamilyMembers",
            "maxAgeChildren",
            "coverLevelType",
            "principalMemberCover",
        ]

        missing = _require_inputs(inputs, required)
        if missing:
            return jsonify({"error": f"Missing required inputs: {', '.join(missing)}"}), 400

        cover_type = (inputs.get("coverLevelType") or "").strip()
        if cover_type not in ("scheme-rules", "member-specified"):
            return jsonify({"error": f"Invalid coverLevelType: '{cover_type}'"}), 400

        must_be_positive = [
            "profitTarget",
            "asAndWhenCommission",
            "maxExtendedFamilyMembers",
            "maxAgeChildren",
            "principalMemberCover",
        ]
        bad_nums = []
        for k in must_be_positive:
            n = _to_float(inputs.get(k), 0.0)
            if n <= 0:
                bad_nums.append(k)

        if bad_nums:
            return jsonify({"error": f"These inputs must be > 0: {', '.join(bad_nums)}"}), 400

        print("=== /calculate CALLED ===")
        print(f"Python platform: {sys.platform}")
        print(f"Members count: {len(members)}")
        print(f"Inputs keys: {list(inputs.keys())}")
        print("=========================")

        if not isinstance(members, list) or len(members) == 0:
            print("[ERROR] No member data provided", file=sys.stderr)
            return jsonify({"error": "No member data provided"}), 400
        
        missing_dob = sum(1 for m in members if _is_blank(m.get("dob")))
        if missing_dob > 0:
            return jsonify({
                "error": f"{missing_dob} members missing DOB. Check file headers (DOB vs Date of Birth)."
            }), 400

        cover_text = "Scheme Rules Benefits" if cover_type == "scheme-rules" else "Member Specified"
        print(f"Cover type raw='{cover_type}', mapped text='{cover_text}'")

        # ---------- Open Excel silently ----------
        print(f"Opening Excel file: {EXCEL_FILE}")
        app_excel = xw.App(visible=False)
        app_excel.display_alerts = False
        app_excel.screen_updating = False
        try:
            print(f"Excel version: {app_excel.version}")
        except Exception as e:
            print(f"Could not read Excel version: {e}", file=sys.stderr)

        wb = app_excel.books.open(EXCEL_FILE)
        print("Excel workbook opened")

        # ---------- Write MemberData (BULK WRITE) ----------
        md = wb.sheets["MemberData"]
        print("Clearing MemberData A2:G100000")
        md.range("A2:G100000").clear_contents()

        values = []

        print("Normalising first 5 DOBs:")
        for idx, m in enumerate(members):
            raw_dob = m.get("dob")
            parsed_dob = _to_excel_date(raw_dob)

            if idx < 5:
                print(f"  row {idx+1}: raw dob={raw_dob!r}, parsed={parsed_dob!r}")

            values.append([
                m.get("memberNumber"),
                m.get("surname"),
                m.get("firstName"),
                parsed_dob,
                m.get("relationship"),
                m.get("gender"),
                float(_to_float(m.get("coverAmount"), 0.0)),
            ])

        # Write everything in one go starting at A2
        if values:
            print(f"Writing {len(values)} member rows to MemberData!A2")
            md.range("A2").value = values
            md.range("D:D").number_format = "dd/mm/yyyy"
        else:
            print("[WARN] values list is empty after mapping members")

        written = len(values)
        print(f"Number of rows written to MemberData: {written}")

        # ---------- Write InputSheet ----------
        inp = wb.sheets["InputSheet"]

        profit_target = _to_float(inputs.get("profitTarget"), 0.0) / 100.0
        as_when = _to_float(inputs.get("asAndWhenCommission"), 0.0) / 100.0

        print("Writing InputSheet key values:")
        print(f"  profitTarget (fraction) -> I6: {profit_target}")
        print(f"  societyName -> I7: {inputs.get('societyName', '')!r}")
        print(f"  asAndWhenCommission (fraction) -> I8: {as_when}")
        print(f"  schemeType -> I9: {inputs.get('schemeType', '')!r}")
        print(f"  numberOfLives(written) -> I10: {written}")
        print(f"  maxExtendedFamilyMembers -> I11: {inputs.get('maxExtendedFamilyMembers')!r}")
        print(f"  maxAgeChildren -> I12: {inputs.get('maxAgeChildren')!r}")
        print(f"  currentMaxAgeChild -> I13: {inputs.get('currentMaxAgeChild')!r}")
        print(f"  coverLevelType text -> I14: {cover_text!r}")

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

        print("Writing cover levels (snapped to thousands):")
        for addr, val in cover_cells.items():
            num = _cover_thousands(val)
            print(f"  {addr}: raw={val!r} -> snapped={num}")
            inp.range(addr).api.Value = float(num)

        print("==== DEBUG: InputSheet values written to Excel ====")
        for addr in ("I6","I7","I8","I9","I10","I11","I12","I13","I14",
                     "I17","I18","I19","I20","I21","I22","I25","I26"):
            val = inp.range(addr).value
            print(f"{addr}: {val!r}")
        print("====================================================")

        # ---------- Read named ranges BEFORE macro (for debugging GoalSeek issues) ----------
        print("Reading key named ranges BEFORE running 'Pricing':")
        _safe_named_value(wb, "MemberStatus")
        _safe_named_value(wb, "BeneficiaryAge")
        _safe_named_value(wb, "MaxChildage")
        _safe_named_value(wb, "SetToZero")
        _safe_named_value(wb, "PremiumResult1")

        # ---------- Activate InputSheet & run macro ----------
        print("Activating InputSheet and running macro 'Pricing'")
        inp.activate()
        wb.app.calculate()
        wb.macro("Pricing")()
        wb.app.calculate()
        print("Macro 'Pricing' completed")

        # ---------- Read named ranges AFTER macro ----------
        print("Reading key named ranges AFTER running 'Pricing':")
        _safe_named_value(wb, "SetToZero")
        _safe_named_value(wb, "PremiumResult1")

        # ---------- Extract results ----------
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

        print("Extracted PremiumResults:")
        for idx, row in enumerate(output["rows"], start=1):
            print(f"  row {idx}: {row}")

        return jsonify({"output": output})

    except Exception as e:
        print("Exception in /calculate:", e, file=sys.stderr)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            if wb is not None:
                wb.close()
                print("Workbook closed")
        except Exception as _e:
            print("close wb:", _e, file=sys.stderr)
        try:
            if app_excel is not None:
                app_excel.quit()
                print("Excel app quit")
        except Exception as _e:
            print("quit app:", _e, file=sys.stderr)


# ------------------------------------------------------------
#  Run directly
# ------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=False)