import React from "react";

import * as SSMActions from '../actions/SSMActions';

import SSMTerminal from "../components/SSMTerminal";

import { Tab, Message } from 'semantic-ui-react';


export default class Terminals extends React.Component {
    constructor(){
        super();
        this.terminalStyle = {'overflowY':'scroll','height':'85vh'};
        this.handleTabChange = this.handleTabChange.bind(this);

        
        this.newTerminalTab = { 
            menuItem: { key: 'newTerminal', icon: 'plus', content: 'New Terminal' }, 
            pane: {
            key: 'newTerminal',
            content: <Tab.Pane><Message negative>
              <Message.Header>Cannot create new terminals</Message.Header>
                <p>Tab limit was reached</p>
              </Message>
            </Tab.Pane> 
            }
        };
        
        this.state = {
            panes : []
        };
        
        this.terminalComponent;
        
    }
    
    componentWillMount(){
        this.createNewTab(0);
        
    }
    

    
    createNewTab(selectedTabIndex){
        const newTerminalId = 'Terminal ' + (selectedTabIndex +1);
        let currentPanes = this.state.panes;

        
        currentPanes.pop();
        currentPanes.push({ 
                menuItem: newTerminalId , 
                pane:{ 
                    key: newTerminalId ,
                    content: 
                        <Tab.Pane padded={false} style={this.terminalStyle} onClick={this.setTerminalFocus}>
                            <SSMTerminal key={newTerminalId} 
                            terminalId={newTerminalId}  />
                        </Tab.Pane> 
                    }
            });
        
        currentPanes.push(this.newTerminalTab);
        
        this.setState({panes:currentPanes});
        SSMActions.addNewTerminal(newTerminalId);
        
    }
    
    handleTabChange(event, data){
        let selectedTabIndex = data.activeIndex;
        
        // 5 tabs max allowed
        if (selectedTabIndex > 4) return;
        
        const selectedTerminalId = 'Terminal ' + (selectedTabIndex +1);
        
        if (data.panes[selectedTabIndex].menuItem.key == 'newTerminal') this.createNewTab(selectedTabIndex);
        
        SSMActions.changeTerminalTab(selectedTerminalId);
        
        
    }
    
    
    
    render(){
        
        return(
            <div>
                <Tab renderActiveOnly={false} onTabChange={this.handleTabChange} panes={this.state.panes} />
            </div>
        );
    }
}