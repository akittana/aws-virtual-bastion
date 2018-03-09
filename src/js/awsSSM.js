import EC2 from 'aws-sdk/clients/ec2';
import SSM from 'aws-sdk/clients/ssm';
import STS from 'aws-sdk/clients/sts';
import { Config, CognitoIdentityCredentials } from 'aws-sdk/global';
import { AuthenticationDetails, CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';

import * as SSMActions from './actions/SSMActions';

const REQUEST_MAX_RESULTS = 50;


export function listInstances(authDetails, region,callback){

    let ec2 = null;
    if (authDetails.mode == 'iamUser') {
         ec2 = new EC2({
            accessKeyId: authDetails.accessKeyId,
            secretAccessKey: authDetails.secretAccessKey,
            region
        });
    }
    else if (authDetails.mode == 'cognito') {
         ec2 = new EC2({
            credentials: authDetails.credentialsObject,
            region
        });
    }
    else if (authDetails.mode == 'iamUserMfa') {
         ec2 = new EC2({
            accessKeyId: authDetails.credentialsObject.AccessKeyId,
            secretAccessKey: authDetails.credentialsObject.SecretAccessKey,
            sessionToken: authDetails.credentialsObject.SessionToken,
            region
        });
    }
    
    var parseReturnedInstances = function(returnedInstances){
        let instances = [];
        returnedInstances.map((instanceList) => {
            
          instanceList.Instances.map((instance) =>{
              let instanceName = "";
              instance.Tags.map((tag) => {
                  if (tag['Key'] == 'Name') instanceName = tag['Value'];
              });
              
              instances.push({
                  instanceId: instance.InstanceId,
                  instanceTags: instance.Tags,
                  instanceDetails: {
                      Name: instanceName,
                      imageId: instance.ImageId,
                      instanceType: instance.InstanceType,
                      privateIpAddress: instance.PrivateIpAddress,
                  }
                  
              }); 
              
          });
          
          
        });
        return instances;
    };
    var getNextResults = function(nextToken, instancesList){
        const params = {MaxResults: REQUEST_MAX_RESULTS, NextToken: nextToken};
        ec2.describeInstances(params).promise()
        .then(
            function(data){
                if (data.NextToken){

                    parseReturnedInstances(data.Reservations).map((instance) => {
                        instancesList.push(instance);
                    });
                    getNextResults(data.NextToken, instancesList);
                }
                else{
                    parseReturnedInstances(data.Reservations).map((instance) => {
                        instancesList.push(instance);
                    });
                    callback(instancesList);
                   
                }
                
            }
        )
        .catch(
            function(err){
                SSMActions.displayErrorMessage('Error listing Instances',err, err.stack);
            }
        );
    };

    const params ={MaxResults:REQUEST_MAX_RESULTS};
    ec2.describeInstances(params).promise()
    .then(
        function(data){
          if (data.NextToken){
            let instancesList = parseReturnedInstances(data.Reservations);
            getNextResults(data.NextToken,instancesList);  
          }
          else
          {
            callback(parseReturnedInstances(data.Reservations));  
          }
          
        //   if (data.NextToken == null){
        //     callback(parseReturnedInstances(data.Reservations));
        //   }
        //   else{
            
        //     let instancesList = parseReturnedInstances(data.Reservations);
        //     getNextResults(data.NextToken,instancesList);
        //   }
      }     
    )
    .catch(
        function(err){
            SSMActions.displayErrorMessage('Error listing Instances',err, err.stack);
        }
    );
    

    
}

export function listRegions(authDetails, callback){
    

    let ec2 = null;
    if (authDetails.mode == 'iamUser') {
         ec2 = new EC2({
            accessKeyId: authDetails.accessKeyId,
            secretAccessKey: authDetails.secretAccessKey,
            region: 'us-east-1'
        });
    }
    else if (authDetails.mode == 'cognito') {
         ec2 = new EC2({
            credentials: authDetails.credentialsObject,
            region: 'us-east-1'
        });
    }
    else if (authDetails.mode == 'iamUserMfa') {
         ec2 = new EC2({
            accessKeyId: authDetails.credentialsObject.AccessKeyId,
            secretAccessKey: authDetails.credentialsObject.SecretAccessKey,
            sessionToken: authDetails.credentialsObject.SessionToken,
            region: 'us-east-1'
        });
    }
    
    
    var regions = [];
    ec2.describeRegions(function(err, data) {
       if (err) SSMActions.displayErrorMessage('Error listing regions',err, err.stack); // an error occurred
       else {
           data.Regions.map((region) => {
               regions.push(region.RegionName);
           });
           callback(regions);
       }
        
    });
}

export function ssmSendCommand(authDetails, command,workingDirectory,instanceId, platformType, region, settings, successCallback, errCallback){
    
    var commandId = '';
    // var instanceIds = [];
    let ssm = null;
    if (authDetails.mode == 'iamUser') {
         ssm = new SSM({
            accessKeyId: authDetails.accessKeyId,
            secretAccessKey: authDetails.secretAccessKey,
            region
        });
    }
    else if (authDetails.mode == 'cognito') {
         ssm = new SSM({
            credentials: authDetails.credentialsObject,
            region
        });
    }
    else if (authDetails.mode == 'iamUserMfa') {
         ssm = new SSM({
            accessKeyId: authDetails.credentialsObject.AccessKeyId,
            secretAccessKey: authDetails.credentialsObject.SecretAccessKey,
            sessionToken: authDetails.credentialsObject.SessionToken,
            region
        });
    }
    
   
        
    const params = {
        // DocumentName: "AWS-RunShellScript",
        DocumentName: (platformType == 'Linux' ? "AWS-RunShellScript": "AWS-RunPowerShellScript"),
        InstanceIds: instanceId,
        Parameters: {
            'commands': [command, (platformType == 'Linux' ? "echo terminalCWDTrackText`pwd`terminalCWDTrackText": "echo terminalCWDTrackText;pwd | Write-Host;echo terminalCWDTrackText")],
            'workingDirectory': workingDirectory
        },
        TimeoutSeconds: settings['cmdTimeOut'],
        OutputS3BucketName: (settings['logToS3']) ? settings['logBucketName'] : null,
        OutputS3KeyPrefix: (settings['logToS3']) ? settings['logS3KeyPrefix'] : null
    };
    
    ssm.sendCommand(params, (err,data) => {
        if (err) SSMActions.displayErrorMessage('Error sending command',err, err.stack); //errCallback(err.stack, instanceId); // an error occurred
        else {
            commandId = data.Command.CommandId;
            instanceId = data.Command.InstanceIds;
            successCallback(commandId,instanceId);
        }
        
    });
    
}

export function ssmGetCommandInvocation(authDetails, commandId, instanceIds,region, successCallback, errCallback){
   
   
    let ssm = null;
    if (authDetails.mode == 'iamUser') {
         ssm = new SSM({
            accessKeyId: authDetails.accessKeyId,
            secretAccessKey: authDetails.secretAccessKey,
            region
        });
    }
    else if (authDetails.mode == 'cognito') {
         ssm = new SSM({
            credentials: authDetails.credentialsObject,
            region
        });
    }
    else if (authDetails.mode == 'iamUserMfa') {
         ssm = new SSM({
            accessKeyId: authDetails.credentialsObject.AccessKeyId,
            secretAccessKey: authDetails.credentialsObject.SecretAccessKey,
            sessionToken: authDetails.credentialsObject.SessionToken,
            region
        });
    }
    

    instanceIds.map((instanceId) => {
        const params = {
          CommandId: commandId, 
          InstanceId: instanceId
        };  
        
        ssm.getCommandInvocation(params, function(err, data) {
          if (err) SSMActions.displayErrorMessage('Error getting command output',err, err.stack); //errCallback(err,instanceId); // an error occurred
          else     successCallback(data);           // successful response
        });
    });
}

export function ssmDescribeInstanceInformation(authDetails, region, successCallback){
   let ssm = null;
    if (authDetails.mode == 'iamUser') {
         ssm = new SSM({
            accessKeyId: authDetails.accessKeyId,
            secretAccessKey: authDetails.secretAccessKey,
            region
        });
    }
    else if (authDetails.mode == 'cognito') {
         ssm = new SSM({
            credentials: authDetails.credentialsObject,
            region
        });
    }
    else if (authDetails.mode == 'iamUserMfa') {
         ssm = new SSM({
            accessKeyId: authDetails.credentialsObject.AccessKeyId,
            secretAccessKey: authDetails.credentialsObject.SecretAccessKey,
            sessionToken: authDetails.credentialsObject.SessionToken,
            region
        });
    }
    
    var getNextResults = function(nextToken, instanceInformationList){
        const params = {NextToken: nextToken, MaxResults:REQUEST_MAX_RESULTS};
        ssm.describeInstanceInformation(params).promise()
        .then(
            function(data){
                
                if (data.NextToken){
                    data.InstanceInformationList.map((instance) => {
                        instanceInformationList.push(instance);
                    });
                    getNextResults(data.NextToken,instanceInformationList); 
                }
                else 
                {
                   data.InstanceInformationList.map((instance) => {
                        instanceInformationList.push(instance);
                    });
                    successCallback(instanceInformationList); 
                }
                
                // if (data.NextToken == null){
                //     data.InstanceInformationList.map((instance) => {
                //         instanceInformationList.push(instance);
                //     });
                //     successCallback(instanceInformationList);
                // }
                // else
                // {
                //     data.InstanceInformationList.map((instance) => {
                //         instanceInformationList.push(instance);
                //     });
                //     getNextResults(data.NextToken,instanceInformationList);
                // }
            }
        )
        .catch(function(err){
            SSMActions.displayErrorMessage('Error retrieving instance details',err, err.stack);
        });
    };
    
    const params = {MaxResults: REQUEST_MAX_RESULTS};
    ssm.describeInstanceInformation(params).promise()
    .then(
        function(data){
            
            if (data.NextToken){
                let instanceInformationList = data.InstanceInformationList;
                data.InstanceInformationList.map((instance) => {
                        instanceInformationList.push(instance);
                    });
                getNextResults(data.NextToken,instanceInformationList);
            }
            else
            {
                successCallback(data.InstanceInformationList);
            }
            
            // if (data.NextToken == null){
            //     successCallback(data.InstanceInformationList);
            // }
            // else{
            //     let instanceInformationList = data.InstanceInformationList;
            //     data.InstanceInformationList.map((instance) => {
            //             instanceInformationList.push(instance);
            //         });
            //     getNextResults(data.NextToken,instanceInformationList);
            // }
        }
    )
    .catch(function(err){
        SSMActions.displayErrorMessage('Error retrieving instance details',err, err.stack);
    });
    
    
}

export function cognitoAuth(cognitoUsername, cognitoPassword, cognitoUserPoolId, cognitoIdentityPoolId , cognitoAppClientId, cognitoRegion, successCallback){
    
    var authenticationData = {
        Username : cognitoUsername, //'user1',
        Password : cognitoPassword //'P@55word2',
    };
    var authenticationDetails = new AuthenticationDetails(authenticationData);
    
    var poolData = {
        UserPoolId : cognitoUserPoolId, //'us-east-1_7E9fI4QPV', // Your user pool id here
        ClientId : cognitoAppClientId //'2ismdvu6g5ee0e4lgf9np00u23' // Your client id here
    };
    var userPool = new CognitoUserPool(poolData);
    
    var userData = {
        Username : cognitoUsername, //'user1',
        Pool : userPool
    };
    var cognitoUser = new CognitoUser(userData);
    
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            var aws_config = new Config; 
            const cognitoEndpoint = 'cognito-idp.' + cognitoRegion + '.amazonaws.com/' + cognitoUserPoolId;
            var loginsKey = {};
            loginsKey[cognitoEndpoint] = result.getIdToken().getJwtToken();
            aws_config.credentials = new CognitoIdentityCredentials({
                IdentityPoolId : cognitoIdentityPoolId, //'us-east-1:630c00ae-62c6-4012-b406-7ccbd5f96b4d', // your identity pool id here
                Logins : loginsKey
            },{region:cognitoRegion});
            
            
            
            //refreshes credentials using AWS.CognitoIdentity.getCredentialsForIdentity()
            aws_config.credentials.refresh((error) => {
                if (error) {
                     SSMActions.displayErrorMessage('Error in cognito auth',error, error.stack); 
                } else {
                     successCallback(aws_config.credentials, cognitoUsername, cognitoPassword, cognitoUserPoolId, cognitoIdentityPoolId , cognitoAppClientId, cognitoRegion);
                }
            });
        },

        onFailure: function(err) {
            SSMActions.displayErrorMessage('Error in cognito auth',err, err.stack); 
        },

    });
    
}

export function stsGetSessionToken(authDetails, region, successCallback){
    let sts = new STS({
        accessKeyId: authDetails.accessKeyId,
        secretAccessKey: authDetails.secretAccessKey,
        region
    });
    
    var params = {
      SerialNumber: authDetails.mfaSerial, 
      TokenCode: authDetails.mfaTokenCode
     };
    
    sts.getSessionToken(params, function(err, data) {
       if (err) SSMActions.displayErrorMessage('Error in MFA auth',err, err.stack); 
       else     successCallback(data);          // successful response
     });
}