import React from 'react';
import { Input, Button, Radio, Modal, Grid } from 'semantic-ui-react';

import SSMStore from "../stores/SSMStore";
import * as SSMActions from '../actions/SSMActions';


export default class Settings extends React.Component {
  constructor(){
      super();
      this.state = {
          open: false,
          settings: SSMStore.getSettings()
      };
      
      this.handleTextChange = this.handleTextChange.bind(this);
      this.handleRadioChange = this.handleRadioChange.bind(this);
      this.saveSettings = this.saveSettings.bind(this);
      
  }
  
  handleTextChange(e, {id, value}){
    let newSettings = this.state.settings;
    if (id == "ssmTimeout") newSettings['ssmTimeout'] = value;
    this.setState({settings: newSettings});
    
  }
  
  handleRadioChange(e, {id, checked}){
    let newSettings = this.state.settings;
    newSettings['terminalShowHostname'] = !checked;
    this.setState({settings: newSettings});

  }
  
  saveSettings(){
    const { settings } = this.state; 
    SSMActions.updateSettings(settings);

    SSMStore.emit("settings_updated");
    
    this.close();
  }
  
  close = () => {
   
    this.setState({ open: false })
  }

  render() {
    const { open } = this.state;

    return (
      <div>
        <Modal closeOnRootNodeClick={false} dimmer="inverted" open={open} onClose={this.close}>
          <Modal.Header>Settings</Modal.Header>
          <Modal.Content>
            <Modal.Description>
                <Grid.Row>Command Timeout  <Input id='ssmTimeout' type='number' onChange={this.handleTextChange} value={this.state.settings['ssmTimeout']} /></Grid.Row>
                &nbsp;
                <Grid.Row><Radio toggle label="Enable Logging" disabled/></Grid.Row>
                &nbsp;
                <Grid.Row><Radio toggle label="Show hostname in prompt" checked={this.state.settings['terminalShowHostname']} 
                  id= 'terminalShowHostname' onMouseDown={this.handleRadioChange} /></Grid.Row>

            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button color='black' onClick={this.close}>
              Cancel
            </Button>
            <Button positive icon='checkmark' labelPosition='right' content="Save changes" onClick={this.saveSettings} />
          </Modal.Actions>
        </Modal>
      </div>
    )
  }
}

