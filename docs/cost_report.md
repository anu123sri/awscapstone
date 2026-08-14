# 💰 TicketDesk One-Page AWS Cost Report

This report summarizes the operational costs, component pricing, and budget optimization for the **TicketDesk Cloud Platform**.

---

## 📊 Monthly Cost Summary

| AWS Service | Resource Description | Billing Model | Monthly Estimate (USD) |
| :--- | :--- | :--- | :---: |
| **VPC & Networking** | 1 NAT Gateway (AZ us-east-1a) + 1 Elastic IP | $0.045/hour + $0.045/GB | **$32.40** *(#1 Most Expensive)* |
| **Amazon RDS** | MySQL 8.0 (`db.t4g.micro` / `db.t3.micro`, 20GB gp3) | $0.018/hour + $0.115/GB-mo | **$16.50** *(#2 Most Expensive)* |
| **Amazon ECS Fargate** | 2 Tasks (0.5 vCPU, 1 GB RAM each) | $0.04048/vCPU-hr + $0.004445/GB-hr | **$18.20** |
| **Application Load Balancer** | 1 ALB (`ticketdesk-alb`) across 2 Public Subnets | $0.0225/hour + $0.008/LCU-hr | **$16.80** |
| **Amazon CloudFront** | Global Edge CDN Distribution (`E3VZTH6XGJXK77`) | $0.085/GB data out (1TB Free Tier) | **$0.00** (Free Tier) |
| **Amazon S3** | Attachments & Frontend Storage + PUT/GET Requests | $0.023/GB-mo + Request tiers | **$0.25** |
| **AWS Lambda** | Python 3.12 Pillow Thumbnail Generator | 1M free requests + Compute tiers | **$0.00** (Free Tier) |
| **AWS Secrets Manager & SSM** | Database credentials & JWT secret | $0.40/secret/month (2 secrets) | **$0.80** |
| **Amazon CloudWatch** | Logs (14-day retention), Dashboard, 3 Metric Alarms | $0.10/alarm + $0.50/GB ingested | **$1.20** |
| **TOTAL ESTIMATED MONTHLY COST** | | | **~$86.15 / month** |

---

## 🔍 The Two Most Expensive Items

### 1. 🥇 NAT Gateway (`$32.40 / month` — ~38% of total bill)
* **Why it costs this much**: AWS charges a flat hourly rate of **$0.045/hour** ($1.08/day) for keeping the NAT Gateway provisioned in the public subnet, regardless of how much traffic traverses it.
* **Architecture Role**: Provides secure, outbound-only internet connectivity for ECS Fargate tasks in private application subnets to pull images and connect to external endpoints.
* **Cost Optimization Strategy**: In non-production environments, NAT Gateways can be replaced with VPC Endpoints (Interface Endpoints) for ECR, S3, Secrets Manager, and CloudWatch to reduce outbound NAT charges.

### 2. 🥈 Amazon RDS MySQL Database (`$16.50 / month` — ~19% of total bill)
* **Why it costs this much**: Continuous instance runtime for `db.t4g.micro` ($0.018/hr) plus 20 GB of gp3 general-purpose SSD storage and automated backup storage.
* **Architecture Role**: Provides ACID-compliant persistence, automated backups, and private subnet isolation for ticket and user entities.
* **Cost Optimization Strategy**: Reserved Instances (1-year or 3-year RI commitment) can reduce RDS instance pricing by up to 38-60%.
