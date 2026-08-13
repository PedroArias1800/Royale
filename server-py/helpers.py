import math
from bson import ObjectId
from datetime import datetime, timezone, timedelta


def generate_order_number(db) -> str:
    panama_now = datetime.now(timezone(timedelta(hours=-5)))
    date_str = panama_now.strftime("%Y%m%d")
    prefix = f"RYL-{date_str}-"
    count = db.transactions.count_documents({"order_number": {"$regex": f"^{prefix}"}})
    return f"{prefix}{str(count + 1).zfill(4)}"


def mark_coupon_used(db, coupon_id) -> None:
    if not coupon_id:
        return
    try:
        oid = ObjectId(str(coupon_id))
    except Exception:
        return
    coupon = db.coupons.find_one({"_id": oid})
    if not coupon:
        return
    max_uses = coupon.get("max_uses")
    uses_count = coupon.get("uses_count", 0) + 1
    update_op: dict = {"$inc": {"uses_count": 1}}
    if max_uses is not None and uses_count >= max_uses:
        update_op["$set"] = {"status": 0, "updatedAt": datetime.now(timezone.utc)}
    db.coupons.update_one({"_id": oid}, update_op)


def compute_delivery_date(express: bool) -> str:
    panama_now = datetime.now(timezone(timedelta(hours=-5)))
    if express and panama_now.hour >= 10:
        return panama_now.strftime("%Y-%m-%d")
    return (panama_now + timedelta(days=1)).strftime("%Y-%m-%d")


def serialize_doc(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [_serialize_value(v) for v in value]
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        else:
            result[key] = value
    return result


def _serialize_value(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, datetime):
        return v.isoformat()
    if isinstance(v, dict):
        return serialize_doc(v)
    return v


def paginate_cursor(cursor, collection, query: dict, page: int, limit: int = 15) -> dict:
    skip = (page - 1) * limit
    docs = [serialize_doc(d) for d in cursor.skip(skip).limit(limit)]
    total = collection.count_documents(query)
    return {
        "data": docs,
        "pagination": {
            "currentPage": page,
            "totalPages": math.ceil(total / limit),
            "totalItems": total,
            "itemsPerPage": limit,
        },
    }


def to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid ID format")
