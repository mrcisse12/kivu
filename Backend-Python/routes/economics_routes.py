"""
Endpoints publics (sans auth) pour les algorithmes économiques — pratique
pour les démos Science Fest Africa et les intégrations partenaires.
"""
from flask import Blueprint, request, jsonify

from services.economics import (
    weighted_moving_average,
    forecast_demand_wma,
    economic_order_quantity,
    safety_stock,
    reorder_point,
    abc_analysis,
    full_inventory_analysis,
)

economics_bp = Blueprint("economics_public", __name__)


@economics_bp.post("/wma")
def wma():
    data = request.get_json(silent=True) or {}
    values = data.get("values", [])
    weights = data.get("weights")
    return jsonify({"wma": weighted_moving_average(values, weights)})


@economics_bp.post("/forecast")
def forecast():
    data = request.get_json(silent=True) or {}
    return jsonify(forecast_demand_wma(
        daily_demand=data.get("dailyDemand", []),
        window=int(data.get("window", 7)),
        horizon_days=int(data.get("horizonDays", 30)),
    ))


@economics_bp.post("/eoq")
def eoq():
    data = request.get_json(silent=True) or {}
    return jsonify(economic_order_quantity(
        annual_demand=float(data.get("annualDemand", 0)),
        ordering_cost=float(data.get("orderingCost", 0)),
        holding_cost_per_unit=float(data.get("holdingCost", 0)),
    ))


@economics_bp.post("/safety-stock")
def ss():
    data = request.get_json(silent=True) or {}
    return jsonify(safety_stock(
        daily_demand_history=data.get("dailyDemand", []),
        lead_time_days=int(data.get("leadTimeDays", 7)),
        service_level=float(data.get("serviceLevel", 0.95)),
    ))


@economics_bp.post("/reorder-point")
def rop():
    data = request.get_json(silent=True) or {}
    return jsonify(reorder_point(
        daily_demand_history=data.get("dailyDemand", []),
        lead_time_days=int(data.get("leadTimeDays", 7)),
        service_level=float(data.get("serviceLevel", 0.95)),
    ))


@economics_bp.post("/abc")
def abc():
    data = request.get_json(silent=True) or {}
    return jsonify({"abc": abc_analysis(data.get("items", []))})


@economics_bp.post("/full-analysis")
def full_analysis():
    data = request.get_json(silent=True) or {}
    return jsonify(full_inventory_analysis(
        daily_demand_history=data.get("dailyDemand", []),
        ordering_cost=float(data.get("orderingCost", 0)),
        holding_cost_per_unit=float(data.get("holdingCost", 0)),
        lead_time_days=int(data.get("leadTimeDays", 7)),
        service_level=float(data.get("serviceLevel", 0.95)),
    ))
