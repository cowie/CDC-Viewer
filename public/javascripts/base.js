const cdcTopic = '/data/ChangeEvents';

const eventedObjects = new Map();
var newestMsg;

const doc = document;
const socket = io();


//toastDefinitions
const customEventToast = 'peErrorArea';
const cdcToast = 'cdcErrorArea';

//socket.io reactions
socket.on(cdcTopic, (msg) => {
    console.log(`new message on ${cdcTopic}`);
    console.log(msg);
    newestMsg = msg;
    processNewCDCEvent(msg);
});
socket.on('PEMessage', (payload) => {
    console.log(`new message on ${payload.eventType}`);
    console.log(payload.message);
    processNewCustomEvent(payload);
});
socket.on('NewSubSuccess', (payload) => {
    console.log(`Confirmed success connecting to ${payload.topicName}`);
    addTopicToList(payload.topicName);
});
socket.on('NewSubFailure', (payload) => {
    console.log(`Failure connecting to ${payload.topicName}`);
    console.log(payload.error);
    popToast(customEventToast, `Failure subscribing to ${payload.topicName}`, `${payload.error.code}: ${payload.error.message} - Did you remember __e at the end?`);
});
socket.on('disconnect', (payload) => {
    console.log('socket disconnected');
    console.log(payload);
    setDisconnectStatus('socketStatus');
});
socket.on('FayeDisconnect', (payload) => {
    console.log('Faye dsiconnected');
    console.log(payload);
    setDisconnectStatus('fayeStatus');
})
//Platform Event Logic

function addPESubscription(peName){
    socket.emit('ADD PE SUB', peName);
}

function processNewCustomEvent(event){
    let objectName = event.eventType;
    event = event.message;
    console.log(event);
    
    const peContainer = doc.getElementById('peContainer');

    let newEventMarkup = `
  <article class="slds-card" data-eventID="${event.event.replayId}">
  <div class="slds-card__header slds-grid slds-grid_vertical">
    ${handleEventHeader(objectName, 'New Event')}
    <div class="slds-card__body slds-col">
        <table class="fieldList slds-table slds-table-bordered slds-table_cell-buffer slds-no-row-hover slds-table_bordered slds-table_fixed-layout">
            <thead>
            <tr class="slds-line-height_reset">
                <th scope="col">
                <div class="slds-truncate" title="Field Name">Field Name</div>
                </th>
                <th scope="col">
                <div class="slds-truncate" title="Value">Value</div>
                </th>
            </tr>
            </thead>
            <tbody>`;
        //add field content
        //List of field changes
        let fieldsChanged = Object.keys(event.payload);
        fieldsChanged.forEach(field => {
            newEventMarkup += handleEventField(field, event.payload[field]);
        });
        newEventMarkup += `
                </tbody>
            </table>
            </div>
         <footer class="slds-card__footer slds-col">
                <span>User ID: ${event.payload.CreatedById}</span><br/>
                <span>Time: ${event.payload.CreatedDate}</span>
         </footer>
         </div></article>
         `;

         let txnDiv = doc.createElement('div');
         txnDiv.innerHTML= newEventMarkup;
         peContainer.appendChild(txnDiv);
}

//Logic for actual things goes below here

