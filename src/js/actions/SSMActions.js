import dispatcher from "../dispatcher";

export function loadInstances(region) {
    dispatcher.dispatch({
            type: "LOAD_INSTANCES",
            region
    });
}

export function loadRegions() {
    dispatcher.dispatch({
        type: "LOAD_REGIONS",
    });
}

export function toggleInstanceSelected(id) {
    dispatcher.dispatch({
            type: "TOGGLE_SELECTED",
            id
    });
}

export function selectRegion(region){
    dispatcher.dispatch({
        type: "SELECT_REGION",
        region
    });
}

export function terminalSendCommand(terminalId, command, instanceId){
    
    dispatcher.dispatch({
        type: "TERMINAL_SEND_COMMAND",
        terminalId,
        command,
        instanceId,
    });
}

export function addNewTerminal(terminalId){
    dispatcher.dispatch({
        type: "ADD_NEW_TERMINAL",
        terminalId,
    });
}

export function changeTerminalTab(terminalId){
    dispatcher.dispatch({
        type: "CHANGE_TERMINAL_TAB",
        terminalId,
    });
}

export function setAuthDetails(mode, authDetails){
    dispatcher.dispatch({
        type: "SET_AUTHENTICATION_DETAILS",
        mode,
        authDetails
    });
}

export function updateSettings(newSettings){
    dispatcher.dispatch({
        type: "UPDATE_SETTINGS",
        newSettings
    });
}