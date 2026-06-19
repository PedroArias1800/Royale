import os
import re
import time
import boto3
from botocore.exceptions import ClientError

_s3 = None


def get_s3():
    global _s3
    if _s3 is None:
        _s3 = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    return _s3


def _sanitize_filename(filename: str) -> str:
    """Remove spaces and URL-unsafe chars from filename, keeping extension."""
    name, sep, ext = filename.rpartition(".")
    if sep:
        name = re.sub(r"[^a-zA-Z0-9_\-]", "", name)
        name = re.sub(r"-{2,}", "-", name).strip("-") or "file"
        return f"{name}.{ext}"
    return re.sub(r"[^a-zA-Z0-9_\-]", "", filename) or "file"


def upload_file(file_bytes: bytes, filename: str, folder: str) -> str:
    bucket = os.environ["S3_MEDIA_BUCKET"]
    clean = _sanitize_filename(filename)
    key = f"{folder}/{int(time.time() * 1000)}-{clean}"
    get_s3().put_object(
        Bucket=bucket,
        Key=key,
        Body=file_bytes,
        ContentType=_guess_content_type(filename),
    )
    region = os.environ.get("AWS_REGION", "us-east-1")
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"


def _guess_content_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    types = {
        "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
        "webp": "image/webp", "avif": "image/avif", "gif": "image/gif",
        "mp4": "video/mp4", "mov": "video/quicktime", "webm": "video/webm",
    }
    return types.get(ext, "application/octet-stream")
