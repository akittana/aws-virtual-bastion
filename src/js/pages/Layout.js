import React from "react";
import {Container, Grid, Segment, Button} from 'semantic-ui-react';

import Instances from "./Instances";
import Terminals from "./Terminals";
import Settings from "../components/Settings";
import Authentication from "../components/Authentication";
import ErrorMessage from "../components/ErrorMessage";

import SSMStore from '../stores/SSMStore';
import * as SSMActions from '../actions/SSMActions';

export default class Layout extends React.Component {
    
  constructor(){
      super();
      this.showSettingsModal = this.showSettingsModal.bind(this);
      this.showAuthModal = this.showAuthModal.bind(this);
      this.showErrorMessage = this.showErrorMessage.bind(this);
      this.state = {
        errorMessages: []
      };
  }
  
  componentWillMount(){
        SSMStore.on("error_message_received", this.showErrorMessage );
  }
  
  showErrorMessage(){
    let newMessage = SSMStore.getErrorMessages();
    while (newMessage != null){
      let newErrorMessages = this.state.errorMessages;
      newErrorMessages.push(<ErrorMessage key={Date.now()} errorHeader={newMessage.errorHeader} errorMessage={newMessage.errorMessage.code + " : " + newMessage.errorMessage.message}/>);
      this.setState({errorMessage:newErrorMessages});
      newMessage = SSMStore.getErrorMessages();
    }
  }
  
  showSettingsModal(){
    this.settingsModal.setState({open:true});
  }   
  
  showAuthModal(){
    this.authModal.setState({open:true});
  }   
  
  render() {
    const style = {'overflowY':'auto'};
    return (
         
      <Container fluid>
       <Settings ref={(settings) => {this.settingsModal = settings;}}/>
       <Authentication ref={(authentication) => {this.authModal = authentication;}}/>
       <Grid >    
        
        <Grid.Column width={4} style={{'height':'100vh', 'overflowY':'auto'}}>
          <Segment >
                  <Instances />
          </Segment>
          
          <Grid.Column width={2}>
          <Button primary style={{'width':'100%'}} onClick={this.showAuthModal}>Authenticate</Button>
          </Grid.Column>
          <br></br>
          <Grid.Column width={2}>
          <Button secondary style={{'width':'100%'}} onClick={this.showSettingsModal}>Settings</Button>
          </Grid.Column>
          <Grid.Column width={4}>
            &nbsp;
            {this.state.errorMessages}
          </Grid.Column>
          
        </Grid.Column>
        
        <Grid.Column width = {12}>
                <Terminals />
        </Grid.Column>
       
       </Grid>
      </Container>

    );
  }
}