const NUM_0 = 0;
/*
    cares_ScreenTrainingDetails
*/
//Gemini
import { LightningElement, track, api, wire } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import kreatorBaseComponentsStyle from '@salesforce/resourceUrl/kreatorBaseComponentsStyle';
import globalCssResource from '@salesforce/resourceUrl/Theme';
import { getRecord } from 'lightning/uiRecordApi'

import {populatePageVaraiblesFromUrl,populateObjectNameRecordLstMap,decodeBindVariable,checkAndDisableField} from 'c/kreatorUtilityComponent';
import {subscribeKreatorMessageChannel, unsubscribeKreatorMessageChannel, publishKreatorMessageChannel,addImportedCompValuesToRecord} from 'c/kreatorGenericUtilityComponents';
/**** Helper responses Import ****/
import { onLoadHandler,onBeforeUnloadHandler,customImplementationHelper,kreatorMessageChannelHandler,renderedCallbackHelper, connectedCallbackHelper,handleSaveRecordResponse,createRecords, onBlurHandler, onChangeHandler,handleImportedCompEvtHelper } from './cares_ScreenTrainingDetailsHelper';
import fetchRecordsFromMetadata from '@salesforce/apex/KreatorGenericController.fetchRecordsFromMetadata';
import { renderedCallbackModule, getParentChildMap, createDataObjStructure,processDataNew, handleChange, validateInputData, formatName, setWireStatus, setHiddenRule } from 'c/kreatorQueryFrameworkModule';
/**** Custom labels Import ****/
import KREATOR_GENERAL_ERROR from '@salesforce/label/c.KREATOR_GENERAL_ERROR';
import KREATOR_DYNAMIC_ACC_MSG from '@salesforce/label/c.KREATOR_DYNAMIC_ACC_MSG';
import KREATOR_SUCCESS_TITLE from '@salesforce/label/c.KREATOR_SUCCESS_TITLE';
import KREATOR_ERROR_TITLE from '@salesforce/label/c.KREATOR_ERROR_TITLE';
import KREATOR_GENERAL_SAVE_SUCCESS from '@salesforce/label/c.KREATOR_GENERAL_SAVE_SUCCESS';
import KREATOR_GENERAL_BEFORE_ALL_VALIDATE_ERROR from '@salesforce/label/c.KREATOR_GENERAL_BEFORE_ALL_VALIDATE_ERROR';
/**** page constants Import ****/
import { pageConstants } from 'c/kreatorGenericConstants';
/*** Picklist Imports ***/
import TRAININGATTENDANCE_OBJECT from '@salesforce/schema/Training_Attendance__c';
import { MessageContext } from 'lightning/messageService';
import { getObjectInfos, getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import { CurrentPageReference,NavigationMixin } from 'lightning/navigation';
export default class Cares_ScreenTrainingDetails extends NavigationMixin(LightningElement) {
navigationMixin = NavigationMixin;
	_pageLevelReadOnly = true;
 
	@api
		get pageLevelReadOnly() {
			return this._pageLevelReadOnly;
			}
		set pageLevelReadOnly(value) {
			this._pageLevelReadOnly = value;
			}

    //added keys for save functionality
    isAllWireLoad = false;
    sobjectTree;
    stackDepth = NUM_0;
    upsertOrderLst = [];
    lookupFieldMap = new Map();
    recordMapUM = new Map();
    tempSobjectTree = {recordLst:[],childNode:{}};
    uniqueKeyRecordMap = new Map();
    objectNameLookupMap = new Map();
    uniqueKeyLookupFieldMap = new Map();
    uniqueKeyIdMap = new Map();
    sobjectLst = [];
    objectNameChildLstMap = new Map();
    sobjectTreeMap = new Map();
    visistedSobjects = [];
    @track tempData;
    objectTypeMap = new Map();
    objectInfoMap = new Map();
    fetchRecordFromApex = false;
    
	kreatorMessageSubscription = null;
    copilotMessage = null;
    kreatorScreenName = 'cares_ScreenTrainingDetails';
    @api ackToCopilot;
    @api copilotData;
    
    @wire(MessageContext)
    messageContext;

    @api trainingattendanceRecordTypeId;
    selectedRecord;
    deleteRecordLst = [];
    objectApiNames = [TRAININGATTENDANCE_OBJECT]
    @wire(getObjectInfos, { objectApiNames: '$objectApiNames' })
    objectInfoHandler({error,data}) {
        if (data) {
            if(data.results.length > NUM_0) {
                for(const obj of data.results){
                    this[formatName(obj.result.apiName)+'RecordTypeId'] ??= obj.result.defaultRecordTypeId;
                    this.objectInfoMap.set(obj.result.apiName, obj.result);
                    this.objectTypeMap.set(obj.result.keyPrefix, obj.result.apiName);
                }
                this.callCreateHelper = true;
            }
        }else if (error) {
        }
    }
    
    //added for order of execution
    set callCreateHelper(value) {
        if(this.objectTypeMap.size && this.fetchRecordFromApex && this.isAllWireLoad){
            this.decoupledMap.clear();
            if(this.tempRecordLst){
                processDataNew(this, this.tempData);
            }
            getParentChildMap(this);
            createRecords(this,'Training_Attendance__c');
            populateObjectNameRecordLstMap(this);
            onLoadHandler(this);
            getParentChildMap(this);
            this.isSpinner = false;
            this.loadPage = true;
            this.iscares_ScreenTrainingDetails = true;
            this.renderInactivePicklists = true;
            this.isFLSCheckCompleted = false;
        }
    
    }

    labels = {
	    KREATOR_GENERAL_ERROR,
	    KREATOR_DYNAMIC_ACC_MSG,
	    KREATOR_SUCCESS_TITLE,
	    KREATOR_ERROR_TITLE,
	    KREATOR_GENERAL_SAVE_SUCCESS,
	    KREATOR_GENERAL_BEFORE_ALL_VALIDATE_ERROR
    }

    oldMsgMap = new Map();
    messageMap = new Map();
    oldDBMsgMap = new Map();
    oldPageMessageMap=new Map();
    @track pickListInfo = {
	    TrainingDetails_Training_Type__c1 : [],
	    TrainingDetails_Training_Provider__c9 : [],
	    TrainingDetails_Specialized_Training__c10 : [],
	    TrainingDetails_Status__c12 : [],
	    TrainingDetails_Pre_Post_Approval_training__c13 : [],
	    TrainingDetails_Training_due_to_CAP__c8 : []
    }
    @api recordId;
    @api isRendered;
    @api iscares_ScreenTrainingDetails = 'true';
    @track tempList = [];
    @track inputCmpIds = ['trainingattendanceData|Name_of_Training__c', 'trainingattendanceData|Training_Type__c', 'trainingattendanceData|Other_Training_Category_Narrative__c', 'trainingattendanceData|Completed_Date__c', 'trainingattendanceData|Scheduled_Date__c', 'trainingattendanceData|Hours_Attended__c', 'trainingattendanceData|Training_Attendance_Description__c', 'trainingattendanceData|Training_Provider__c', 'trainingattendanceData|Specialized_Training__c', 'trainingattendanceData|Status__c', 'trainingattendanceData|Pre_Post_Approval_Training__c', 'trainingattendanceData|Training_due_to_CAP__c', 'trainingattendanceData|Other_Training_Provider_Narrative__c', 'trainingattendanceData|CreatedById', 'trainingattendanceData|LastModifiedById']
    @track isSpinner = true;
    renderedflag = false;
    @api isPageValid = false;
    @track recordList = [];
    oldRecordList = [];
    recordFound = false;
    objHierarchy=[];
    levelIndexes=[];
    upsertRecordMap = new Map();
    deleteRecordMap = new Map();
    upsertSobjectMap = new Map();
    deleteSobjectMap = new Map();
    tempUpsertRecordMap=new Map();
    tempUpsertSobjectMap=new Map();
    tempOldMsgMap=new Map();
    responseData={};
    relationshipMap = new Map();
    recordMap = new Map();
    decoupledMap = new Map();
    modifiedFieldMap = new Map();
    @track isKreatorScreen = true;
    @track dataObject = {};
    existingObjSet = new Set();
    isMultiParentVersion=true;
    Constants = pageConstants();
    junctionObjectList=[];
    parentMap=new  Map();
    objectNameRecordLstMap=new Map();
    filterObjNameFieldsMap=new Map();
    recordPathKeyMap = new Map();
    @track wireLoadStatus = { trainingattendancePicklistValues: false };

    @track _loadPage = false;
	get loadPage() {
		return this._loadPage;
	}

	set loadPage(value) {
		this._loadPage = value;
	}
    chidlRecordNamesLst =  [{"isMultiRecord":false,"objectName":"Training_Attendance__c","relationShipName":null}];
cares_TrainingDetailsaccordionGroup0OpenSecs = ['accordionsection01carestrainingdetailsaccordiongroup0'];
    @wire (CurrentPageReference) pageRef;
    @wire(getRecord, { recordId: '$recordId', fields: ['RecordType.Id'] }) 
    trainingattendancerecord({data}) {
        if(data){
            this.trainingattendanceRecordTypeId = data.recordTypeId;
        }
    }
    @wire(getPicklistValuesByRecordType, { objectApiName: TRAININGATTENDANCE_OBJECT, recordTypeId: '$trainingattendanceRecordTypeId' })
    trainingattendancePicklistValues({ data, error }) {
        if(data){
            this.pickListInfo.TrainingDetails_Training_Type__c1 = data?.picklistFieldValues?.Training_Type__c?.values;
            this.pickListInfo.TrainingDetails_Training_Provider__c9 = data?.picklistFieldValues?.Training_Provider__c?.values;
            this.pickListInfo.TrainingDetails_Specialized_Training__c10 = data?.picklistFieldValues?.Specialized_Training__c?.values;
            this.pickListInfo.TrainingDetails_Status__c12 = data?.picklistFieldValues?.Status__c?.values;
            this.pickListInfo.TrainingDetails_Pre_Post_Approval_training__c13 = data?.picklistFieldValues?.Pre_Post_Approval_Training__c?.values;
            this.pickListInfo.TrainingDetails_Training_due_to_CAP__c8 = data?.picklistFieldValues?.Training_due_to_CAP__c?.values;
            setWireStatus(this,'trainingattendancePicklistValues');
        }
        if(error){
        }
    }
    @track tempRecordLst;
    /* Page Variables */
    pageVariableSet = new Set(['recordId','trainingattendanceId','ApplicationParticipantFilter','RFHParticipantFilter','DisableSelectParticipant','DisableParticipant','ackToCopilot','copilotData']);
        @api trainingattendanceId = "";
        @track ApplicationParticipantFilter = "";
        @track RFHParticipantFilter = "";
        @track DisableSelectParticipant = true;
        @track DisableParticipant = true;
    @track pageVariableObj = {
        isGridHiddenRule:{}
    }
    validationActionData = {
        Training_Attendance__c: {
            Completed_Date__c : {
                validationInputs : {completedDateFormatValidation: {}},
                validationLevel : {completedDateFormatValidation:"field"},
                errorMsgList : {completedDateFormatValidation:"Please make sure date is in the following format M/D/YYYY"},
                executeAllValidations : true,
                validationList : ["completedDateFormatValidation"],
                eventType : {completedDateFormatValidation:this.Constants.ONCHANGE},
                validationTriggerFields : ["Completed_Date__c","Completed_Date__c","Scheduled_Date__c","Scheduled_Date__c"]
            },
            Scheduled_Date__c : {
                validationInputs : {completedDateFormatValidation: {}},
                validationLevel : {completedDateFormatValidation:"field"},
                errorMsgList : {completedDateFormatValidation:"Please make sure date is in the following format M/D/YYYY"},
                executeAllValidations : true,
                validationList : ["completedDateFormatValidation"],
                eventType : {completedDateFormatValidation:this.Constants.ONCHANGE}
            }
        }
    }
    createRecordTemplateObj = {
	    Training_Attendance__c:{
		    fieldMapping : {}
	    }
    }
    paramsObject = {
        'customImplementationHelper':{
            'eventData' : undefined
        },
        'handleSaveRecordResponse' : {
            'eventData' : undefined
        }
    }
	handleCustomActions(event) {
        if (event.detail.name === "Save") {
            this.paramsObject.handleSaveRecordResponse.eventData = event;
            handleSaveRecordResponse(this);
        }
        this.paramsObject.customImplementationHelper.eventData = event;
        customImplementationHelper(this);
	}

    handleQueueEvaluation() {
        const valueChangeEvent =  new CustomEvent('inputdatachange', {
            detail: {}
        });
        this.dispatchEvent(valueChangeEvent);
    }

	handlePageSetup() {
        //Imperative method to get picklist values in page
	}

	connectedCallback() {
        populatePageVaraiblesFromUrl(this);
		connectedCallbackHelper(this);
        this.handleLoad();
		subscribeKreatorMessageChannel(this, kreatorMessageChannelHandler);
    }

    disconnectedCallback() {
		unsubscribeKreatorMessageChannel(this);
        onBeforeUnloadHandler(this);
	}

    @api
    handleLoad() {
        this.isSpinner = true;
        this.oldDBMsgMap.clear();
        const bindVariableString = [{'key':'recordId','value':this.recordId,'isEncrypted':false}, {'key':'trainingattendanceId','value':this.trainingattendanceId,'isEncrypted':false}];
        decodeBindVariable(bindVariableString);
        fetchRecordsFromMetadata({queryInfo:'QF_cares_ScreenTrainingDetails',bindVariableString:JSON.stringify(bindVariableString)})
            .then(data=>{
                this.tempData = data;
                this.tempRecordLst = data.sobjectLst;
                this.loadQueryInfo = {queryInfo:'QF_cares_ScreenTrainingDetails',bindVariableString:JSON.stringify(bindVariableString)};
                createDataObjStructure(this);
                if(data.isSuccess) {              
                    this.fetchRecordFromApex = true;
                    this.callCreateHelper = true; 
                }
                if(!data.isSuccess){
                }
				publishKreatorMessageChannel(this);
        		this.handlePageSetup();
            })
            .catch(error=>{
                this.isSpinner = false;
            })
        this.isRendered = true;
    }
    
	handleLayoutSettings(record) {
        this.loadPage=false;
        this.handleRequiredRule(record);
        this.handleDisabledRule(record);
        this.handleHiddenRule(record);
        this.handleReadOnlyRule(record);
        this.handleExpressions(record);
        this.loadPage=true;
    }

    handleRequiredRule(record) {
		if(record?.attributes?.type === 'Training_Attendance__c'){
            record.isRequiredRule.isTrainingDetails_Name_of_Training__c0Required =  true;
            record.isRequiredRule.isTrainingDetails_Training_Type__c1Required =  false;
            record.isRequiredRule.isTrainingDetails_Other_Training_Category_Narrative__c2Required =  record.Training_Type__c === 'Other';
            record.isRequiredRule.isCompletedDateRequired =  record.Status__c === 'Completed';
            record.isRequiredRule.isTrainingDetails_Hours_Attended__c6Required =  record.Status__c === 'Completed';
            record.isRequiredRule.isTrainingDetails_Training_Attendance_Description__c7Required =  false;
            record.isRequiredRule.isTrainingDetails_Training_Provider__c9Required =  false;
            record.isRequiredRule.isTrainingDetails_Specialized_Training__c10Required =  false;
            record.isRequiredRule.isTrainingDetails_Status__c12Required =  false;
            record.isRequiredRule.isTrainingDetails_Pre_Post_Approval_training__c13Required =  false;
            record.isRequiredRule.isTrainingDetails_Training_due_to_CAP__c8Required =  false;
            record.isRequiredRule.isTrainingDetails_Other_Training_Provider_Narrative__c11Required =  true;
        }
    }

   handleDisabledRule(record) {
        const trainingattendancecFieldsToCheck = [  
             { field: 'Status__c', isDisabledField: 'isTrainingDetails_Status__c12Disabled', resetValue: '', clearDisabledValue : false, condition: true}  , 
             { field: 'Pre_Post_Approval_Training__c', isDisabledField: 'isTrainingDetails_Pre_Post_Approval_training__c13Disabled', resetValue: '', clearDisabledValue : false, condition: true}  
        ];
        const fieldsToCheckMap = {
            'Training_Attendance__c' : trainingattendancecFieldsToCheck
        };
        const fieldsToCheck = fieldsToCheckMap[record?.attributes?.type];
        if (fieldsToCheck) {
        fieldsToCheck.forEach(dataForDisabledRule => {
            checkAndDisableField(this, record, dataForDisabledRule);
        });
    }
    }    

    handleReadOnlyRule(record) {
		if(record.attributes.type === 'Training_Attendance__c') {
            record.isReadOnlyRule && (record.isReadOnlyRule.isSystemInformation_CreatedById0ReadOnly =  true);               
            record.isReadOnlyRule && (record.isReadOnlyRule.isSystemInformation_LastModifiedById2ReadOnly =  true);               
        }
    }

    handleHiddenRule(record) {
        const trainingattendancecFieldsToCheck = [
            { ruleName:  'isTrainingDetails_Other_Training_Category_Narrative__c2Hidden', condition : record.Training_Type__c !== 'Other', fieldName : 'Other_Training_Category_Narrative__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isGrid11Hidden', condition :(this.recordMap.get('Training_Attendance__c').Organization__c === null) } ,                
            { ruleName:  'isGrid1Hidden', condition :!(this.recordMap.get('Training_Attendance__c').Organization__c === null) } ,                
            { ruleName:  'isGrid121Hidden', condition :(this.recordMap.get('Training_Attendance__c').Pre_Post_Approval_Training__c === "Pre-Approval") } ,                
            { ruleName:  'isGrid122Hidden', condition :!(this.recordMap.get('Training_Attendance__c').Training_Provider__c === 'Other') } ,                
            { ruleName:  'isbuttonGroupHidden', condition :this.pageLevelReadOnly } 
        ];
        const hiddenFieldsToCheckMap = {
                    'Training_Attendance__c' : trainingattendancecFieldsToCheck 
        };
        const hiddenFieldsToCheck = hiddenFieldsToCheckMap[record?.attributes?.type];
        if (hiddenFieldsToCheck) {
                hiddenFieldsToCheck.forEach(dataForHiddenRule => {
                setHiddenRule(this, record, dataForHiddenRule);
            });  
        }
}              
    

    handleExpressions(record) {
        if(record.attributes.type === 'Training_Attendance__c') {
            this.validationActionData['Training_Attendance__c']['Completed_Date__c'].validationInputs.completedDateFormatValidation.validationExpression = new Date(record.Completed_Date__c).toLocaleDateString() !== new Date(record.Completed_Date__c).toLocaleDateString('en-US');
            this.validationActionData['Training_Attendance__c']['Scheduled_Date__c'].validationInputs.completedDateFormatValidation.validationExpression = new Date(record.Completed_Date__c).toLocaleDateString() !== new Date(record.Completed_Date__c).toLocaleDateString('en-US');
        }
    }


    handleCancel() {
        this.upsertRecordMap.clear();
        this.upsertSobjectMap.clear();
        this.iscares_ScreenTrainingDetails = false;
        this.handleLoad();
    }



	handleInputDataChangeEvent(event) {
        const recordData = handleChange(this,event);
        validateInputData(recordData, this.Constants.ONCHANGE, this);
        onChangeHandler(this,recordData,event);
    }

    handleInputDataBlurEvent(event) {
        const recordData = handleChange(this,event);
        validateInputData(recordData, this.Constants.ONBLUR, this);
        onBlurHandler(this,recordData,event);
    }
    
    handleInputDataSaveEvent(event) {
        if(event.currentTarget.dataset.lwcId.includes(this.Constants.PAGE_VAR)){
            evaluatePageVariable(this,event)
        }
        else{
		    const recordData = handleChange(this,event,true);
		    validateInputData(recordData,this.Constants.ONSAVE,this);
        }
	}
	renderedCallback() {
  		if (!this.renderedflag) {
			Promise.all([
                loadStyle(this, globalCssResource),
                loadStyle(this, kreatorBaseComponentsStyle)
	        ]).catch(error => {
	            this.template.querySelector(this.Constants.NOTIFICATION).updateValues(this.Constants.ERROR_STATUS, 'Error loading style', error.message);
	        });  
			this.renderedflag = true;
		}
        renderedCallbackModule(this);
        renderedCallbackHelper(this);
    }

	importedComponentFieldMapping = {
			ParticipantComboBox:{fieldValue:'Training_Attendance__c|Application_Related_Person__c'},SelectParticipantComboBox:{fieldValue:'Training_Attendance__c|RFH_Participant__c'}
	}
	handleImportedComponentEvt(event) {
	    addImportedCompValuesToRecord(this,event);
	    handleImportedCompEvtHelper(this,event);
	}
}
