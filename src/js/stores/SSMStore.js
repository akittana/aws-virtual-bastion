import { EventEmitter } from 'events';

import dispatcher from "../dispatcher";
import * as awsSSM from '../awsSSM';


class SSMStore extends EventEmitter {
    constructor() {
        super();
        this.regions = [];
        this.selectedRegion = "";
        this.terminals = {"Terminal 1": {
                    selectedRegion: "",
                    instancesList: {},
                    selectedInstances: {},
                    receivedTerminalOutput: []
                }};
        this.activeTerminalId = "Terminal 1";
        this.authDetails = {
            mode: "",
            accessKeyId: "", 
            secretAccessKey: "",
            mfaEnabled: false,
            mfaSerial: "",
            mfaTokenCode: "",
            credentialsObject: null,
            cognitoUsername: "", 
            cognitoPassword:"", 
            cognitoUserPoolId: "", //"us-east-1_7E9fI4QPV", 
            cognitoIdentityPoolId:"", //"us-east-1:630c00ae-62c6-4012-b406-7ccbd5f96b4d", 
            cognitoAppClientId:"", //"2ismdvu6g5ee0e4lgf9np00u23", 
            cognitoRegion:"", //"us-east-1"
        };
        this.isAuthenticated = false;
        this.settings = {
            ssmTimeout: 60,
            terminalShowHostname: true,
            logToS3: false,
            logBucketName: "",
            logS3KeyPrefix: ""
        };
        this.errorMessages = [];
        
        this.getSettings = this.getSettings.bind(this);
    }
    
    handleActions(action) {
        switch(action.type) {
            
            case "UPDATE_SETTINGS": {
                this.settings = action.newSettings;
                break;
            }
            
            case "SET_AUTHENTICATION_DETAILS": {
                this.authDetails['mode'] = action.mode;
                if (this.authDetails['mode'] == 'iamUser' || this.authDetails['mode'] == 'credFile')
                {
                    this.authDetails['mode'] = 'iamUser'; // this is to override the settings if it was set to credFile
                    this.authDetails['accessKeyId'] = action.authDetails.accessKeyId;
                    this.authDetails['secretAccessKey'] = action.authDetails.secretAccessKey;
                    
                    this.isAuthenticated = true;
                    this.loadRegions();
                }
                else if (this.authDetails['mode'] == 'iamUserMfa') {
                    awsSSM.stsGetSessionToken(this.authDetails, 'us-east-1', (data) => {
                        this.authDetails['credentialsObject'] = data.Credentials;
                        this.isAuthenticated = true;
                        this.loadRegions();
                    });
                    
                }
                else if (this.authDetails['mode'] == 'cognito'){
                    const { cognitoUsername, cognitoPassword, cognitoUserPoolId, cognitoIdentityPoolId , cognitoAppClientId, cognitoRegion } = action.authDetails;
                    this.authDetails.mode = 'cognito';
                    awsSSM.cognitoAuth(cognitoUsername, cognitoPassword, cognitoUserPoolId, cognitoIdentityPoolId , cognitoAppClientId, cognitoRegion, 
                    (credentialsObject) => {
                        
                        if (credentialsObject){
                            this.authDetails.credentialsObject = credentialsObject; 
                            this.authDetails.cognitoUsername = cognitoUsername;
                            this.authDetails.cognitoPassword = cognitoPassword;
                            this.authDetails.cognitoUserPoolId = cognitoUserPoolId;
                            this.authDetails.cognitoIdentityPoolId = cognitoIdentityPoolId;
                            this.authDetails.cognitoAppClientId = cognitoAppClientId;
                            this.authDetails.cognitoRegion = cognitoRegion;
                            
                            
                            this.isAuthenticated = true;
                            this.loadRegions();
                        }
                    });
                }
                break;
            }
        
            case "LOAD_INSTANCES": {
                this.loadInstances(action.region);
                break;
            }
            
            case "SELECT_REGION": {
                this.selectRegion(action.region);
                break;
            }
            
            case "TOGGLE_SELECTED": {
                this.toggleInstanceSelected(action.id);
                break;
            }
            
            case "LOAD_REGIONS": {
                // awsSSM.init_ec2(this.authDetails['accessKeyId'], this.authDetails['secretAccessKey'],"us-east-1");
                this.loadRegions();
                break;
            }
            
            case "REFRESH_INSTANCES": {
                if (this.terminals[this.activeTerminalId].selectedRegion){
                    this.emit("refresh_instances_loading");
                    const selectedRegion = this.terminals[this.activeTerminalId].selectedRegion;
                    this.loadInstances(selectedRegion);
                }
                break;
            }
            
            case "TERMINAL_SEND_COMMAND": {
                
                const selectedRegion = this.terminals[this.activeTerminalId].selectedRegion;
                const terminalId = action.terminalId; 
                
                let instances = [];
                Object.keys(this.terminals[terminalId].selectedInstances).map((key, index) => {
                    const instanceId = key;
                    instances.push(instanceId);
                    
                });
                
                this.ssmSendCommand(instances, selectedRegion, terminalId, action.command, null );
                
                
                break;
            }
            
            case "ADD_NEW_TERMINAL": {
                if (this.terminals[action.terminalId]) break;
                this.terminals[action.terminalId] = {
                    selectedRegion: "",
                    instancesList: {},
                    selectedInstances: {},
                    receivedTerminalOutput: []
                };
                break;
            }
            
            case "CHANGE_TERMINAL_TAB": {
                // set active terminal to current terminal tab
                this.activeTerminalId = action.terminalId;
                this.emit("clear_search");
                this.emit("selected_region_changed");
                this.emit("instances_changed");
                break;
            }
            
            case "ERROR_MESSAGE": {
                this.displayErrorMessage(action.errorHeader, action.errorMessage, action.errorDetailed);
                
                break;
            }
            
            
        }
    }
    
