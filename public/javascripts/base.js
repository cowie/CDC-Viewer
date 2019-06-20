const eventedObjects = new Map();
var newestMsg;

const doc = document;
    const socket = io();
    socket.on('MESSAGE', (msg) => {
      //const newBlerp = doc.createElement('li');
      //newBlerp.append(msg);
      //doc.getElementById('blerp').appendChild(newBlerp);
      console.log(msg);
      newestMsg = msg;
      processNewEvent(msg);
});

function processNewEvent(event){
    let objectName = event.payload.ChangeEventHeader.entityName;
    if(!eventedObjects.get(objectName)!= 1){
        eventedObjects.add(objectName, 1);
        //create new tab to hold object, todo.
    }
    let eventsContainer = doc.getElementById('blerp');
    
    //build containers
    let txnLI = doc.createElement('li');
    txnLI.setAttribute('data-txnID', event.payload.ChangeEventHeader.transactionKey);
    let eventDiv = doc.createElement('div');
    eventDiv.setAttribute('data-eventID', event.event.replayId);
    let eventHeader = doc.createElement('div');
    eventHeader.classList.add('eventHeader');
    let eventBody = doc.createElement('div');
    eventBody.classList.add('eventBody');

    //build header
    //set up title
    let titleArea = doc.createElement('h3');
    titleArea.append(`Change Event: ${event.payload.ChangeEventHeader.entityName} - ${event.payload.ChangeEventHeader.changeType}`);
    eventHeader.appendChild(titleArea);
    //set up subtitle
    let subtitleArea = doc.createElement('h4');
    subtitleArea.append(`Event Time: ${event.payload.LastModifiedDate}`);
    eventHeader.appendChild(subtitleArea);
    
    //build body
    //List of record IDs
    let recordList = doc.createElement('ul');
    recordList.classList.add('recordList');
    event.payload.ChangeEventHeader.recordIds.forEach(recordId => {
        let recordIDItem = doc.createElement('li');
        recordIDItem.append(recordId);
        recordList.appendChild(recordIDItem);
    });
    eventBody.appendChild(recordList);
    //List of field changes
    let fieldChangelist = doc.createElement('ul');
    fieldChangelist.classList.add('fieldChangeList');
    let fieldsChanged = Object.keys(event.payload);
    fieldsChanged.forEach(field => {
        if(field != 'LastModifiedDate' && field != 'ChangeEventHeader'){
            let fieldItem = doc.createElement('li');
            fieldItem.append(`${field}: ${event.payload[field]}`);
            fieldChangelist.appendChild(fieldItem);
        }
    });
    eventBody.appendChild(fieldChangelist);
    let commitingUser = doc.createElement('h4');
    commitingUser.classList.add('committingUser');
    commitingUser.append(`User: ${event.payload.ChangeEventHeader.commitUser}`);
    eventBody.appendChild(commitingUser);

    eventDiv.appendChild(eventHeader);
    eventDiv.appendChild(eventBody);
    txnLI.appendChild(eventDiv);
    eventsContainer.appendChild(txnLI);
}
