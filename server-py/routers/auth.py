import os
import bcrypt
from fastapi import APIRouter, Response, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from database import get_db
from auth import create_access_token, verify_token
from helpers import serialize_doc, to_object_id

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


class LoginBody(BaseModel):
    email: str
    password: str


def _user_response(user: dict) -> dict:
    rol = user.get("rol", 2)
    roles = user.get("roles") or [rol]
    return {
        "id": str(user["_id"]),
        "firstname": user["firstname"],
        "lastname": user["lastname"],
        "email": user["email"],
        "rol": rol,
        "roles": roles,
        "status": user.get("status"),
        "createdAt": user.get("createdAt", "").isoformat() if user.get("createdAt") else None,
        "updatedAt": user.get("updatedAt", "").isoformat() if user.get("updatedAt") else None,
    }


@router.post("/api/login")
def login(body: LoginBody, response: Response):
    db = get_db()
    user = db.users.find_one({"email": body.email})
    if not user:
        return JSONResponse(status_code=400, content=["Invalid Credentials"])

    if not bcrypt.checkpw(body.password.encode(), user["password"].encode()):
        return JSONResponse(status_code=400, content=["Invalid Credentials"])

    token = create_access_token({"id": str(user["_id"])})
    response.set_cookie(**COOKIE_OPTS, value=token)
    return _user_response(user)


@router.post("/api/logout")
def logout(response: Response):
    response.delete_cookie("token", path="/", domain=".royalepanama.com")
    return Response(status_code=200)


@router.get("/api/verify")
def verify(payload: dict = Depends(verify_token)):
    db = get_db()
    user = db.users.find_one({"_id": to_object_id(payload["id"])})
    if not user:
        return JSONResponse(status_code=401, content=["User not found"])
    rol = user.get("rol", 2)
    return {
        "id": str(user["_id"]),
        "firstname": user["firstname"],
        "lastname": user["lastname"],
        "email": user["email"],
        "rol": rol,
        "roles": user.get("roles") or [rol],
        "status": user.get("status"),
    }


@router.get("/api/profile")
def profile(payload: dict = Depends(verify_token)):
    db = get_db()
    user = db.users.find_one({"_id": to_object_id(payload["id"])})
    if not user:
        return JSONResponse(status_code=400, content={"message": "User not Found"})
    return _user_response(user)
