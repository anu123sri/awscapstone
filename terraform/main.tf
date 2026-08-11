terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  # For local execution state. In production, configure S3 backend with DynamoDB locking.
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "ticketdesk/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Owner       = var.owner
      Environment = var.environment
      CostCenter  = var.costcenter
      ManagedBy   = "Terraform"
    }
  }
}
