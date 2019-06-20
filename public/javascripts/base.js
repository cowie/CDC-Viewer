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
      processNewEventSLDS(msg);
});



function processNewEvent(event){
    let objectName = event.payload.ChangeEventHeader.entityName;
    if(!eventedObjects.get(objectName)!= 1){
        eventedObjects.add(objectName, 1);
        //create new tab to hold object, todo.
    }
    let eventsContainer = doc.getElementById('mainContainer');
    
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

function processNewEventSLDS(event){
    let objectName = event.payload.ChangeEventHeader.entityName;
    if(!eventedObjects.get(objectName)!= 1){
        eventedObjects.add(objectName, 1);
        //create new tab to hold object, todo.
    }
    const eventsContainer = doc.getElementById('mainContainer');

    let newEventMarkup = `
  <article class="slds-card" data-eventID="${event.event.replayId}">
  <div class="slds-card__header slds-grid slds-grid_vertical">
    <header class="slds-media slds-media-center slds-col">
      <div class="slds-media__figure">
        <span class="slds-icon_container slds-icon-standard-contact" title="contact">
            <svg class="slds-icon slds-icon_small" aria-hidden="true">
                <use xlink:href="/assets/icons/standard-sprite/svg/symbols.svg#contact"></use>
            </svg>
            <span class="slds-assistive-text">contact</span>
        </span>
      </div>
      <div class="slds-media__body">
        <h2 class="slds-card__header-title">
            <a href="javascript:void(0);" class="slds-card__header-link slds-truncate" title="${event.payload.ChangeEventHeader.entityName}"><span>${event.payload.ChangeEventHeader.entityName}</span></a>
        </h2>
      </div>
      <div class="slds-no-flex">
      </div>
    </header>
    <div class="slds-card__body slds-col">
      <table class="recordList slds-table slds-table-bordered slds-table_cell-buffer slds-no-row-hover slds-table_bordered slds-table_fixed-layout" role="grid">
        <thead>
          <tr class="slds-line-height_reset">
            <th scope="col">
              <div class="slds-truncate" title="Records Changed">Records Changed</div>
            </th>
          </tr>
        </thead>
        <tbody>`;
        //add record ID content

        event.payload.ChangeEventHeader.recordIds.forEach(recordId => {
            newEventMarkup += `
            <tr class="slds-hint-parent">
                <th scope="row">
                    <div class="slds-truncate" title="${recordId}">
                        ${recordId}
                    </div>
                </th>
            </tr>`
        });

        newEventMarkup +=  `
        </tbody>
        </table>
        <table class="fieldList slds-table slds-table-bordered slds-table_cell-buffer slds-no-row-hover slds-table_bordered slds-table_fixed-layout">
            <thead>
            <tr class="slds-line-height_reset">
                <th scope="col">
                <div class="slds-truncate" title="Field Name">Field Name</div>
                </th>
                <th scope="col">
                <div class="slds-truncate" title="New Value">New Value</div>
                </th>
            </tr>
            </thead>
            <tbody>`;
        //add field content
        //List of field changes
        let fieldsChanged = Object.keys(event.payload);
        fieldsChanged.forEach(field => {
            if(field != 'LastModifiedDate' && field != 'ChangeEventHeader'){
                newEventMarkup += `
                    <tr class="slds-hint-parent">
                        <th scope="row">
                            <div class="slds-truncate" title="${field}">
                                ${field}
                            </div>
                        </th>
                        <td role="gridcell">
                            <div class="slds-truncate" title="${event.payload[field]}">
                                ${event.payload[field]}
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
        newEventMarkup += `
                </tbody>
            </table>
            </div>
         <footer class="slds-card__footer slds-col">
                <span>User ID: ${event.payload.ChangeEventHeader.commitUser}</span><br/>
                <span>Time: ${event.payload.LastModifiedDate}</span>
         </footer>
         </div></article>
         `;

         //<div data-txnID="${event.payload.ChangeEventHeader.transactionKey}">
         //</div>
         let txnDiv = doc.createElement('div');
         txnDiv.setAttribute('data-txnID', event.payload.ChangeEventHeader.transactionKey);
         txnDiv.innerHTML= newEventMarkup;
         eventsContainer.appendChild(txnDiv);
}