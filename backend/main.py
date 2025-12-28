# ==============================
# FASTAPI FX FORECAST BACKEND
# ==============================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import numpy as np
import pandas as pd
import datetime
import joblib
import os

from tensorflow.keras.models import load_model

# ==============================
# BASE DIRECTORY (🔥 IMPORTANT FIX)
# ==============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ==============================
# INITIALIZE APP
# ==============================

app = FastAPI(
    title="FX Hybrid Forecast API",
    description="15-Day INR Forecast using LSTM + XGBoost",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# LOAD MODELS & ASSETS (ONCE)
# ==============================

LOOK_BACK = 60
FEATURES = 5

lstm = load_model(os.path.join(BASE_DIR, "lstm_model.h5"))
xgb = joblib.load(os.path.join(BASE_DIR, "xgb_model.joblib"))

scaler_x = joblib.load(os.path.join(BASE_DIR, "scaler_x.joblib"))
scaler_y = joblib.load(os.path.join(BASE_DIR, "scaler_y.joblib"))

last_sequence = joblib.load(
    os.path.join(BASE_DIR, "last_sequence.joblib")
)  # shape: (60, 5)

model_volatility = joblib.load(
    os.path.join(BASE_DIR, "model_volatility.joblib")
)

price_df = joblib.load(
    os.path.join(BASE_DIR, "price_data.joblib")
)  # contains Price column

# ==============================
# HEALTH CHECK
# ==============================

@app.get("/")
def home():
    return {"status": "API is running successfully 🚀"}

# ==============================
# 15-DAY FORECAST ENDPOINT
# ==============================

@app.get("/forecast")
def forecast_15_days():

    days_to_predict = 15

    future_prices = []
    upper_band = []
    lower_band = []

    current_seq = last_sequence.reshape(1, LOOK_BACK, FEATURES)
    last_known_price = float(price_df["Price"].iloc[-1])

    for i in range(days_to_predict):

        # ---- LSTM Trend ----
        lstm_pred = lstm.predict(current_seq, verbose=0)

        # ---- Hybrid Input ----
        last_step = current_seq[:, -1, :]
        hybrid_input = np.hstack([last_step, lstm_pred])

        # ---- XGBoost Return ----
        pred_scaled = xgb.predict(hybrid_input)
        pred_return = scaler_y.inverse_transform(
            pred_scaled.reshape(-1, 1)
        )[0][0]

        # ---- Market Noise Injection ----
        noise = np.random.normal(0, model_volatility * 0.5)

        next_price = last_known_price + pred_return + noise
        future_prices.append(next_price)

        # ---- Confidence Interval ----
        uncertainty = model_volatility * np.sqrt(i + 1)
        upper_band.append(next_price + uncertainty)
        lower_band.append(next_price - uncertainty)

        # ---- Update Sequence ----
        new_row = last_step.copy()
        new_row[0, 1] = pred_scaled[0]

        current_seq = np.append(
            current_seq[:, 1:, :],
            new_row.reshape(1, 1, FEATURES),
            axis=1
        )

        last_known_price = next_price

    # ==============================
    # DATE GENERATION
    # ==============================

    start_date = datetime.date.today() + datetime.timedelta(days=1)
    dates = [
        (start_date + datetime.timedelta(days=i)).isoformat()
        for i in range(days_to_predict)
    ]

    # ==============================
    # BEST TRADE DAY (MID-RANGE)
    # ==============================

    max_price = max(future_prices)
    min_price = min(future_prices)
    mid_price = (max_price + min_price) / 2

    best_index = int(
        np.argmin(np.abs(np.array(future_prices) - mid_price))
    )

    # ==============================
    # RESPONSE
    # ==============================

    return {
        "dates": dates,
        "predicted_prices": future_prices,
        "upper_risk": upper_band,
        "lower_risk": lower_band,
        "best_trade_day": {
            "date": dates[best_index],
            "price": round(future_prices[best_index], 2),
            "reason": "Recommended Price for minimum loss"
        }
    }
