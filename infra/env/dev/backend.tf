terraform {
  backend "s3" {
    bucket         = "worklient-terraform-state-dev"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "worklient-terraform-locks-dev"
    encrypt        = true
  }
}
