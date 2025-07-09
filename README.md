# Alibaba Cloud OSS Tools

A collection of tools and scripts for working with Alibaba Cloud Object Storage Service (OSS).

## Overview

This repository contains various utilities for interacting with Alibaba Cloud OSS, leveraging the S3-compatible API that Alibaba Cloud provides.

## Contents

### `/nodejs-s3-list-buckets`
A Node.js script that uses the AWS S3 SDK to list buckets in Alibaba Cloud OSS. This demonstrates how to use AWS SDKs with Alibaba Cloud's S3-compatible endpoints.

## Getting Started

Each subdirectory contains its own README with specific setup and usage instructions.

### Prerequisites

- Valid Alibaba Cloud account with OSS access
- Access Key ID and Secret Access Key from Alibaba Cloud
- Appropriate permissions to list and access OSS buckets

### Security Notes

- Never commit credentials to version control
- Use environment variables for sensitive information
- Follow the principle of least privilege when setting up access keys

## Alibaba Cloud OSS Regions

Common Alibaba Cloud OSS endpoints:

| Region | Endpoint |
|--------|----------|
| China (Hangzhou) | `oss-cn-hangzhou.aliyuncs.com` |
| China (Shanghai) | `oss-cn-shanghai.aliyuncs.com` |
| China (Beijing) | `oss-cn-beijing.aliyuncs.com` |
| China (Shenzhen) | `oss-cn-shenzhen.aliyuncs.com` |
| Singapore | `oss-ap-southeast-1.aliyuncs.com` |
| US (Silicon Valley) | `oss-us-west-1.aliyuncs.com` |
| US (Virginia) | `oss-us-east-1.aliyuncs.com` |

## Contributing

Feel free to submit issues and enhancement requests.

## License

See LICENSE file for details.