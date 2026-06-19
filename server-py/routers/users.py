import bcrypt
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from database import get_db
from auth import create_access_token, verify_token
from helpers import serialize_doc, paginate_cursor, to_object_id

router = APIRouter()

COOKIE_OPTS = dict(
    key="token",
    httponly=True,
    secure=True,
    samesite="none",
    max_age=60 * 60 * 24 * 365,
    domain=".royalepanama.com",
    path="/",
)


class UserBody(BaseModel):
    firstname: str
    lastname: str
    email: str
    password: Optional[str] = None
    rol: int
    status: int


def _get_rol(id: int) -> str:
    return "Admin" if id == 1 else "Vendedor"


def _user_resp(user: dict) -> dict:
    from datetime import datetime
    return {
        "id": str(user["_id"]),
        "firstname": user["firstname"],
        "lastname": user["lastname"],
        "email": user["email"],
        "rol": _get_rol(user.get("rol", 2)),
        "status": user.get("status"),
        "createdAt": user["createdAt"].isoformat() if isinstance(user.get("createdAt"), datetime) else None,
        "updatedAt": user["updatedAt"].isoformat() if isinstance(user.get("updatedAt"), datetime) else None,
    }


@router.get("/api/users/all")
def get_all_users():
    db = get_db()
    docs = list(db.users.find({}, {"firstname": 1, "lastname": 1, "email": 1, "rol": 1, "status": 1}))
    return [serialize_doc(d) for d in docs]


@router.get("/api/users/sellers")
def get_sellers(page: int = Query(default=1)):
    db = get_db()
    query = {"rol": 2}
    cursor = db.users.find(query, {"firstname": 1, "lastname": 1}).sort("firstname", 1)
    return paginate_cursor(cursor, db.users, query, page)


@router.get("/api/users")
def get_users(page: int = Query(default=1)):
    db = get_db()
    query = {}
    cursor = db.users.find(query, {"firstname": 1, "lastname": 1, "email": 1, "rol": 1, "status": 1})
    return paginate_cursor(cursor, db.users, query, page)


@router.post("/api/user")
def create_user(body: UserBody, response: Response):
    db = get_db()
    if db.users.find_one({"email": body.email}):
        return JSONResponse(status_code=400, content=["El Correo ya está en uso"])

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    password_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    doc = {
        "firstname": body.firstname, "lastname": body.lastname,
        "email": body.email, "password": password_hash,
        "rol": body.rol, "status": body.status,
        "createdAt": now, "updatedAt": now,
    }
    result = db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    token = create_access_token({"id": str(doc["_id"])})
    response.set_cookie(**COOKIE_OPTS, value=token)
    return _user_resp(doc)


@router.put("/api/user/{id}")
def update_user(id: str, body: UserBody):
    db = get_db()
    from datetime import datetime, timezone

    if body.password:
        password_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    else:
        existing = db.users.find_one({"email": body.email}, {"password": 1})
        password_hash = existing["password"] if existing else ""

    update_data = {
        "firstname": body.firstname, "lastname": body.lastname,
        "email": body.email, "password": password_hash,
        "rol": body.rol, "status": body.status,
        "updatedAt": datetime.now(timezone.utc),
    }
    doc = db.users.find_one_and_update(
        {"_id": to_object_id(id)}, {"$set": update_data}, return_document=True
    )
    if not doc:
        return JSONResponse(status_code=404, content={"message": "User not Found"})
    return _user_resp(doc)
