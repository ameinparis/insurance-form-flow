from flask import Flask, request, jsonify
import xlwings as xw
import os
import sys
import traceback

app = Flask(__name__)

EXCEL_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "sheets", "individual-life.xlsm")
)

if not os.path.exists(EXCEL_FILE):
    print(f"Excel file not found at: {EXCEL_FILE}", file=sys.stderr)
else:
    print(f"Using Excel file: {EXCEL_FILE}")

XL_APP = None
WB = None

SHEET_NAME = "Quotes engine"

# ---- Cell mapping (confirmed) ----
INPUT_CELLS = {
    "age": "D4",
    "gender": "D5",
    "smokerStatus": "D6",
    "education": "D7",
    "income": "D8",
    "marriageStatus": "D9",
    "product": "D12",
    "term": "D13",
    "cashbackOption": "D14",
    "deathCover": "D15",
    "disabilityCover": "D16",
    "ciCover": "D17",
}

OUTPUT_CELLS = {
    "basePremium": "D20",
    "cashbackPremium": "D21",
    "deathCoverPremium": "D22",
    "disabilityCoverPremium": "D23",
    "ciCoverPremium": "D24",
    "coverAdjustmentFactor": "D25",
    "totalPremium": "D26",
}

# ---- Mapping frontend enums -> Excel dropdown labels ----
MAPS = {
    "gender": {"male": "Male", "female": "Female"},
    "smokerStatus": {"smoker": "Smoker", "non-smoker": "Non-smoker"},
    "education": {"degree": "Degree", "no-degree": "No degree"},
    "income": {"above-10k": ">P10k", "below-10k": "<=P10k"},
    "marriageStatus": {"married": "Married", "single": "Single"},
    "product": {"nomeduw": "NoMedUW", "meduw": "MedUW"},
    "cashbackOption": {
        "no-cashback": "No cashback",
        "10-after-5": "10% after 5 years",
        "120-after-15": "120% after 15 years",
    },
}


def ensure_workbook_open():
    global XL_APP, WB

    if WB is not None:
        return WB

    if not os.path.exists(EXCEL_FILE):
        raise FileNotFoundError(f"Excel file not found at: {EXCEL_FILE}")

    XL_APP = xw.App(visible=False)
    XL_APP.display_alerts = False
    XL_APP.screen_updating = False

    WB = XL_APP.books.open(EXCEL_FILE)
    return WB


def as_int(val, field):
    try:
        # allow "5000000" or "5000000.0"
        return int(float(val))
    except Exception:
        raise ValueError(f"Invalid numeric value for {field}: {val}")


def normalize_payload(payload: dict) -> dict:
    # Required fields
    required = [
        "age", "gender", "smokerStatus", "education", "income", "marriageStatus",
        "product", "term", "cashbackOption",
        "deathCover", "disabilityCover", "ciCover"
    ]
    missing = [k for k in required if payload.get(k) in (None, "", [])]
    if missing:
        raise ValueError(f"Missing fields: {missing}")

    # Convert enums -> Excel labels
    def map_enum(group, raw):
        raw = str(raw).strip()
        # keep case insensitive for safety
        raw_lower = raw.lower()
        mapping = MAPS[group]
        if raw_lower not in mapping:
            raise ValueError(f"Invalid {group}: {raw}. Allowed: {list(mapping.keys())}")
        return mapping[raw_lower]

    return {
        "age": as_int(payload["age"], "age"),
        "gender": map_enum("gender", payload["gender"]),
        "smokerStatus": map_enum("smokerStatus", payload["smokerStatus"]),
        "education": map_enum("education", payload["education"]),
        "income": map_enum("income", payload["income"]),
        "marriageStatus": map_enum("marriageStatus", payload["marriageStatus"]),
        "product": map_enum("product", payload["product"]),
        "term": as_int(payload["term"], "term"),
        "cashbackOption": map_enum("cashbackOption", payload["cashbackOption"]),
        "deathCover": as_int(payload["deathCover"], "deathCover"),
        "disabilityCover": as_int(payload["disabilityCover"], "disabilityCover"),
        "ciCover": as_int(payload["ciCover"], "ciCover"),
    }


@app.route("/calculate", methods=["POST"])
def calculate_individual_life():
    try:
        payload = request.get_json(force=True) or {}
        data = normalize_payload(payload)

        wb = ensure_workbook_open()
        sh = wb.sheets[SHEET_NAME]

        # ---- write inputs ----
        for k, addr in INPUT_CELLS.items():
            sh.range(addr).value = data[k]

        # ---- recalc (no macro needed) ----
        # This forces Excel to update formulas.
        wb.app.calculate()

              # ---- read outputs ----
        raw = {}
        for k, addr in OUTPUT_CELLS.items():
            raw[k] = sh.range(addr).value

        # Normalize numbers
        def to_float(x):
            try:
                return float(x)
            except Exception:
                return 0.0

        base = to_float(raw.get("basePremium"))
        cashback = to_float(raw.get("cashbackPremium"))
        death = to_float(raw.get("deathCoverPremium"))
        disability = to_float(raw.get("disabilityCoverPremium"))
        ci = to_float(raw.get("ciCoverPremium"))

        caf = raw.get("coverAdjustmentFactor")

        # Important: Excel might return 1.05, 105, or "105%"
        caf_percent = None
        if isinstance(caf, str) and "%" in caf:
            caf_percent = float(caf.replace("%", "").strip())
        elif isinstance(caf, (int, float)):
            # If it's 1.05 -> convert to 105
            caf_percent = caf * 100 if caf <= 2 else caf
        else:
            caf_percent = 0.0

        total = to_float(raw.get("totalPremium"))

        output = {
            "section": "Premium",
            "rows": [
                {"label": "Base premium", "value": round(base, 2), "format": "currency"},
                {"label": "Cashback premium", "value": round(cashback, 2), "format": "currency"},
                {"label": "Death cover premium", "value": round(death, 2), "format": "currency"},
                {"label": "Disability cover premium", "value": round(disability, 2), "format": "currency"},
                {"label": "Critical illness cover premium", "value": round(ci, 2), "format": "currency"},
                {"label": "Cover adjustment factor", "value": round(caf_percent, 0), "format": "percent"},
                {"label": "Total premium", "value": round(total, 2), "format": "currency", "isTotal": True},
            ],
            "raw": {
                "basePremium": base,
                "cashbackPremium": cashback,
                "deathCoverPremium": death,
                "disabilityCoverPremium": disability,
                "ciCoverPremium": ci,
                "coverAdjustmentFactorPercent": caf_percent,
                "totalPremium": total,
            }
        }

        return jsonify({"ok": True, "output": output}), 200


    except Exception as e:
        print("❌ Individual life calc error:", str(e), file=sys.stderr)
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 400


@app.get("/health")
def health():
    return "OK", 200


if __name__ == "__main__":
    app.run(port=5005, debug=True)
