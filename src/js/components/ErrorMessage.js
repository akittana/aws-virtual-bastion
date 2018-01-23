import React from "react";

import { Message } from 'semantic-ui-react';

export default class ErrorMessage extends React.Component {
 constructor(){
     super();
     this.state = { visible: true }
     this.handleDismiss = this.handleDismiss.bind(this);
 }
 
 handleDismiss = () => {
    this.setState({ visible: false });
  }
  
 
 render(){
     if (this.state.visible) {
     return (
         <Message
          error
          onDismiss={this.handleDismiss}
          header={this.props.errorHeader}
          content={this.props.errorMessage}
         />
    );
    }
    else return null;
 }
}