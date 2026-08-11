output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront Distribution domain name (Frontend URL)"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.cdn[0].domain_name : "CloudFront Disabled (Access directly via ALB DNS)"
}

output "ecr_backend_repository_url" {
  description = "ECR Repository URL for Backend Docker Image"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "ECR Repository URL for Frontend Docker Image"
  value       = aws_ecr_repository.frontend.repository_url
}

output "rds_endpoint" {
  description = "RDS MySQL Database Endpoint"
  value       = aws_db_instance.mysql.endpoint
}

output "s3_attachments_bucket_name" {
  description = "S3 Bucket Name for Ticket File Attachments"
  value       = aws_s3_bucket.attachments.id
}

output "s3_frontend_bucket_name" {
  description = "S3 Bucket Name hosting static frontend assets"
  value       = aws_s3_bucket.frontend.id
}

output "ecs_cluster_name" {
  description = "ECS Fargate Cluster Name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS Fargate Service Name"
  value       = aws_ecs_service.backend.name
}

output "secretsmanager_secret_name" {
  description = "AWS Secrets Manager Secret Name storing Database credentials"
  value       = aws_secretsmanager_secret.db_credentials.name
}
