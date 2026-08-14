# 1. DB Subnet Group (Private DB Subnets)
resource "aws_db_subnet_group" "rds" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private_db[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# 2. Random Password Generation for Database
resource "random_password" "db_password" {
  length  = 16
  special = false
}

# 3. AWS Secrets Manager Secret for DB Password
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "/${var.project_name}/${var.environment}/db_password"
  recovery_window_in_days = 0

  tags = {
    Name = "${var.project_name}-db-secret"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "mysql"
    port     = 3306
  })
}

# 4. AWS Systems Manager Parameter Store for DB Connection Settings
resource "aws_ssm_parameter" "db_url" {
  name  = "/${var.project_name}/${var.environment}/SPRING_DATASOURCE_URL"
  type  = "String"
  value = "jdbc:mysql://${aws_db_instance.mysql.endpoint}/${var.db_name}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
}

resource "aws_ssm_parameter" "db_user" {
  name  = "/${var.project_name}/${var.environment}/SPRING_DATASOURCE_USERNAME"
  type  = "String"
  value = var.db_username
}

# 5. RDS MySQL 8.0 Instance
resource "aws_db_instance" "mysql" {
  identifier            = "${var.project_name}-db"
  engine                = "mysql"
  engine_version        = "8.0"
  instance_class        = "db.t4g.micro"
  allocated_storage     = 20
  max_allocated_storage = 50
  storage_type          = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Security & Backup Checklist Requirements
  publicly_accessible     = false # Checklist #16 & Pass/Fail #3
  storage_encrypted       = true  # Checklist #20
  backup_retention_period = 1     # Checklist #21 (Set to 1 for Free Tier compatibility)
  deletion_protection     = false # Set to false to allow clean terraform destroy
  skip_final_snapshot     = true  # Set to true for quick teardown in POC environment

  tags = {
    Name = "${var.project_name}-mysql-db"
  }
}
# 6. AWS Secrets Manager Secret for JWT Secret Key
resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "/${var.project_name}/${var.environment}/jwt_secret"
  recovery_window_in_days = 0

  tags = {
    Name = "${var.project_name}-jwt-secret"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}