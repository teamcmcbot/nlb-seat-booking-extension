variable "aws_region" {
  description = "Region containing the notification SSM parameter."
  type        = string
  default     = "ap-southeast-1"
}
variable "notification_kms_key_arn" {
  description = "Only needed if the parameter moves from alias/aws/ssm to a customer-managed key."
  type        = string
  default     = null
}

variable "notification_parameter_name" {
  description = "SSM parameter name containing the notification API key."
  type        = string
}
