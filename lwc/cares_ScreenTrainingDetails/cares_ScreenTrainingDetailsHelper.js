const NUM_0 = 0;
const NUM_1 = 1;
const NUM_15 = 15;
import { validateUserReadOnlyAccess } from 'c/caresJavascriptUtility';
/*
    cares_ScreenTrainingDetails
*/

import { getFocusedTabInfo, closeTab } from 'lightning/platformWorkspaceApi';
import { NavigationMixin } from 'lightning/navigation';
import { recordTemplateForCreateNEW } from 'c/kreatorUtilityComponent';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getSObjectList from '@salesforce/apex/CARES_GenericPageController.getSObjectList';
import { preSaveValidate,kreatorReportValidity } from 'c/kreatorQueryFrameworkModule';
import { validateImportedComponent } from 'c/kreatorGenericUtilityComponents';
import upsertTrainingRecords from '@salesforce/apex/CARES_GenericPageController.upsertRecords';
import ERRORMESSAGE from '@salesforce/label/c.CARES_Exception_Message';
import { getLogger } from 'c/logger';
import {
    getRecordUsingObjName,
    getRecordsUsingObjName,
    getParentRecords,
    addFieldsToRecordAndSave,
    addFieldsToAllRecordsAndSave,
    addRecordForSave,
    addRecordsForSave,
    deleteFieldsFromRecord,
    deleteRecordBeforeSave,
    deleteRecordsBeforeSave
} from 'c/kreatorHelperModule';
const logger = getLogger();
let ParentInitiated = 'Reload';
let isValidInput = false;
const fieldCustomValidationError = 'FIELD_CUSTOM_VALIDATION_EXCEPTION';

const SUCCESS = 'Success';
const SUCCESS_VARIANT = 'success';
const ERROR = 'Error';
const ERROR_VARIANT = 'error';
const SUCCESS_MESSAGE = 'Data Saved Successfully.';
const YES = 'Yes';

/*
Note : All filter conditions configured in the query will come as part 
of the field mapping key with respect to each object 
*/
export const createRecords = (cmpRef, objectName) => {
    const createTemp = cmpRef.createRecordTemplateObj[objectName];
    if ((!cmpRef.existingObjSet.size) || (cmpRef.existingObjSet.size && !(cmpRef.existingObjSet.has(objectName))) || (cmpRef.existingObjSet.size && (cmpRef.existingObjSet.has(objectName) && createTemp.filterTypes))) {
        recordTemplateForCreateNEW(cmpRef, objectName, createTemp.fieldMapping, createTemp.filterTypes, createTemp.filterTypesMapping);
    }
}

function showToast(cmpRef, title, message, variant) {
    cmpRef.isSpinner = false;
    cmpRef.dispatchEvent(new ShowToastEvent({
        title: title,
        message: message,
        variant: variant
    }));
}

