import React from "react";
import Terminal from 'react-web-terminal';

import * as SSMActions from '../actions/SSMActions';
import SSMStore from '../stores/SSMStore';

import { Grid } from 'semantic-ui-react';

export default class SSMTerminal extends React.Component {
    
    constructor(){
        super();
        
        this.state = {
          commandLog: [],
          currentLineInLog: 0
        };
        
        this.terminalShowHostname = SSMStore.getSettings()['terminalShowHostname'];
        this.processOutputReceived = this.processOutputReceived.bind(this);
        this.setFocus = this.setFocus.bind(this);
        this.commandHandler = this.commandHandler.bind(this);
        this.handleArrowUp = this.handleArrowUp.bind(this);
        this.handleArrowDown = this.handleArrowDown.bind(this);
        this.resetInputBuffer = this.resetInputBuffer.bind(this);
        this.insertInputText = this.insertInputText.bind(this);
    }
    
    componentWillMount(){
        SSMStore.on("terminal_output_received", this.processOutputReceived );
        SSMStore.on("settings_updated", () => {this.terminalShowHostname = SSMStore.getSettings()['terminalShowHostname'];} );
        
    }
    
    componentWillUnmount(){
        SSMStore.removeListener("terminal_output_received", this.processOutputReceived);
    }
    
    resetInputBuffer(){
        this.terminalComponent.inputComp.buffer.resetInputBuffer();
    }
    
    insertInputText(text){
        this.terminalComponent.inputComp.buffer.insertText(text);
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
        let currentCommandLog = this.state.commandLog;
        const terminalId = this.props.terminalId;
        SSMActions.terminalSendCommand(terminalId, component.input(), 'y');
        currentCommandLog.push(component.input());
        this.resetInputBuffer();
        
        this.setState({
            commandLog:currentCommandLog,
            currentLineInLog: (currentCommandLog.length - 1)
        });
    }
    
    setFocus(){
        this.terminalComponent.focus();
    }
    
    handleArrowUp(){
        let currentLineInLog = this.state.currentLineInLog;
        if (currentLineInLog == this.state.commandLog.length) currentLineInLog--;
        
        const lastCommandInHistoryBuffer = this.state.commandLog[currentLineInLog];
        this.resetInputBuffer();
        this.insertInputText(lastCommandInHistoryBuffer);
        if (currentLineInLog > 0) this.setState({currentLineInLog: (currentLineInLog - 1)});
    }
    
    handleArrowDown(){
        let currentLineInLog = this.state.currentLineInLog;
        if (currentLineInLog == 0) currentLineInLog++;
        
        if (currentLineInLog == (this.state.commandLog.length)) {
            this.resetInputBuffer();
            this.insertInputText("");
            return;
        }
        
        const lastCommandInHistoryBuffer = this.state.commandLog[currentLineInLog];
        this.resetInputBuffer();
        this.insertInputText(lastCommandInHistoryBuffer);
        if (currentLineInLog < (this.state.commandLog.length)) this.setState({currentLineInLog: (currentLineInLog + 1)});
        
    }
        
    render(){
        
        return(
           <Grid.Row stretched>  
             <Terminal 
                commandHandler={this.commandHandler} prompt='$ ' 
                ref={(component)=>{this.terminalComponent =component;}} 
                keyStrokeMap={{
                    'ArrowUp': this.handleArrowUp,
                    'ArrowDown': this.handleArrowDown
                }}/>
           </Grid.Row>    
        );
    }
}