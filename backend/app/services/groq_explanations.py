"""Groq-powered, data-grounded explanations for GVP model outputs."""

import os
import logging
from typing import Any

logger = logging.getLogger(__name__)

VALID_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
]

def get_groq_model() -> str:
    """Return the configured Groq model name, validating against supported models."""
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    if not model or model.startswith("openai/") or model not in VALID_MODELS:
        return "llama-3.3-70b-versatile"
    return model


def _build_rule_based_fallback(record: dict[str, Any], rec_pct: str) -> str:
    """Fallback generator when Groq API key is invalid or unreachable."""
    gvp_id = record.get("gvp_id", "Unknown")
    worst = record.get("worst_factor", "High Recurrence Risk")
    bin_m = record.get("distance_to_bin_m", 250)
    market_m = record.get("distance_to_market_m", 100)
    col_freq = record.get("collection_frequency_per_week", 1)
    complaints = record.get("total_complaints", 20)
    action = record.get("recommended_action", "Schedule immediate sanitation cleanup")

    return (
        f"Risk explanation: {gvp_id} shows a {rec_pct} recurrence rate driven by {worst} "
        f"({complaints} complaints logged, nearest bin at {bin_m}m, market at {market_m}m).\n"
        f"Immediate action: Deploy rapid response team to clear active waste dump and conduct vector treatment.\n"
        f"Prevention action: {action} and increase collection frequency from {col_freq}x/week to daily."
    )


def generate_gvp_explanation(record: dict[str, Any]) -> str:
    """Generate a concise, location-specific explanation based on supplied model output and metrics."""
    api_key = os.getenv("GROQ_API_KEY")

    raw_rec = record.get("rf_predicted_recurrence_rate") or record.get("recurrence_rate") or 0.85
    rec_pct = f"{round(float(raw_rec) * 100, 1)}%"

    if not api_key or api_key.startswith("gsk_placeholder"):
        return _build_rule_based_fallback(record, rec_pct)

    try:
        from groq import Groq
    except ImportError:
        return _build_rule_based_fallback(record, rec_pct)

    prompt = f"""You are a GVMC sanitation decision-support AI assistant analyzing GVP {record['gvp_id']}.
Use the supplied telemetry and risk data to provide a clear, distinct briefing.
Reference the exact numbers (complaints, distance to bin/market, collection frequency, etc.) in your answer.

Write exactly three concise labelled lines:
Risk explanation: ...
Immediate action: ...
Prevention action: ...

--- Data for GVP {record['gvp_id']} ---
Risk tier: {record.get('computed_risk_tier', 'Unknown')}
Risk score: {record.get('risk_score', 'Unknown')}
Predicted recurrence rate: {rec_pct}
Total complaints logged: {record.get('total_complaints', 'Unknown')}
Distance to nearest bin: {record.get('distance_to_bin_m', 'Unknown')} meters
Distance to market: {record.get('distance_to_market_m', 'Unknown')} meters
Collection frequency: {record.get('collection_frequency_per_week', 'Unknown')} times/week
Days since last cleanup: {record.get('days_since_last_cleanup', 'Unknown')} days
Population density: {record.get('population_density', 'medium')}
Near school: {record.get('near_school', False)}
Near bus stop: {record.get('near_bus_stop', False)}
Likely root cause: {record.get('worst_factor', 'Unknown')}
Primary recommendation: {record.get('recommended_action', 'Regular monitoring')}
"""

    model_name = get_groq_model()

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=220,
        )
        content = completion.choices[0].message.content
        if content and content.strip():
            return content.strip()
    except Exception as err:
        logger.warning(f"Groq API call failed: {err}. Falling back to rule-based briefing.")
        # Fallback to secondary model llama-3.1-8b-instant or rule-based
        if model_name != "llama-3.1-8b-instant":
            try:
                client = Groq(api_key=api_key)
                completion = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=220,
                )
                content = completion.choices[0].message.content
                if content and content.strip():
                    return content.strip()
            except Exception:
                pass

    return _build_rule_based_fallback(record, rec_pct)
