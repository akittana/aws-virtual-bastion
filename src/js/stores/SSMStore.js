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
            secretAccessKey: "" 
        };
        this.isAuthenticated = false;
        this.settings = {
            ssmTimeout: 60,
            terminalShowHostname: true
        };
        
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
                this.authDetails['accessKeyId'] = action.authDetails.accessKey;
                this.authDetails['secretAccessKey'] = action.authDetails.secretAccessKey;
                
                awsSSM.init_ec2(this.authDetails['accessKeyId'], this.authDetails['secretAccessKey'],"us-east-1");
                this.isAuthenticated = true;
                this.loadRegions();
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
                awsSSM.init_ec2(this.authDetails['accessKeyId'], this.authDetails['secretAccessKey'],"us-east-1");
                this.loadRegions();
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
            
            
        }
    }
    
    isAuthenticated(){
        return this.isAuthenticated;
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
        awsSSM.listRegions( (regions) => {
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
    
    selectRegion(region){
        this.loadInstances(region);
        this.terminals[this.activeTerminalId].selectedRegion= region;
        this.emit("selected_region_changed");
    }
    
    loadInstances(region) {
        awsSSM.listInstances(this.authDetails['accessKeyId'], this.authDetails['secretAccessKey'], region, (instances) => {
            this.terminals[this.activeTerminalId].instancesList = {};
            instances.map((instance) => {
                this.terminals[this.activeTerminalId].instancesList[instance.instanceId] = {
                    selected: false,
                    commandStatus: null,
                    instanceTags: instance.instanceTags,
                    instanceDetails: instance.instanceDetails,
                    ssmEnabled: false,
                };
            });
            
            awsSSM.ssmDescribeInstanceInformation(this.authDetails['accessKeyId'], this.authDetails['secretAccessKey'], region, (ssmEnabledInstances) => {
            ssmEnabledInstances.map((instance) => {
                this.terminals[this.activeTerminalId].instancesList[instance.InstanceId].ssmEnabled = true;
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
        // this.terminals[this.activeTerminalId].selectedInstances = {};
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
        const successCallback = (data) => {
              if (data.StatusDetails == "Success") {
                  clearInterval(intervalLoop);
                  const instanceId = data.InstanceId;
                  
                  
                  //split output from Current Working Directory string (always at the end)
                  const terminalCWD = data.StandardOutputContent.split("terminalCWDTrackText")[1];
                  const commandOutput = data.StandardOutputContent.split("terminalCWDTrackText")[0];
                  
    
                  // update selected instance information with current working directory
                  if (terminalCWD) this.terminals[terminalId].selectedInstances[instanceId]["currentWorkingDirectory"] = terminalCWD;
                  
                  if (overrideSuccessCallback) {
                    overrideSuccessCallback(commandOutput.replace('\n',''));  
                    this.setCmdSuccessIcon(terminalId,instanceId);
                  } 
                  else {
                  this.terminals[terminalId].receivedTerminalOutput.push({
                       instanceId: instanceId,
                       commandOutput: commandOutput
                  }); 
                  this.setCmdSuccessIcon(terminalId,instanceId);
                  
                  this.emit("terminal_output_received");
                  }
              }
        };
        
        const errCallback = (err, instanceId) => {
                console.log("error",err);
                this.setCmdErrorIcon(this.activeTerminalId, instanceId);
            };
        
        
        var intervalLoop = setInterval(
            awsSSM.ssmGetCommandInvocation.bind(this,this.authDetails['accessKeyId'], this.authDetails['secretAccessKey'], commandId, instanceIds, this.terminals[this.activeTerminalId].selectedRegion,
           successCallback, errCallback )
           ,250);

    }
    
    ssmSendCommand(instances, region, activeTerminalId, command, overrideSuccessCallback ) {
        
        instances.map( (instanceId) => {
            
            const instanceCWD = this.terminals[activeTerminalId].selectedInstances[instanceId]['currentWorkingDirectory'];
            awsSSM.ssmSendCommand(this.authDetails['accessKeyId'], this.authDetails['secretAccessKey'], command, [instanceCWD], [instanceId] ,region, this.settings['ssmTimeout'],
                    (commandId, instanceIds) => {
                        
                        this.ssmWaitForCommandComplete(activeTerminalId, commandId,instanceIds, (overrideSuccessCallback == null) ? null : overrideSuccessCallback);
                    }, (err,instanceIds) => {
                        instanceIds.map((instanceId) => {
                            this.setCmdErrorIcon(this.activeTerminalId, instanceId);    
                        });
                        console.log(err);
                        
                    });
                    
            this.setCmdLoadingIcon(this.activeTerminalId,instanceId);
        });
        
    }
}

const ssmStore = new SSMStore;
dispatcher.register(ssmStore.handleActions.bind(ssmStore));


export default ssmStore;