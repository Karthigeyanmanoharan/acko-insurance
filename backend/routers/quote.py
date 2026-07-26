# backend/routers/quote.py
# Module 2 — Insurance Premium Quote Predictor
# Feature order matches your ETL notebook exactly.

import os
import joblib
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings("ignore")

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from sql_table import Quotation
from auth import get_current_user

router = APIRouter(prefix="/quote", tags=["Quote Predictor"])

# ---------------------------------------------------------------------------
# Load all 6 model files ONCE at startup
# ---------------------------------------------------------------------------
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "..", "ml", "saved_models")

_cache = {}

def _get(name: str):
    if name not in _cache:
        path = os.path.join(MODELS_DIR, name)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")
        _cache[name] = joblib.load(path)
    return _cache[name]


# ---------------------------------------------------------------------------
# Feature importance (top 3 factors)
# ---------------------------------------------------------------------------
def _top_factors(model, preprocessor, n=3):
    try:
        importances  = model.feature_importances_
        feature_names = preprocessor.get_feature_names_out()
        pairs = sorted(zip(feature_names, importances),
                       key=lambda x: x[1], reverse=True)[:n]
        name_map = {
            "numerical_scaler__idv":                 "Insured Declared Value (IDV)",
            "numerical_scaler__engine_cc":            "Engine Capacity (CC)",
            "numerical_scaler__ncb_percent":          "No Claim Bonus",
            "numerical_scaler__vehicle_age_years":    "Vehicle Age",
            "numerical_scaler__city_risk_score":      "City Risk Score",
            "numerical_scaler__city_tier":            "City Tier",
            "numerical_scaler__customer_age":         "Customer Age",
            "numerical_scaler__claim_history_count":  "Claim History",
            "numerical_scaler__num_addons":           "Number of Add-ons",
            "numerical_scaler__sum_insured":          "Sum Insured",
            "numerical_scaler__num_members":          "Number of Members",
            "numerical_scaler__policy_tenure":        "Policy Tenure",
            "numerical_scaler__ncb_years":            "NCB Years",
            "all_categorical_encoder__segment":       "Vehicle Segment",
            "all_categorical_encoder__fuel_type":     "Fuel Type",
            "all_categorical_encoder__policy_type":   "Policy Type",
            "all_categorical_encoder__city":          "City",
            "all_categorical_encoder__state":         "State",
            "all_categorical_encoder__vehicle_make":  "Vehicle Make",
            "all_categorical_encoder__vehicle_model": "Vehicle Model",
            "all_categorical_encoder__plan_name":     "Plan Name",
            "all_categorical_encoder__plan_category": "Plan Category",
            "all_categorical_encoder__bmi_category":  "BMI Category",
        }
        factors = []
        for raw, score in pairs:
            label = name_map.get(raw, raw.split("__")[-1].replace("_", " ").title())
            factors.append({
                "factor":     label,
                "importance": round(float(score) * 100, 1),
            })
        return factors
    except Exception:
        return []


