import os
import boto3
from fastapi import APIRouter, Depends
from botocore.exceptions import ClientError

from auth import verify_token

router = APIRouter()

BUCKET  = os.environ.get("S3_MEDIA_BUCKET", "royale-media")
REGION  = os.environ.get("AWS_REGION", "us-east-1")


def _list_s3_images(prefix: str) -> list[str]:
    s3 = boto3.client("s3", region_name=REGION)
    try:
        paginator = s3.get_paginator("list_objects_v2")
        urls = []
        for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
            for obj in page.get("Contents", []):
                key = obj["Key"]
                if key == prefix:
                    continue  # skip the folder itself
                urls.append(f"https://{BUCKET}.s3.{REGION}.amazonaws.com/{key}")
        return urls
    except ClientError:
        return []


@router.get("/api/img/icon")
def get_icon_gallery(_: dict = Depends(verify_token)):
    return {"images": _list_s3_images("parfumIcon/")}


@router.get("/api/img")
def get_parfum_gallery(_: dict = Depends(verify_token)):
    return {"images": _list_s3_images("parfums/")}
