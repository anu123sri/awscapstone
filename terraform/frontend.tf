# Random suffix for globally unique S3 bucket names
resource "random_string" "bucket_suffix" {
  length  = 6
  special = false
  upper   = false
}

# S3 Bucket for Static Frontend Assets (Not Public)
resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.project_name}-frontend-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = {
    Name = "${var.project_name}-frontend-bucket"
  }
}

# Block all public access to Frontend S3 Bucket
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Control (OAC) - Optional based on enable_cloudfront
resource "aws_cloudfront_origin_access_control" "oac" {
  count                             = var.enable_cloudfront ? 1 : 0
  name                              = "${var.project_name}-frontend-oac"
  description                       = "OAC for static frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution - Optional based on enable_cloudfront
resource "aws_cloudfront_distribution" "cdn" {
  count               = var.enable_cloudfront ? 1 : 0
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # Origin 1: Static S3 Frontend Bucket
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-Frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac[0].id
  }

  # Origin 2: Application Load Balancer for API requests
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-Backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Cache Behavior for /api/* requests -> Route to ALB Backend
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-Backend"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Host", "Accept", "Content-Type", "Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  # Default Cache Behavior /* -> Static S3 Frontend
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Frontend"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-cloudfront-cdn"
  }
}

# S3 Bucket Policy allowing CloudFront OAC access if CloudFront is enabled
resource "aws_s3_bucket_policy" "frontend" {
  count  = var.enable_cloudfront ? 1 : 0
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Resource = [aws_s3_bucket.frontend.arn, "${aws_s3_bucket.frontend.arn}/*"]
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn[0].arn
          }
        }
      }
    ]
  })
}