# ---------------------------------------------------------------------------
# City info lookup
# ---------------------------------------------------------------------------
CITY_INFO = {
    "Agra":{"tier":2,"risk":1.18,"state":"Uttar Pradesh"},
    "Ahmedabad":{"tier":1,"risk":1.30,"state":"Gujarat"},
    "Amritsar":{"tier":2,"risk":1.10,"state":"Punjab"},
    "Bengaluru":{"tier":1,"risk":1.28,"state":"Karnataka"},
    "Bhopal":{"tier":2,"risk":1.05,"state":"Madhya Pradesh"},
    "Bhubaneswar":{"tier":2,"risk":1.05,"state":"Odisha"},
    "Chandigarh":{"tier":2,"risk":1.12,"state":"Chandigarh"},
    "Chennai":{"tier":1,"risk":1.22,"state":"Tamil Nadu"},
    "Coimbatore":{"tier":2,"risk":1.05,"state":"Tamil Nadu"},
    "Delhi":{"tier":1,"risk":1.40,"state":"Delhi"},
    "Faridabad":{"tier":1,"risk":1.30,"state":"Haryana"},
    "Gandhinagar":{"tier":2,"risk":1.10,"state":"Gujarat"},
    "Ghaziabad":{"tier":1,"risk":1.32,"state":"Uttar Pradesh"},
    "Gurugram":{"tier":1,"risk":1.35,"state":"Haryana"},
    "Guwahati":{"tier":2,"risk":1.05,"state":"Assam"},
    "Hyderabad":{"tier":1,"risk":1.25,"state":"Telangana"},
    "Indore":{"tier":2,"risk":1.10,"state":"Madhya Pradesh"},
    "Jaipur":{"tier":2,"risk":1.12,"state":"Rajasthan"},
    "Jalandhar":{"tier":2,"risk":1.10,"state":"Punjab"},
    "Kanpur":{"tier":2,"risk":1.10,"state":"Uttar Pradesh"},
    "Kochi":{"tier":2,"risk":1.08,"state":"Kerala"},
    "Kolkata":{"tier":1,"risk":1.28,"state":"West Bengal"},
    "Lucknow":{"tier":2,"risk":1.12,"state":"Uttar Pradesh"},
    "Ludhiana":{"tier":2,"risk":1.12,"state":"Punjab"},
    "Madurai":{"tier":2,"risk":1.05,"state":"Tamil Nadu"},
    "Mangalore":{"tier":2,"risk":1.00,"state":"Karnataka"},
    "Meerut":{"tier":2,"risk":1.10,"state":"Uttar Pradesh"},
    "Mumbai":{"tier":1,"risk":1.40,"state":"Maharashtra"},
    "Mysuru":{"tier":2,"risk":1.05,"state":"Karnataka"},
    "Nagpur":{"tier":2,"risk":1.08,"state":"Maharashtra"},
    "Nashik":{"tier":2,"risk":1.05,"state":"Maharashtra"},
    "Navi Mumbai":{"tier":1,"risk":1.35,"state":"Maharashtra"},
    "Noida":{"tier":1,"risk":1.32,"state":"Uttar Pradesh"},
    "Patna":{"tier":2,"risk":1.10,"state":"Bihar"},
    "Pune":{"tier":1,"risk":1.22,"state":"Maharashtra"},
    "Raipur":{"tier":2,"risk":1.00,"state":"Chhattisgarh"},
    "Rajkot":{"tier":2,"risk":1.08,"state":"Gujarat"},
    "Ranchi":{"tier":2,"risk":1.00,"state":"Jharkhand"},
    "Surat":{"tier":2,"risk":1.12,"state":"Gujarat"},
    "Thane":{"tier":1,"risk":1.30,"state":"Maharashtra"},
    "Thiruvananthapuram":{"tier":2,"risk":1.05,"state":"Kerala"},
    "Vadodara":{"tier":2,"risk":1.10,"state":"Gujarat"},
    "Varanasi":{"tier":2,"risk":1.08,"state":"Uttar Pradesh"},
    "Vijayawada":{"tier":2,"risk":1.05,"state":"Andhra Pradesh"},
    "Visakhapatnam":{"tier":2,"risk":1.08,"state":"Andhra Pradesh"},
}


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class BikeQuoteRequest(BaseModel):
    # Customer
    customer_age: int
    # Location
    city: str
    state: str
    # Vehicle
    manufacturing_year: int
    engine_cc: int
    idv: float
    vehicle_make: str
    vehicle_model: str
    variant: str
    segment: str
    fuel_type: str
    # Policy
    policy_type: str
    ncb_percent: int
    claim_history_count: int
    # Add-ons — matches ETL notebook addon columns exactly
    addon_consumables_cover: int = 0
    addon_engine_protection: int = 0
    addon_pillion_rider_cover: int = 0
    addon_return_to_invoice: int = 0
    addon_roadside_assistance: int = 0
    addon_unknown: int = 0
    addon_zero_depreciation: int = 0


