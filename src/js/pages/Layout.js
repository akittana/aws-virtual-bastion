import React from "react";
import {Container, Grid, Segment, Button, Icon} from 'semantic-ui-react';

import Instances from "./Instances";
import Terminals from "./Terminals";
import Settings from "../components/Settings";
import Authentication from "../components/Authentication";

export default class Layout extends React.Component {
    
  constructor(){
      super();
      this.showSettingsModal = this.showSettingsModal.bind(this);
      this.showAuthModal = this.showAuthModal.bind(this);
  }   
  
  showSettingsModal(){
    this.settingsModal.setState({open:true});
  }   
  
  showAuthModal(){
    this.authModal.setState({open:true});
  }   
  
  render() {
    return (
         
      <Container fluid>
       <Settings ref={(settings) => {this.settingsModal = settings;}}/>
       <Authentication ref={(authentication) => {this.authModal = authentication;}}/>
       <Grid >    
        
        <Grid.Column width={4}>
          <Segment>
                  <Instances />
          </Segment>
          
          <Grid.Column width={2}>
          <Button primary style={{'width':'100%'}} onClick={this.showAuthModal}>Authenticate</Button>
          </Grid.Column>
          <br></br>
          <Grid.Column width={2}>
          <Button secondary style={{'width':'100%'}} onClick={this.showSettingsModal}>Settings</Button>
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