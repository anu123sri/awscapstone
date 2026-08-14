# ECS Fargate Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-ecs-cluster"
  }
}

# CloudWatch Log Group for ECS Backend Logs
resource "aws_cloudwatch_log_group" "ecs_backend" {
  name              = "/ecs/${var.project_name}-backend"
  retention_in_days = 14 # Checklist #28 (finite retention period)

  tags = {
    Name = "${var.project_name}-backend-log-group"
  }
}

# ECS Task Definition for Backend API
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "${var.project_name}-backend"
      image     = "${aws_ecr_repository.backend.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = var.backend_container_port
          hostPort      = var.backend_container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "SPRING_PROFILES_ACTIVE"
          value = "prod"
        },
        {
          name  = "ATTACHMENTS_S3_BUCKET"
          value = aws_s3_bucket.attachments.id
        }
      ]

      secrets = [
        {
          name      = "SPRING_DATASOURCE_URL"
          valueFrom = aws_ssm_parameter.db_url.arn
        },
        {
          name      = "SPRING_DATASOURCE_USERNAME"
          valueFrom = aws_ssm_parameter.db_user.arn
        },
        {
          name      = "SPRING_DATASOURCE_PASSWORD"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:password::"
        },
        {
          name      = "TICKETDESK_JWT_SECRET"
          valueFrom = aws_secretsmanager_secret.jwt_secret.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-backend-task-def"
  }
}

# ECS Fargate Service (Runs in Private App Subnets)
resource "aws_ecs_service" "backend" {
  name                               = "${var.project_name}-backend-service"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.backend.arn
  desired_count                      = var.backend_desired_count
  launch_type                        = "FARGATE"
  enable_execute_command             = true
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 50

  network_configuration {
    subnets          = aws_subnet.private_app[*].id
    security_groups  = [aws_security_group.ecs_backend.id]
    assign_public_ip = false # Checklist #10 (Container runs in private subnet)
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "${var.project_name}-backend"
    container_port   = var.backend_container_port
  }

  depends_on = [
    aws_lb_listener.http,
    aws_db_instance.mysql
  ]

  tags = {
    Name = "${var.project_name}-backend-service"
  }
}
