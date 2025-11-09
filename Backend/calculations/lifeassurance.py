import sys
import logging
from flask import Flask, request, jsonify
import pandas as pd
from datetime import datetime, date

app = Flask(__name__)

# ---------------------- Helpers ----------------------

def calculate_age(dob_str):
    """Excel logic: =DATEDIF(DOB, NOW(), "y") + 1"""
    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d")
        today = datetime.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return age + 1
    except Exception:
        return None


def excel_serial(d: date) -> int:
    """Convert date to Excel's 1900 date serial."""
    base = date(1899, 12, 31)
    days = (d - base).days
    if d >= date(1900, 3, 1):
        days += 1  # Excel’s leap year bug
    return days


def get_gla_rate(avg_age: float, percent_male: float) -> float:
    """Weighted GLA rate by average age and gender."""
    gla_rates = [
        (15, 0.771, 0.357292683),
        (16, 0.93336, 0.432532683),
        (17, 1.07388, 0.497651707),
        (18, 1.194, 0.553317073),
        (19, 1.29516, 0.664532356),
        (20, 1.3788, 0.733673394),
        (21, 1.44636, 0.786723013),
        (22, 1.49928, 0.832253388),
        (23, 1.539, 0.8656875),
        (24, 1.56696, 0.882697991),
        (25, 1.5846, 0.884427907),
        (26, 1.59336, 0.859164706),
        (27, 1.59468, 0.838020612),
        (28, 1.59, 0.811736842),
        (29, 1.58076, 0.79038),
        (30, 1.5684, 0.766964835),
        (31, 1.55436, 0.755471061),
        (32, 1.54008, 0.744083596),
        (33, 1.527, 0.737764045),
        (34, 1.51656, 0.728626592),
        (35, 1.5102, 0.725897238),
        (36, 1.50936, 0.73007087),
        (37, 1.51548, 0.733556809),
        (38, 1.53, 0.752984293),
        (39, 1.55436, 0.77718),
        (40, 1.59, 0.798916256),
        (41, 1.63836, 0.834783429),
        (42, 1.70088, 0.881648807),
        (43, 1.779, 0.928513158),
        (44, 1.87416, 0.988050879),
        (45, 1.9878, 1.061215936),
        (46, 2.12136, 1.14907),
        (47, 2.27628, 1.243824429),
        (48, 2.454, 1.358758389),
        (49, 2.65596, 1.486669434),
        (50, 2.8836, 1.633189381),
        (51, 3.13836, 1.803256575),
        (52, 3.42168, 1.989348837),
        (53, 3.735, 2.19442446),
        (54, 4.07976, 2.427776644),
        (55, 4.4574, 2.68372625),
        (56, 4.86936, 2.982947634),
        (57, 5.31708, 3.288437979),
        (58, 5.802, 3.638853081),
        (59, 6.32556, 4.021248857),
        (60, 6.8892, 4.43636144),
        (61, 7.49436, 4.889875857),
        (62, 8.14248, 5.381333523),
        (63, 8.835, 5.916651584),
        (64, 9.57336, 6.512022392),
        (65, 10.359, 7.136680585),
        (66, 11.19336, 7.770654518),
        (67, 12.07788, 8.451170327),
        (68, 13.014, 9.172441061),
        (69, 14.00316, 9.946568195),
        (70, 15.0468, 10.76679552),
    ]

    age_key = int(avg_age)
    rates_dict = {row[0]: (row[1], row[2]) for row in gla_rates}
    male_rate, female_rate = rates_dict.get(age_key, rates_dict.get(35, (1.5, 0.73)))

    weighted_rate = (male_rate * percent_male) + (female_rate * (1 - percent_male))
    return weighted_rate / 1000.0  # per-1 rate


# ---------------------- Endpoint ----------------------

@app.route("/calculate", methods=["POST"])
def calculate_life_assurance():
    try:
        data = request.get_json(force=True)
        members = data.get("members", [])
        if not members:
            return jsonify({"error": "No member data received"}), 400

        df = pd.DataFrame(members)
        df["annualSalary"] = pd.to_numeric(df["annualSalary"], errors="coerce").fillna(0)
        df["dob"] = pd.to_datetime(df["dob"], dayfirst=True, errors="coerce")
        df["age"] = df["dob"].apply(lambda x: calculate_age(x.strftime("%Y-%m-%d")) if pd.notna(x) else None)

        # ---- Basic Stats ----
        membership = len(df)
        total_salary = df["annualSalary"].sum()
        avg_salary = df["annualSalary"].mean()
        avg_age = df["age"].mean()
        min_age = df["age"].min()
        max_age = df["age"].max()
        pct_male = (df["gender"].str.upper().eq("M").sum() / membership) if membership else 0

        min_dob_dt = df["dob"].min()
        max_dob_dt = df["dob"].max()
        min_as = int(excel_serial(min_dob_dt.date())) if pd.notna(min_dob_dt) else None
        max_as = int(excel_serial(max_dob_dt.date())) if pd.notna(max_dob_dt) else None

        # ---- GLA ----
        gla_rate = get_gla_rate(avg_age, pct_male)
        df["GLA_Rate"] = gla_rate
        df["BenefitAmount"] = df["annualSalary"] * 4.2
        df["ExpectedClaimsCost"] = df["BenefitAmount"] * gla_rate

        total_expected_cost = df["ExpectedClaimsCost"].sum()
        weighted_avg_rate = (total_expected_cost / total_salary) if total_salary > 0 else 0

        summary = {
            "membership": membership,
            "totalSalary": round(total_salary),
            "averageSalary": round(avg_salary),
            "averageAge": round(avg_age),
            "minAge": round(min_age),
            "maxAge": round(max_age),
            "percentMale": int(round(pct_male * 100)),
            "minAS": min_as,  # Excel-style serial from DOB
            "maxAS": max_as,  # Excel-style serial from DOB
            "minDOB": min_dob_dt.strftime("%Y-%m-%d") if pd.notna(min_dob_dt) else None,
            "maxDOB": max_dob_dt.strftime("%Y-%m-%d") if pd.notna(max_dob_dt) else None,
            "glaRate": round(gla_rate, 6),
            "weightedAverageRate": round(weighted_avg_rate, 6),
            "totalExpectedCost": round(total_expected_cost),
        }
        print("\n📤 Output Summary:")
        for k, v in summary.items():
            print(f"{k}: {v}")

        return jsonify({"output": summary})

    except Exception as e:
        logging.exception("Life Assurance calculation failed")
        return jsonify({"error": str(e)}), 500

# ---------------------- Run Server ----------------------
if __name__ == "__main__":
    app.run(port=5005, debug=True)