export const onBeforeUnloadHandler = () => {
    //use this fucntion to perform logic before navigating to next component
}
export const onLoadHandler = async (cmpRef) => {
    cmpRef.pageLevelReadOnly = validateUserReadOnlyAccess(cmpRef, 'trainingattendance');
    let IsApproved;
    if (cmpRef?.pageRef?.attributes?.actionName === 'new') {
        cmpRef.DisableSelectParticipant = false;
        cmpRef.DisableParticipant = false;
        const input = cmpRef?.pageRef?.state?.defaultFieldValues;
        const params = input.split(',').reduce((acc, part) => {
            const [key, value] = part.split('=');
            acc[key] = value;
            return acc;
        }, {});

        const additionalParameter = params['additionalParameter'];
        const contextRecordId = params['contextRecordId'];
        cmpRef.dataObject.trainingattendance.Status__c = 'Scheduled';
        if (additionalParameter === 'RFHP') {
            ParentInitiated = 'RFHP';
            cmpRef.RFHParticipantFilter = "Where Role__c = 'Resource Parent' and Id ='" + contextRecordId + "' ORDER BY CreatedDate desc";
            const query = "SELECT Organization__c, Organization__r.Approval_Date__c  FROM RFH_Participant__c  Where Id = '" + contextRecordId + "'  ORDER BY CreatedDate ASC";
            const results = await getSObjectList({ query: query });
            if (results[NUM_0]?.Organization__r.Approval_Date__c !== '') {
                IsApproved = true;
            }
            cmpRef.dataObject.trainingattendance.Organization__c = results[NUM_0]?.Organization__c;
            cmpRef.dataObject.trainingattendance.RFH_Participant__c = contextRecordId;
        } else if (additionalParameter === 'RFAP') {
            ParentInitiated = 'RFAP';
            IsApproved = false;
            cmpRef.dataObject.trainingattendance.Organization__c = null;
            cmpRef.ApplicationParticipantFilter = "Where Id ='" + contextRecordId + "' AND Related_Person_Type__c IN ('Primary Applicant','Co-Applicant') ORDER BY CreatedDate desc";
            cmpRef.dataObject.trainingattendance.Application_Related_Person__c = contextRecordId;
        } else if (additionalParameter === 'RFH') {
            ParentInitiated = 'RFH';
            const query = "SELECT Approval_Date__c  FROM Account  Where Id = '" + contextRecordId + "'  ORDER BY CreatedDate ASC";
            const results = await getSObjectList({ query: query });
            if (results[NUM_0]?.Approval_Date__c !== '') {
                IsApproved = true;
            }
            cmpRef.dataObject.trainingattendance.Organization__c = contextRecordId;
            cmpRef.RFHParticipantFilter = " Where Role__c = 'Resource Parent' and Organization__c = '" + contextRecordId + "' ORDER BY CreatedDate desc";
        } else if (additionalParameter === 'RFA') {
            ParentInitiated = 'RFA';
            IsApproved = false;
            cmpRef.dataObject.trainingattendance.Organization__c = null;
            cmpRef.dataObject.trainingattendance.Application__c = contextRecordId;
            cmpRef.ApplicationParticipantFilter = "Where Application__c ='" + contextRecordId + "' AND Related_Person_Type__c IN ('Primary Applicant','Co-Applicant') ORDER BY CreatedDate desc";
        }
        if (IsApproved === true) {
            cmpRef.dataObject.trainingattendance.Pre_Post_Approval_Training__c = 'Post Approval';
        } else {
            cmpRef.dataObject.trainingattendance.Pre_Post_Approval_Training__c = 'Pre-Approval';
        }
    } else if (cmpRef?.dataObject?.trainingattendance?.Organization__c !== null && cmpRef?.dataObject?.trainingattendance?.Organization__c !== undefined) {
            cmpRef.RFHParticipantFilter = "Where Role__c = 'Resource Parent' and Organization__c ='" + cmpRef?.dataObject?.trainingattendance?.Organization__c + "' ORDER BY CreatedDate desc";
    }else{
            cmpRef.dataObject.trainingattendance.Organization__c = null;
            cmpRef.ApplicationParticipantFilter = "Where Application__c ='" + cmpRef?.dataObject?.trainingattendance?.Application__c + "' AND Related_Person_Type__c IN ('Primary Applicant','Co-Applicant') ORDER BY CreatedDate desc";
        }
}
export const customImplementationHelper = () => {
    //use this function to handle custom code implementation
}
/*
 * onBlur operations are performed via a helper method, which also exposes recordData for modification.
 * @param {*} cmpRef        :- Page reference to the JS file
 * @param {*} recordData    :- recordData type for data in the input element
 * @param {*} event         :- event type for what event method is called for
 */
export const onBlurHandler = () => {
    /* Add your custom logic here for onBlur action in component*/
}
/*
 * onChange operations are performed via a helper method, which also exposes recordData for modification.
 * @param {*} cmpRef        :- Page reference to the JS file
 * @param {*} recordData    :- recordData type for data in the input element
 * @param {*} event         :- event type for what event method is called for
 */
export const onChangeHandler = async (cmpRef) => {
    if (cmpRef.dataObject.trainingattendance.Completed_Date__c !== '' && cmpRef.dataObject.trainingattendance.Completed_Date__c !== undefined) {
        cmpRef.dataObject.trainingattendance.Status__c = 'Completed';
    } else {
        cmpRef.dataObject.trainingattendance.Status__c = 'Scheduled';
    }
    if (cmpRef.dataObject.trainingattendance.Training_Type__c === 'CPR Training') {
        const results = await getSObjectList({ query: query });
        if (results.length === NUM_0) {
            cmpRef.dataObject.trainingattendance.Pre_Post_Approval_Training__c = 'Pre-Approval';
        }
        
    }

    /* Add your custom logic here for onChange action in component*/
}
/*
* postSave operations are performed via a helper method.
* @param {*} cmpRef        :- Page reference to the JS file
* @param {*} data          :- recordData type for data in the input element
*/

