# Notification IAM bootstrap

This root provisions one role and its inline policy for the notification
job. It reuses the existing GitHub OIDC provider and existing SSM parameter;
it does not read the secret value into Terraform state. The audit workflow uses a separate notification job to send its final summary.

The reviewed configuration fixes a permissions document incorrectly used as a
trust policy, attaches the SSM policy, wires the previously commented module,
and removes unused example variables and the inconsistent bucket spelling.

## Backend

Account: `390017876013`; region: `ap-southeast-1`.
Bucket: `nlb-extension-terraform-state-390017876013-ap-southeast-1-an`.
State key: `bootstrap/terraform.tfstate`; native S3 lock: the same key plus
`.tflock`. The bucket is bootstrapped separately with AWS CLI, with versioning,
SSE-S3 encryption, blocked public access, disabled ACLs, and HTTPS-only access.
It is intentionally outside the root's lifecycle to avoid a circular backend
dependency. Do not delete it when destroying the IAM root.

Creation requires a current AWS CLI supporting `--bucket-namespace`:

```sh
aws s3api create-bucket \
  --bucket nlb-extension-terraform-state-390017876013-ap-southeast-1-an \
  --bucket-namespace account-regional \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1 \
  --object-ownership BucketOwnerEnforced
```

See `bootstrap-backend.sh` for the complete creation and protection commands.
Use a trusted administrative AWS session. The notification role receives no
Terraform-state access and cannot provision IAM resources.

## Review and apply

```sh
terraform -chdir=terraform/bootstrap init -backend-config=backend.bootstrap.hcl
terraform -chdir=terraform/bootstrap validate
terraform -chdir=terraform/bootstrap plan -out=notification.tfplan
# Review the plan before provisioning the role:
terraform -chdir=terraform/bootstrap apply notification.tfplan
terraform -chdir=terraform/bootstrap output notification_role_arn
```

The module targets this repository. Copy `terraform.tfvars.examples` to
`terraform.tfvars` inside `bootstrap/` to set the production parameter name. Commit `.terraform.lock.hcl`; never commit
state, local tfvars, credentials, or saved plans.

## GitHub integration

Set these in the repository's `notifications` GitHub Environment:

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `AWS_ROLE_ARN` | Terraform's `notification_role_arn` output (a role ARN, not the OIDC provider ARN) |
| Variable | `AWS_REGION` | `ap-southeast-1` |
| Secret | `SEND_NOTIFICATION_SSM_PARAM` | `/zhenwei-dev-api/prod/send-notification/api-key/automation` |

Restrict the environment's deployment branches to `main` before enabling the
job. The exact OIDC subject is
`repo:teamcmcbot@133510590/nlb-seat-booking-extension@1317438263:environment:notifications`.
An environment-based subject does not include the branch, so GitHub's environment
branch protection must enforce that restriction. Keep unattended execution in
mind when choosing reviewer gates.

The notification job declares `environment: notifications` and
`permissions: {contents: read, id-token: write}`, assume the role through
`aws-actions/configure-aws-credentials`, and call `ssm:GetParameter` with
decryption. Retrieve and mask the key only within the sender process; do not
put it in job outputs, reports, or artifacts. Send the notification through the
existing API. It sends one summary per run, including clean audits.

Only the exact production parameter is allowed. The observed key is
`alias/aws/ssm`; no extra customer-managed KMS grant is needed. If it changes,
set `notification_kms_key_arn` and ensure the key policy allows the role. The
optional decrypt permission is limited to SSM and this parameter's encryption
context. No recursive parameter reads, wildcard environments, or dev secret
access are granted.

References: [GitHub OIDC in AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws),
[Terraform S3 backend](https://developer.hashicorp.com/terraform/language/backend/s3),
[AWS bucket namespaces](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html).

This repository uses immutable GitHub OIDC subjects. Verify the prefix with
`gh api repos/teamcmcbot/nlb-seat-booking-extension/actions/oidc/customization/sub`
before changing its trust policy; name-only subjects do not match.
