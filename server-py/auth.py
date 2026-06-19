import os
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Cookie, HTTPException


def create_access_token(payload: dict) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + timedelta(days=1)
    return jwt.encode(data, os.environ["JWT_SECRET"], algorithm="HS256")


def verify_token(token: str = Cookie(default=None)):
    if not token:
        raise HTTPException(status_code=401, detail="No token, authorization denied")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
