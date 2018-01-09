import React from "react";
import Terminal from 'react-web-terminal';

import * as SSMActions from '../actions/SSMActions';
import SSMStore from '../stores/SSMStore';

import { Grid } from 'semantic-ui-react';

export default class SSMTerminal extends React.Component {
    
    constructor(){
        super();
        this.terminalShowHostname = SSMStore.getSettings()['terminalShowHostname'];
        this.processOutputReceived = this.processOutputReceived.bind(this);
        this.setFocus = this.setFocus.bind(this);
        this.commandHandler = this.commandHandler.bind(this);
    }
    
    componentWillMount(){
        SSMStore.on("terminal_output_received", this.processOutputReceived );
        SSMStore.on("settings_updated", () => {this.terminalShowHostname = SSMStore.getSettings()['terminalShowHostname'];} );
        
    }
    
    componentWillUnmount(){
        SSMStore.removeListener("terminal_output_received", this.processOutputReceived);
    }
    
    processOutputReceived(){
        
        let data;
        const terminalId = this.props.terminalId;
        
        data = SSMStore.getReceivedTerminalOutput(terminalId);
        while (data != undefined){
            const instanceId = data.instanceId;
            const instanceCWD = SSMStore.getInstanceCWD(terminalId, data.instanceId);
            const instanceHostname = SSMStore.getInstanceHostname(terminalId, data.instanceId);
            const platformType = data.platformType;
            
            this.terminalComponent.output( ((this.terminalShowHostname) ? instanceHostname : instanceId) + ((platformType == 'Linux')? ":": "|") + instanceCWD + ((platformType == 'Linux')? "$ ": "> ") + data.commandOutput);
            data = SSMStore.getReceivedTerminalOutput(terminalId);
        }
    }
    
    commandHandler(component) {
        const terminalId = this.props.terminalId;
        SSMActions.terminalSendCommand(terminalId, component.input(), 'y');
        
    }
    
    setFocus(){
        this.terminalComponent.focus();
    }
        
    render(){
        
        return(
           <Grid.Row stretched>  
             <Terminal commandHandler={this.commandHandler} prompt='~> ' ref={(component)=>{this.terminalComponent =component;}} />
           </Grid.Row>    
        );
    }
}