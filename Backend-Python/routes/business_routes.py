"""
Routes business — produits, mouvements de stock, commandes.
S'appuie sur services/economics.py pour WMA, EOQ, Safety Stock.
"""
from datetime import datetime, timedelta
import json
from flask import Blueprint, request, jsonify, g
from sqlalchemy import func

from database import db
from models import Product, StockMovement, Order
from services.economics import (
    full_inventory_analysis,
    economic_order_quantity,
    safety_stock,
    reorder_point,
    forecast_demand_wma,
    abc_analysis,
)
from auth import jwt_required

business_bp = Blueprint("business", __name__)


# ------------------ Produits ------------------
@business_bp.get("/products")
@jwt_required
def list_products():
    rows = Product.query.filter_by(user_id=g.current_user.id).all()
    return jsonify({"products": [p.to_dict() for p in rows]})


@business_bp.post("/products")
@jwt_required
def create_product():
    data = request.get_json(silent=True) or {}
    p = Product(
        user_id=g.current_user.id,
        name=data["name"],
        sku=data.get("sku", ""),
        category=data.get("category", "general"),
        price=float(data.get("price", 0)),
        cost=float(data.get("cost", 0)),
        currency=data.get("currency", "FCFA"),
        stock=int(data.get("stock", 0)),
        ordering_cost=float(data.get("orderingCost", 0)),
        holding_cost=float(data.get("holdingCost", 0)),
        lead_time_days=int(data.get("leadTimeDays", 7)),
        service_level=float(data.get("serviceLevel", 0.95)),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify({"product": p.to_dict()}), 201


@business_bp.get("/products/<int:pid>")
@jwt_required
def get_product(pid):
    p = Product.query.filter_by(id=pid, user_id=g.current_user.id).first_or_404()
    return jsonify({"product": p.to_dict()})


# ------------------ Mouvements de stock ------------------
@business_bp.post("/products/<int:pid>/movements")
@jwt_required
def add_movement(pid):
    p = Product.query.filter_by(id=pid, user_id=g.current_user.id).first_or_404()
    data = request.get_json(silent=True) or {}
    qty = int(data.get("quantity", 0))
    mtype = data.get("type", "sale")

    movement = StockMovement(product_id=p.id, quantity=qty, type=mtype, note=data.get("note", ""))
    db.session.add(movement)

    # Mise à jour du stock courant
    if mtype in ("sale",):
        p.stock = max(0, p.stock - abs(qty))
    elif mtype in ("purchase", "return"):
        p.stock += abs(qty)
    else:
        p.stock += qty  # adjustment signé

    db.session.commit()
    return jsonify({"movement": movement.to_dict(), "product": p.to_dict()}), 201


# ------------------ Algorithmes économiques ------------------
def _daily_sales_history(product_id: int, days: int = 90):
    """Renvoie une liste des ventes quotidiennes (positives) sur N jours."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.session.query(
            func.date(StockMovement.occurred_at).label("d"),
            func.sum(StockMovement.quantity).label("q"),
        )
        .filter(StockMovement.product_id == product_id)
        .filter(StockMovement.type == "sale")
        .filter(StockMovement.occurred_at >= cutoff)
        .group_by("d")
        .order_by("d")
        .all()
    )
    # Remplit les jours manquants à 0 pour la stabilité statistique
    history = {r.d: abs(r.q or 0) for r in rows}
    today = datetime.utcnow().date()
    series = []
    for i in range(days, 0, -1):
        d = (today - timedelta(days=i - 1))
        series.append(float(history.get(str(d), 0)))
    return series


@business_bp.get("/products/<int:pid>/analytics")
@jwt_required
def product_analytics(pid):
    p = Product.query.filter_by(id=pid, user_id=g.current_user.id).first_or_404()
    history = _daily_sales_history(pid, days=90)

    analysis = full_inventory_analysis(
        daily_demand_history=history,
        ordering_cost=p.ordering_cost,
        holding_cost_per_unit=p.holding_cost,
        lead_time_days=p.lead_time_days,
        service_level=p.service_level,
    )

    # Persiste les valeurs dérivées
    p.eoq = analysis["eoq"]["eoq"]
    p.safety_stock = analysis["safetyStock"]["safetyStock"]
    p.reorder_point = analysis["reorderPoint"]["reorderPoint"]
    db.session.commit()

    return jsonify({
        "product": p.to_dict(),
        "history": history,
        "analysis": analysis,
    })


@business_bp.post("/economics/eoq")
@jwt_required
def standalone_eoq():
    """Endpoint utilitaire — calcule un EOQ sans avoir à créer un produit."""
    data = request.get_json(silent=True) or {}
    return jsonify(economic_order_quantity(
        annual_demand=float(data.get("annualDemand", 0)),
        ordering_cost=float(data.get("orderingCost", 0)),
        holding_cost_per_unit=float(data.get("holdingCost", 0)),
    ))


@business_bp.post("/economics/wma")
@jwt_required
def standalone_wma():
    data = request.get_json(silent=True) or {}
    return jsonify(forecast_demand_wma(
        daily_demand=data.get("dailyDemand", []),
        window=int(data.get("window", 7)),
        horizon_days=int(data.get("horizonDays", 30)),
    ))


@business_bp.post("/economics/safety-stock")
@jwt_required
def standalone_safety_stock():
    data = request.get_json(silent=True) or {}
    ss = safety_stock(
        daily_demand_history=data.get("dailyDemand", []),
        lead_time_days=int(data.get("leadTimeDays", 7)),
        service_level=float(data.get("serviceLevel", 0.95)),
    )
    rop = reorder_point(
        daily_demand_history=data.get("dailyDemand", []),
        lead_time_days=int(data.get("leadTimeDays", 7)),
        service_level=float(data.get("serviceLevel", 0.95)),
    )
    return jsonify({"safetyStock": ss, "reorderPoint": rop})


@business_bp.get("/economics/abc")
@jwt_required
def abc():
    rows = Product.query.filter_by(user_id=g.current_user.id).all()
    items = [{"id": p.id, "name": p.name, "value": (p.price * p.stock) or 0} for p in rows]
    return jsonify({"abc": abc_analysis(items)})


# ------------------ Commandes (marketplace cross-langue) ------------------
@business_bp.post("/orders")
@jwt_required
def create_order():
    data = request.get_json(silent=True) or {}
    items = data.get("items", [])
    total = sum(i.get("qty", 0) * i.get("price", 0) for i in items)
    order = Order(
        user_id=g.current_user.id,
        customer_name=data.get("customerName", ""),
        customer_language=data.get("customerLanguage", "fra"),
        total=total,
        currency=data.get("currency", "FCFA"),
        items_json=json.dumps(items, ensure_ascii=False),
    )
    db.session.add(order)
    db.session.commit()
    return jsonify({"order": order.to_dict()}), 201


@business_bp.get("/orders")
@jwt_required
def list_orders():
    rows = Order.query.filter_by(user_id=g.current_user.id).order_by(Order.created_at.desc()).all()
    return jsonify({"orders": [o.to_dict() for o in rows]})
