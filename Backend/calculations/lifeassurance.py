import sys
import logging
from flask import Flask, request, jsonify
import pandas as pd
from datetime import datetime, date
import re

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
        days += 1  # Excel’s leap-year bug
    return days

# ---------------------- Endpoint ----------------------
@app.route("/calculate", methods=["POST"])
def calculate_life_assurance():
    try:
        data = request.get_json(force=True)

        members = data.get("members", [])
        if not members:
            return jsonify({"error": "No member data received"}), 400
        
        # Read salary multiplier sent from frontend (default to 4 if missing/bad)
        try:
            salary_multiplier = float(data.get("salaryMultiplier", 4.0) or 4.0)
        except Exception:
            salary_multiplier = 4.0

        df = pd.DataFrame(members)
        df["annualSalary"] = pd.to_numeric(df.get("annualSalary", 0), errors="coerce").fillna(0.0)
        df["dob"] = pd.to_datetime(df.get("dob", None), dayfirst=True, errors="coerce")
        df["age"] = df["dob"].apply(lambda x: calculate_age(x.strftime("%Y-%m-%d")) if pd.notna(x) else None)

        # ---- Basic Stats ----
        membership = int(len(df))
        total_salary = float(df["annualSalary"].sum())
        avg_salary = float(df["annualSalary"].mean()) if membership else 0.0
        avg_age = float(df["age"].mean()) if membership else 0.0
        min_age = float(df["age"].min()) if membership else 0.0
        max_age = float(df["age"].max()) if membership else 0.0
        pct_male = (df.get("gender", pd.Series([], dtype="object")).astype(str).str.upper().eq("M").sum() / membership) if membership else 0.0  # 0..1

        min_dob_dt = df["dob"].min()
        max_dob_dt = df["dob"].max()
        min_as = int(excel_serial(min_dob_dt.date())) if pd.notna(min_dob_dt) else None
        max_as = int(excel_serial(max_dob_dt.date())) if pd.notna(max_dob_dt) else None

        # ---- Weighted Average (Excel-style) ----
        gla_rates = [
            (15, 0.771, 0.357292683),(16, 0.93336, 0.432532683),(17, 1.07388, 0.497651707),
            (18, 1.194, 0.553317073),(19, 1.29516, 0.664532356),(20, 1.3788, 0.733673394),
            (21, 1.44636, 0.786723013),(22, 1.49928, 0.832253388),(23, 1.539, 0.8656875),
            (24, 1.56696, 0.882697991),(25, 1.5846, 0.884427907),(26, 1.59336, 0.859164706),
            (27, 1.59468, 0.838020612),(28, 1.59, 0.811736842),(29, 1.58076, 0.79038),
            (30, 1.5684, 0.766964835),(31, 1.55436, 0.755471061),(32, 1.54008, 0.744083596),
            (33, 1.527, 0.737764045),(34, 1.51656, 0.728626592),(35, 1.5102, 0.725897238),
            (36, 1.50936, 0.73007087),(37, 1.51548, 0.733556809),(38, 1.53, 0.752984293),
            (39, 1.55436, 0.77718),(40, 1.59, 0.798916256),(41, 1.63836, 0.834783429),
            (42, 1.70088, 0.881648807),(43, 1.779, 0.928513158),(44, 1.87416, 0.988050879),
            (45, 1.9878, 1.061215936),(46, 2.12136, 1.14907),(47, 2.27628, 1.243824429),
            (48, 2.454, 1.358758389),(49, 2.65596, 1.486669434),(50, 2.8836, 1.633189381),
            (51, 3.13836, 1.803256575),(52, 3.42168, 1.989348837),(53, 3.735, 2.19442446),
            (54, 4.07976, 2.427776644),(55, 4.4574, 2.68372625),(56, 4.86936, 2.982947634),
            (57, 5.31708, 3.288437979),(58, 5.802, 3.638853081),(59, 6.32556, 4.021248857),
            (60, 6.8892, 4.43636144),(61, 7.49436, 4.889875857),(62, 8.14248, 5.381333523),
            (63, 8.835, 5.916651584),(64, 9.57336, 6.512022392),(65, 10.359, 7.136680585),
            (66, 11.19336, 7.770654518),(67, 12.07788, 8.451170327),(68, 13.014, 9.172441061),
            (69, 14.00316, 9.946568195),(70, 15.0468, 10.76679552),
        ]
        rate_map = {age: (m, f) for age, m, f in gla_rates}
        min_age_key, max_age_key = min(rate_map), max(rate_map)

        age_key = int(avg_age) if pd.notna(avg_age) else 35
        age_key = max(min_age_key, min(max_age_key, age_key))  # clamp 15..70

        male_pt, female_pt = rate_map[age_key]             # per-thousand values
        wa_pt = (male_pt * pct_male) + (female_pt * (1 - pct_male))  # per-thousand
        wa_per1 = wa_pt / 1000.0

        gla_rate_pt = wa_pt
        gla_rate_per1 = wa_per1

        ce_pt = data.get("claimsExperiencePerThousand", 0.64)
        try:
            ce_pt = float(ce_pt)
        except Exception:
            ce_pt = 0.64
        ce_blended_pt = 0.5 * wa_pt + 0.5 * ce_pt
        ce_blended_per1 = ce_blended_pt / 1000.0

       

         # Use chosen salary multiplier from frontend (2x / 3x / 4x)
        df["glaBenefitAmount"] = (df["annualSalary"] * salary_multiplier) + 20000.0
        df["glaExpectedClaimsCost"] = df["glaBenefitAmount"] * gla_rate_per1
        first_benefit = float(df["glaBenefitAmount"].iloc[0])
        first_claim_cost = float(df["glaExpectedClaimsCost"].iloc[0])
        fcl = avg_salary * 4

        # Rollups
        total_expected_claims_cost = float(df["glaExpectedClaimsCost"].sum())
        print("🧮 Total Expected Claims Cost:", total_expected_claims_cost)
        print(df[["annualSalary", "glaBenefitAmount", "glaExpectedClaimsCost"]].head(15).to_string())


        # ---- Predefined Constants ----
        admin_expense = 0.12         # O1
        commission = 0.114           # O2
        profit_load = 0.05           # O3
        safety_margin = 0.20         # O4
        discount_rate = 0.05         # O5
        
        

    
        discount_factor = (1 + discount_rate) ** (-0.5)
        denominator = 1 - admin_expense - profit_load - safety_margin

        net_premium = (total_expected_claims_cost * discount_factor) / denominator
        
        gross_premium = net_premium / (1 - commission)
        
        total_gla_benefit_amount = float(df["glaBenefitAmount"].sum())
        total_annual_salary = (total_gla_benefit_amount) / salary_multiplier
        commission_amount = gross_premium - net_premium
        gross_rate_gla = gross_premium / total_annual_salary
        gross_rate_phi = 0.35 * gross_rate_gla
        death = total_annual_salary * gross_rate_gla
        odb = total_annual_salary * gross_rate_phi
        total_premiums = death + odb
        
        # ---- Update Summary ----
        summary = {
            "membership": membership,
            "totalSalary": round(total_salary),
            "averageSalary": round(avg_salary) if membership else None,
            "averageAge": round(avg_age) if membership else None,
            "minAge": round(min_age) if membership else None,
            "maxAge": round(max_age) if membership else None,
            "percentMale": int(round(pct_male * 100)),
            "minAS": min_as,
            "maxAS": max_as,
            "weightedAveragePerThousand": round(wa_pt, 6),
            "glaRatePer1": round(gla_rate_per1, 9),
            "ceBlendedPerThousand": round(ce_blended_pt, 6),
            "firstGLABenefitAmount": round(first_benefit, 2),
            "firstExpectedClaimsCost": round(first_claim_cost, 2),
            "fcl": round(fcl, 2),
            "totalExpectedClaimsCost": round(total_expected_claims_cost, 2),
            "netPremium": round(net_premium, 2),
            "commission": round(commission_amount, 2),  # NEW: Commission amount
            "grossPremium": round(gross_premium, 2),  # NEW: Gross Premium
            "totalAnnualSalary": round(total_annual_salary, 2), # NEW: Total Annual Salary
            "grossRateGLA": round(gross_rate_gla, 4),
            "grossRatePHI": round(gross_rate_phi, 4),
            "deathPremium":round(death),
            "ODB": round(odb),
            "totalPremiums":round(total_premiums)
            
            
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
