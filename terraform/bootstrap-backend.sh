#!/usr/bin/env bash
set -euo pipefail
AWS_CLI="${AWS_CLI:-aws}"
bucket='nlb-extension-terraform-state-390017876013-ap-southeast-1-an'
account='390017876013'
region='ap-southeast-1'
[[ "$("$AWS_CLI" sts get-caller-identity --query Account --output text)" == "$account" ]] || { echo 'Wrong AWS account' >&2; exit 1; }
if result=$("$AWS_CLI" s3api head-bucket --bucket "$bucket" --expected-bucket-owner "$account" 2>&1); then
  echo 'Using existing account-owned backend bucket.'
elif [[ "$result" == *'(404)'* ]]; then
  "$AWS_CLI" s3api create-bucket --bucket "$bucket" --bucket-namespace account-regional --region "$region" --create-bucket-configuration "LocationConstraint=$region" --object-ownership BucketOwnerEnforced
else
  echo "$result" >&2
  exit 1
fi
"$AWS_CLI" s3api put-public-access-block --bucket "$bucket" --expected-bucket-owner "$account" --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
"$AWS_CLI" s3api put-bucket-ownership-controls --bucket "$bucket" --expected-bucket-owner "$account" --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]'
"$AWS_CLI" s3api put-bucket-versioning --bucket "$bucket" --expected-bucket-owner "$account" --versioning-configuration Status=Enabled
"$AWS_CLI" s3api put-bucket-encryption --bucket "$bucket" --expected-bucket-owner "$account" --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
"$AWS_CLI" s3api put-bucket-tagging --bucket "$bucket" --expected-bucket-owner "$account" --tagging 'TagSet=[{Key=Project,Value=nlb-seat-booking-extension},{Key=Purpose,Value=terraform-state},{Key=ManagedBy,Value=aws-cli-bootstrap}]'
# This dedicated backend bucket's policy is owned by this bootstrap script.
"$AWS_CLI" s3api put-bucket-policy --bucket "$bucket" --expected-bucket-owner "$account" --policy "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"DenyInsecureTransport\",\"Effect\":\"Deny\",\"Principal\":\"*\",\"Action\":\"s3:*\",\"Resource\":[\"arn:aws:s3:::$bucket\",\"arn:aws:s3:::$bucket/*\"],\"Condition\":{\"Bool\":{\"aws:SecureTransport\":\"false\"}}}]}"