    displayErrorMessage(errorHeader, errorMessage, errorDetailed ){
        this.errorMessages.push({
                    errorHeader,
                    errorMessage,
                    errorDetailed
                });
        this.emit("error_message_received");
    }
    
    isAuthenticated(){
        return this.isAuthenticated;
    }
    
    getAuthDetails(){
        return this.authDetails;
    }
    
    setCmdLoadingIcon(terminalId, instanceId){
        this.terminals[terminalId].instancesList[instanceId].commandStatus = "loading";
        this.emit("instances_changed");
        
    }
    
    setCmdSuccessIcon(terminalId, instanceId){
        this.terminals[terminalId].instancesList[instanceId].commandStatus = "success";
        this.emit("instances_changed");
    }
    
    setCmdErrorIcon(terminalId, instanceId) {
        this.terminals[terminalId].instancesList[instanceId].commandStatus = "error";
        this.emit("instances_changed");
    }
    
    clearCmdIcon(terminalId, instanceId){
        this.terminals[terminalId].instancesList[instanceId].commandStatus = "";
        this.emit("instances_changed");
    }
    
    loadRegions() {
        this.regions = [];
        awsSSM.listRegions( this.authDetails,(regions) => {
            regions.map((region) => {this.regions.push(region);});
            this.emit("regions_updated");
        });
        
        
    }
    
    getSettings(){
        return this.settings;
    }
    
    getRegions(){
        return this.regions;
    }
    
    getInstances() {
        return this.terminals[this.activeTerminalId].instancesList;
    }
    
    getSelectedRegion(){
        return this.terminals[this.activeTerminalId].selectedRegion;
    }
    
    getReceivedTerminalOutput(terminalId){
        return this.terminals[terminalId].receivedTerminalOutput.pop();
    }
    
    getErrorMessages(){
        return this.errorMessages.pop();
    }
    
    selectRegion(region){
        this.loadInstances(region);
        this.terminals[this.activeTerminalId].selectedRegion= region;
        this.emit("selected_region_changed");
    }
    
    loadInstances(region) {
        awsSSM.listInstances(this.authDetails, region, (instances) => {
            this.terminals[this.activeTerminalId].instancesList = {};
            instances.map((instance) => {
                this.terminals[this.activeTerminalId].instancesList[instance.instanceId] = {
                    selected: false,
                    commandStatus: null,
                    instanceTags: instance.instanceTags,
                    instanceDetails: instance.instanceDetails,
                    ssmEnabled: false,
                    platformType: "",
                };
            });
            
            
            
            awsSSM.ssmDescribeInstanceInformation(this.authDetails, region, 
            (ssmEnabledInstances) => {
                
                ssmEnabledInstances.map((instance) => {
                    this.terminals[this.activeTerminalId].instancesList[instance.InstanceId].ssmEnabled = true;
                    this.terminals[this.activeTerminalId].instancesList[instance.InstanceId].platformType = instance.PlatformType;
            });
            
            this.emit("instances_changed");
            
        });
        
        });
        
        
        
        
    }
    
    updateInstanceHostname(instanceId){
        const selectedRegion = this.terminals[this.activeTerminalId].selectedRegion;
        this.ssmSendCommand([instanceId], selectedRegion, this.activeTerminalId, 'hostname', (commandOutput) => {
            this.terminals[this.activeTerminalId].selectedInstances[instanceId]['hostname'] = commandOutput;
        });
        
    }
    
    toggleInstanceSelected(instanceId){
        this.terminals[this.activeTerminalId].instancesList[instanceId]['selected'] = !this.terminals[this.activeTerminalId].instancesList[instanceId]['selected'];
        if (!this.terminals[this.activeTerminalId].instancesList[instanceId]['selected']) this.clearCmdIcon(this.activeTerminalId, instanceId);
        this.emit("instances_changed");
        this.updateSelectedInstances();
        
    }
    
