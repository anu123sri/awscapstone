# TicketDesk AWS Cloud Deployment — Master End-to-End Technical Guide

---

## 📌 Executive Overview & System Architecture

This guide provides a comprehensive, step-by-step technical breakdown of the **TicketDesk IT Support Ticket Tracking System** cloud deployment on Amazon Web Services (AWS). It explains what resources were created, why they were created in a specific dependency order, how each service securely connects to others, and how direct-to-S3 file uploads and serverless thumbnail processing operate.

---

## 🌐 End-to-End AWS System Topology

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               1. USER BROWSER / CLIENT                                 │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTPS Request (https://d34fecnctmxvyw.cloudfront.net)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               2. AMAZON CLOUDFRONT CDN                                 │
│                   (Global Edge Locations + Path Pattern Routing)                       │
└───────────────────────┬────────────────────────────────────────┬───────────────────────┘
                        │                                        │
      Static Web Assets │ (HTML/JS/CSS)             API Requests │ (/api/*)
                        ▼                                        ▼
┌────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│     3. PRIVATE S3 FRONTEND BUCKET      │   │   4. APPLICATION LOAD BALANCER (ALB)   │
│     (ticketdesk-frontend-5ujbds)       │   │    (ticketdesk-alb in Public Subnets)  │
│ Protected by Origin Access Control(OAC)│   └───────────────────┬────────────────────┘
└────────────────────────────────────────┘                       │ HTTP (Port 8080)
                                                                 ▼
                                             ┌────────────────────────────────────────┐
                                             │    5. ECS FARGATE CONTAINER (API)      │
                                             │ (ticketdesk-backend in Private Subnets)│
                                             └──────────┬──────────────────┬──────────┘
                                                        │                  │
                                         MySQL (3306)   │                  │ Presigned Upload URL
                                                        ▼                  ▼
                                             ┌─────────────────────┐  ┌───────────────────────┐
                                             │    6. RDS MYSQL     │  │     7. PRIVATE S3     │
                                             │  (Private Subnet)   │  │  ATTACHMENTS BUCKET   │
                                             └─────────────────────┘  │(ticketdesk-attachments│
                                                                      │       -5ujbds)        │
                                                                      └───────────┬───────────┘
                                                                                  │ s3:ObjectCreated:Put
                                                                                  ▼
                                                                      ┌───────────────────────┐
                                                                      │     8. AWS LAMBDA     │
                                                                      │ (Thumbnail Generator) │
                                                                      └───────────────────────┘
```

---

## 🚀 Step-by-Step Deployment Roadmap (Execution Order)

### STEP 1: Containerization & Security Hardening (Milestone M1)
Before launching any cloud infrastructure, the backend and frontend applications are containerized with multi-stage Docker builds:
* **Multi-Stage Spring Boot Dockerfile**:
  * **Stage 1 (`builder`)**: Uses `maven:3.9.6-eclipse-temurin-21` to compile the Java 21 Spring Boot application and package the JAR (`mvn clean package -DskipTests`).
  * **Stage 2 (`runtime`)**: Uses a minimal `eclipse-temurin:21-jre-jammy` footprint.
* **Security Hardening**:
  * Runs as a dedicated non-root system user (`appuser`, UID 10001) so the container never runs with root privileges.
  * Exposes port `8080` for the embedded Apache Tomcat container.
* **Container Hygiene (`.dockerignore`)**:
  * Excludes `.git`, `node_modules`, `target/`, `terraform/`, `.idea/`, and temporary build artifacts, producing an optimized, lightweight container image.

---

### STEP 2: Networking & Security Group Hierarchy (Milestone M2)
Everything in AWS requires an isolated, secure network foundation (VPC) before databases, compute tasks, or load balancers can be provisioned.
* **Amazon VPC (`10.0.0.0/16`)**:
  * Provisions an isolated Virtual Private Cloud across **2 Availability Zones** (`us-east-1a`, `us-east-1b`) in region `us-east-1`.
* **Subnet Segmentation Across 3 Tiers**:
  * **Public Subnets (`10.0.1.0/24`, `10.0.2.0/24`)**: Connected to an Internet Gateway (IGW). Houses the Application Load Balancer and NAT Gateway.
  * **Private Application Subnets (`10.0.11.0/24`, `10.0.12.0/24`)**: Isolated from public ingress. Houses ECS Fargate container tasks.
  * **Private Database Subnets (`10.0.21.0/24`, `10.0.22.0/24`)**: Zero internet routing. Houses Amazon RDS MySQL instances.
* **NAT Gateway**:
  * Placed in a Public Subnet with an Elastic IP. Allows private application subnets (ECS containers) to send outbound traffic to pull container images from ECR or talk to AWS APIs without receiving unsolicited incoming internet traffic.
* **Strict Security Group Chaining**:
  * **ALB Security Group (`ticketdesk-alb-sg`)**: Accepts incoming HTTP (Port 80) from any IP (`0.0.0.0/0`).
  * **ECS Security Group (`ticketdesk-ecs-backend-sg`)**: Accepts Port 8080 **ONLY** from `ticketdesk-alb-sg`.
  * **RDS Security Group (`ticketdesk-rds-sg`)**: Accepts MySQL Port 3306 **ONLY** from `ticketdesk-ecs-backend-sg`.

---

### STEP 3: Database & Secrets Management (Milestone M3)
* **AWS Secrets Manager (`/ticketdesk/production/db_password`)**:
  * Generates a random, 16-character secure database password and stores it safely.
* **AWS Secrets Manager (`/ticketdesk/production/jwt_secret`)**:
  * Generates and stores a cryptographically secure 256-bit HMAC key for signing JWT tokens.
* **SSM Parameter Store (`/ticketdesk/production/*`)**:
  * Stores non-sensitive configuration settings (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`).
* **Amazon RDS MySQL 8.0 (`ticketdesk-db`)**:
  * Provisioned in a Multi-AZ DB Subnet Group across private database subnets (`10.0.21.0/24`, `10.0.22.0/24`).
  * `publicly_accessible = false` (cannot be accessed over the internet).
  * Storage encrypted at rest with AWS KMS (`storage_encrypted = true`).

---

### STEP 4: Amazon ECR & ECS Fargate Service (Milestones M1 / M3)
* **Amazon ECR Repository (`ticketdesk-backend`)**:
  * Stores backend container images with automated scanning enabled (`scan_on_push = true`) and lifecycle policy keeping the latest releases.
* **ECS Fargate Cluster & Task Definition (`ticketdesk-backend-task`)**:
  * **Compute Resources**: 0.5 vCPU and 1 GB RAM per task.
  * **Execution Role**: Granted `AmazonECSTaskExecutionRolePolicy` + least-privilege Secrets Manager and SSM read permissions to inject secrets into environment variables at container boot.
  * **Task Role**: Granted least-privilege S3 bucket access for generating presigned URLs.
* **ECS Service (`ticketdesk-backend-service`)**:
  * Runs **2 continuous Fargate tasks** across both Availability Zones (`us-east-1a` and `us-east-1b`) in private subnets with `assign_public_ip = false`.
  * Registered to the ALB Target Group (`ticketdesk-be-tg`) with automated health checks on `/api/health`.

---

### STEP 5: Static Frontend Delivery & Global CDN (Milestone M4)
* **Private S3 Frontend Bucket (`ticketdesk-frontend-5ujbds`)**:
  * Blocks all public access (`aws_s3_bucket_public_access_block`).
  * Encrypted with SSE-S3.
* **Amazon CloudFront Distribution (`d34fecnctmxvyw.cloudfront.net`)**:
  * Uses **Origin Access Control (OAC)** to securely read static HTML/JS/CSS files from private S3 using AWS SigV4 signed requests.
  * **Path Routing Rules**:
    * **Default (`/*`)**: Routes to S3 bucket (React SPA frontend).
    * **`/api/*`**: Proxies directly to the Application Load Balancer (`http://ticketdesk-alb-683270245.us-east-1.elb.amazonaws.com`).

---

### STEP 6: Serverless Direct File Uploads & Lambda (Milestone M5)
* **Presigned S3 Upload Workflow (Zero API Byte Handling)**:
  1. When a user attaches a file in the UI, the React frontend calls `POST /api/attachments/presign`.
  2. Backend API generates a temporary, signed AWS S3 PUT URL (15-minute expiration) with object key `uploads/{ticketId}/{uuid}-{filename}`.
  3. The browser streams image bytes directly to S3 via HTTP PUT without taxing API server memory or network bandwidth.
  4. Frontend calls `POST /api/attachments/confirm` to record attachment metadata in MySQL.
* **Serverless AWS Lambda Thumbnail Generator (`ticketdesk-thumbnail-generator`)**:
  * Packaged with Python 3.12 and the **Pillow** image processing library.
  * Configured with an S3 event notification (`s3:ObjectCreated:Put`) on prefix `uploads/`.
  * Automatically resizes incoming screenshots to **200×200 pixel JPEG thumbnails** and writes them to `thumbnails/thumb_{filename}` with `ContentType: image/jpeg`.

---

### STEP 7: Automated CI/CD Pipeline (Milestone M6)
GitHub Actions workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) automates deployment on every `git push` to `main`:
1. **Stage 1 (Quality Check)**:
   * Runs **Gitleaks** secret scanner across repository history to prevent committing credentials.
   * Sets up JDK 21 and runs Maven unit test suite (`mvn test -B`).
2. **Stage 2 (Build & Push)**:
   * Authenticates to Amazon ECR via `aws-actions/amazon-ecr-login`.
   * Builds Docker image, tags it with the immutable Git commit SHA and `latest`, and pushes to ECR.
3. **Stage 3 (Deploy to Production)**:
   * Triggers a zero-downtime rolling update on ECS Fargate (`aws ecs update-service --force-new-deployment`).
   * Builds React frontend (`npm run build`), syncs `dist/` to S3, and creates a CloudFront cache invalidation (`/*`).
4. **Stage 4 (Smoke Test)**:
   * Runs automated curl tests against `https://d34fecnctmxvyw.cloudfront.net/api/health` to confirm `HTTP 200 OK`.

---

### STEP 8: Operations, Alarms & Cost Management (Milestones M7 / M8)
* **CloudWatch Log Group (`/ecs/ticketdesk-backend`)**:
  * Configured with a finite **14-day retention policy** to prevent unbounded storage costs.
* **Amazon SNS Topic (`ticketdesk-alerts-topic`)**:
  * Central notification bus for incident alerting.
* **3 Actionable CloudWatch Metric Alarms**:
  1. `ticketdesk-alb-high-5xx-errors`: Triggers if ALB 5xx errors > 5 in 5 minutes.
  2. `ticketdesk-unhealthy-ecs-targets`: Triggers if unhealthy targets >= 1 in 1 minute.
  3. `ticketdesk-rds-high-cpu`: Triggers if RDS MySQL CPU utilization > 80% over 10 minutes.
  * All alarms configured with `treat_missing_data = "notBreaching"`.
* **CloudWatch Operations Dashboard (`ticketdesk-operations-dashboard`)**:
  * Displays live widgets for ALB Request Count, Target Response Time, ECS CPU/Memory, and RDS Database Connections.
* **Cost Optimization**:
  * Estimated total monthly spend is **~$86.15 / month**, with the two most expensive items being the **NAT Gateway** ($32.40/mo) and **RDS MySQL Database** ($16.50/mo).

---

## 🔗 Quick Reference Service Connection Matrix

| Source Service | Target Service | Connection Method | Security Enforcement |
| :--- | :--- | :--- | :--- |
| **Browser** | **CloudFront CDN** | HTTPS (`https://d34fecnctmxvyw.cloudfront.net`) | TLS 1.2+ Encryption |
| **CloudFront** | **S3 Frontend** | S3 REST Origin | Origin Access Control (OAC) SigV4 |
| **CloudFront** | **ALB** | HTTP (`/api/*`) | Custom Header / Load Balancer DNS |
| **ALB** | **ECS Fargate** | HTTP (Port 8080) | `ticketdesk-ecs-backend-sg` accepts Port 8080 **ONLY** from `ticketdesk-alb-sg` |
| **ECS Fargate** | **RDS MySQL** | TCP (Port 3306) | `ticketdesk-rds-sg` accepts Port 3306 **ONLY** from `ticketdesk-ecs-backend-sg` |
| **ECS Fargate** | **Secrets Manager** | AWS IAM Execution Role | `secretsmanager:GetSecretValue` on secret ARNs |
| **Browser** | **S3 Attachments** | S3 Presigned PUT URL | Expiring HMAC-SHA256 signature (15 min) |
| **S3 Attachments** | **AWS Lambda** | `s3:ObjectCreated:Put` Event | S3 Bucket Notification Permissions |
| **ECS / ALB / RDS** | **CloudWatch** | AWS CloudWatch Agent / Metric Driver | Centralized Telemetry & Alarms |
