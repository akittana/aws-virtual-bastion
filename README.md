# Overview
ssmTerminal is a javascript client that provides an interactive terminal with EC2 instances using the AWS Systems Manager (SSM) API. ssmTerminal can be used as a simple bastion host to provide shell access to private EC2 instances with no internet connectivity (As long as they are configured for AWS Systems Manager service). 

Key Features:
 1. ssmTerminal keeps track of current directory for each session
 2. Send commands to multiple instances at once. 
 3. Have multiple terminal windows open at the same time. 

# Requirements

ssmTerminal requires instances to have the proper IAM roles configured and the ssm agent installed, and the credentials provided to have the proper access to AWS Systems Manager.

More details can be found at: 
https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-access.html

# To use
ssmTerminal requires index.html and client.min.js, both located under /src. It can be run locally or hosted on a webserver or S3 bucket by opening index.html.

# Compiling from source
If changes are made to the source code, then 'npn run prod_build' will recompile from source. 
