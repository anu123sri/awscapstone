# TicketDesk — AWS Cloud Deployment (Capstone POC)

> **Foundation Level Capstone Project**  
> Complete Infrastructure as Code (IaC), Multi-stage Containerization, AWS ECS Fargate, RDS MySQL, CloudFront + S3, Serverless Attachments, CI/CD Pipeline, and CloudWatch Observability.

[![CI/CD Pipeline](https://github.com/anu123sri/awscapstone/actions/workflows/deploy.yml/badge.svg)](https://github.com/anu123sri/awscapstone/actions)
[![AWS Architecture](https://img.shields.io/badge/AWS-Fargate%20%7C%20RDS%20%7C%20S3%20%7C%20CloudFront-232F3E?logo=amazon-aws)](https://aws.amazon.com/)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?logo=terraform)](https://www.terraform.io/)
[![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.2%20%28Java%2021%29-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20MUI-61DAFB?logo=react)](https://react.dev/)

---

## 🌐 Live Production Endpoints

* **Application Live URL (CloudFront CDN)**: [https://d34fecnctmxvyw.cloudfront.net](https://d34fecnctmxvyw.cloudfront.net)
* **Backend Health Check**: [https://d34fecnctmxvyw.cloudfront.net/api/health](https://d34fecnctmxvyw.cloudfront.net/api/health)
* **ALB Direct DNS**: `http://ticketdesk-alb-683270245.us-east-1.elb.amazonaws.com`
* **GitHub Repository**: [https://github.com/anu123sri/awscapstone](https://github.com/anu123sri/awscapstone)

---

## 🏛️ System Architecture

```text
┌──────────────────┐
│     Browser      │ ───────► CloudFront + S3 (Static React Frontend)
└────────┬─────────┘
         │ /api/*
┌────────▼─────────┐
│ Application Load │ (Public Subnets across 2 AZs: us-east-1a & us-east-1b)
│     Balancer     │
└────────┬─────────┘
         │
┌────────▼─────────┐
│   ECS Fargate    │ (Private Subnets across 2 AZs - Spring Boot Java 21 API)
└────┬────────┬────┘
     │        │
┌────▼───┐ ┌──▼─────────────┐
│  RDS   │ │ S3 Attachments │ (Direct Browser PUT Upload via Presigned URL)
│ MySQL  │ │     Bucket     │
└────────┘ └────┬───────────┘
                │ (s3:ObjectCreated:Put on uploads/)
           ┌────▼───────────┐
           │   AWS Lambda   │ (Pillow Thumbnail Generator -> thumbnails/)
           └────────────────┘
```

---

## 🚀 Quick Start Guide — Deployment from Scratch

### Prerequisites
* [AWS CLI v2](https://aws.amazon.com/cli/) configured (`aws configure`)
* [Terraform >= 1.5.0](https://www.terraform.io/) installed
* [Docker Desktop](https://www.docker.com/) installed
* Node.js v20+ and Java 21 / Maven 3.9+ installed
* Git installed

---

### Step 1: Local Container Verification (Milestone M1)

1. Build local multi-stage Docker image:
   ```bash
   cd ticketdesk-backend
   docker build -t ticketdesk-api:local .
   ```
2. Run container locally with Docker Compose:
   ```bash
   cd ..
   docker-compose up -d --build
   ```
3. Test local health check:
   ```bash
   curl http://localhost:8080/api/health
   ```
   **Expected response**: `UP` (HTTP 200)

---

### Step 2: Infrastructure Provisioning with Terraform (Milestones M2, M3, M4, M5, M7)

1. Navigate to the Terraform configuration directory:
   ```bash
   cd terraform
   ```
2. Initialize Terraform modules and providers:
   ```bash
   terraform init
   ```
3. Validate configuration files:
   ```bash
   terraform validate
   ```
4. Review planned cloud resources:
   ```bash
   terraform plan
   ```
5. Apply and provision the complete AWS stack (~8-10 minutes):
   ```bash
   terraform apply -auto-approve
   ```

---

### Step 3: Build & Push Image to Amazon ECR (Milestone M3)

1. Fetch ECR Repository URL from Terraform outputs:
   ```bash
   export ECR_URL=$(terraform output -raw ecr_backend_repository_url)
   export AWS_REGION="us-east-1"
   ```
2. Authenticate Docker to Amazon ECR:
   ```bash
   aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL
   ```
3. Tag image with Git commit SHA and push to ECR:
   ```bash
   export COMMIT_SHA=$(git rev-parse --short HEAD || echo "v1.0")
   docker tag ticketdesk-api:local $ECR_URL:$COMMIT_SHA
   docker tag ticketdesk-api:local $ECR_URL:latest
   docker push $ECR_URL:$COMMIT_SHA
   docker push $ECR_URL:latest
   ```

---

### Step 4: Build & Deploy Frontend to S3 (Milestone M4)

1. Navigate to frontend directory:
   ```bash
   cd ../ticketdesk-frontend
   ```
2. Install dependencies & build production static assets:
   ```bash
   npm install
   npm run build
   ```
3. Upload static assets to private S3 frontend bucket:
   ```bash
   export FRONTEND_BUCKET=$(terraform -chdir=../terraform output -raw s3_frontend_bucket_name)
   aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete
   ```
4. Invalidate CloudFront CDN Cache:
   ```bash
   export CLOUDFRONT_ID=$(terraform -chdir=../terraform output -raw cloudfront_distribution_id || echo "E3VZTH6XGJXK77")
   aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
   ```

---

### Step 5: End-to-End Verification & Smoke Test (Milestones M6 & M8)

1. Obtain CloudFront URL:
   ```bash
   export CLOUDFRONT_URL="https://$(terraform -chdir=../terraform output -raw cloudfront_domain_name)"
   echo "Application Live URL: $CLOUDFRONT_URL"
   ```
2. Run automated smoke tests & load sanity check (20 concurrent users):
   ```bash
   cd ..
   python scripts/load_test.py
   ```
   **Expected Result**:
   ```text
   ============================================================
   LOAD SANITY CHECK FINAL RESULTS
   ============================================================
   Target URL:              https://d34fecnctmxvyw.cloudfront.net
   Concurrent Users:        20
   Total Duration:          60s
   Total Requests Executed: 2010
   Successful Requests:     2010
   Failed Requests:         0
   Error Rate:              0.00%
   ============================================================
   LOAD TEST RESULT: PASSED (0 errors encountered!)
   ```

---

## 🧹 Stack Destruction & Clean Rebuild (Milestone M8)

To prove 100% Infrastructure as Code reproducibility, tear down all created AWS resources:

```bash
cd terraform
terraform destroy -auto-approve
```

To recreate the entire stack from zero with a single command:
```bash
terraform apply -auto-approve
```

---

## 🔐 Demo Credentials

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `admin123` | Full access (Manage Users, Categories, Metrics) |
| **Standard Employee** | `user1` | `password` | Create & view tickets, upload attachments |

---

## 📊 Verification & Documentation Matrix

* **Master Technical Guide (End-to-End)**: [MASTER_DEPLOYMENT_GUIDE.md](MASTER_DEPLOYMENT_GUIDE.md)
* **One-Page AWS Cost Report**: [cost_report.md](cost_report.md)
* **Automated CI/CD Pipeline Workflow**: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
* **Light Load Sanity Check Script**: [scripts/load_test.py](scripts/load_test.py)
