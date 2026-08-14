# 🎫 TicketDesk — Enterprise Cloud-Native Support Desk Platform
> **AWS Capstone Project | Production-Ready Multi-Tier Cloud Architecture**

[![CI/CD Pipeline](https://github.com/anu123sri/awscapstone/actions/workflows/deploy.yml/badge.svg)](https://github.com/anu123sri/awscapstone/actions)
[![AWS Architecture](https://img.shields.io/badge/AWS-Fargate%20%7C%20RDS%20%7C%20S3%20%7C%20CloudFront-232F3E?logo=amazon-aws)](https://aws.amazon.com/)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?logo=terraform)](https://www.terraform.io/)
[![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.2%20%28Java%2021%29-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20MUI-61DAFB?logo=react)](https://react.dev/)

---

## 🌐 Live Production Endpoints

* **Production URL (CloudFront CDN)**: [https://d34fecnctmxvyw.cloudfront.net](https://d34fecnctmxvyw.cloudfront.net)
* **Application Load Balancer Endpoint**: `http://ticketdesk-alb-683270245.us-east-1.elb.amazonaws.com`
* **Health Check Endpoint**: [https://d34fecnctmxvyw.cloudfront.net/api/health](https://d34fecnctmxvyw.cloudfront.net/api/health)
* **GitHub Repository**: [https://github.com/anu123sri/awscapstone](https://github.com/anu123sri/awscapstone)

---

## 🏗️ High-Level Cloud Architecture

```mermaid
flowchart TD
    User([👤 User / Browser])
    CloudFront[🌐 CloudFront CDN Distribution<br/>d34fecnctmxvyw.cloudfront.net]
    S3Frontend[(🪣 S3 Bucket: Static Frontend Assets<br/>OAC Restricted Access)]
    S3Attachments[(🪣 S3 Bucket: Attachments<br/>Direct Browser PUT & Thumbnails)]
    Lambda[⚡ Lambda: Thumbnail Generator<br/>Pillow 200x200 Image Resizer]
    
    subgraph VPC ["AWS VPC (10.0.0.0/16) — Region us-east-1"]
        subgraph PublicSubnets ["Public Subnets (AZ-1a / AZ-1b)"]
            ALB[⚖️ Application Load Balancer<br/>ticketdesk-alb]
            NAT[🚪 NAT Gateway + Elastic IP]
        end
        
        subgraph PrivateAppSubnets ["Private Application Subnets (AZ-1a / AZ-1b)"]
            ECS1[🐳 ECS Fargate Task 1<br/>Spring Boot API]
            ECS2[🐳 ECS Fargate Task 2<br/>Spring Boot API]
        end
        
        subgraph PrivateDBSubnets ["Private Database Subnets (AZ-1a / AZ-1b)"]
            RDS[(🗄️ Amazon RDS MySQL 8.0<br/>Multi-AZ Subnet Group)]
        end
    end

    User -->|HTTPS Request| CloudFront
    CloudFront -->|Static Files / UI| S3Frontend
    CloudFront -->|/api/* Dynamic Traffic| ALB
    User -.->|Direct S3 PUT Upload (Presigned URL)| S3Attachments
    S3Attachments -->|ObjectCreated Event| Lambda
    Lambda -->|Write 200x200 JPEG| S3Attachments

    ALB -->|Forward TCP:8080| ECS1
    ALB -->|Forward TCP:8080| ECS2
    ECS1 -->|Outbound via NAT| NAT
    ECS2 -->|Outbound via NAT| NAT
    ECS1 -->|MySQL TCP:3306| RDS
    ECS2 -->|MySQL TCP:3306| RDS
```

---

## 🚀 Key Features & Capabilities

1. **Enterprise Role-Based Access Control (RBAC)**:
   * **Employees**: Create, track, filter tickets, inspect attachment thumbnails, and update profile settings.
   * **Admins**: Manage user directories, toggle roles, configure ticket categories, and oversee system analytics.
2. **Serverless Direct-to-S3 Attachment Pipeline (M5)**:
   * Backend generates secure 15-minute presigned S3 URLs.
   * Browser streams image bytes directly to S3 via HTTP PUT without taxing API memory.
   * S3 event automatically invokes an AWS Lambda function running Python Pillow to generate 200×200 JPEG thumbnails.
3. **Automated CI/CD Pipeline (M6)**:
   * GitHub Actions runs Gitleaks secret scanner, executes Maven unit tests on JDK 21, builds container images, pushes to Amazon ECR, deploys rolling updates to ECS Fargate, syncs frontend to S3, invalidates CloudFront CDN cache, and runs automated smoke tests.
4. **Full-Stack Observability & Alarms (M7)**:
   * Centralized CloudWatch logging with a 14-day finite retention policy.
   * Live CloudWatch Operations Dashboard tracking traffic, latency, CPU/memory, and RDS connections.
   * 3 actionable CloudWatch Metric Alarms with Amazon SNS email alerting.
5. **Production Hardening (M8)**:
   * 100% universal resource tagging (`Project`, `Owner`, `Environment`, `CostCenter`, `ManagedBy`).
   * Proven load resilience: **2,010 requests @ 20 concurrent users with 0.00% error rate**.
   * One-page AWS cost report detailing all service spend.

---

## 🛠️ Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Cloud Infrastructure (IaC)** | Terraform 1.5+, AWS Provider ~> 5.0 |
| **Compute & Containers** | AWS ECS Fargate, Amazon ECR, Docker, multi-stage builds |
| **Database & Caching** | Amazon RDS MySQL 8.0, HikariCP Connection Pooling, Spring Data JPA |
| **Serverless & Storage** | AWS Lambda (Python 3.12, Pillow), Amazon S3, S3 Event Notifications |
| **Networking & CDN** | AWS VPC, Public/Private Subnets, NAT Gateway, Internet Gateway, ALB, CloudFront (OAC) |
| **Security & Secrets** | AWS Secrets Manager, SSM Parameter Store, IAM Roles & Policies, Gitleaks, JWT (jjwt 0.12) |
| **Observability** | Amazon CloudWatch Logs, Metrics, Dashboards, Metric Alarms, Amazon SNS |
| **Backend Framework** | Java 21, Spring Boot 3.2.3, Spring Security 6, Maven, JUnit 5, Mockito |
| **Frontend Framework** | React 18, Vite 5, Material-UI (MUI v5), Axios, React Router v6 |
| **CI/CD Automation** | GitHub Actions (`.github/workflows/deploy.yml`) |

---

## 🏆 Milestone Progress Matrix (M1 – M8)

| Milestone | Description | Status | Evidence |
| :--- | :--- | :---: | :--- |
| **M1 — App in a Box** | Containerized app running locally with Docker Compose | ✅ **Complete** | [`docker-compose.yml`](docker-compose.yml) with backend, frontend, and MySQL |
| **M2 — Foundation in Cloud** | Multi-AZ VPC, subnets, IGW, NAT, and RDS MySQL | ✅ **Complete** | [`terraform/vpc.tf`](terraform/vpc.tf) & [`terraform/rds.tf`](terraform/rds.tf) |
| **M3 — Compute on ECS** | ECS Fargate service behind Application Load Balancer | ✅ **Complete** | [`terraform/ecs.tf`](terraform/ecs.tf) & [`terraform/alb.tf`](terraform/alb.tf) |
| **M4 — Global Edge CDN** | S3 frontend + CloudFront OAC + ALB API routing | ✅ **Complete** | [`terraform/frontend.tf`](terraform/frontend.tf) serving at CloudFront URL |
| **M5 — Serverless Attachments** | Presigned S3 direct upload + Lambda Pillow thumbnailer | ✅ **Complete** | [`lambda/thumbnail_generator.py`](lambda/thumbnail_generator.py) & S3 CORS |
| **M6 — CI/CD Pipeline** | GitHub Actions build $\rightarrow$ test $\rightarrow$ scan $\rightarrow$ ECR $\rightarrow$ ECS $\rightarrow$ smoke test | ✅ **Complete** | [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) automated deploys |
| **M7 — Observability** | 14-day logs, Operations Dashboard & 3 Metric Alarms | ✅ **Complete** | [`terraform/observability.tf`](terraform/observability.tf) with 3 alarms in OK state |
| **M8 — Harden and Prove It** | Universal tagging, 20-user load test (0 errors), cost report | ✅ **Complete** | [`cost_report.md`](cost_report.md) & [`scripts/load_test.py`](scripts/load_test.py) |

---

## 🔐 Demo Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **System Administrator** | `admin` | `admin123` |
| **Standard Employee** | `user1` | `password` |

---

## 📁 Repository Structure

```text
TicketDesk/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Automated 4-stage CI/CD pipeline
├── lambda/
│   ├── package/                  # Pillow binary dependencies for Lambda
│   └── thumbnail_generator.py    # Python Lambda thumbnail function
├── scripts/
│   └── load_test.py              # 20-concurrent-user load sanity check script
├── terraform/
│   ├── alb.tf                    # Application Load Balancer & Target Groups
│   ├── ecs.tf                    # ECS Fargate Cluster, Task Def, & Service
│   ├── frontend.tf               # S3 Static Hosting, CloudFront & OAC
│   ├── iam.tf                    # IAM Roles & Least-Privilege Policies
│   ├── main.tf                   # Terraform Provider & Default Resource Tags
│   ├── observability.tf          # CloudWatch Log Groups, Dashboard & Alarms
│   ├── outputs.tf                # Infrastructure Output Values
│   ├── rds.tf                    # RDS MySQL & DB Subnet Groups
│   ├── secrets.tf                # AWS Secrets Manager & SSM Parameters
│   ├── serverless.tf             # S3 Attachments Bucket & Lambda Function
│   ├── variables.tf              # Configurable Input Variables
│   └── vpc.tf                    # VPC, Subnets, NAT, IGW, Route Tables
├── ticketdesk-backend/           # Spring Boot 3.2 Java 21 REST API
│   ├── src/main/java/com/ticketdesk/
│   │   ├── attachment/           # Presigned S3 uploads & metadata
│   │   ├── auth/                 # JWT Authentication & RBAC
│   │   ├── category/             # Ticket categories
│   │   ├── comment/              # Ticket discussions & comments
│   │   ├── config/               # Security & S3Presigner configuration
│   │   ├── dashboard/            # Analytical metrics
│   │   ├── ticket/               # Ticket lifecycle management
│   │   └── user/                 # User profiles & directory
│   ├── src/test/java/com/ticketdesk/ # JUnit 5 & Mockito Unit Tests
│   ├── Dockerfile                # Multi-stage container build
│   └── pom.xml                   # Maven dependencies
├── ticketdesk-frontend/          # React 18 + Vite 5 SPA
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, Theme Toggle
│   │   ├── pages/                # Dashboard, Tickets, User Admin, Profile
│   │   └── services/             # Axios API & Direct S3 PUT Upload Service
│   ├── Dockerfile
│   └── package.json
├── ARCHITECTURE.md               # Detailed Cloud Architecture Specification
├── DEPLOYMENT_GUIDE.md           # Step-by-Step Infrastructure Deployment Runbook
├── DEPLOYMENT_READINESS_CHECKLIST.md # §6 Readiness Audit (34 Checklist Items)
├── DEMO_RUNBOOK.md               # 10-Minute Facilitator Demonstration Guide
├── cost_report.md                # One-Page AWS Cost & Spend Analysis
└── docker-compose.yml            # Local development orchestration
```
