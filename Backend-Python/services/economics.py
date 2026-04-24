"""
Algorithmes économiques KIVU — calculs serveur.

Implémente :
- WMA : Weighted Moving Average (prévision de la demande pondérée)
- EOQ : Economic Order Quantity (formule de Wilson)
- Safety Stock : stock de sécurité pour atteindre un niveau de service donné
- Reorder Point : point de réapprovisionnement
- ABC Analysis : classification des produits par valeur

Toutes les fonctions sont pures et 100% testables.
"""

from __future__ import annotations
import math
import statistics
from datetime import datetime, timedelta
from typing import Iterable, List, Sequence


# ---------------------------------------------------------------------------
# 1️⃣ Weighted Moving Average (WMA)
# ---------------------------------------------------------------------------
def weighted_moving_average(values: Sequence[float], weights: Sequence[float] | None = None) -> float:
    """
    Calcule la moyenne mobile pondérée.

    Si `weights` n'est pas fourni, les poids sont linéaires (la valeur la plus
    récente a le plus grand poids) — convention standard en finance/supply chain.

    >>> weighted_moving_average([10, 20, 30])
    23.333333333333332    # (10*1 + 20*2 + 30*3) / (1+2+3)
    """
    n = len(values)
    if n == 0:
        return 0.0

    if weights is None:
        weights = list(range(1, n + 1))  # 1, 2, 3, …, n
    elif len(weights) != n:
        raise ValueError("len(weights) doit être égal à len(values)")

    total_weight = sum(weights)
    if total_weight == 0:
        return 0.0

    return sum(v * w for v, w in zip(values, weights)) / total_weight


def forecast_demand_wma(
    daily_demand: Sequence[float],
    window: int = 7,
    horizon_days: int = 30,
) -> dict:
    """
    Prévoit la demande future à `horizon_days` à partir de l'historique.
    Renvoie également la WMA quotidienne projetée.
    """
    if len(daily_demand) < 2:
        avg = float(daily_demand[0]) if daily_demand else 0.0
        return {
            "wmaDaily": avg,
            "forecastTotal": avg * horizon_days,
            "horizonDays": horizon_days,
            "windowSize": min(window, len(daily_demand)),
            "method": "WMA",
        }

    window = min(window, len(daily_demand))
    recent = list(daily_demand[-window:])
    wma_daily = weighted_moving_average(recent)

    return {
        "wmaDaily": round(wma_daily, 4),
        "forecastTotal": round(wma_daily * horizon_days, 2),
        "horizonDays": horizon_days,
        "windowSize": window,
        "method": "WMA",
    }


# ---------------------------------------------------------------------------
# 2️⃣ Economic Order Quantity (EOQ — formule de Wilson)
# ---------------------------------------------------------------------------
def economic_order_quantity(
    annual_demand: float,
    ordering_cost: float,
    holding_cost_per_unit: float,
) -> dict:
    """
    Calcule la quantité économique de commande.

    Q* = sqrt( (2 * D * S) / H )
        D = demande annuelle (unités)
        S = coût de passation d'une commande
        H = coût annuel de détention d'une unité en stock
    """
    if annual_demand <= 0 or ordering_cost <= 0 or holding_cost_per_unit <= 0:
        return {
            "eoq": 0.0,
            "totalCost": 0.0,
            "ordersPerYear": 0.0,
            "cycleDays": 0.0,
            "warning": "Paramètres invalides : tous doivent être > 0",
        }

    eoq = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost_per_unit)
    orders_per_year = annual_demand / eoq
    cycle_days = 365.0 / orders_per_year if orders_per_year > 0 else 0
    total_cost = (annual_demand / eoq) * ordering_cost + (eoq / 2) * holding_cost_per_unit

    return {
        "eoq": round(eoq, 2),
        "totalCost": round(total_cost, 2),
        "ordersPerYear": round(orders_per_year, 2),
        "cycleDays": round(cycle_days, 1),
        "method": "EOQ-Wilson",
    }


# ---------------------------------------------------------------------------
# 3️⃣ Safety Stock & Reorder Point
# ---------------------------------------------------------------------------
# Z-scores pour les niveaux de service les plus communs (loi normale)
_Z_TABLE = {
    0.50: 0.00, 0.80: 0.84, 0.85: 1.04, 0.90: 1.28,
    0.95: 1.65, 0.97: 1.88, 0.98: 2.05, 0.99: 2.33, 0.999: 3.09,
}


