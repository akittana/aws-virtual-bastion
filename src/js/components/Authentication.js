import React from 'react';
import { Input, Button, Radio, Modal, Grid } from 'semantic-ui-react';

import * as SSMActions from '../actions/SSMActions';

export default class Authentication extends React.Component {
  constructor(){
      super();
      this.state = {
          open: false,
          authOptionSelected: "accessKey",
          authDetails: {}
      };
      
      this.saveChanges = this.saveChanges.bind(this);
      this.handleTextChange = this.handleTextChange.bind(this);
  }
  close = () => this.setState({ open: false })
  
  handleTextChange(e, {id, value}){
    let newAuthDetails = this.state.authDetails;
    if (id == "accessKeyInput") newAuthDetails['accessKey'] = value;
    else if (id == "secretAccessKeyInput") newAuthDetails['secretAccessKey'] = value;
    
    this.setState({authDetails: newAuthDetails});
    
  }
  
  saveChanges(){
    SSMActions.setAuthDetails(this.state.authOptionSelected, this.state.authDetails);
    this.close();
  }
  
  render() {
    const { open, authOptionSelected } = this.state;

    return (
      <div>
        <Modal closeOnRootNodeClick={false} dimmer="inverted" open={open} onClose={this.close}>
          <Modal.Header>Authentication details</Modal.Header>
          <Modal.Content>
            <Modal.Description>
            </Modal.Description>

             <Grid.Row><Radio label="Acess Keys" value="accessKey" checked={authOptionSelected === "accessKey"} onChange={(e, { value }) => {this.setState({authOptionSelected:value})}} /></Grid.Row>
             &nbsp;
             <Grid.Row><Input id="accessKeyInput" type='text' placeholder='Access Key' style={{'width':'40%'}} disabled={authOptionSelected === "cognito"} onChange={this.handleTextChange} /></Grid.Row> 
             &nbsp;
             <Grid.Row><Input id="secretAccessKeyInput" type='password' placeholder='Secret Access Key' style={{'width':'60%'}} disabled={authOptionSelected === "cognito"} onChange={this.handleTextChange} /></Grid.Row>
             &nbsp;
             <Grid.Row><Radio disabled label="Amazon Cognito" value="cognito" checked={authOptionSelected === "cognito"} onChange={(e, { value }) => {this.setState({authOptionSelected:value})}} /></Grid.Row>
             &nbsp;
             <Grid.Row><Input type='text' placeholder='Username' disabled={authOptionSelected === "accessKey"} style={{'width':'40%'}} /></Grid.Row>
             &nbsp;
             <Grid.Row><Input type='password' placeholder='Password' disabled={authOptionSelected === "accessKey"} style={{'width':'40%'}} /></Grid.Row>

          </Modal.Content>
          <Modal.Actions>
            <Button color='black' onClick={this.close}>
              Cancel
            </Button>
            <Button positive icon='checkmark' labelPosition='right' content="Save changes" onClick={this.saveChanges} />
          </Modal.Actions>
        </Modal>
      </div>
    )
  }
}

