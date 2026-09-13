module "iam_github_roles" {
  source               = "../modules/iam-github-roles"
  name_prefix          = "nlb-extension"
  github_repository    = "teamcmcbot/nlb-seat-booking-extension"
  github_owner_id      = "133510590"
  github_repository_id = "1317438263"
  github_environment   = "notifications"
  aws_region           = var.aws_region
  parameter_name       = var.notification_parameter_name
  kms_key_arn          = var.notification_kms_key_arn
  tags = {
    Project   = "nlb-seat-booking-extension"
    ManagedBy = "terraform"
  }
}