def _z_score(service_level: float) -> float:
    """Renvoie le z-score correspondant à un niveau de service (0-1)."""
    if service_level >= 0.999:
        return 3.09
    # Interpolation linéaire entre les valeurs connues les plus proches
    keys = sorted(_Z_TABLE.keys())
    for i, k in enumerate(keys):
        if service_level <= k:
            if i == 0:
                return _Z_TABLE[k]
            k_low = keys[i - 1]
            ratio = (service_level - k_low) / (k - k_low) if k != k_low else 0
            return _Z_TABLE[k_low] + ratio * (_Z_TABLE[k] - _Z_TABLE[k_low])
    return 1.65  # défaut 95%


def safety_stock(
    daily_demand_history: Sequence[float],
    lead_time_days: int,
    service_level: float = 0.95,
) -> dict:
    """
    Calcule le stock de sécurité.
    SS = Z × σ_demande × sqrt(LeadTime)
    """
    if not daily_demand_history or lead_time_days <= 0:
        return {"safetyStock": 0.0, "stdDev": 0.0, "zScore": 0.0}

    if len(daily_demand_history) < 2:
        std_dev = 0.0
    else:
        std_dev = statistics.stdev(daily_demand_history)

    z = _z_score(service_level)
    ss = z * std_dev * math.sqrt(lead_time_days)

    return {
        "safetyStock": round(ss, 2),
        "stdDev": round(std_dev, 4),
        "zScore": round(z, 4),
        "leadTimeDays": lead_time_days,
        "serviceLevel": service_level,
    }


def reorder_point(
    daily_demand_history: Sequence[float],
    lead_time_days: int,
    service_level: float = 0.95,
) -> dict:
    """
    ROP = (demande moyenne quotidienne × lead time) + safety stock
    """
    if not daily_demand_history:
        return {"reorderPoint": 0.0, "avgDailyDemand": 0.0, "safetyStock": 0.0}

    avg = sum(daily_demand_history) / len(daily_demand_history)
    ss_data = safety_stock(daily_demand_history, lead_time_days, service_level)
    rop = avg * lead_time_days + ss_data["safetyStock"]

    return {
        "reorderPoint": round(rop, 2),
        "avgDailyDemand": round(avg, 4),
        "safetyStock": ss_data["safetyStock"],
        "leadTimeDays": lead_time_days,
        "serviceLevel": service_level,
    }


# ---------------------------------------------------------------------------
# 4️⃣ ABC Analysis — Classification des produits
# ---------------------------------------------------------------------------
def abc_analysis(items: Iterable[dict]) -> List[dict]:
    """
    Classification ABC :
      A = top 80% de la valeur
      B = 80-95%
      C = 95-100%

    `items` = [{"id": ..., "value": annual_revenue}]
    """
    sorted_items = sorted(items, key=lambda x: x.get("value", 0), reverse=True)
    total = sum(i.get("value", 0) for i in sorted_items)
    if total == 0:
        return []

    cumulative = 0.0
    result = []
    for item in sorted_items:
        cumulative += item.get("value", 0)
        ratio = cumulative / total
        if ratio <= 0.80:
            cls = "A"
        elif ratio <= 0.95:
            cls = "B"
        else:
            cls = "C"
        result.append({
            **item,
            "cumulativeRatio": round(ratio, 4),
            "class": cls,
        })
    return result


# ---------------------------------------------------------------------------
# 5️⃣ Synthèse complète pour un produit donné
# ---------------------------------------------------------------------------
def full_inventory_analysis(
    daily_demand_history: Sequence[float],
    ordering_cost: float,
    holding_cost_per_unit: float,
    lead_time_days: int = 7,
    service_level: float = 0.95,
) -> dict:
    """
    Effectue toutes les analyses en une seule passe — pratique pour le tableau de
    bord business KIVU.
    """
    annual_demand = sum(daily_demand_history) * (365.0 / max(len(daily_demand_history), 1))

    eoq = economic_order_quantity(annual_demand, ordering_cost, holding_cost_per_unit)
    ss = safety_stock(daily_demand_history, lead_time_days, service_level)
    rop = reorder_point(daily_demand_history, lead_time_days, service_level)
    forecast = forecast_demand_wma(daily_demand_history, window=7, horizon_days=30)

    return {
        "annualDemandEstimate": round(annual_demand, 2),
        "eoq": eoq,
        "safetyStock": ss,
        "reorderPoint": rop,
        "forecast30Days": forecast,
        "computedAt": datetime.utcnow().isoformat() + "Z",
    }
