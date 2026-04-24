"""Modèles Business — Produit, Mouvements de stock, Commandes.
Utilisés par les algorithmes économiques WMA, EOQ, Safety Stock."""
from datetime import datetime
from database import db


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(60))
    category = db.Column(db.String(80), default="general")
    price = db.Column(db.Float, default=0.0)
    cost = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(8), default="FCFA")

    # Inventaire
    stock = db.Column(db.Integer, default=0)
    reorder_point = db.Column(db.Float, default=0.0)
    eoq = db.Column(db.Float, default=0.0)            # Economic Order Quantity calculé
    safety_stock = db.Column(db.Float, default=0.0)   # Stock de sécurité calculé

    # Coûts pour EOQ
    ordering_cost = db.Column(db.Float, default=0.0)  # Coût par commande
    holding_cost = db.Column(db.Float, default=0.0)   # Coût annuel de stockage par unité

    # Service level / lead time
    lead_time_days = db.Column(db.Integer, default=7)
    service_level = db.Column(db.Float, default=0.95)

    description_translations_json = db.Column(db.Text, default="{}")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    movements = db.relationship("StockMovement", backref="product", cascade="all, delete-orphan")

    def to_dict(self):
        import json
        try:
            translations = json.loads(self.description_translations_json or "{}")
        except json.JSONDecodeError:
            translations = {}
        return {
            "id": self.id,
            "name": self.name,
            "sku": self.sku,
            "category": self.category,
            "price": self.price,
            "cost": self.cost,
            "currency": self.currency,
            "stock": self.stock,
            "reorderPoint": self.reorder_point,
            "eoq": self.eoq,
            "safetyStock": self.safety_stock,
            "orderingCost": self.ordering_cost,
            "holdingCost": self.holding_cost,
            "leadTimeDays": self.lead_time_days,
            "serviceLevel": self.service_level,
            "descriptionTranslations": translations,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class StockMovement(db.Model):
    __tablename__ = "stock_movements"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False)         # +entrée / -sortie
    type = db.Column(db.String(20), default="sale")          # sale|purchase|adjustment|return
    occurred_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    note = db.Column(db.String(255), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "productId": self.product_id,
            "quantity": self.quantity,
            "type": self.type,
            "occurredAt": self.occurred_at.isoformat() if self.occurred_at else None,
            "note": self.note,
        }


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    customer_name = db.Column(db.String(200), default="")
    customer_language = db.Column(db.String(8), default="fra")

    total = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(8), default="FCFA")
    status = db.Column(db.String(20), default="pending")  # pending|paid|shipped|delivered|cancelled

    items_json = db.Column(db.Text, default="[]")  # [{productId, qty, price}]

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        try:
            items = json.loads(self.items_json or "[]")
        except json.JSONDecodeError:
            items = []
        return {
            "id": self.id,
            "customerName": self.customer_name,
            "customerLanguage": self.customer_language,
            "total": self.total,
            "currency": self.currency,
            "status": self.status,
            "items": items,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
