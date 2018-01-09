import EC2 from 'aws-sdk/clients/ec2';
import SSM from 'aws-sdk/clients/ssm';

var ec2 = {};


export function init_ec2(accessKeyId, secretAccessKey, region){
    ec2[region] = new EC2({
    accessKeyId,
    secretAccessKey,
    region
});
}

// init_ec2("us-east-1");

export function listInstances(accessKeyId, secretAccessKey, region,callback){
    
    if (!ec2[region]) {init_ec2(accessKeyId, secretAccessKey, region);}
    var instances = [];
    
    ec2[region].describeInstances(function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else {
          
          data.Reservations.map((instance) => {
              
              // extract Name tag from list of tags
              let instanceName = "";
              instance.Instances[0].Tags.map((tag) => {
                  if (tag['Key'] == 'Name') instanceName = tag['Value'];
              });
              
              instances.push({
                  instanceId: instance.Instances[0].InstanceId,
                  instanceTags: instance.Instances[0].Tags,
                  instanceDetails: {
                      Name: instanceName,
                      imageId: instance.Instances[0].ImageId,
                      instanceType: instance.Instances[0].InstanceType,
                      privateIpAddress: instance.Instances[0].PrivateIpAddress,
                  }
                  
              });
          });
          
          callback(instances);
      }          
    });
    
}

export function listRegions(callback){
    var regions = [];
    ec2["us-east-1"].describeRegions(function(err, data) {
       if (err) console.log(err, err.stack); // an error occurred
       else {
           data.Regions.map((region) => {
               regions.push(region.RegionName);
           });
           callback(regions);
       }
        
    });
}

export function ssmSendCommand(accessKeyId, secretAccessKey, command,workingDirectory,instanceId, platformType, region, cmdTimeOut, successCallback, errCallback){
    
   
    var commandId = '';
    // var instanceIds = [];
    
    var ssm = new SSM({
        accessKeyId,
        secretAccessKey,
        region
    });
        
    const params = {
        // DocumentName: "AWS-RunShellScript",
        DocumentName: (platformType == 'Linux' ? "AWS-RunShellScript": "AWS-RunPowerShellScript"),
        InstanceIds: instanceId,
        Parameters: {
            'commands': [command, (platformType == 'Linux' ? "echo terminalCWDTrackText`pwd`terminalCWDTrackText": "echo terminalCWDTrackText;pwd | Write-Host;echo terminalCWDTrackText")],
            'workingDirectory': workingDirectory
        },
        TimeoutSeconds: cmdTimeOut
    };
    
    ssm.sendCommand(params, (err,data) => {
        if (err) errCallback(err.stack, instanceId); // an error occurred
        else {
            commandId = data.Command.CommandId;
            instanceId = data.Command.InstanceIds;
            successCallback(commandId,instanceId);
        }
        
    });
    
}

export function ssmGetCommandInvocation(accessKeyId, secretAccessKey, commandId, instanceIds,region, successCallback, errCallback){
   
   
    var ssm = new SSM({
        accessKeyId,
        secretAccessKey,
        region
    });
    

    instanceIds.map((instanceId) => {
        const params = {
          CommandId: commandId, 
          InstanceId: instanceId
        };  
        
        ssm.getCommandInvocation(params, function(err, data) {
          if (err) errCallback(err,instanceId); // an error occurred
          else     successCallback(data);           // successful response
        });
    });
}

export function ssmDescribeInstanceInformation(accessKeyId, secretAccessKey, region, successCallback){
    var ssm = new SSM({
        accessKeyId,
        secretAccessKey,
        region
    });
    
    const params = {};
    
    ssm.describeInstanceInformation(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     successCallback(data.InstanceInformationList);           // successful response
    });
}