import os
import boto3
import uuid
from datetime import datetime
from typing import BinaryIO, Optional, Tuple
from botocore.exceptions import ClientError
from fastapi import UploadFile

from app.core.config import settings


class S3Service:
    """Service for S3 file storage operations"""
    
    def __init__(self):
        """Initialize S3 client"""
        if settings.STORAGE_TYPE != "s3":
            return
            
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
            endpoint_url=settings.S3_ENDPOINT_URL
        )
        self.bucket_name = settings.S3_BUCKET_NAME
        
        # Ensure bucket exists
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self) -> None:
        """Ensure the configured S3 bucket exists, create if not"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            # Bucket doesn't exist, create it
            self.s3_client.create_bucket(Bucket=self.bucket_name)
    
    async def upload_file(self, file: UploadFile, folder: str = "uploads", public: bool = False) -> Tuple[str, str]:
        """
        Upload a file to S3
        
        Args:
            file: The file to upload
            folder: The folder to store the file in
            public: Whether the file should be publicly accessible
        
        Returns:
            Tuple of (s3_key, public_url)
        """
        if settings.STORAGE_TYPE != "s3":
            # Fall back to local file storage if S3 is not configured
            return await self._save_local_file(file, folder)
            
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{uuid.uuid4().hex}_{file.filename}"
        s3_key = f"{folder}/{filename}"
        
        # Set content type based on file
        content_type = file.content_type
        
        # Set ACL based on public flag
        acl = 'public-read' if public else 'private'
        
        # Upload file to S3
        file_content = await file.read()
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type,
            ACL=acl
        )
        
        # Get public URL
        if public:
            url = f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
        else:
            url = s3_key
            
        return s3_key, url
    
    def generate_presigned_url(self, s3_key: str, expiration: int = 3600) -> Optional[str]:
        """Generate a presigned URL for a file"""
        if settings.STORAGE_TYPE != "s3":
            # For local storage, generate a local URL
            return f"/api/v1/storage/files/{s3_key}"
            
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError:
            return None
    
    async def delete_file(self, s3_key: str) -> bool:
        """Delete a file from S3"""
        if settings.STORAGE_TYPE != "s3":
            # Delete local file
            local_path = os.path.join(settings.LOCAL_STORAGE_PATH, s3_key)
            try:
                if os.path.exists(local_path):
                    os.remove(local_path)
                return True
            except:
                return False
                
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
        except ClientError:
            return False
            
    async def _save_local_file(self, file: UploadFile, folder: str) -> Tuple[str, str]:
        """Save file to local storage when S3 is not configured"""
        # Create storage directory if it doesn't exist
        storage_path = os.path.join(settings.LOCAL_STORAGE_PATH, folder)
        os.makedirs(storage_path, exist_ok=True)
        
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(folder, filename)
        full_path = os.path.join(settings.LOCAL_STORAGE_PATH, file_path)
        
        # Save file
        file_content = await file.read()
        with open(full_path, "wb") as f:
            f.write(file_content)
            
        # Return file path and URL
        return file_path, f"/api/v1/storage/files/{file_path}"


# Create singleton instance
s3_service = S3Service()