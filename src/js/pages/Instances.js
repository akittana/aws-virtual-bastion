import React from "react";

import * as SSMActions from "../actions/SSMActions";
import SSMStore from "../stores/SSMStore";

import Instance from "../components/Instance";

import { Dropdown, Input, Form, Message, Button } from "semantic-ui-react";

export default class Instances extends React.Component {
  constructor(){
    super();
    
    this.state = {
      instances: SSMStore.getInstances(),
      regions: [],
      selectedRegion: "",
      viewOptionsValue: "byInstanceName",
      instanceSearchValue: "",
      refreshInstancesLoading: false,
    };
    
    this.handleViewOptionsChange = this.handleViewOptionsChange.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleRefreshButton = this.handleRefreshButton.bind(this);
    
  }
  
  componentWillMount() {
    SSMStore.on("instances_changed", () => {
        this.setState(
            {
                instances: SSMStore.getInstances(),
                refreshInstancesLoading:false,
            }
        );
    });
    
    SSMStore.on("selected_region_changed", () => {
      this.setState(
          {
            selectedRegion: SSMStore.getSelectedRegion(),
          }
        );
    });
    
    SSMStore.on("regions_updated", () => {
      this.setState({regions: SSMStore.getRegions()});
    });
    
    SSMStore.on("clear_search", () => {
      this.setState({instanceSearchValue:""});
    });
    
    SSMStore.on("refresh_instances_loading",() => {
     this.setState({refreshInstancesLoading:true}); 
    });
    
    // this.loadRegions();
  }
  
  
  loadRegions() {
    SSMActions.loadRegions();
  }
  
  loadInstances() {
    SSMActions.loadInstances(this.state.selectedRegion);
  }
  
  selectRegion(event, data){

    const region = data.value;
    
    SSMActions.selectRegion(region);
  }
  
  handleViewOptionsChange(e, { value }){
    this.setState({viewOptionsValue: value});
  }
  
  handleSearchChange(e, { value }){
    this.setState({instanceSearchValue:value});
  }
  
  handleRefreshButton(){
    SSMActions.refreshInstances();
  }
  
  render() {
    
    
    if (!SSMStore.isAuthenticated){
      return (
        <Message warning>
          <Message.Header> Not Authenticated </Message.Header>
          <p>Enter authentication details to load instances ...</p>
        </Message>  
      );
        
    }
    else {
      const { instances, selectedRegion, viewOptionsValue, instanceSearchValue, refreshInstancesLoading } = this.state;
    const instancesList = [];
    Object.keys(instances).map(function(key, index) {
      const instanceId = key;
      const commandStatus = (instances[instanceId]['commandStatus']) ? commandStatus : "";
      
      const iconInfo = {
        loading: (instances[instanceId]['commandStatus'] == "loading") ? true : false,
        color: (instances[instanceId]['commandStatus'] == "success") ? "blue" : "black",
      };
      
      if (instances[instanceId]['commandStatus'] == "success") iconInfo['icon'] = 'check';
      else if (instances[instanceId]['commandStatus'] == "loading") iconInfo['icon'] = 'spinner';
      else if (instances[instanceId]['commandStatus'] == "error") {
        iconInfo['icon'] = 'remove';
        iconInfo['color'] = 'red';
      }
      
      
       instancesList.push(
          <Instance key={instanceId} instanceId={instanceId} {...instances[instanceId]} iconInfo={iconInfo} viewOptionsValue={viewOptionsValue} instanceSearchValue={instanceSearchValue}/>
         );
    });
    
    const regionsList = [];
    this.state.regions.map( (region) => {regionsList.push({key:region, value:region, text:region});});
    
    const viewOptionsForm = <Form>
                              <Form.Group inline>
                                <label>Show</label>
                                <Form.Radio label='Name' value='byInstanceName' checked={viewOptionsValue === "byInstanceName"} onChange={this.handleViewOptionsChange}  />
                                <Form.Radio label='Instance Id' value='byInstanceId' checked={viewOptionsValue === "byInstanceId"} onChange={this.handleViewOptionsChange} />
                              </Form.Group>
                            </Form>;
                            
      return (
        <div>
          <h1> Select Instances </h1>
          <Dropdown search placeholder='Choose region...' 
          options={regionsList} onChange={this.selectRegion} value={selectedRegion}/> 
          <Button size='small' loading={refreshInstancesLoading} icon='refresh' style={{'position':'absolute','right':'0','backgroundColor':'Transparent'}} onClick={this.handleRefreshButton} />
          <hr></hr>
          {instancesList.length > 0 
            ? <Input size='mini' icon='search' fluid value={this.state.instanceSearchValue} placeholder='Search instances by name, details, tags, ...' onChange={this.handleSearchChange} />
            : null 
          }
          <br />
          {instancesList.length > 0 ? instancesList: "No instances in selected region"}
          <br />
          {instancesList.length > 0 ? viewOptionsForm: null }
        </div>
      );
    }
  }
}