class CarQuoteRequest(BaseModel):
    customer_age: int
    city: str
    state: str
    manufacturing_year: int
    engine_cc: int
    idv: float
    vehicle_make: str
    vehicle_model: str
    variant: str
    segment: str
    fuel_type: str
    policy_type: str
    ncb_percent: int
    claim_history_count: int
    # Add-ons — matches ETL notebook addon columns exactly
    addon_consumables_cover: int = 0
    addon_engine_protection: int = 0
    addon_key_replacement: int = 0
    addon_no_claim_bonus_protection: int = 0
    addon_passenger_cover: int = 0
    addon_personal_accident_cover: int = 0
    addon_return_to_invoice: int = 0
    addon_roadside_assistance: int = 0
    addon_tyre_protection: int = 0
    addon_zero_depreciation: int = 0


class HealthQuoteRequest(BaseModel):
    # Numerical (StandardScaler)
    age: int
    num_members: int
    city_tier: int
    ncb_years: int
    sum_insured: int
    deductible: int
    num_addons: int = 0
    policy_tenure: int
    # OrdinalEncoder columns (note: smoke, has_pre_existing etc. go through OrdinalEncoder!)
    plan_name: str
    plan_category: str
    gender: str
    state: str
    bmi_category: str
    smoke: int           # 0 or 1 — passed through OrdinalEncoder
    has_pre_existing: int
    annual_checkup: int
    has_maternity: int = 0
    has_opd: int = 0
    # Passthrough addon columns
    addon_critical_illness_rider: int = 0
    addon_dental_vision: int = 0
    addon_hospital_cash: int = 0
    addon_international_cover: int = 0
    addon_maternity: int = 0
    addon_opd_cover: int = 0
    addon_personal_accident: int = 0


class QuoteResponse(BaseModel):
    vehicle_type: str
    predicted_premium: int
    monthly_premium: int
    top_factors: list
    message: str


