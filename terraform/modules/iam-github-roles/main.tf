data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

locals {
  oidc_host     = trimprefix(data.aws_iam_openid_connect_provider.github.url, "https://")
  parameter_arn = "arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${var.parameter_name}"
}

data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_host}:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_host}:sub"
      values   = ["repo:${split("/", var.github_repository)[0]}@${var.github_owner_id}/${split("/", var.github_repository)[1]}@${var.github_repository_id}:environment:${var.github_environment}"]
    }
  }
}

resource "aws_iam_role" "notification" {
  name               = "${var.name_prefix}-github-actions-notification"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
  tags               = var.tags
}

data "aws_iam_policy_document" "notification" {
  statement {
    actions   = ["ssm:GetParameter"]
    resources = [local.parameter_arn]
  }
  # alias/aws/ssm needs no additional customer-managed key grant.
  dynamic "statement" {
    for_each = var.kms_key_arn == null ? [] : [var.kms_key_arn]
    content {
      actions   = ["kms:Decrypt"]
      resources = [statement.value]
      condition {
        test     = "StringEquals"
        variable = "kms:ViaService"
        values   = ["ssm.${var.aws_region}.${data.aws_partition.current.dns_suffix}"]
      }
      condition {
        test     = "StringEquals"
        variable = "kms:EncryptionContext:PARAMETER_ARN"
        values   = [local.parameter_arn]
      }
    }
  }
}

resource "aws_iam_role_policy" "notification" {
  name   = "read-notification-api-key"
  role   = aws_iam_role.notification.id
  policy = data.aws_iam_policy_document.notification.json
}
