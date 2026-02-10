terraform {
  required_version = ">= 1.5.0"
}

data "aws_route53_zone" "existing" {
  count = var.create_hosted_zone ? 0 : 1
  name  = var.domain_name
}

resource "aws_route53_zone" "main" {
  count = var.create_hosted_zone ? 1 : 0
  name  = var.domain_name

  tags = var.tags
}

locals {
  hosted_zone_id   = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : data.aws_route53_zone.existing[0].zone_id
  hosted_zone_name = var.create_hosted_zone ? aws_route53_zone.main[0].name : data.aws_route53_zone.existing[0].name

  txt_records_by_name = {
    for name, records in {
      for record in var.email_txt_records : record.name => record...
    } : name => [
      for record in records : record.value
    ]
  }

  mx_records_combined = [
    for record in var.email_mx_records : "${record.priority} ${record.value}"
  ]
}

resource "aws_route53_record" "email_mx" {
  count = length(var.email_mx_records) > 0 ? 1 : 0

  zone_id         = local.hosted_zone_id
  name            = var.domain_name
  type            = "MX"
  ttl             = 3600
  allow_overwrite = true

  records = local.mx_records_combined

  lifecycle {
    create_before_destroy = true
    ignore_changes        = []
  }
}

resource "aws_route53_record" "email_txt" {
  for_each = local.txt_records_by_name

  zone_id         = local.hosted_zone_id
  name            = each.key == "@" ? var.domain_name : "${each.key}.${var.domain_name}"
  type            = "TXT"
  ttl             = 3600
  allow_overwrite = true

  records = each.value
}

resource "aws_route53_record" "email_cname" {
  for_each = {
    for idx, record in var.email_cname_records : idx => record
  }

  zone_id         = local.hosted_zone_id
  name            = "${each.value.name}.${var.domain_name}"
  type            = "CNAME"
  ttl             = 3600
  allow_overwrite = true

  records = [each.value.value]
}
