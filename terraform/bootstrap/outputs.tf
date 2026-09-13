output "notification_role_arn" {
  description = "Set AWS_ROLE_ARN in the GitHub notifications environment to this role ARN."
  value       = module.iam_github_roles.role_arn
}
output "notification_parameter_arn" {
  value = module.iam_github_roles.parameter_arn
}
