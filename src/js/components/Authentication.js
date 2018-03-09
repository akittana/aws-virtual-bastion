import React from 'react';
import { Input, Button, Radio, Modal, Grid, Form, Accordion, Checkbox, 
         Dropdown, Message, Popup, Icon, List } from 'semantic-ui-react';
         
import * as SSMActions from '../actions/SSMActions';
import SSMStore from "../stores/SSMStore";

import parseINIString from "../Helpers/iniParser";


export default class Authentication extends React.Component {
  constructor(){
      super();
      this.state = {
          open: false,
          authOptionSelected: "iamUser",
          authDetails: SSMStore.getAuthDetails(),
          credProfiles: [],
          credProfilesAuthInfo: {},
          credProfilesError: false,
      };
      
      this.saveChanges = this.saveChanges.bind(this);
      this.handleTextChange = this.handleTextChange.bind(this);
      this.handleMfaChange = this.handleMfaChange.bind(this);
      this.handleFileSelect = this.handleFileSelect.bind(this);
      this.handleProfileSelect = this.handleProfileSelect.bind(this);
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
    console.log(this.state.authOptionSelected, this.state.authDetails);
    SSMActions.setAuthDetails(this.state.authOptionSelected, this.state.authDetails);
    this.close();
  }
  
  handleFileSelect(event){
    const file = event.target.files[0];
    let reader = new FileReader();
    reader.onload = (event) => {
      
    this.setState({credProfilesError:false});
    const profiles = parseINIString(event.target.result);
    
    if (!profiles || profiles === {}) return;
    
    
    let credProfiles = [];
    let credProfilesAuthInfo = {};
    Object.keys(profiles).map((key,index) => {
      if (!profiles[key].aws_access_key_id || !profiles[key].aws_secret_access_key) this.setState({credProfilesError:true});
      else{
        credProfiles.push({key:key,text:key,value:key});
        
        credProfilesAuthInfo[key] = {
          accessKeyId: profiles[key].aws_access_key_id,
          secretAccessKey: profiles[key].aws_secret_access_key
        };
      }
    });
    
    this.setState({
      credProfiles:credProfiles,
      credProfilesAuthInfo: credProfilesAuthInfo
    });
    
    };
    
    reader.readAsText(file);
  }
  
