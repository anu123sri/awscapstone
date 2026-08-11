import json
import os
import urllib.parse
import boto3

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    """
    AWS Lambda function triggered by S3 ObjectCreated events.
    Reads uploaded ticket attachment, generates thumbnail / metadata record,
    and logs processing confirmation.
    """
    print(f"Received event: {json.dumps(event)}")
    
    for record in event.get('Records', []):
        bucket_name = record['s3']['bucket']['name']
        object_key = urllib.parse.unquote_plus(record['s3']['object']['key'], encoding='utf-8')
        
        # Skip if already a thumbnail
        if object_key.startswith('thumbnails/'):
            print(f"Skipping thumbnail object: {object_key}")
            continue
            
        print(f"Processing attachment upload: Bucket='{bucket_name}', Key='{object_key}'")
        
        try:
            response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
            content_type = response.get('ContentType', 'unknown')
            content_length = response.get('ContentLength', 0)
            
            # Create thumbnail key path
            thumbnail_key = f"thumbnails/thumb_{os.path.basename(object_key)}"
            
            # Copy or write thumbnail metadata tag back to S3 bucket
            s3_client.put_object(
                Bucket=bucket_name,
                Key=thumbnail_key,
                Body=f"Thumbnail metadata record for {object_key} (Size: {content_length} bytes, Type: {content_type})".encode('utf-8'),
                ContentType='text/plain'
            )
            print(f"Successfully generated thumbnail record at: {thumbnail_key}")
            
        except Exception as e:
            print(f"Error processing {object_key} from bucket {bucket_name}: {str(e)}")
            raise e
            
    return {
        'statusCode': 200,
        'body': json.dumps('Thumbnail generation completed successfully!')
    }