function highlightInvalidInputs(cmpRef) {
    isValidInput = true;
    const inputSelectors = [
        'c-kreator-input-text',
        'c-kreator-input-text-area',
        'c-kreator-input-selection-radio',
        'c-kreator-input-selection-picklist'
    ];
    inputSelectors.forEach(selector => {
        const inputs = cmpRef.template.querySelectorAll(selector);
        inputs.forEach(input => {
            if (typeof input.reportValidity === 'function') {
                isValidInput = input.reportValidity() && isValidInput;
            }
        });
    });
}
export const handleSaveRecordResponse = async (cmpRef) => {
    try {
        cmpRef.isSpinner = true;
        await preSaveValidate(cmpRef);
        highlightInvalidInputs(cmpRef);
        validateImportedComponent(cmpRef);
        if (cmpRef.oldMsgMap.size || !isValidInput) {
            kreatorReportValidity(cmpRef);
            showToast(cmpRef, ERROR, cmpRef.labels.KREATOR_GENERAL_BEFORE_ALL_VALIDATE_ERROR, ERROR_VARIANT);
            return;
        }

        let cwiParticipants;
        const ParticipantsList = [];
        const ListOfParticipantTrainId = [];
        let listForError = false;
        if (cmpRef.dataObject.trainingattendance?.RFH_Participant__c !== '' && cmpRef.dataObject.trainingattendance?.RFH_Participant__c !== undefined) {
           
            
            cwiParticipants = cmpRef.dataObject.trainingattendance?.RFH_Participant__c.split(';');

            if (cwiParticipants.length > NUM_0) {
                let query = '';
                if (cwiParticipants.length === NUM_1) {
                    query += "SELECT Training_Type__c,Scheduled_Date__c, Status__c,RFH_Participant__c  FROM Training_Attendance__c  Where Training_Type__c = 'CPR Training' AND RFH_Participant__c = '" + cwiParticipants[NUM_0] + "'  ORDER BY CreatedDate ASC";
                } else {

                    const formattedIds = "(" + cwiParticipants.map(id => `'${id}'`).join(", ") + ")";

                    query += "SELECT Training_Type__c,Scheduled_Date__c, Status__c,RFH_Participant__c  FROM Training_Attendance__c  Where Training_Type__c = 'CPR Training' AND RFH_Participant__c In " + formattedIds + " ORDER BY CreatedDate ASC";
                }
                const results = await getSObjectList({ query: query });
                if (results.length > NUM_0) {
                    results.forEach(element => {
                        ListOfParticipantTrainId.push(element.RFH_Participant__c);
                        if (element.Status__c === 'Scheduled') {
                            listForError = true;
                        }
                    })
                }
                if (cmpRef.dataObject.trainingattendance.Training_Type__c === 'Biennial CPR' && cmpRef.dataObject.trainingattendance.Status__c === 'Completed' && listForError) {
                    showToast(cmpRef, ERROR, 'Biennial CPR Training cannot be marked as Complete as previous CPR training has not been completed.', ERROR_VARIANT);
                    return;
                }
                cwiParticipants.forEach(element => {
                    const obj = {};
                    obj.sobjectType = 'Training_Attendance__c';
                    obj.Application__c = cmpRef.dataObject.trainingattendance?.Application__c;
                    obj.Organization__c = cmpRef.dataObject.trainingattendance?.Organization__c;
                    obj.RFH_Participant__c = element;
                    obj.Training_Type__c = cmpRef.dataObject.trainingattendance?.Training_Type__c;
                    obj.Completed_Date__c = cmpRef.dataObject.trainingattendance?.Completed_Date__c;
                    obj.Name_of_Training__c = cmpRef.dataObject.trainingattendance?.Name_of_Training__c;
                    obj.Specialized_Training__c = cmpRef.dataObject.trainingattendance?.Specialized_Training__c;
                    obj.Hours_Attended__c = cmpRef.dataObject.trainingattendance?.Hours_Attended__c;
                    obj.Other_Training_Provider_Narrative__c = cmpRef.dataObject.trainingattendance?.Other_Training_Provider_Narrative__c;
                    obj.Training_due_to_CAP__c = cmpRef.dataObject.trainingattendance?.Training_due_to_CAP__c;
                    obj.Training_Provider__c = cmpRef.dataObject.trainingattendance?.Training_Provider__c;
                    obj.Scheduled_Date__c = cmpRef.dataObject.trainingattendance?.Scheduled_Date__c;
                    obj.Training_Attendance_Description__c = cmpRef.dataObject.trainingattendance?.Training_Attendance_Description__c;
                    obj.Status__c = cmpRef.dataObject.trainingattendance?.Status__c;
                    const fifteendigitRFHParticipantIds = ListOfParticipantTrainId.map(rfhid => String(rfhid).substring(NUM_0, NUM_15));
                    if (!fifteendigitRFHParticipantIds.includes(element) && cmpRef.dataObject.trainingattendance?.Training_Type__c === 'CPR Training') {

                        obj.Pre_Post_Approval_Training__c = 'Pre-Approval';
                    } else {
                        obj.Pre_Post_Approval_Training__c = 'Post Approval';
                    }
                    obj.Other_Training_Category_Narrative__c = cmpRef.dataObject.trainingattendance?.Other_Training_Category_Narrative__c;
                    obj.Id = cmpRef.dataObject.trainingattendance?.Id || null;
                    ParticipantsList.push(obj);
                });

            }
        }
        else if (cmpRef.dataObject.trainingattendance?.Application_Related_Person__c !== '' && cmpRef.dataObject.trainingattendance?.Application_Related_Person__c !== undefined) {

            cwiParticipants = cmpRef.dataObject.trainingattendance.Application_Related_Person__c.split(';');

            if (cwiParticipants.length > NUM_0) {
                let query = '';
                if (cwiParticipants.length === NUM_1) {
                    query += "SELECT Training_Type__c,Scheduled_Date__c, Status__c  FROM Training_Attendance__c  Where Training_Type__c = 'CPR Training' AND Application_Related_Person__c = '" + cwiParticipants + "'  ORDER BY CreatedDate ASC";
                } else {

                    const formattedIds = "(" + cwiParticipants.map(id => `'${id}'`).join(", ") + ")";

                    query += "SELECT Training_Type__c,Scheduled_Date__c, Status__c  FROM Training_Attendance__c  Where Training_Type__c = 'CPR Training' AND Application_Related_Person__c In " + formattedIds + " ORDER BY CreatedDate ASC";
                }
                const results = await getSObjectList({ query: query });
                if (results.length > NUM_0) {
                    results.forEach(element => {
                        if (element.Status__c === 'Scheduled') {
                            listForError = true;
                        }
                    })
                }
                if (cmpRef.dataObject.trainingattendance.Training_Type__c === 'Biennial CPR' && cmpRef.dataObject.trainingattendance.Status__c === 'Completed' && listForError) {
                    showToast(cmpRef, ERROR, 'Biennial CPR Training cannot be marked as Complete as previous CPR training has not been completed.', ERROR_VARIANT);
                    return;
                }
                cwiParticipants.forEach(element => {
                    const obj = {};
                    obj.sobjectType = 'Training_Attendance__c';
                    obj.Application__c = cmpRef.dataObject.trainingattendance?.Application__c;
                    obj.Application_Related_Person__c = element;
                    obj.Training_Type__c = cmpRef.dataObject.trainingattendance?.Training_Type__c;
                    obj.Completed_Date__c = cmpRef.dataObject.trainingattendance?.Completed_Date__c;
                    obj.Name_of_Training__c = cmpRef.dataObject.trainingattendance?.Name_of_Training__c;
                    obj.Specialized_Training__c = cmpRef.dataObject.trainingattendance?.Specialized_Training__c;
                    obj.Hours_Attended__c = cmpRef.dataObject.trainingattendance?.Hours_Attended__c;
                    obj.Other_Training_Provider_Narrative__c = cmpRef.dataObject.trainingattendance?.Other_Training_Provider_Narrative__c;
                    obj.Training_due_to_CAP__c = cmpRef.dataObject.trainingattendance?.Training_due_to_CAP__c;
                    obj.Training_Provider__c = cmpRef.dataObject.trainingattendance?.Training_Provider__c;
                    obj.Scheduled_Date__c = cmpRef.dataObject.trainingattendance?.Scheduled_Date__c;
                    obj.Training_Attendance_Description__c = cmpRef.dataObject.trainingattendance?.Training_Attendance_Description__c;
                    obj.Status__c = cmpRef.dataObject.trainingattendance?.Status__c;
                    obj.Pre_Post_Approval_Training__c = cmpRef.dataObject.trainingattendance?.Pre_Post_Approval_Training__c;
                    obj.Other_Training_Category_Narrative__c = cmpRef.dataObject.trainingattendance?.Other_Training_Category_Narrative__c;
                    obj.Id = cmpRef.dataObject.trainingattendance?.Id || null;
                    ParticipantsList.push(obj);
                });
            }
        }
        if (ParticipantsList.length > NUM_0) {
            upsertTrainingRecords({ sobjectList: ParticipantsList }).then(result => {
                if (result === 'Success') {
                    const messageDetails = {};
                    messageDetails.title = '';
                    messageDetails.message = SUCCESS_MESSAGE;
                    messageDetails.variant = 'success';
                    showToast(cmpRef, SUCCESS, SUCCESS_MESSAGE, SUCCESS_VARIANT);
                    if (ParentInitiated === 'RFHP') {
                        navigateAndClose('RFH_Participant__c', cmpRef.dataObject.trainingattendance?.RFH_Participant__c, cmpRef);
                    } else if (ParentInitiated === 'RFH') {
                        navigateAndClose('Account', cmpRef.dataObject.trainingattendance?.Organization__c, cmpRef);
                    } else if (ParentInitiated === 'RFA') {
                        navigateAndClose('Application__c', cmpRef.dataObject.trainingattendance?.Application__c, cmpRef);
                    } else if (ParentInitiated === 'RFAP') {
                        navigateAndClose('ApplicationRelatedPerson__c', cmpRef.dataObject.trainingattendance?.Application_Related_Person__c,cmpRef);
                    } else if (ParentInitiated === 'Reload') {
                        window.location.reload();
                    }

                }
            }).catch(error => {
                const errorMsg = error?.body?.message;
                if (errorMsg?.includes(fieldCustomValidationError)) {
                    showToast(cmpRef, ERROR, errorMsg.split('FIELD_CUSTOM_VALIDATION_EXCEPTION, ')[NUM_1].split(': []')[NUM_0], ERROR_VARIANT);
                } else {
                    showToast(cmpRef, ERROR, errorMsg, ERROR_VARIANT);
                }
                logger.error(ERRORMESSAGE + error.message);
            });
        }

    }
    catch (error) {
        logger.error(ERRORMESSAGE + error.message);
    }
}