  handleProfileSelect(event, data){
    const selectedProfile = data.value;
    const accessKeyId = this.state.credProfilesAuthInfo[selectedProfile].accessKeyId;
    const secretAccessKey = this.state.credProfilesAuthInfo[selectedProfile].secretAccessKey;
    
    let newAuthDetails = this.state.authDetails;
    newAuthDetails['accessKeyId'] = accessKeyId;
    newAuthDetails['secretAccessKey'] = secretAccessKey;
    
    this.setState({authDetails: newAuthDetails});
  }
  render() {
    const { open, authOptionSelected, credProfiles, credProfilesError } = this.state;
    
    const cognitoConfiguration = [<Form.Group key='cognitoGroup' widths='equal'> 
      <Form.Input size='mini' label='Cognito Region' key= 'cognitoRegion' id="cognitoRegion" type='text' placeholder='Cognito Region' disabled={authOptionSelected !== "cognito"}  onChange={this.handleTextChange} value={this.state.authDetails['cognitoRegion']} />
      <Form.Input size='mini' label='User Pool Id' key= 'cognitoUserPoolId' id="cognitoUserPoolId" type='text' placeholder='User Pool Id' disabled={authOptionSelected !== "cognito"}  onChange={this.handleTextChange} value={this.state.authDetails['cognitoUserPoolId']} />
      <Form.Input size='mini' label='Identity Pool Id' key= 'cognitoIdentityPoolId' id="cognitoIdentityPoolId" type='text' placeholder='Identity Pool Id' disabled={authOptionSelected !== "cognito"}  onChange={this.handleTextChange} value={this.state.authDetails['cognitoIdentityPoolId']} />
      <Form.Input size='mini' label='App Client Id' key= 'cognitoAppClientId' id="cognitoAppClientId" type='text' placeholder='App Client Id' disabled={authOptionSelected !== "cognito"}  onChange={this.handleTextChange} value={this.state.authDetails['cognitoAppClientId']} />
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
             <Grid.Row><Radio label="Load credentials from file" value="credFile" checked={authOptionSelected === "credFile"} onChange={(e, { value }) => {this.setState({authOptionSelected:value})}} /></Grid.Row>
             &nbsp;
             <Grid.Row><Input type='file' onChange={this.handleFileSelect} disabled={authOptionSelected !== "credFile"}/>
             &nbsp;&nbsp;&nbsp;&nbsp;<Dropdown search selection disabled={credProfiles.length === 0} placeholder={credProfiles.length === 0? 'No profiles loaded':'Select profile'} options={credProfiles} onChange={this.handleProfileSelect}/>
             &nbsp;&nbsp;&nbsp;&nbsp;<Popup 
              trigger={<Icon size='large' size='small' name='info' color='blue' circular />}
              horizontalOffset={50}
              position='right center'
            >
            <Popup.Content>
             <div>
             AWS CLI tool stores credentials specified with aws configure in a local file named credentials in a folder named .aws in your home directory
             &nbsp;
              <List>
               <List.Item key={'linux'} > <b>{"On Linux/MacOS:  "}</b> {"~/.aws/credentials"} </List.Item>
               <List.Item key={'windows'} > <b>{"On Windows: "}</b> {"%UserProfile%\\.aws\\credentials" } </List.Item>
              </List>
             </div>
            </Popup.Content>
            </Popup>
             &nbsp;&nbsp;&nbsp;&nbsp;<Message color='red' style={{display: (credProfilesError) ? null: 'none'}} >Invalid File Format</Message>
             </Grid.Row>
             &nbsp;  
             <Grid.Row><Radio label="Acess Keys" value="iamUser" checked={authOptionSelected === "iamUser" || authOptionSelected === "iamUserMfa"} onChange={(e, { value }) => {this.setState({authOptionSelected:value})}} /></Grid.Row>
             &nbsp;
             <Grid.Row><Input id="accessKeyIdInput" type='text' placeholder='Access Key' style={{'width':'40%'}} disabled={authOptionSelected !== "iamUser" && authOptionSelected !== "iamUserMfa"} onChange={this.handleTextChange} /></Grid.Row> 
             &nbsp;
             <Grid.Row><Input id="secretAccessKeyInput" type='password' placeholder='Secret Access Key' style={{'width':'60%'}} disabled={authOptionSelected !== "iamUser" && authOptionSelected !== "iamUserMfa"} onChange={this.handleTextChange} /></Grid.Row>
             &nbsp;
             <Grid.Row>
             <Checkbox label="Multi-Factor Authentication (MFA)" id='enableMfa' disabled={authOptionSelected !== "iamUser" && authOptionSelected !== "iamUserMfa"} checked={this.state.authDetails.mfaEnabled} onClick={this.handleMfaChange}/>
             &nbsp;&nbsp;&nbsp; <Input size='mini' id='mfaSerial' placeholder='MFA Serial/ARN' disabled={authOptionSelected !== "iamUser" && authOptionSelected !== "iamUserMfa"} style={{display:(this.state.authDetails.mfaEnabled) ? null:'none'}} onChange={this.handleTextChange} />
             &nbsp;&nbsp;&nbsp; <Input size='mini' id='mfaTokenCode' placeholder='MFA Token Code' disabled={authOptionSelected !== "iamUser" && authOptionSelected !== "iamUserMfa"} style={{display:(this.state.authDetails.mfaEnabled) ? null:'none'}} onChange={this.handleTextChange} />
             </Grid.Row>
             &nbsp;
             <Grid.Row><Radio label="Amazon Cognito" value="cognito" checked={authOptionSelected === "cognito"} onChange={(e, { value }) => {this.setState({authOptionSelected:value})}} /></Grid.Row>
             &nbsp;
             <Accordion as={Form} panels={panels} disabled={authOptionSelected !== "cognito"} />
             <Grid.Row><Input id="cognitoUsername" type='text' placeholder='Username' disabled={authOptionSelected !== "cognito"} style={{'width':'40%'}} onChange={this.handleTextChange} /></Grid.Row>
             &nbsp;
             <Grid.Row><Input id="cognitoPassword" type='password' placeholder='Password' disabled={authOptionSelected !== "cognito"} style={{'width':'40%'}} onChange={this.handleTextChange} /></Grid.Row>

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

