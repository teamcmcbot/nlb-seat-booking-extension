variable "name_prefix" {
  type = string
}
variable "github_repository" {
  type = string
  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "Use an exact owner/repository name without wildcards."
  }
}
variable "github_environment" {
  type    = string
  default = "notifications"
}
variable "aws_region" {
  type = string
}
variable "parameter_name" {
  type = string
  validation {
    condition     = startswith(var.parameter_name, "/") && !can(regex("[?*]", var.parameter_name))
    error_message = "Use one absolute SSM parameter name without wildcards."
  }
}
variable "kms_key_arn" {
  description = "Optional customer-managed KMS key ARN; leave null for alias/aws/ssm. Its key policy must also allow this role."
  type        = string
  default     = null
}
variable "tags" {
  type    = map(string)
  default = {}
}

variable "github_owner_id" {
  type = string
  validation {
    condition     = can(regex("^[0-9]+$", var.github_owner_id))
    error_message = "Use the immutable numeric GitHub owner ID."
  }
}
variable "github_repository_id" {
  type = string
  validation {
    condition     = can(regex("^[0-9]+$", var.github_repository_id))
    error_message = "Use the immutable numeric GitHub repository ID."
  }
}
