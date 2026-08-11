variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (e.g., dev, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name tag and naming prefix"
  type        = string
  default     = "ticketdesk"
}

variable "owner" {
  description = "Owner tag for resource tracking"
  type        = string
  default     = "pod"
}

variable "costcenter" {
  description = "CostCenter tag for budget tracking"
  type        = string
  default     = "foundation"
}

variable "vpc_cidr" {
  description = "CIDR block for main VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_app_subnet_cidrs" {
  description = "CIDR blocks for private app subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "private_db_subnet_cidrs" {
  description = "CIDR blocks for private database subnets"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}

variable "db_name" {
  description = "MySQL database name"
  type        = string
  default     = "ticketdesk_db"
}

variable "db_username" {
  description = "MySQL master username"
  type        = string
  default     = "ticketdesk_user"
}

variable "backend_container_port" {
  description = "Port exposed by Spring Boot backend application"
  type        = number
  default     = 8080
}

variable "backend_cpu" {
  description = "Fargate task CPU units"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Fargate task memory (in MB)"
  type        = number
  default     = 1024
}

variable "backend_desired_count" {
  description = "Desired number of backend container tasks"
  type        = number
  default     = 2
}

variable "enable_cloudfront" {
  description = "Set to true to provision CloudFront Distribution (requires AWS Support CloudFront verification for new accounts)"
  type        = bool
  default     = false
}