async function navigateAndClose(objName, TArecordId, cmpRef) {
    cmpRef[NavigationMixin.Navigate]({
        type: 'standard__recordPage',
        attributes: {
            recordId: TArecordId,
            objectApiName: objName,
            actionName: 'view'
        },
        state: {
            c__node: 'Trainings'
        }
    });
    try {
        const tabInfo = await getFocusedTabInfo();
    const tabId = tabInfo.tabId;
    await closeTab( tabId );
} catch(error) {
 logger.error('Test 308 error' + error.message);
}
}

function invokeWorkspaceAPI(methodName, methodArgs) {
    return new Promise((resolve, reject) => {
        const closeCurrentTabEvent = new CustomEvent("internalapievent", {
            bubbles: true,
            composed: true,
            cancelable: false,
            detail: {
                category: "workspaceAPI",
                methodName: methodName,
                methodArgs: methodArgs,
                callback: (err, response) => {
                    if (err) {
                        return reject(new Error(err).message);
                    } 
                        return resolve(response);
                    
                }
            }
        });

        this.dispatchEvent(closeCurrentTabEvent);
    });
}

export const handleImportedCompEvtHelper = (cmpRef, eventData) => {
    //User can add custom logic below
    //below example code show how use get street from event detail in case of differnt imported comp Id
    //let streetVar1, streetVar2;
    //if(eventData.currentTarget.dataset.kreatorImportedCompId == 'genericaddress1'){
    //    streetVar2 = eventData.detail.street;
    //}
    //if(eventData.currentTarget.dataset.kreatorImportedCompId == 'genericaddress2'){
    //    streetVar2 = eventData.detail.street;
    //}
}


export const kreatorMessageChannelHandler = (cmpRef, message) => {
    /* Add you custom logic here to handle the message received on Kreator message channel*/
}
export const connectedCallbackHelper = () => {

    /* Add your custom logic here for connectedCallback action in component*/

}
export const renderedCallbackHelper = () => {
    /*
     * Use this function to add custom logic in renderedCallbackHelper for controlling the flow of the rendering logic.
     * Query the UI elements to access their properties based on their type.
     * Example query is given below
     */

    /*
    *Define a page variable as a boolean flag to control the execution of renderedCallback. In the example below, renderCheck is a boolean type page variable configured in the tool. Based on this boolean flag, we will control the flow.
   */


    
}
