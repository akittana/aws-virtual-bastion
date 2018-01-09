import React from "react";
import * as SSMActions from "../actions/SSMActions";

import { Checkbox, Icon, Popup, List, Label } from "semantic-ui-react";

function instanceSearchMatch(searchValue, string){
    if (searchValue == "") return true;
    
    if (string.indexOf(searchValue) >= 0) return true;
    else return false;
  }
  
export default class Instance extends React.Component {
  
  constructor(){
    super();
    
  }
  

  
  toggleSelect(id){
    SSMActions.toggleInstanceSelected(id);
  }
  
  render() {
    
    const checkboxStyle = {
      'overflow':'hidden',
      'display':'inline-block',
      'width': '90%',
      'whiteSpace': 'nowrap',
    };
    

    let isVisible = false;
    
    const isChecked = this.props.selected;
    const { instanceId, instanceDetails, viewOptionsValue, instanceSearchValue, ssmEnabled, platformType } = this.props;
    
    let icon = null;
    if (this.props.iconInfo) icon= <Icon loading={this.props.iconInfo.loading} name={this.props.iconInfo.icon} color={this.props.iconInfo.color} />;
    
    let labelIcon;
    if (platformType != "") labelIcon = <Icon name={(platformType == 'Linux') ? 'linux' : 'windows'} />;
    else labelIcon = null;
    
    const label = <label>{(viewOptionsValue === 'byInstanceName') ? instanceDetails.Name + "\t" : instanceId + "\t"}{labelIcon}</label>;
    
    const checkbox = <Checkbox
          disabled={!ssmEnabled}
          id={instanceId} 
          checked={isChecked} 
          onChange={this.toggleSelect.bind(this,instanceId)} 
          // label={ (viewOptionsValue === 'byInstanceName') ? instanceDetails.Name + "\t" : instanceId + "\t"} 
          label={label}
          style={checkboxStyle} fitted />;
    
    var detailsList = [];
    
    if (!ssmEnabled) {
      detailsList.push(<List.Item style={{'color':'red'}} key={'ssmEnabled'} > <b>{"SSM not enabled for instance or instance is not running"}</b>  </List.Item>);
    }
    
    // add instanceId to details list
    detailsList.push(<List.Item key={'instanceId'} > <b>{"Instance Id: "}</b> {instanceId } </List.Item>);
    if (instanceSearchMatch(instanceSearchValue,instanceId)) isVisible=true;
    
    Object.keys(instanceDetails).map(function(key,index) {
      if (instanceSearchMatch(instanceSearchValue,instanceDetails[key])) isVisible=true;
      detailsList.push(<List.Item key={key} > <b>{key + ": "}</b> {instanceDetails[key] } </List.Item>);
    });
    
    

    
    var tagList = [];
    this.props.instanceTags.map((tag) => {
      // Skip the Name tag
      if (!(tag['Key'] == 'Name')) 
      {
        if (instanceSearchMatch(instanceSearchValue,tag['Key'])) isVisible=true;
        if (instanceSearchMatch(instanceSearchValue,tag['Value'])) isVisible=true;
        tagList.push(<List.Item key={tag['Key']} > <b>{tag['Key'] + ": "}</b> {tag['Value'] } </List.Item>);
      }
    });
    
    
    
    const content = <div><List><List.Header><b>Details</b></List.Header>{detailsList}</List><List><List.Header><b>Tags</b></List.Header>{tagList}</List></div>;
      
    return (
      
      <div style={{'display': isVisible ? null: 'none'}}>
        <Popup flowing trigger={checkbox} content={content} basic position='right center' />
          {icon}
      </div>
    );
  }
}