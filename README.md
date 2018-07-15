# Overview
A web based terminal for EC2 instances that does not require SSH or any other inbound connections to the instaces. Instead it uses the AWS Systems Manager (SSM) API to run commands (bash or powershell).

[Try it here](https://awsvirtualbastion.asecure.cloud)


**Run commands on multiple instances at once:**

![Run commands on multiple instances](/screenshots/multi-select.png) 

**Support for powershell:**

![Run Powershell commands](/screenshots/powershell.png)

**Keeps track of current directory:**
![Keep track of directory](/screenshots/dir-state.png)

# Key Features:

 1. Secure interactive command-line shell in the browser without exposing any ports on the instance.
 2. Keeps track of current directory which enables moving around the filesystem similar to a traditional shell session.
 3. Execute commands/scripts on multiple instances at once, as wel as having multiple terminal sessions concurrently. 
 4. Automatically log all commands and their output in S3. 

# How it works
Virtual bastion (ssmTerminal) relies on the AWS Systems Manager (SSM) service. To use the service, instances need to have an agent installed (installed by default on the latest Amazon Linux and Windows EC2 instances). The SSM service can send commands (linux shell or windows powershell) to instances through the agents. Finally, EC2 instances require access to the SSM service (outbound access from the instances).

ssmTerminal communciates with the SSM service using the AWS API. Commands entered into the web terminal trigger the sendCommand API call, and once the commands are executed on the instance, the output is retrieved using the getCommandInvocation API call. The output is formatted and displayed by ssmTerminal.

In addition, with each command sent, a 'pwd' command is appended on each requested execution. This is used to keep track of the current directory as the user moves around the filesystem.

# Authentication
Two authentication options are supported:
 - IAM user (Access Key and Secret Access Key). MFA (Multi-Factor Auth) token can be provided for additional security.
 - Cognito user pools with Federated Identity.

# Configuration/Requirements

- EC2 Instance Requirements
 Instances require the AWS Systems Manager (SSM) agent installed (the agent is installed by default on Windows instances and the latest Amazon Linux instances).  In addition to the agent, ec2 instances also require the proper IAM role applied to allow communication with the SSM service.

- User Requirements
The IAM user or the Cognito Federated Identity role requires an IAM policy which allows the following actions:
	- ec2:DescribeRegions
	- ec2:DescribeInstances
	- ssm:SendCommand
	- ssm:DescribeInstanceInformation
	- ssm:ListInstanceAssociations
	- ssm:DescribeInstanceAssociationsStatus
	- ssm:GetCommandInvocation


More details can be found at: 
https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-access.html

# To use
Download index.html and client.min.js, both located under /src. It can be run locally or hosted on a webserver (or S3 bucket).

# Compiling from source
If changes are made to the source code, then 'npm run prod_build' will recompile from source. 


