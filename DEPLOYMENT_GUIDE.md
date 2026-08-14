# 🚀 TicketDesk — AWS Deployment & Operations Runbook

This guide contains step-by-step operational instructions for provisioning the TicketDesk infrastructure from zero, configuring CI/CD automation, and performing clean teardowns.

---

## 📋 Prerequisites

* **AWS CLI** (v2.x) authenticated with administrator credentials (`aws configure`).
* **Terraform** (>= 1.5.0).
* **Docker Desktop** (for container image builds and local runs).
* **Node.js** (v20.x) and **JDK 21** with **Maven 3.9+**.

---

## 1. Zero-Touch Infrastructure Provisioning (Cold Start)

To provision the complete cloud infrastructure from zero:

```bash
# 1. Clone repository
git clone https://github.com/anu123sri/awscapstone.git
cd awscapstone/terraform

# 2. Initialize Terraform providers and state
terraform init

# 3. Validate configuration syntax
terraform validate

# 4. Review planned cloud resources
terraform plan

# 5. Provision all infrastructure (Takes ~8-10 minutes for RDS & CloudFront)
terraform apply -auto-approve
```

### Key Terraform Outputs
Upon completion, Terraform will output your live endpoints:
```text
Outputs:
alb_dns_name           = "ticketdesk-alb-683270245.us-east-1.elb.amazonaws.com"
cloudfront_domain_name = "d34fecnctmxvyw.cloudfront.net"
ecr_backend_repository = "471112653333.dkr.ecr.us-east-1.amazonaws.com/ticketdesk-backend"
rds_endpoint           = "ticketdesk-db.ce1wycuaa2m1.us-east-1.rds.amazonaws.com:3306"
s3_frontend_bucket     = "ticketdesk-frontend-5ujbds"
s3_attachments_bucket  = "ticketdesk-attachments-5ujbds"
```

---

## 2. Setting Up GitHub Actions CI/CD Pipeline

1. In your GitHub repository, navigate to **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Click **New repository secret** and add the following two secrets:
   * `AWS_ACCESS_KEY_ID`: `<Your-AWS-Access-Key>`
   * `AWS_SECRET_ACCESS_KEY`: `<Your-AWS-Secret-Access-Key>`
3. Any push to `main` will automatically trigger the 4-stage pipeline:
   * **Stage 1**: Gitleaks Secret Scan & Maven Unit Tests (`quality-check`)
   * **Stage 2**: Docker Build, Tag with Git SHA, and Push to Amazon ECR (`build-and-push`)
   * **Stage 3**: Rolling Update on ECS Fargate, React build, S3 sync & CloudFront cache invalidation (`deploy`)
   * **Stage 4**: Post-Deployment Smoke Test against production URL (`smoke-test`)

---

## 3. Running Light Load Sanity Check (20 Concurrent Users)

To run the automated load verification:

```bash
# Navigate to repository root
cd TicketDesk

# Execute 20 concurrent users load test
python scripts/load_test.py
```

Expected result:
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

## 4. Local Development (Docker Compose)

For offline development without deploying to AWS:

```bash
# Start backend, frontend, and local MySQL container
docker-compose up -d --build

# View logs
docker-compose logs -f

# Access local frontend
http://localhost:5173

# Access local backend API
http://localhost:8080/api/health
```

---

## 5. Complete Infrastructure Teardown

To destroy all provisioned AWS cloud resources and halt all billing:

```bash
cd terraform

# Deprovision all cloud infrastructure
terraform destroy -auto-approve
```