    updateSelectedInstances(){
        
        Object.keys(this.terminals[this.activeTerminalId].instancesList).map((key, index) => {
           const instanceId = key;
           if (this.terminals[this.activeTerminalId].instancesList[key]["selected"]) {
             if (!this.terminals[this.activeTerminalId].selectedInstances[instanceId]){  
                 this.terminals[this.activeTerminalId].selectedInstances[instanceId] = {
                   currentWorkingDirectory: "/",
                   hostname: ""
                 };
             this.updateInstanceHostname(instanceId);    
                 
             }
           }
           else if (!this.terminals[this.activeTerminalId].instancesList[key]["selected"]) {
               if (this.terminals[this.activeTerminalId].selectedInstances[instanceId]) {
                   delete this.terminals[this.activeTerminalId].selectedInstances[instanceId];
               }
           }
          });
          
    }
    
    getInstanceCWD(terminalId, instanceId){
        // CWD is tracked for selected instnaces only
        return this.terminals[terminalId].selectedInstances[instanceId]['currentWorkingDirectory'];
    }
    
    getInstanceHostname(terminalId, instanceId){
        return this.terminals[terminalId].selectedInstances[instanceId]['hostname'];
    }
    
    ssmWaitForCommandComplete(terminalId, commandId, instanceIds, overrideSuccessCallback){
        const intervalPeriod = 250; // Interval in ms
        
        let timeWaited = 0;
        const successCallback = (data) => {
            timeWaited += intervalPeriod;
            
            const instanceId = data.InstanceId;
              if (data.StatusDetails == "Success") {
                  clearInterval(intervalLoop);

                  //split output from Current Working Directory string (always at the end)
                  let terminalCWD = null;
                  let commandOutput = null;
                  if (data.StandardOutputContent.includes("terminalCWDTrackText")) {
                  terminalCWD = data.StandardOutputContent.split("terminalCWDTrackText")[1].replace(/\n/g,'').replace(/\s/g,''); // replace all occurences of newline and whitespace
                  commandOutput = data.StandardOutputContent.split("terminalCWDTrackText")[0];
                  }
                  else {
                      commandOutput = data.StandardOutputContent;
                      this.displayErrorMessage("Error in changing working directory",{code:"Error:",message:"Output too long"},null);

                  }
                  
                  const platformType = this.terminals[terminalId].instancesList[instanceId]['platformType'];
    
                  // update selected instance information with current working directory
                  if (terminalCWD) this.terminals[terminalId].selectedInstances[instanceId]["currentWorkingDirectory"] = terminalCWD;
                  
                  if (overrideSuccessCallback) {
                    overrideSuccessCallback(commandOutput.replace('\n',''));  
                    this.setCmdSuccessIcon(terminalId,instanceId);
                  } 
                  else {
                  this.terminals[terminalId].receivedTerminalOutput.push({
                       instanceId: instanceId,
                       platformType: platformType,
                       commandOutput: commandOutput
                  }); 
                  this.setCmdSuccessIcon(terminalId,instanceId);
                  
                  this.emit("terminal_output_received");
                  }
              }
              else {
                  if (data.StatusDetails != "InProgress"){
                      
                      this.displayErrorMessage("Error in receiving command output",{code:"Command Status",message:data.StatusDetails},null);
                      clearInterval(intervalLoop);
                      this.setCmdErrorIcon(this.activeTerminalId,instanceId);
                  }
                  
                  if (timeWaited > (this.settings.ssmTimeout * 1000)) {
                      this.displayErrorMessage("Error in receiving command output",{code:"Command Status",message:"Timed out"},null);
                      clearInterval(intervalLoop);
                      this.setCmdErrorIcon(this.activeTerminalId,instanceId);
                  }
              }
        };
        
        const errCallback = (err, instanceId) => {
                this.displayErrorMessage('Error getting command output',err, err.stack);
                this.setCmdErrorIcon(this.activeTerminalId, instanceId);
            };
        
        var intervalLoop = setInterval(
            awsSSM.ssmGetCommandInvocation.bind(this,this.authDetails, commandId, instanceIds, this.terminals[this.activeTerminalId].selectedRegion,
           successCallback, errCallback )
           ,intervalPeriod);
    }
    
    ssmSendCommand(instances, region, activeTerminalId, command, overrideSuccessCallback ) {
        
        instances.map( (instanceId) => {
            
            const instanceCWD = this.terminals[activeTerminalId].selectedInstances[instanceId]['currentWorkingDirectory'];
            const platformType = this.terminals[this.activeTerminalId].instancesList[instanceId]['platformType'];
            awsSSM.ssmSendCommand(this.authDetails, command, [instanceCWD], [instanceId], platformType, region, this.settings,
                    (commandId, instanceIds) => {
                        
                        this.ssmWaitForCommandComplete(activeTerminalId, commandId,instanceIds, (overrideSuccessCallback == null) ? null : overrideSuccessCallback);
                    }, (err,instanceIds) => {
                        instanceIds.map((instanceId) => {
                            this.setCmdErrorIcon(this.activeTerminalId, instanceId);    
                        });
                        this.displayErrorMessage('Error sending command',err, err.stack);
                        
                    });
                    
            this.setCmdLoadingIcon(this.activeTerminalId,instanceId);
        });
        
    }
}

const ssmStore = new SSMStore;
dispatcher.register(ssmStore.handleActions.bind(ssmStore));


export default ssmStore;