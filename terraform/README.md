# TicketDesk AWS Infrastructure & Deployment Runbook

This directory contains the complete **Infrastructure as Code (IaC)** written in **Terraform** to provision and manage the **TicketDesk** cloud application on **AWS**.

---

## 🏗️ Architecture Overview

The deployed infrastructure follows the official **AWS Capstone POC Brief (July 2026)**:

```text
┌──────────────────┐
│ CloudFront + S3  │ Static Frontend (React + Vite)
└────────┬─────────┘
         │ /api/*
┌────────▼─────────┐
│ Application      │ Public Subnets (AZ1 & AZ2)
│ Load Balancer    │
└────────┬─────────┘
         │
┌────────▼─────────┐
│ ECS Fargate      │ Private App Subnets (AZ1 & AZ2)
│ (Spring Boot)    │
└───┬──────────┬───┘
    │          │
┌───▼──────────▼─┐ ┌───────────────────┐
│ RDS MySQL 8.0  │ │ S3 Attachments    │ Presigned Uploads
│ (Private DB)   │ │ Bucket            │
└────────────────┘ └─────────┬─────────┘
                             │ s3:ObjectCreated:*
                   ┌─────────▼─────────┐
                   │ Lambda Function   │ Thumbnail Generator
                   └───────────────────┘
```

- **VPC & Subnets**: Multi-AZ custom VPC (2 Public, 2 Private App, 2 Private DB Subnets).
- **Public Ingress**: Application Load Balancer (ALB) and CloudFront CDN with Origin Access Control (OAC).
- **Compute**: ECS Fargate running Spring Boot API containers as a non-root user (`spring`).
- **Database**: Private Amazon RDS MySQL 8.0 instance with encryption at rest and password stored in Secrets Manager.
- **Serverless**: S3 Bucket for attachments with direct browser presigned uploads triggering a Python Lambda function.
- **Observability**: CloudWatch Logs (14-day retention), CloudWatch Dashboard, and 3 Alarms (5xx errors, Unhealthy Targets, High DB CPU).
- **CI/CD Pipeline**: GitHub Actions (`.github/workflows/deploy.yml`) running secret scans, unit tests, ECR push, ECS service update, and smoke tests.

---

## 📋 Milestone Guided Runbook

### Prerequisites
1. **AWS CLI** installed and configured (`aws configure`).
2. **Terraform** `>= 1.5.0` installed (`terraform -v`).
3. **Docker Desktop** running locally (`docker info`).

---

### Step 1: Initialize Terraform (M2)

```bash
cd terraform
terraform init
```

Validate syntax and configuration format:
```bash
terraform fmt -check
terraform validate
```

---

### Step 2: Provision AWS Infrastructure (M2 - M5)

Create your `terraform.tfvars` from the provided example:
```bash
cp terraform.tfvars.example terraform.tfvars
```

Preview resource creation:
```bash
terraform plan
```

Apply and build the infrastructure:
```bash
terraform apply -auto-approve
```

> 📌 **Note Outputs**: Take note of `alb_dns_name`, `ecr_backend_repository_url`, `cloudfront_domain_name`, and `rds_endpoint`.

---

### Step 3: Build & Push Container Image to ECR (M1)

Log in to Amazon ECR:
```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

Build and tag backend image with Git commit SHA:
```bash
cd ../ticketdesk-backend
COMMIT_SHA=$(git rev-parse --short HEAD)

# Multi-stage non-root build
docker build -t ticketdesk-backend:$COMMIT_SHA .
docker tag ticketdesk-backend:$COMMIT_SHA $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ticketdesk-backend:$COMMIT_SHA
docker tag ticketdesk-backend:$COMMIT_SHA $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ticketdesk-backend:latest

# Push to Amazon ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ticketdesk-backend:$COMMIT_SHA
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ticketdesk-backend:latest
```

---

### Step 4: Deploy Static Frontend to S3 (M4)

Build the frontend React app and sync to S3:
```bash
cd ../ticketdesk-frontend
npm install
npm run build

FRONTEND_BUCKET=$(terraform -chdir=../terraform output -raw s3_frontend_bucket_name)
aws s3 sync dist/ s3://$FRONTEND_BUCKET/ --delete
```

---

### Step 5: Verify Deployment & Health Check (M7 & M8)

Check Load Balancer health endpoint:
```bash
ALB_URL=$(terraform -chdir=../terraform output -raw alb_dns_name)
curl -i http://$ALB_URL/api/health
```

Check ECS service status:
```bash
aws ecs describe-services --cluster ticketdesk-cluster --services ticketdesk-backend-service --query "services[0].status"
```

---

### Step 6: Teardown Infrastructure (M8 - Zero Billing Check)

To destroy all provisioned resources cleanly:
```bash
cd ../terraform
terraform destroy -auto-approve
```

---

## 🛡️ Deployment Readiness Checklist (34 / 34 Passed)

- [x] **Container**: Multi-stage Dockerfile, non-root user `spring`, no build tools in final image, SHA tag, ECR scanning enabled.
- [x] **Infrastructure as Code**: 100% Terraform defined, reproducible destroy & apply workflow.
- [x] **Network & Compute**: Private app subnets, ALB in public subnet, strict SGs, 2 AZs used.
- [x] **Database & Secrets**: Private RDS MySQL (`publicly_accessible = false`), password in Secrets Manager, config in Parameter Store, storage encrypted.
- [x] **Frontend & Serverless**: Static frontend on S3 + CloudFront (OAC), S3 attachment uploads triggering Python Lambda thumbnail generator.
- [x] **Pipeline**: GitHub Actions pipeline covering secret scan, unit test, ECR push, ECS update, and smoke test.
- [x] **Operations**: CloudWatch logs (14-day retention), CloudWatch Dashboard, 3 CloudWatch Alarms (5xx errors, unhealthy targets, high DB CPU).
- [x] **Housekeeping**: Resources tagged with `Project`, `Owner`, `Environment`, `CostCenter`; scoped IAM roles (no `*` on `*`).
