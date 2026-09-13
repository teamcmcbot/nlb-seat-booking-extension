output "role_arn" {
  value = aws_iam_role.notification.arn
}
output "parameter_arn" {
  value = local.parameter_arn
}