function processNewCDCEvent(event){
    let objectName = event.payload.ChangeEventHeader.entityName;
    if(!eventedObjects.get(objectName)!= 1){
        eventedObjects.add(objectName, 1);
        //create new tab to hold object, todo.
    }
    const cdcContainer = doc.getElementById('cdcContainer');

    let newEventMarkup = `
  <article class="slds-card" data-eventID="${event.event.replayId}">
  <div class="slds-card__header slds-grid slds-grid_vertical">
    ${handleEventHeader(event.payload.ChangeEventHeader.entityName, event.payload.ChangeEventHeader.changeType)}
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
            newEventMarkup += handleEventField(field, event.payload[field]);
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
         cdcContainer.appendChild(txnDiv);
}

function handleEventField(fieldName, fieldValue){
    //check if special field
    //todo
    let returnHTMLContent = '';
    if(fieldName != 'LastModifiedDate' && fieldName != 'ChangeEventHeader'){
        let staticStart = '<tr class="slds-hint-parent">';
        let staticEnd = '</tr>'
        //check if composite(object) field
        if(typeof(fieldValue) === 'object'){
            returnHTMLContent = `
                <th scope="row">
                    <div class="slds-truncate" title="${fieldName}">
                        ${fieldName}
                    </div>
                </th>
            `;
            let valueHTMLContent = `<td role="gridcell"><dl class="slds-list_horizontal slds-wrap">`;
            Object.keys(fieldValue).forEach(subFieldName =>{
                valueHTMLContent += `
                <dt class="slds-item_label slds-text-color_weak slds-truncate" title="${subFieldName}">${subFieldName}:</dt>
                <dd class="slds-item_detail slds-truncate" title="${fieldValue[subFieldName]}">${fieldValue[subFieldName]}</dd>
                `
            });
            valueHTMLContent += `</dl></td>`
            returnHTMLContent += valueHTMLContent;
        }else if(typeof(fieldValue) === 'string'){
            //handle standard
            returnHTMLContent = `
                            <th scope="row">
                                <div class="slds-truncate" title="${fieldName}">
                                    ${fieldName}
                                </div>
                            </th>
                            <td role="gridcell">
                                <div class="slds-truncate" title="${fieldValue}">
                                    ${fieldValue}
                                </div>
                            </td>
            `;
        }else{
            //quietly hide lol.
        }
        returnHTMLContent = `${staticStart}${returnHTMLContent}${staticEnd}`;
    }
    return returnHTMLContent;
}

function handleEventHeader(objectName, changeType){
    let staticHeader = `<header class="slds-media slds-media-center slds-col">`;
    let staticFooter = `<div class="slds-no-flex"></div></header>`;
    let imageHTML;
    objectName;

    if(objectName.indexOf('__c') == -1 && objectName.indexOf('__e') == -1){
        //standard object
        imageHTML = `
            <div class="slds-media__figure">
                <span class="slds-icon_container slds-icon-standard-${objectName.toLowerCase()}" title="${objectName}">
                    <svg class="slds-icon slds-icon_small" aria-hidden="true">
                        <use xlink:href="/assets/icons/standard-sprite/svg/symbols.svg#${objectName.toLowerCase()}"></use>
                    </svg>
                    <span class="slds-assistive-text">${objectName}</span>
                </span>
            </div>`;
    }else if(objectName.indexOf('__e') == -1){
        //custom object
        imageHTML = `
            <div class="slds-media__figure">
                <span class="slds-icon_container slds-icon-custom-custom18" title="${objectName}">
                    <svg class="slds-icon slds-icon_small" aria-hidden="true">
                        <use xlink:href="/assets/icons/custom-sprite/svg/symbols.svg#custom18"></use>
                    </svg>
                    <span class="slds-assistive-text">${objectName}</span>
                </span>
            </div>`;
    }else {
        //custom Event
        imageHTML = `
            <div class="slds-media__figure">
                <span class="slds-icon_container slds-icon-standard-apex-plugin" title="${objectName}">
                    <svg class="slds-icon slds-icon_small" aria-hidden="true">
                        <use xlink:href="/assets/icons/standard-sprite/svg/symbols.svg#apex_plugin"></use>
                    </svg>
                    <span class="slds-assistive-text">${objectName}</span>
                </span>
            </div>`;
    }
    let titleHTML = `
            <div class="slds-media__body">
                <h2 class="slds-card__header-title">
                    <a href="javascript:void(0);" class="slds-card__header-link slds-truncate" title="${objectName} - ${changeType}"><span>${objectName} - ${changeType}</span></a>
                </h2>
            </div>`;
    return `${staticHeader}${imageHTML}${titleHTML}${staticFooter}`;
}
//simple page logic stuff goes here

function handleTabClick(event){
    event.preventDefault();
    let allTabs = document.getElementsByClassName('slds-is-active');
    Array.from(allTabs).forEach(ele => {
        ele.classList.remove('slds-is-active');
        ele.parentElement.classList.remove('slds-has-focus');
    });
    let allPanes = document.getElementsByClassName('slds-show');
    Array.from(allPanes).forEach(ele => {
        ele.classList.remove('slds-show');
        ele.classList.add('slds-hide');
    });

    let clickedTab = event.currentTarget;
    clickedTab.classList.add('slds-is-active');
    clickedTab.parentElement.classList.add('slds-has-focus');
    let target = document.getElementById(clickedTab.getAttribute('aria-controls'));
    target.classList.add('slds-show');
    target.classList.remove('slds-hide');
}
function wakeToolTip(event){
    let targetTip = document.getElementById(event.currentTarget.getAttribute('aria-describedby'));
    targetTip.classList.add('slds-rise-from-ground');
    targetTip.classList.remove('slds-fall-into-ground');
}

function sleepToolTip(event){
    let targetTip = document.getElementById(event.currentTarget.getAttribute('aria-describedby'));
    targetTip.classList.remove('slds-rise-from-ground');
    targetTip.classList.add('slds-fall-into-ground');
}

function handlePESubmit(event){
    event.preventDefault();
    let subInput = document.getElementById('txtNewPESubscription');
    let subName = subInput.value;
    subInput.value= '';
    addPESubscription(subName);
}

function addTopicToList(topicName){
    const PEList = document.getElementById('subscribedPEList');
    const newPEItem = document.createElement('div');
    newPEItem.classList.add('subscribedPE', 'slds-col');
    newPEItem.textContent= topicName;
    PEList.appendChild(newPEItem);
}

function popToast(toastTarget, error, subError){
    let toastContainer = document.getElementById(toastTarget);
    let errorContainer = toastContainer.firstChild.children[2];
    errorContainer.children[0].textContent = error;
    errorContainer.children[1].textContent = subError;
    toastContainer.classList.add('slds-transition-show');
    setTimeout(() => {
        toastContainer.classList.remove('slds-transition-show');
    }, 5000);
}
function handleToastCloseLink(event){
    let container = event.currentTarget;
    container.parentElement.parentElement.parentElement.classList.remove('slds-transition-show');
}

function setDisconnectStatus(targetNotification){
    let ringIndicator = document.getElementById(targetNotification);
    ringIndicator.classList.add('slds-progress-ring_expired');
}

/* Graveyard

    */
