# 📖 TicketDesk — M0 Manual Deployment Runbook

This document describes the manual step-by-step procedure used during initial baseline verification (Milestone M0) prior to full Terraform automation.

---

## 1. Network Setup (VPC & Subnets)
1. Created custom VPC `10.0.0.0/16` in `us-east-1` with DNS hostnames and resolution enabled.
2. Created 2 Public Subnets (`10.0.1.0/24`, `10.0.2.0/24`) attached to Internet Gateway.
3. Created 2 Private App Subnets (`10.0.11.0/24`, `10.0.12.0/24`) routed through NAT Gateway.
4. Created 2 Private DB Subnets (`10.0.21.0/24`, `10.0.22.0/24`) with isolated internal routes.

---

## 2. Database & Secrets Setup
1. Stored database master password in AWS Secrets Manager `/ticketdesk/production/db_password`.
2. Created RDS Subnet Group and launched MySQL 8.0 `db.t4g.micro` in private database subnets.
3. Configured security groups so RDS only accepts connections from the backend ECS security group on port `3306`.

---

## 3. Compute & Container Setup
1. Created Amazon ECR repository `ticketdesk-backend`.
2. Built Docker container image locally and pushed to ECR.
3. Created ECS Cluster `ticketdesk-cluster` and registered task definition `ticketdesk-backend-task` (Fargate, 0.5 vCPU, 1 GB RAM).
4. Provisioned Application Load Balancer `ticketdesk-alb` with target group `ticketdesk-be-tg` health checking on `/api/health`.
5. Created ECS Service with `desired_count = 2` tasks distributed across both AZs.

---

## 4. Frontend & CDN Setup
1. Built React Vite frontend production bundle.
2. Uploaded assets to private S3 bucket `ticketdesk-frontend-5ujbds`.
3. Created CloudFront distribution `E3VZTH6XGJXK77` with Origin Access Control (OAC) and path routing:
   * `/api/*` $\rightarrow$ Application Load Balancer.
   * `Default (*)` $\rightarrow$ S3 bucket.

---

## 5. Serverless Attachments Setup
1. Created S3 attachments bucket `ticketdesk-attachments-5ujbds` with CORS configuration.
2. Deployed Python Lambda function `ticketdesk-thumbnail-generator` with Pillow dependencies.
3. Configured S3 event trigger on `uploads/` prefix to invoke Lambda and write 200x200 JPEG thumbnails to `thumbnails/`.

---

> **Note**: For production deployments, all of the manual steps above are 100% automated using Terraform in [`terraform/`](../terraform).
