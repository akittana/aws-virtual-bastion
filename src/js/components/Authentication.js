import React from 'react';
import { Input, Button, Radio, Modal, Grid, Form, Accordion, Checkbox } from 'semantic-ui-react';

import * as SSMActions from '../actions/SSMActions';
import SSMStore from "../stores/SSMStore";

export default class Authentication extends React.Component {
  constructor(){
      super();
      this.state = {
          open: false,
          authOptionSelected: "iamUser",
          authDetails: SSMStore.getAuthDetails()
      };
      
      this.saveChanges = this.saveChanges.bind(this);
      this.handleTextChange = this.handleTextChange.bind(this);
      this.handleMfaChange = this.handleMfaChange.bind(this);
  }
  close = () => this.setState({ open: false })
  
  handleTextChange(e, {id, value}){
    let newAuthDetails = this.state.authDetails;
    if (id == "accessKeyIdInput") newAuthDetails['accessKeyId'] = value;
    else if (id == "secretAccessKeyInput") newAuthDetails['secretAccessKey'] = value;
    else if (id == "cognitoUsername") newAuthDetails['cognitoUsername'] = value;
    else if (id == "cognitoPassword") newAuthDetails['cognitoPassword'] = value;
    else if (id == "cognitoUserPoolId") newAuthDetails['cognitoUserPoolId'] = value;
    else if (id == "cognitoIdentityPoolId") newAuthDetails['cognitoIdentityPoolId'] = value;
    else if (id == "cognitoAppClientId") newAuthDetails['cognitoAppClientId'] = value;
    else if (id == "cognitoRegion") newAuthDetails['cognitoRegion'] = value;
    else if (id == "mfaSerial") newAuthDetails['mfaSerial'] = value;
    else if (id == "mfaTokenCode") newAuthDetails['mfaTokenCode'] = value;
    
    this.setState({authDetails: newAuthDetails});

  }
  
  handleMfaChange(){
    let newAuthDetails = this.state.authDetails;
    newAuthDetails['mfaEnabled'] = !this.state.authDetails['mfaEnabled'];
    if (newAuthDetails['mfaEnabled'] == true) this.setState({authOptionSelected:'iamUserMfa'});
    else this.setState({authOptionSelected:'iamUser'});
    this.setState({authDetails:newAuthDetails});
  }
  
  saveChanges(){
    SSMActions.setAuthDetails(this.state.authOptionSelected, this.state.authDetails);
    this.close();
  }
  
  render() {
    const { open, authOptionSelected } = this.state;
    
    const cognitoConfiguration = [<Form.Group key='cognitoGroup' widths='equal'> 
      <Form.Input size='mini' label='Cognito Region' key= 'cognitoRegion' id="cognitoRegion" type='text' placeholder='Cognito Region' disabled={authOptionSelected === "iamUser"}  onChange={this.handleTextChange} value={this.state.authDetails['cognitoRegion']} />
      <Form.Input size='mini' label='User Pool Id' key= 'cognitoUserPoolId' id="cognitoUserPoolId" type='text' placeholder='User Pool Id' disabled={authOptionSelected === "iamUser"}  onChange={this.handleTextChange} value={this.state.authDetails['cognitoUserPoolId']} />
      <Form.Input size='mini' label='Identity Pool Id' key= 'cognitoIdentityPoolId' id="cognitoIdentityPoolId" type='text' placeholder='Identity Pool Id' disabled={authOptionSelected === "iamUser"}  onChange={this.handleTextChange} value={this.state.authDetails['cognitoIdentityPoolId']} />
      <Form.Input size='mini' label='App Client Id' key= 'cognitoAppClientId' id="cognitoAppClientId" type='text' placeholder='App Client Id' disabled={authOptionSelected === "iamUser"}  onChange={this.handleTextChange} value={this.state.authDetails['cognitoAppClientId']} />
    </Form.Group>];
    
    const panels = [
      {
        title: 'Cognito Configuration',
        content: cognitoConfiguration,
      },
    ];
    
    return (
      <div>
        <Modal closeOnRootNodeClick={false} dimmer="inverted" open={open} onClose={this.close}>
          <Modal.Header>Authentication details</Modal.Header>
          <Modal.Content>
            <Modal.Description>
            </Modal.Description>

             <Grid.Row><Radio label="Acess Keys" value="iamUser" checked={authOptionSelected === "iamUser"} onChange={(e, { value }) => {this.setState({authOptionSelected:value})}} /></Grid.Row>
             &nbsp;
             <Grid.Row><Input id="accessKeyIdInput" type='text' placeholder='Access Key' style={{'width':'40%'}} disabled={authOptionSelected === "cognito"} onChange={this.handleTextChange} /></Grid.Row> 
             &nbsp;
             <Grid.Row><Input id="secretAccessKeyInput" type='password' placeholder='Secret Access Key' style={{'width':'60%'}} disabled={authOptionSelected === "cognito"} onChange={this.handleTextChange} /></Grid.Row>
             &nbsp;
             <Grid.Row>
             <Checkbox label="Multi-Factor Authentication (MFA)" id='enableMfa' disabled={authOptionSelected === "cognito"} checked={this.state.authDetails.mfaEnabled} onClick={this.handleMfaChange}/>
             &nbsp;&nbsp;&nbsp; <Input size='mini' id='mfaSerial' placeholder='MFA Serial/ARN' disabled={authOptionSelected === "cognito"} style={{display:(this.state.authDetails.mfaEnabled) ? null:'none'}} onChange={this.handleTextChange} />
             &nbsp;&nbsp;&nbsp; <Input size='mini' id='mfaTokenCode' placeholder='MFA Token Code' disabled={authOptionSelected === "cognito"} style={{display:(this.state.authDetails.mfaEnabled) ? null:'none'}} onChange={this.handleTextChange} />
             </Grid.Row>
             &nbsp;
             <Grid.Row><Radio label="Amazon Cognito" value="cognito" checked={authOptionSelected === "cognito"} onChange={(e, { value }) => {this.setState({authOptionSelected:value})}} /></Grid.Row>
             &nbsp;
             <Accordion as={Form} panels={panels} disabled={authOptionSelected === "iamUser"} />
             <Grid.Row><Input id="cognitoUsername" type='text' placeholder='Username' disabled={authOptionSelected === "iamUser"} style={{'width':'40%'}} onChange={this.handleTextChange} /></Grid.Row>
             &nbsp;
             <Grid.Row><Input id="cognitoPassword" type='password' placeholder='Password' disabled={authOptionSelected === "iamUser"} style={{'width':'40%'}} onChange={this.handleTextChange} /></Grid.Row>

          </Modal.Content>
          <Modal.Actions>
            <Button color='black' onClick={this.close}>
              Cancel
            </Button>
            <Button positive icon='checkmark' labelPosition='right' content="Save changes" onClick={this.saveChanges} />
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

