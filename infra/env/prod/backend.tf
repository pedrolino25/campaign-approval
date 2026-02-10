terraform {
  backend "s3" {
    bucket         = "worklient-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "worklient-terraform-locks-prod"
    encrypt        = true
  }
}
