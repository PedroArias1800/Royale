import math
from bson import ObjectId
from datetime import datetime


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
