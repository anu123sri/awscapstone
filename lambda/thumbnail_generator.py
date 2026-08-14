import io
import json
import os
import urllib.parse
import boto3
from PIL import Image, ImageDraw, ImageFont

s3_client = boto3.client('s3')

def generate_doc_thumbnail(ext):
    """Generate a clean document icon thumbnail for non-image attachments."""
    img = Image.new('RGB', (200, 200), color=(240, 244, 248))
    draw = ImageDraw.Draw(img)
    
    # Draw a card-like icon border
    draw.rounded_rectangle([30, 20, 170, 180], radius=10, fill=(255, 255, 255), outline=(203, 213, 225), width=2)
    # Draw header bar on card
    draw.rounded_rectangle([30, 20, 170, 60], radius=10, fill=(79, 70, 229))
    
    # Draw extension text in center
    label = (ext.lstrip('.')[:4] or 'DOC').upper()
    draw.text((100, 110), label, fill=(79, 70, 229), anchor="mm")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG', optimize=True)
    buffer.seek(0)
    return buffer.getvalue(), 'image/png'

def lambda_handler(event, context):
    """
    AWS Lambda function triggered by S3 ObjectCreated events.
    Downloads uploaded attachment from uploads/ (or tickets/), generates a real 200x200 thumbnail,
    and uploads the resulting thumbnail image to thumbnails/thumb_{filename}.
    """
    print(f"Received event: {json.dumps(event)}")
    
    for record in event.get('Records', []):
        bucket_name = record['s3']['bucket']['name']
        object_key = urllib.parse.unquote_plus(record['s3']['object']['key'], encoding='utf-8')
        
        # Skip if already a thumbnail to avoid recursion
        if object_key.startswith('thumbnails/'):
            print(f"Skipping thumbnail object: {object_key}")
            continue
            
        print(f"Processing attachment upload: Bucket='{bucket_name}', Key='{object_key}'")
        
        try:
            # 1. Download original attachment from S3
            response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
            file_bytes = response['Body'].read()
            content_type = response.get('ContentType', '')
            
            filename = os.path.basename(object_key)
            _, ext = os.path.splitext(filename.lower())
            
            thumb_bytes = None
            thumb_content_type = 'image/jpeg'
            
            # 2. Try processing as an image
            is_image = content_type.startswith('image/') or ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
            
            if is_image:
                try:
                    with Image.open(io.BytesIO(file_bytes)) as img:
                        # Convert RGBA to RGB for JPEG compatibility if needed
                        if img.mode in ('RGBA', 'LA', 'P'):
                            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                            rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                            img = rgb_img
                        elif img.mode != 'RGB':
                            img = img.convert('RGB')
                        
                        # Generate thumbnail keeping aspect ratio (max 200x200)
                        img.thumbnail((200, 200), Image.Resampling.LANCZOS)
                        
                        buffer = io.BytesIO()
                        img.save(buffer, format='JPEG', quality=85, optimize=True)
                        buffer.seek(0)
                        thumb_bytes = buffer.getvalue()
                        thumb_content_type = 'image/jpeg'
                except Exception as img_err:
                    print(f"Could not parse as image: {img_err}, generating fallback document thumbnail")
                    thumb_bytes, thumb_content_type = generate_doc_thumbnail(ext)
            else:
                thumb_bytes, thumb_content_type = generate_doc_thumbnail(ext)
            
            # 3. Save thumbnail image to S3 thumbnails/ folder
            thumbnail_key = f"thumbnails/thumb_{filename}"
            s3_client.put_object(
                Bucket=bucket_name,
                Key=thumbnail_key,
                Body=thumb_bytes,
                ContentType=thumb_content_type
            )
            print(f"Successfully generated thumbnail image ({len(thumb_bytes)} bytes, {thumb_content_type}) at: {thumbnail_key}")
            
        except Exception as e:
            print(f"Error processing {object_key} from bucket {bucket_name}: {str(e)}")
            raise e
            
    return {
        'statusCode': 200,
        'body': json.dumps('Thumbnail generation completed successfully!')
    }