# ---------------------------------------------------------------------------
# POST /quote/bike
# ---------------------------------------------------------------------------
@router.post("/bike", response_model=QuoteResponse)
def quote_bike(
    req: BikeQuoteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    preprocessor = _get("bike_insurance_preprocessor.pkl")
    model        = _get("bike_insurance_xgboost_model.pkl")

    city_info   = CITY_INFO.get(req.city, {"tier": 2, "risk": 1.0, "state": req.state})
    vehicle_age = 2026 - req.manufacturing_year
    num_addons  = sum([
        req.addon_consumables_cover, req.addon_engine_protection,
        req.addon_pillion_rider_cover, req.addon_return_to_invoice,
        req.addon_roadside_assistance, req.addon_unknown,
        req.addon_zero_depreciation,
    ])

    # Column order must exactly match the ETL notebook:
    # OrdinalEncoder cols first, then StandardScaler, then remainder passthrough
    df = pd.DataFrame([{
        # OrdinalEncoder columns (in ETL order)
        "segment":      req.segment,
        "fuel_type":    req.fuel_type,
        "policy_type":  req.policy_type,
        "city":         req.city,
        "state":        req.state,
        "vehicle_make": req.vehicle_make,
        "vehicle_model":req.vehicle_model,
        "variant":      req.variant,
        "manufacturing_year":req.manufacturing_year,
        # StandardScaler columns (in ETL order)
        "customer_age":         req.customer_age,
        "city_tier":            city_info["tier"],
        "city_risk_score":      city_info["risk"],
        "vehicle_age_years":    vehicle_age,
        "engine_cc":            req.engine_cc,
        "idv":                  req.idv,
        "ncb_percent":          req.ncb_percent,
        "claim_history_count":  req.claim_history_count,
        "num_addons":           num_addons,
        # Passthrough addon columns (in ETL order)
        "addon_consumables_cover":   req.addon_consumables_cover,
        "addon_engine_protection":   req.addon_engine_protection,
        "addon_pillion_rider_cover": req.addon_pillion_rider_cover,
        "addon_return_to_invoice":   req.addon_return_to_invoice,
        "addon_roadside_assistance": req.addon_roadside_assistance,
        "addon_unknown":             req.addon_unknown,
        "addon_zero_depreciation":   req.addon_zero_depreciation,
    }])

    try:
        X         = preprocessor.transform(df)
        predicted = float(model.predict(X)[0])
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Prediction error: {str(e)}")

    factors = _top_factors(model, preprocessor)

    # Save to DB
    try:
        q = Quotation(
            user_id=current_user.id,
            vehicle_type="bike",
            vehicle_make=req.vehicle_make,
            vehicle_model=req.vehicle_model,
            manufacturing_year=req.manufacturing_year,
            city=req.city,
            idv=req.idv,
            ncb_percent=req.ncb_percent,
            predicted_premium=round(predicted),
        )
        db.add(q)
        db.commit()
    except Exception:
        db.rollback()  # don't let a DB error kill the prediction response

    premium = round(predicted)
    return QuoteResponse(
        vehicle_type="bike",
        predicted_premium=premium,
        monthly_premium=round(premium / 12),
        top_factors=factors,
        message=f"Your estimated annual bike insurance premium is ₹{premium:,}",
    )


# ---------------------------------------------------------------------------
# POST /quote/car
# ---------------------------------------------------------------------------
@router.post("/car", response_model=QuoteResponse)
def quote_car(
    req: CarQuoteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    preprocessor = _get("car_insurance_preprocessor.pkl")
    model        = _get("car_insurance_xgboost_model.pkl")

    city_info   = CITY_INFO.get(req.city, {"tier": 2, "risk": 1.0, "state": req.state})
    vehicle_age = 2026 - req.manufacturing_year
    num_addons  = sum([
        req.addon_consumables_cover, req.addon_engine_protection,
        req.addon_key_replacement, req.addon_no_claim_bonus_protection,
        req.addon_passenger_cover, req.addon_personal_accident_cover,
        req.addon_return_to_invoice, req.addon_roadside_assistance,
        req.addon_tyre_protection, req.addon_zero_depreciation,
    ])

    df = pd.DataFrame([{
        # OrdinalEncoder columns
        "segment":      req.segment,
        "fuel_type":    req.fuel_type,
        "policy_type":  req.policy_type,
        "city":         req.city,
        "state":        req.state,
        "vehicle_make": req.vehicle_make,
        "vehicle_model":req.vehicle_model,
        "variant":      req.variant,
        # StandardScaler columns
        "manufacturing_year":req.manufacturing_year,
        "customer_age":         req.customer_age,
        "city_tier":            city_info["tier"],
        "city_risk_score":      city_info["risk"],
        "vehicle_age_years":    vehicle_age,
        "engine_cc":            req.engine_cc,
        "idv":                  req.idv,
        "ncb_percent":          req.ncb_percent,
        "claim_history_count":  req.claim_history_count,
        "num_addons":           num_addons,
        # Passthrough addon columns
        "addon_consumables_cover":        req.addon_consumables_cover,
        "addon_engine_protection":        req.addon_engine_protection,
        "addon_key_replacement":          req.addon_key_replacement,
        "addon_no_claim_bonus_protection":req.addon_no_claim_bonus_protection,
        "addon_passenger_cover":          req.addon_passenger_cover,
        "addon_personal_accident_cover":  req.addon_personal_accident_cover,
        "addon_return_to_invoice":        req.addon_return_to_invoice,
        "addon_roadside_assistance":      req.addon_roadside_assistance,
        "addon_tyre_protection":          req.addon_tyre_protection,
        "addon_zero_depreciation":        req.addon_zero_depreciation,
    }])

    try:
        X         = preprocessor.transform(df)
        predicted = float(model.predict(X)[0])
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Prediction error: {str(e)}")

    factors = _top_factors(model, preprocessor)

    try:
        q = Quotation(
            user_id=current_user.id,
            vehicle_type="car",
            vehicle_make=req.vehicle_make,
            vehicle_model=req.vehicle_model,
            manufacturing_year=req.manufacturing_year,
            city=req.city,
            idv=req.idv,
            ncb_percent=req.ncb_percent,
            predicted_premium=round(predicted),
        )
        db.add(q)
        db.commit()
    except Exception:
        db.rollback()

    premium = round(predicted)
    return QuoteResponse(
        vehicle_type="car",
        predicted_premium=premium,
        monthly_premium=round(premium / 12),
        top_factors=factors,
        message=f"Your estimated annual car insurance premium is ₹{premium:,}",
    )


# ---------------------------------------------------------------------------
# POST /quote/health
# ---------------------------------------------------------------------------
@router.post("/health", response_model=QuoteResponse)
def quote_health(
    req: HealthQuoteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    preprocessor = _get("health_insurance_preprocessor.pkl")
    model        = _get("health_insurance_xgboost_model.pkl")

    # num_addons = count of active addon flags
    num_addons = sum([
        req.addon_critical_illness_rider, req.addon_dental_vision,
        req.addon_hospital_cash, req.addon_international_cover,
        req.addon_maternity, req.addon_opd_cover, req.addon_personal_accident,
    ])

    df = pd.DataFrame([{
        # OrdinalEncoder columns (includes binary flags — matches ETL Cell 74!)
        "plan_name":       req.plan_name,
        "plan_category":   req.plan_category,
        "gender":          req.gender,
        "state":           req.state,
        "bmi_category":    req.bmi_category,
        "smoke":           req.smoke,
        "has_pre_existing":req.has_pre_existing,
        "annual_checkup":  req.annual_checkup,
        "has_maternity":   req.has_maternity,
        "has_opd":         req.has_opd,
        # StandardScaler columns
        "age":          req.age,
        "num_members":  req.num_members,
        "city_tier":    req.city_tier,
        "ncb_years":    req.ncb_years,
        "sum_insured":  req.sum_insured,
        "deductible":   req.deductible,
        "num_addons":   num_addons,
        "policy_tenure":req.policy_tenure,
        # Passthrough addon columns
        "addon_critical_illness_rider": req.addon_critical_illness_rider,
        "addon_dental_vision":          req.addon_dental_vision,
        "addon_hospital_cash":          req.addon_hospital_cash,
        "addon_international_cover":    req.addon_international_cover,
        "addon_maternity":              req.addon_maternity,
        "addon_opd_cover":              req.addon_opd_cover,
        "addon_personal_accident":      req.addon_personal_accident,
    }])

    try:
        X         = preprocessor.transform(df)
        predicted = float(model.predict(X)[0])
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Prediction error: {str(e)}")

    factors = _top_factors(model, preprocessor)

    premium = round(predicted)
    return QuoteResponse(
        vehicle_type="health",
        predicted_premium=premium,
        monthly_premium=round(premium / 12),
        top_factors=factors,
        message=f"Your estimated annual health insurance premium is ₹{premium:,}",
    )


# ---------------------------------------------------------------------------
# GET /quote/lookup/{vehicle_type} — returns valid dropdown values
# ---------------------------------------------------------------------------
@router.get("/lookup/{vehicle_type}")
def get_lookup(vehicle_type: str):
    if vehicle_type not in ("bike", "car", "health"):
        raise HTTPException(status_code=404, detail="Unknown vehicle type")

    if vehicle_type == "health":
        pre  = _get("health_insurance_preprocessor.pkl")
        enc  = pre.named_transformers_["all_categorical_encoder"]
        cats = list(pre.transformers_[0][2])
        return {
            "plan_names":      [str(v) for v in enc.categories_[cats.index("plan_name")]],
            "plan_categories": [str(v) for v in enc.categories_[cats.index("plan_category")]],
            "genders":         [str(v) for v in enc.categories_[cats.index("gender")]],
            "states":          [str(v) for v in enc.categories_[cats.index("state")]],
            "bmi_categories":  [str(v) for v in enc.categories_[cats.index("bmi_category")]],
        }
    else:
        pre  = _get(f"{vehicle_type}_insurance_preprocessor.pkl")
        enc  = pre.named_transformers_["all_categorical_encoder"]
        cats = list(pre.transformers_[0][2])
        return {
            "segments": [str(v) for v in enc.categories_[cats.index("segment")]],
            "fuels":    [str(v) for v in enc.categories_[cats.index("fuel_type")]],
            "policies": [str(v) for v in enc.categories_[cats.index("policy_type")]],
            "cities":   [str(v) for v in enc.categories_[cats.index("city")]],
            "states":   [str(v) for v in enc.categories_[cats.index("state")]],
            "makes":    [str(v) for v in enc.categories_[cats.index("vehicle_make")]],
            "models":   [str(v) for v in enc.categories_[cats.index("vehicle_model")]],
            "variants": [str(v) for v in enc.categories_[cats.index("variant")]],
        }