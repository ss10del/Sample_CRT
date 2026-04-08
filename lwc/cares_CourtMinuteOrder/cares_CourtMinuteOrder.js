const NUM_0 = 0;
/*
    Name:  cares_CourtMinuteOrder
    Description: This component is used to create court minute order records.
    Date                         Developer                           Description
    01/27/2025          Vishal/Deloitte                  Regeneration
    05/16/2025          Nandini/Deloitte                 CARESV1-74862 - Modifed incorrect hidden rule conditions
    06/25/2025          Subhendu/Deloitte                CARESV1-79320 -Modified populateParentFilter method
    07/29/2025          Sukesh/Deloitte                  CARESV1-50729: Courts_M16_M17_M18_AddCourtMinuteOrder_054
    11/05/2025  		Jai/Deloitte					 CARESV1-94160
    11/14/2025          Pranav/Deloitte                  CARESV1-93026
    01/07/2026          Harini/Deloitte          CARESV1-101376

*/
import { LightningElement, track, api, wire } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import kreatorBaseComponentsStyle from '@salesforce/resourceUrl/kreatorBaseComponentsStyle';
import globalCssResource from '@salesforce/resourceUrl/Theme';
import { getRecord } from 'lightning/uiRecordApi'

import {populatePageVaraiblesFromUrl,populateObjectNameRecordLstMap,decodeBindVariable,handlePickList,checkAndDisableField} from 'c/kreatorUtilityComponent';
import {subscribeKreatorMessageChannel, unsubscribeKreatorMessageChannel, publishKreatorMessageChannel,addImportedCompValuesToRecord} from 'c/kreatorGenericUtilityComponents';
/**** Helper responses Import ****/
import { onLoadHandler, kreatorMessageChannelHandler, handleSaveResponse, createRecords, handleImportedCompEvtHelper } from './cares_CourtMinuteOrderHelper';
// EMPTY_IMPORT: auto-commented empty helper imports
// import { onBeforeUnloadHandler, customImplementationHelper, renderedCallbackHelper, connectedCallbackHelper, onBlurHandler, onChangeHandler } from './cares_CourtMinuteOrderHelper';
import fetchRecordsFromMetadata from '@salesforce/apex/KreatorGenericController.fetchRecordsFromMetadata';
// PMD Fix: Added evaluatePageVariable import to fix 'no-undef' rule
import { renderedCallbackModule, getParentChildMap, createDataObjStructure,processDataNew, handleChange, validateInputData, checkFLSForRules, formatName, setWireStatus, disableDependentPicklist, setHiddenRule, evaluatePageVariable } from 'c/kreatorQueryFrameworkModule';
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
import COURTMINUTEORDER_OBJECT from '@salesforce/schema/Court_Minute_Order__c';
import { MessageContext } from 'lightning/messageService';
import { getObjectInfos, getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import { CurrentPageReference,NavigationMixin } from 'lightning/navigation';


import { getLogger } from 'c/logger';

import synchronousDML from '@salesforce/label/c.CARES_Exception_Synchronous_Dml';


export default class Cares_CourtMinuteOrder extends NavigationMixin(LightningElement) {
logger = getLogger();

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
    kreatorScreenName = 'cares_CourtMinuteOrder';
    @api ackToCopilot;
    @api copilotData;
    
    @wire(MessageContext)
    messageContext;

    @api courtminuteorderRecordTypeId;
    selectedRecord;
    deleteRecordLst = [];
    objectApiNames = [COURTMINUTEORDER_OBJECT]
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
            createRecords(this,'Court_Minute_Order__c');
            populateObjectNameRecordLstMap(this);
            onLoadHandler(this);
            getParentChildMap(this);
            this.isSpinner = false;
            this.loadPage = true;
            this.iscares_CourtMinuteOrder = true;
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
        Hearing_Type1 : [],
	    The_Application_is__c : [],
	    Copy_of_Order_to_be_Given_By__c : [],
	    Request_to_Transfer_to_Tribal_Court__c : [],
	    Denial_of_transfer_to_Tribal_Court__c : [],
	    Either_of__c : [],
	    Transfer_declined_by_tribal_court__c : [],
	    Good_cause_exists_for_denying_transfer__c : [],
	    Has_Potential_Tribal_Affiliation__c : [],
	    Placement_evidence_testimony_presented__c : [],
	    Good_cause_under_ICWA__c : [],
	    Basis_for_good_cause__c : [],
	    Basis_for_Good_cause_Type__c : [],
	    Court_informed_of_ID_card_Possession__c : [],
	    Parentage_Determined_for__c : [],
	    Are_Needs_being_met__c : [],
	    Is_the_level_of_Care_Consistent__c : [],
	    Placement_Provides__c : [],
	    Does_information_align_with_WIC_36131__c : [],
	    Is_STRTP_or_CTF_Identified_Approved__c : [],
	    Placement_promotes_child_best_interest__c : [],
	    Signed_Statement_has_Been_Provided__c : [],
	    Reasonable_Efforts__c : [],
	    In_NM_s_Best_Interests__c : [],
	    The_requirements_of_WIC_607_5_were_met__c : [],
	    NMD_informed_about_the_right_to_choose__c : [],
	    NMD_wants_ICWA_to_continue_to_apply__c : [],
	    Picklist8 : [],
	    Picklist9 : [],
	    Picklist10 : [],
	    Picklist11 : [],
	    Picklist12 : [],
	    Picklist13 : [],
	    Picklist14 : [],
	    Picklist15 : [],
	    Picklist16 : [],
	    Picklist17 : [],
	    Picklist18 : [],
	    Picklist19 : [],
	    Picklist20 : [],
	    Picklist21 : [],
	    Picklist2 : [],
	    Picklist3 : [],
	    Picklist4 : [],
	    Picklist5 : [],
	    Court_Minute_Order__c_Court_Denies_JV_472_Request_Findings__c_40d : [],
	    Court_Minute_Order__c_Consent_of_TPR_Rights_was_Executed__c_157 : [],
	    Court_Minute_Order__c_Indian_Family_Active_Efforts_Outcome__c_3d2 : [],
	    Court_Minute_Order__c_Qualified_Expert_Witness_Considered__c_e0d : [],
	    Court_Minute_Order__c_Court_Order_Status__c_f93 : [],
	    Court_Minute_Order__c_Court_Ordered_Special_program__c_ae7 : [],
	    Court_Minute_Order__c_Primary_Responsible_Agency__c_0ea : [],
	    Court_Minute_Order__c_Secondary_Responsible_Agency__c_ef9 : [],
	    Court_Minute_Order__c_Termination_of_Jurisdiction_Reason__c_e4c : [],
        Court_Minute_Order__c_Termination_of_Jurisdiction_Sub_Reason__c_5b0 : {values:'',controllerValues:'',controller:'Court_Minute_Order__c_Termination_of_Jurisdiction_Reason__c_e4c'},
	    Picklist6 : [],
	    Picklist7 : [],
        Court_Minute_Order__c_Legal_Authority_for_Placement__c_17c : []

    }
    @api recordId;
    @api isRendered;
    // PMD Fix: Changed string 'true' to boolean true to fix '@api' type mismatch
    @api iscares_CourtMinuteOrder = false;
    @track tempList = [];
    @track inputCmpIds = ['courtminuteorderData|Hearing_Type__c', 'courtminuteorderData|Other_Finding_Details__c', 'courtminuteorderData|Items_not_served_timely_per_statute__c', 'courtminuteorderData|Proper_Notice_Not_Given_to__c', 'courtminuteorderData|Court_Date_Reasonable_Efforts_Made__c', 'courtminuteorderData|Court_Date_Reasonable_Efforts_Not_Made__c', 'courtminuteorderData|The_Application_is__c', 'courtminuteorderData|Specify_All_Modifications_Conditions__c', 'courtminuteorderData|Reason_for_Denial__c', 'courtminuteorderData|Resubmitted_Missing_Information__c', 'courtminuteorderData|Applicant_Resubmitted_Date__c', 'courtminuteorderData|Other_Person_Details__c', 'courtminuteorderData|Copy_of_Order_to_be_Given_By__c', 'courtminuteorderData|JV_180_Other_Denial__c', 'courtminuteorderData|Request_to_Transfer_to_Tribal_Court__c', 'courtminuteorderData|Denial_of_transfer_to_Tribal_Court__c', 'courtminuteorderData|Either_of__c', 'courtminuteorderData|Transfer_declined_by_tribal_court__c', 'courtminuteorderData|Good_cause_exists_for_denying_transfer__c', 'courtminuteorderData|Has_Potential_Tribal_Affiliation__c', 'courtminuteorderData|Tribe_Name__c', 'courtminuteorderData|Placement_evidence_testimony_presented__c', 'courtminuteorderData|Good_cause_under_ICWA__c', 'courtminuteorderData|Basis_for_good_cause__c', 'courtminuteorderData|Basis_for_Good_cause_Type__c', 'courtminuteorderData|Date_court_was_informed__c', 'courtminuteorderData|Court_informed_of_ID_card_Possession__c', 'courtminuteorderData|Parentage_Determined_for__c', 'courtminuteorderData|Parentage_Determined_for_Details__c', 'courtminuteorderData|Legal_Authority_for_Placement__c', 'courtminuteorderData|Other_Kin_Details__c', 'courtminuteorderData|Proposed_Placement_Name__c', 'courtminuteorderData|Located_at__c', 'courtminuteorderData|Expedited_Placement_Criteria_Details__c', 'courtminuteorderData|Are_Needs_being_met__c', 'courtminuteorderData|Is_the_level_of_Care_Consistent__c', 'courtminuteorderData|Placement_Provides__c', 'courtminuteorderData|Does_information_align_with_WIC_36131__c', 'courtminuteorderData|Is_STRTP_or_CTF_Identified_Approved__c', 'courtminuteorderData|Placing_Agencys_JV235_Filed_Date__c', 'courtminuteorderData|Placement_promotes_child_best_interest__c', 'courtminuteorderData|Good_Cause_Exists_for_Continuance__c', 'courtminuteorderData|Signed_Statement_has_Been_Provided__c', 'courtminuteorderData|Other_Reason__c', 'courtminuteorderData|State_Specified_Modifications__c', 'courtminuteorderData|Other_Reason_FC_was_Denied__c', 'courtminuteorderData|Reasonable_Efforts__c', 'courtminuteorderData|In_NM_s_Best_Interests__c', 'courtminuteorderData|The_requirements_of_WIC_607_5_were_met__c', 'courtminuteorderData|NMD_informed_about_the_right_to_choose__c', 'courtminuteorderData|NMD_wants_ICWA_to_continue_to_apply__c', 'courtminuteorderData|Other_Party_Details__c', 'courtminuteorderData|Other_Informed_Party__c', 'courtminuteorderData|Other_Waived_Rights__c', 'courtminuteorderData|Other_Active_Party__c', 'courtminuteorderData|Other_Non_Active_Party__c', 'courtminuteorderData|Other_Non_Required_Party__c', 'courtminuteorderData|Reasonable_Efforts_Return_Child__c', 'courtminuteorderData|Mother_Level_Progres__c', 'courtminuteorderData|Father_Level_Progress__c', 'courtminuteorderData|Biolog_Father_Level__c', 'courtminuteorderData|LegGuardian_Level__c', 'courtminuteorderData|IndianCustodian_Level__c', 'courtminuteorderData|Other_Level_Progress__c', 'courtminuteorderData|Other_Progress_Party__c', 'courtminuteorderData|Parental_Education_Rights__c', 'courtminuteorderData|Par_Education_Rights__c', 'courtminuteorderData|Unmeet_Needs_16__c', 'courtminuteorderData|Unmeet_Needs_16__c', 'courtminuteorderData|Unmet_Needs_17__c', 'courtminuteorderData|Unmeet_Need_Details17__c', 'courtminuteorderData|Add_Ser_Details__c', 'courtminuteorderData|Add_Ser_Details2__c', 'courtminuteorderData|Add_Ser_De3__c', 'courtminuteorderData|Add_Ser5__c', 'courtminuteorderData|Add_Ser_7__c', 'courtminuteorderData|Coun_Ser_Prevent__c', 'courtminuteorderData|Ev_Other_1__c', 'courtminuteorderData|Eve_Other2__c', 'courtminuteorderData|PostSec_Ed_Ser_Details__c', 'courtminuteorderData|Other_Prog_Plac__c', 'courtminuteorderData|Oth_Prog_Mad_Twards__c', 'courtminuteorderData|Other_Prog_Made__c', 'courtminuteorderData|Ind_1_Imp__c', 'courtminuteorderData|Ind_2_Imp__c', 'courtminuteorderData|Oth_Child_Needs_Dec__c', 'courtminuteorderData|Barriers_to_Provide_Inf__c', 'courtminuteorderData|Ant_Adult_Ach_Date__c', 'courtminuteorderData|youth_perm_plan__c', 'courtminuteorderData|Other_Perm_Plan_Details__c', 'courtminuteorderData|Oth_Compelling_Placement__c', 'courtminuteorderData|Case_Plan_Add_Stated__c', 'courtminuteorderData|Case_Plan_Add_Info__c', 'courtminuteorderData|Reason_Perm_Liv_Arr__c', 'courtminuteorderData|Other_Living_Arr__c', 'courtminuteorderData|Mit_Cause_1__c', 'courtminuteorderData|Mit_Cause_2__c', 'courtminuteorderData|Likely_Date_for_Safe__c',  'courtminuteorderData|Other_Basis_for_Court_Determination__c', 'courtminuteorderData|Court_Denies_JV_472_Request_Findings__c', 'courtminuteorderData|Denial_Reason__c', 'courtminuteorderData|Minute_Order_Details__c', 'courtminuteorderData|Consent_of_TPR_Rights_was_Executed__c', 'courtminuteorderData|Indian_Family_Active_Efforts_Outcome__c', 'courtminuteorderData|Qualified_Expert_Witness_Considered__c', 'courtminuteorderData|Court_Order_Status__c', 'courtminuteorderData|Court_Ordered_Special_program__c', 'courtminuteorderData|Special_program_details__c', 'courtminuteorderData|State_Specific_JV_180_Modifications__c', 'courtminuteorderData|As_Recommended_with_Modifications_Reason__c', 'courtminuteorderData|Contrary_to_Recommendations_Reason__c', 'courtminuteorderData|Primary_Responsible_Agency__c', 'courtminuteorderData|Secondary_Responsible_Agency__c', 'courtminuteorderData|TerminatedParentedIds__c', 'courtminuteorderData|Date_of_Termination_of_Jurisdiction__c', 'courtminuteorderData|Termination_of_Jurisdiction_Reason__c', 'courtminuteorderData|Termination_of_Jurisdiction_Details__c', 'courtminuteorderData|Termination_of_Jurisdiction_Sub_Reason__c', 'courtminuteorderData|Specify_Modifications_and_Conditions_220__c', 'courtminuteorderData|JV_220_Application_Resubmission_Reason__c', 'courtminuteorderData|Specify_Modifications_and_Conditions_Psy__c', 'courtminuteorderData|Specify_Reason_for_Denial__c', 'courtminuteorderData|Transfer_In_County_Name__c', 'courtminuteorderData|Transfer_Out_County_Name__c', 'courtminuteorderData|Transfer_In_Date_and_Time__c', 'courtminuteorderData|Transfer_Out_Date_and_Time__c', 'courtminuteorderData|Next_Scheduled_Hearing__c', 'courtminuteorderData|CreatedById', 'courtminuteorderData|LastModifiedById']
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
    @track wireLoadStatus = { courtminuteorderPicklistValues: false };

    @track _loadPage = false;
	get loadPage() {
		return this._loadPage;
	}

	set loadPage(value) {
		this._loadPage = value;
	}
    chidlRecordNamesLst =  [{"isMultiRecord":false,"objectName":"Court_Minute_Order__c","relationShipName":null}];
ACCORDIONGROUP87bcfbOpenSecs = ['accordionsection1accordiongroup87bcfb'];
AccordionGroup151OpenSecs = ['accordiongroup1511'];
AccordionGroup8OpenSecs = ['accordionsection1accordiongroup8'];
AccordionGroup7OpenSecs = ['accordionsection1accordiongroup7'];
AccordionGroup131OpenSecs = ['accordiongroup1311'];
AccordionGroup9OpenSecs = ['accordionsection1accordiongroup9'];
AccordionGroup81OpenSecs = ['accordiongroup811'];
ACCORDIONGROUP57f7f21OpenSecs = ['accordiongroup57f7f211'];
AccordionGroup2OpenSecs = ['accordionsection1accordiongroup2'];
AccordionGroup1OpenSecs = ['accordionsection1accordiongroup1'];
AccordionGroup4OpenSecs = ['accordionsection1accordiongroup4'];
AccordionGroup3OpenSecs = ['accordionsection1accordiongroup3'];
AccordionGroup6OpenSecs = ['accordionsection1accordiongroup6'];
ACCORDIONGROUPba1d17OpenSecs = ['accordionsection1accordiongroupba1d17'];
AccordionGroup5OpenSecs = ['accordionsection1accordiongroup5'];
AccordionGroup16OpenSecs = ['accordionsection1accordiongroup16'];
AccordionGroup17OpenSecs = ['accordionsection1accordiongroup17'];
ACCORDIONGROUP57f7f2OpenSecs = ['accordionsection1accordiongroup57f7f2'];
AccordionGroup18OpenSecs = ['accordionsection1accordiongroup18'];
AccordionGroup12OpenSecs = ['accordionsection1accordiongroup12'];
AccordionGroup13OpenSecs = ['accordionsection1accordiongroup13'];
AccordionGroup14OpenSecs = ['accordionsection1accordiongroup14'];
AccordionGroup15OpenSecs = ['accordionsection1accordiongroup15'];
ACCORDIONGROUP970c0cOpenSecs = ['null1'];
AccordionGroup10OpenSecs = ['accordionsection1accordiongroup10'];
AccordionGroup11OpenSecs = ['accordionsection1accordiongroup10'];
    @wire (CurrentPageReference) pageRef;
    @wire(getRecord, { recordId: '$recordId', fields: ['RecordType.Id'] }) 
    courtminuteorderrecord({data}) {
        if(data){
            this.courtminuteorderRecordTypeId = data.recordTypeId;
        }
    }
    @wire(getPicklistValuesByRecordType, { objectApiName: COURTMINUTEORDER_OBJECT, recordTypeId: '$courtminuteorderRecordTypeId' })
    courtminuteorderPicklistValues({ data, error }) {
        if(data){
            this.pickListInfo.Hearing_Type1 = data?.picklistFieldValues?.Hearing_Type__c?.values;
            this.pickListInfo.The_Application_is__c = data?.picklistFieldValues?.The_Application_is__c?.values;
            this.pickListInfo.Copy_of_Order_to_be_Given_By__c = data?.picklistFieldValues?.Copy_of_Order_to_be_Given_By__c?.values;
            this.pickListInfo.Request_to_Transfer_to_Tribal_Court__c = data?.picklistFieldValues?.Request_to_Transfer_to_Tribal_Court__c?.values;
            this.pickListInfo.Denial_of_transfer_to_Tribal_Court__c = data?.picklistFieldValues?.Denial_of_transfer_to_Tribal_Court__c?.values;
            this.pickListInfo.Either_of__c = data?.picklistFieldValues?.Either_of__c?.values;
            this.pickListInfo.Transfer_declined_by_tribal_court__c = data?.picklistFieldValues?.Transfer_declined_by_tribal_court__c?.values;
            this.pickListInfo.Good_cause_exists_for_denying_transfer__c = data?.picklistFieldValues?.Good_cause_exists_for_denying_transfer__c?.values;
            this.pickListInfo.Has_Potential_Tribal_Affiliation__c = data?.picklistFieldValues?.Has_Potential_Tribal_Affiliation__c?.values;
            this.pickListInfo.Placement_evidence_testimony_presented__c = data?.picklistFieldValues?.Placement_evidence_testimony_presented__c?.values;
            this.pickListInfo.Good_cause_under_ICWA__c = data?.picklistFieldValues?.Good_cause_under_ICWA__c?.values;
            this.pickListInfo.Basis_for_good_cause__c = data?.picklistFieldValues?.Basis_for_good_cause__c?.values;
            this.pickListInfo.Basis_for_Good_cause_Type__c = data?.picklistFieldValues?.Basis_for_Good_cause_Type__c?.values;
            this.pickListInfo.Court_informed_of_ID_card_Possession__c = data?.picklistFieldValues?.Court_informed_of_ID_card_Possession__c?.values;
            this.pickListInfo.Parentage_Determined_for__c = data?.picklistFieldValues?.Parentage_Determined_for__c?.values;
            this.pickListInfo.Are_Needs_being_met__c = data?.picklistFieldValues?.Are_Needs_being_met__c?.values;
            this.pickListInfo.Is_the_level_of_Care_Consistent__c = data?.picklistFieldValues?.Is_the_level_of_Care_Consistent__c?.values;
            this.pickListInfo.Placement_Provides__c = data?.picklistFieldValues?.Placement_Provides__c?.values;
            this.pickListInfo.Does_information_align_with_WIC_36131__c = data?.picklistFieldValues?.Does_information_align_with_WIC_36131__c?.values;
            this.pickListInfo.Is_STRTP_or_CTF_Identified_Approved__c = data?.picklistFieldValues?.Is_STRTP_or_CTF_Identified_Approved__c?.values;
            this.pickListInfo.Placement_promotes_child_best_interest__c = data?.picklistFieldValues?.Placement_promotes_child_best_interest__c?.values;
            this.pickListInfo.Signed_Statement_has_Been_Provided__c = data?.picklistFieldValues?.Signed_Statement_has_Been_Provided__c?.values;
            this.pickListInfo.Reasonable_Efforts__c = data?.picklistFieldValues?.Reasonable_Efforts__c?.values;
            this.pickListInfo.In_NM_s_Best_Interests__c = data?.picklistFieldValues?.In_NM_s_Best_Interests__c?.values;
            this.pickListInfo.The_requirements_of_WIC_607_5_were_met__c = data?.picklistFieldValues?.The_requirements_of_WIC_607_5_were_met__c?.values;
            this.pickListInfo.NMD_informed_about_the_right_to_choose__c = data?.picklistFieldValues?.NMD_informed_about_the_right_to_choose__c?.values;
            this.pickListInfo.NMD_wants_ICWA_to_continue_to_apply__c = data?.picklistFieldValues?.NMD_wants_ICWA_to_continue_to_apply__c?.values;
            this.pickListInfo.Picklist8 = data?.picklistFieldValues?.Reasonable_Efforts_Return_Child__c?.values;
            this.pickListInfo.Picklist9 = data?.picklistFieldValues?.Mother_Level_Progres__c?.values;
            this.pickListInfo.Picklist10 = data?.picklistFieldValues?.Father_Level_Progress__c?.values;
            this.pickListInfo.Picklist11 = data?.picklistFieldValues?.Biolog_Father_Level__c?.values;
            this.pickListInfo.Picklist12 = data?.picklistFieldValues?.LegGuardian_Level__c?.values;
            this.pickListInfo.Picklist13 = data?.picklistFieldValues?.IndianCustodian_Level__c?.values;
            this.pickListInfo.Picklist14 = data?.picklistFieldValues?.Other_Level_Progress__c?.values;
            this.pickListInfo.Picklist15 = data?.picklistFieldValues?.Parental_Education_Rights__c?.values;
            this.pickListInfo.Picklist16 = data?.picklistFieldValues?.Par_Education_Rights__c?.values;
            this.pickListInfo.Picklist17 = data?.picklistFieldValues?.Unmeet_Needs_16__c?.values;
            this.pickListInfo.Picklist18 = data?.picklistFieldValues?.Unmet_Needs_17__c?.values;
            this.pickListInfo.Picklist19 = data?.picklistFieldValues?.Coun_Ser_Prevent__c?.values;
            this.pickListInfo.Picklist20 = data?.picklistFieldValues?.Ev_Other_1__c?.values;
            this.pickListInfo.Picklist21 = data?.picklistFieldValues?.Eve_Other2__c?.values;
            this.pickListInfo.Picklist2 = data?.picklistFieldValues?.Barriers_to_Provide_Inf__c?.values;
            this.pickListInfo.Picklist3 = data?.picklistFieldValues?.youth_perm_plan__c?.values;
            this.pickListInfo.Picklist4 = data?.picklistFieldValues?.Case_Plan_Add_Stated__c?.values;
            this.pickListInfo.Picklist5 = data?.picklistFieldValues?.Reason_Perm_Liv_Arr__c?.values;
            this.pickListInfo.Court_Minute_Order__c_Court_Denies_JV_472_Request_Findings__c_40d = data?.picklistFieldValues?.Court_Denies_JV_472_Request_Findings__c?.values;
            this.pickListInfo.Court_Minute_Order__c_Consent_of_TPR_Rights_was_Executed__c_157 = data?.picklistFieldValues?.Consent_of_TPR_Rights_was_Executed__c?.values;
            this.pickListInfo.Court_Minute_Order__c_Indian_Family_Active_Efforts_Outcome__c_3d2 = data?.picklistFieldValues?.Indian_Family_Active_Efforts_Outcome__c?.values;
            this.pickListInfo.Court_Minute_Order__c_Qualified_Expert_Witness_Considered__c_e0d = data?.picklistFieldValues?.Qualified_Expert_Witness_Considered__c?.values;
            this.pickListInfo.Court_Minute_Order__c_Court_Order_Status__c_f93 = data?.picklistFieldValues?.Court_Order_Status__c?.values;
            this.pickListInfo.Court_Minute_Order__c_Court_Ordered_Special_program__c_ae7 = data?.picklistFieldValues?.Court_Ordered_Special_program__c?.values;
            this.pickListInfo.Court_Minute_Order__c_Primary_Responsible_Agency__c_0ea = data?.picklistFieldValues?.Primary_Responsible_Agency__c?.values;
            this.pickListInfo.Court_Minute_Order__c_Secondary_Responsible_Agency__c_ef9 = data?.picklistFieldValues?.Secondary_Responsible_Agency__c?.values;
            this.pickListInfo.Court_Minute_Order__c_Termination_of_Jurisdiction_Reason__c_e4c = data?.picklistFieldValues?.Termination_of_Jurisdiction_Reason__c?.values;
            this.pickListInfo.Court_Minute_Order__c_Termination_of_Jurisdiction_Sub_Reason__c_5b0.values = data?.picklistFieldValues?.Termination_of_Jurisdiction_Sub_Reason__c?.values;
            this.pickListInfo.Court_Minute_Order__c_Termination_of_Jurisdiction_Sub_Reason__c_5b0.controllerValues = data?.picklistFieldValues?.Termination_of_Jurisdiction_Sub_Reason__c?.controllerValues;
            this.pickListInfo.Picklist6 = data?.picklistFieldValues?.Transfer_In_County_Name__c?.values;
            this.pickListInfo.Picklist7 = data?.picklistFieldValues?.Transfer_Out_County_Name__c?.values;
            this.pickListInfo.Court_Minute_Order__c_Legal_Authority_for_Placement__c_17c = data?.picklistFieldValues?.Legal_Authority_for_Placement__c?.values;
            setWireStatus(this,'courtminuteorderPicklistValues');
        }
        if(error){
        }
    }
    @track tempRecordLst;
    @track eventTracker = '';
    /* Page Variables */
    pageVariableSet = new Set(['recordId','courtminuteorderId','cwiParticipantFilter','courtMinuteOrderObj','isAdHocActivityOrder','isDisableCWIParticipant','isPrimaryWorkerDisabled','primaryWorkerParentId','primaryWorkerSelection','personRelationshipId','personRelationshipSelection','ackToCopilot','copilotData']);
    @api courtminuteorderId = "";
    @track cwiParticipantFilter = "";
    @track courtMinuteOrderObj = {};
    isAdHocActivityOrder = false;
    isDisableCWIParticipant = false;
    isPrimaryWorkerDisabled = false;
    primaryWorkerParentId = "";
    @track primaryWorkerSelection = [];
    personRelationshipId = "";
    personRelationshipSelection = [];
    @track pageVariableObj = {
        isGridHiddenRule:{}
    }
    createRecordTemplateObj = {
	    Court_Minute_Order__c:{
		    fieldMapping : {}
	    }
    }
    // PMD Fix: Changed undefined to null to fix 'no-undefined' rule
    paramsObject = {
        'customImplementationHelper':{
            'eventData' : null
        },
        'handleSaveResponse' : {
            'eventData' : null
        }
    }
	handleCustomActions(event) {
        if (event.detail.name === "Button_9c8857") {
            this.paramsObject.handleSaveResponse.eventData = event;
            handleSaveResponse(this);
        }
        this.paramsObject.customImplementationHelper.eventData = event;
// EMPTY_CALL: customImplementationHelper (auto-commented)         customImplementationHelper(this);
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
// EMPTY_CALL: connectedCallbackHelper (auto-commented) 		connectedCallbackHelper(this);
        this.handleLoad();
		subscribeKreatorMessageChannel(this, kreatorMessageChannelHandler);
    }

    disconnectedCallback() {
		unsubscribeKreatorMessageChannel(this);
// EMPTY_CALL: onBeforeUnloadHandler (auto-commented)         onBeforeUnloadHandler(this);
	}

    @api
    handleLoad() {
        this.isSpinner = true;
        this.oldDBMsgMap.clear();
        const bindVariableString = [{'key':'recordId','value':this.recordId,'isEncrypted':false}, {'key':'courtminuteorderId','value':this.courtminuteorderId,'isEncrypted':false}];
        decodeBindVariable(bindVariableString);
        fetchRecordsFromMetadata({queryInfo:'QF_cares_CourtMinuteOrder',bindVariableString:JSON.stringify(bindVariableString)})
            .then(data=>{
                this.tempData = data;
                this.tempRecordLst = data.sobjectLst;
                this.loadQueryInfo = {queryInfo:'QF_cares_CourtMinuteOrder',bindVariableString:JSON.stringify(bindVariableString)};
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
            
            this.logger.error('Exception in handleLoad  of cares_CourtMinuteOrder' + JSON.stringify(error));
            this.logger.saveLog(synchronousDML);
})
        this.isRendered = true;
    }
    
	handleLayoutSettings(record, eventType) {
        this.loadPage=false;
        this.handleRequiredRule(record);
        this.handleDisabledRule(record);
        this.handleHiddenRule(record);
        this.handleReadOnlyRule(record);
        this.handleDependentPickList(record , eventType);
        this.loadPage=true;
    }

    handleRequiredRule(record, eventType){
		if(record?.attributes?.type === 'Court_Minute_Order__c'){
            record.isRequiredRule.isOther_Finding_Details__cRequired =  (record.Select_Findings__c?.includes('Other Details') || record.Additional_Finding__c?.includes('Other Details'));
            record.isRequiredRule.isItems_not_served_timely_per_statute__cRequired =  true;
            record.isRequiredRule.isProper_Notice_Not_Given_to__cRequired =  true;
            record.isRequiredRule.isCourt_Date_Reasonable_Efforts_Made__cRequired =  true;
            record.isRequiredRule.isCourt_Date_Reasonable_Efforts_Not_Made__cRequired =  true;
            record.isRequiredRule.isThe_Application_is__cRequired =  true;
            record.isRequiredRule.isSpecify_All_Modifications_Conditions__cRequired =  true;
            record.isRequiredRule.isReason_for_Denial__cRequired =  true;
            record.isRequiredRule.isResubmitted_Missing_Information__cRequired =  true;
            record.isRequiredRule.isApplicant_Resubmitted_Date__cRequired =  true;
            record.isRequiredRule.isOther_Person_Details__cRequired =  true;
            record.isRequiredRule.isCopy_of_Order_to_be_Given_By__cRequired =  true;
            record.isRequiredRule.isRequest_to_Transfer_to_Tribal_Court__cRequired =  true;
            record.isRequiredRule.isDenial_of_transfer_to_Tribal_Court__cRequired =  true;
            record.isRequiredRule.isEither_of__cRequired =  true;
            record.isRequiredRule.isTransfer_declined_by_tribal_court__cRequired =  true;
            record.isRequiredRule.isGood_cause_exists_for_denying_transfer__cRequired =  true;
            record.isRequiredRule.isHas_Potential_Tribal_Affiliation__cRequired =  true;
            record.isRequiredRule.isBasis_for_Good_cause_Type__cRequired =  true;
            record.isRequiredRule.isParentage_Determined_for__cRequired =  true;
            record.isRequiredRule.isParentage_Determined_for_Details__cRequired =  true;
            record.isRequiredRule.isOther_Kin_Details__cRequired =  true;
            record.isRequiredRule.isProposed_Placement_Name__cRequired =  true;
            record.isRequiredRule.isLocated_at__cRequired =  true;
            record.isRequiredRule.isExpedited_Placement_Criteria_Details__cRequired =  true;
            record.isRequiredRule.isAre_Needs_being_met__cRequired =  true;
            record.isRequiredRule.isIs_the_level_of_Care_Consistent__cRequired =  true;
            record.isRequiredRule.isPlacement_Provides__cRequired =  true;
            record.isRequiredRule.isDoes_information_align_with_WIC_36131__cRequired =  true;
            record.isRequiredRule.isIs_STRTP_or_CTF_Identified_Approved__cRequired =  true;
            record.isRequiredRule.isPlacing_Agencys_JV235_Filed_Date__cRequired =  true;
            record.isRequiredRule.isPlacement_promotes_child_best_interest__cRequired =  true;
            record.isRequiredRule.isGood_Cause_Exists_for_Continuance__cRequired =  true;
            record.isRequiredRule.isSigned_Statement_has_Been_Provided__cRequired =  true;
            record.isRequiredRule.isOther_Reason__cRequired =  true;
            record.isRequiredRule.isState_Specified_Modifications__cRequired =  true;
            record.isRequiredRule.isOther_Reason_FC_was_Denied__cRequired =  true;
            record.isRequiredRule.isReasonable_Efforts__cRequired =  true;
            record.isRequiredRule.isIn_NM_s_Best_Interests__cRequired =  true;
            record.isRequiredRule.isThe_requirements_of_WIC_607_5_were_met__cRequired =  true;
            record.isRequiredRule.isNMD_informed_about_the_right_to_choose__cRequired =  true;
            record.isRequiredRule.isNMD_wants_ICWA_to_continue_to_apply__cRequired =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Denial_Reason__c_b56Required =  true;
            record.isRequiredRule.isDenial_Reason__cRequired =  true;
            record.isRequiredRule.isText1Required =  true;
            record.isRequiredRule.isText2Required =  true;
            record.isRequiredRule.isText3Required =  true;
            record.isRequiredRule.isText4Required =  true;
            record.isRequiredRule.isPicklist8Required =  true;
            record.isRequiredRule.isPicklist9Required =  true;
            record.isRequiredRule.isPicklist10Required =  true;
            record.isRequiredRule.isPicklist11Required =  true;
            record.isRequiredRule.isPicklist12Required =  true;
            record.isRequiredRule.isPicklist13Required =  true;
            record.isRequiredRule.isPicklist14Required =  true;
            record.isRequiredRule.isText19Required =  true;
            record.isRequiredRule.isPicklist15Required =  true;
            record.isRequiredRule.isPicklist16Required =  true;
            record.isRequiredRule.isPicklist17Required =  true;
            record.isRequiredRule.isText20Required =  true;
            record.isRequiredRule.isPicklist18Required =  true;
            record.isRequiredRule.isText21Required =  true;
            record.isRequiredRule.isText22Required =  true;
            record.isRequiredRule.isText23Required =  true;
            record.isRequiredRule.isText24Required =  true;
            record.isRequiredRule.isText25Required =  true;
            record.isRequiredRule.isText26Required =  true;
            record.isRequiredRule.isPicklist19Required =  true;
            record.isRequiredRule.isPicklist20Required =  true;
            record.isRequiredRule.isPicklist21Required =  true;
            record.isRequiredRule.isPicklist2Required =  true;
            record.isRequiredRule.isText27Required =  true;
            record.isRequiredRule.isText5Required =  true;
            record.isRequiredRule.isText6Required =  true;
            record.isRequiredRule.isText7Required =  true;
            record.isRequiredRule.isText10Required =  true;
            record.isRequiredRule.isPicklist3Required =  true;
            record.isRequiredRule.isText11Required =  true;
            record.isRequiredRule.isText12Required =  true;
            record.isRequiredRule.isPicklist4Required =  true;
            record.isRequiredRule.isText16Required =  true;
            record.isRequiredRule.isPicklist5Required =  true;
            record.isRequiredRule.isText15Required =  true;
            record.isRequiredRule.isText13Required =  true;
            record.isRequiredRule.isText14Required =  true;
            record.isRequiredRule.isOther_Basis_for_Court_DeterminationRequired =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Court_Denies_JV_472_Request_Findings__c_40dRequired =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Denial_Reason__c_da5Required =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Minute_Order_Details__c_52bRequired =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Special_program_details__c_891Required =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_State_Specific_JV_180_Modifications__c_db2Required =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_As_Recommended_with_Modifications_Reason__c_936Required =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Contrary_to_Recommendations_Reason__c_517Required =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Primary_Responsible_Agency__c_0eaRequired =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Secondary_Responsible_Agency__c_ef9Required =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Termination_of_Jurisdiction_Reason__c_e4cRequired =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Termination_of_Jurisdiction_Details__c_69fRequired =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Termination_of_Jurisdiction_Sub_Reason__c_5b0Required =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Specify_Modifications_and_Conditions_220__c_cdfRequired =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_JV_220_Application_Resubmission_Reason__c_c5fRequired =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Specify_Modifications_and_Conditions_Psy__c_d76Required =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Specify_Reason_for_Denial__c_91aRequired =  true;
            record.isRequiredRule.isPicklist6Required =  true;
            record.isRequiredRule.isPicklist7Required =  true;
            record.isRequiredRule.isDateTime1Required =  true;
            record.isRequiredRule.isDateTime2Required =  true;
            record.isRequiredRule.isCourt_Minute_Order__c_Legal_Authority_for_Placement__c_17cRequired =  true;
        }
    }

    handleDisabledRule(record, eventType) {
        const courtminuteordercFieldsToCheck = [  
             { field: 'Hearing_Type__c', isDisabledField: 'isHearing_Type1Disabled', resetValue: '', clearDisabledValue : false, condition: true || checkFLSForRules(this, record, 'Court_Minute_Order__c', 'Hearing_Type__c')} , 
             { field: 'Tribe_Name__c', isDisabledField: 'isRichText1Disabled', resetValue: '', clearDisabledValue : false, condition: true}  , 
             { field: 'Other_Finding_Details__c', isDisabledField: 'isOther_Finding_Details__cDisabled', resetValue: '', clearDisabledValue: false, condition: !(record.Additional_Finding__c?.includes('Other')) },
             { field: 'Termination_of_Jurisdiction_Sub_Reason__c', isDisabledField: 'isCourt_Minute_Order__c_Termination_of_Jurisdiction_Sub_Reason__c_5b0Disabled', resetValue: '', clearDisabledValue : false, condition: disableDependentPicklist(this.pickListInfo.Court_Minute_Order__c_Termination_of_Jurisdiction_Sub_Reason__c_5b0.comboboxListJson) || checkFLSForRules(this, record, 'Court_Minute_Order__c', 'Termination_of_Jurisdiction_Sub_Reason__c')} 
        ];
        const fieldsToCheckMap = {
            'Court_Minute_Order__c' : courtminuteordercFieldsToCheck
        };
        const fieldsToCheck = fieldsToCheckMap[record?.attributes?.type];
        if (fieldsToCheck) {
        fieldsToCheck.forEach(dataForDisabledRule => {
            checkAndDisableField(this, record, dataForDisabledRule);
        });
        }
    }

    handleReadOnlyRule(record, eventType){
		if(record.attributes.type === 'Court_Minute_Order__c') {
            // PMD Fix: Converted short-circuit expressions to if statements to fix 'no-unused-expressions' rule
            if (record.isReadOnlyRule) {
                record.isReadOnlyRule.isProgress_Report__c_CreatedById_25aReadOnly = true;
                record.isReadOnlyRule.isProgress_Report__c_LastModifiedById_2cfReadOnly = true;
            }
        }
    }

    handleHiddenRule(record, eventType){
        const courtminuteordercFieldsToCheck = [
            { ruleName:  'isItems_not_served_timely_per_statute__cHidden', condition : !(record.Select_Findings__c?.includes('Notice requirement were not met. The following items were not served within the time prescribed by law:') || record.Additional_Finding__c?.includes('Notice requirement were not met. The following items were not served within the time prescribed by law:')), fieldName : 'Items_not_served_timely_per_statute__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isProper_Notice_Not_Given_to__cHidden', condition : !(record.Select_Findings__c?.includes('Notice requirements were not met') || record.Additional_Finding__c?.includes('Notice requirements were not met')), fieldName : 'Proper_Notice_Not_Given_to__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Date_Reasonable_Efforts_Made__cHidden', condition : !(record.Select_Findings__c?.includes('Reasonable efforts were made to Prevent Removal') || record.Additional_Finding__c?.includes('Reasonable efforts were made to Prevent Removal')), fieldName : 'Court_Date_Reasonable_Efforts_Made__c' ,value : null, clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Date_Reasonable_Efforts_Not_Made__cHidden', condition : !(record.Select_Findings__c?.includes('Reasonable Efforts Not Made') || record.Additional_Finding__c?.includes('Reasonable Efforts Not Made')), fieldName : 'Court_Date_Reasonable_Efforts_Not_Made__c' ,value : null, clearErrorMsg : true } ,             
            { ruleName:  'isThe_Application_is__cHidden', condition : !(record.Select_Findings__c?.includes('Application made for authorization to begin or continue giving the child the psychotropic medication listed in #19 on JV-220(A) or #16 on JV-220(B)') || record.Additional_Finding__c?.includes('Application made for authorization to begin or continue giving the child the psychotropic medication listed in #19 on JV-220(A) or #16 on JV-220(B)')), fieldName : 'The_Application_is__c' ,value : '', clearErrorMsg : true } ,              
            { ruleName:  'isSpecify_All_Modifications_Conditions__cHidden', condition : !((record.Select_Findings__c?.includes('Application made for authorization to begin or continue giving the child the psychotropic medication listed in #19 on JV-220(A) or #16 on JV-220(B)') || record.Additional_Finding__c?.includes('Application made for authorization to begin or continue giving the child the psychotropic medication listed in #19 on JV-220(A) or #16 on JV-220(B)'))  && record.The_Application_is__c?.includes('Granted with the following modifications or conditions')), fieldName : 'Specify_All_Modifications_Conditions__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isReason_for_Denial__cHidden', condition : !((record.Select_Findings__c?.includes('Application made for authorization to begin or continue giving the child the psychotropic medication listed in #19 on JV-220(A) or #16 on JV-220(B)') || record.Additional_Finding__c?.includes('Application made for authorization to begin or continue giving the child the psychotropic medication listed in #19 on JV-220(A) or #16 on JV-220(B)'))  && record.The_Application_is__c?.includes('Denied')), fieldName : 'Reason_for_Denial__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isResubmitted_Missing_Information__cHidden', condition : !(record.Select_Findings__c?.includes('Application to be Resubmitted') || record.Additional_Finding__c?.includes('Application to be Resubmitted')), fieldName : 'Resubmitted_Missing_Information__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isApplicant_Resubmitted_Date__cHidden', condition : !(record.Select_Findings__c?.includes('Application to be Resubmitted') || record.Additional_Finding__c?.includes('Application to be Resubmitted')), fieldName : 'Applicant_Resubmitted_Date__c' ,value : null, clearErrorMsg : true } ,             
            { ruleName:  'isOther_Person_Details__cHidden', condition : !((record.Select_Findings__c?.includes("Ordered to give a copy of this order, including pages 5 and 6 of form JV-220(A) or pages 3 and 4 of form JV-220(B) and the medication monograph attached to the form JV-220(A) to the child's caregiver either in person or by mail within two court days") || record.Additional_Finding__c?.includes("Ordered to give a copy of this order, including pages 5 and 6 of form JV-220(A) or pages 3 and 4 of form JV-220(B) and the medication monograph attached to the form JV-220(A) to the child's caregiver either in person or by mail within two court days"))  && record.Copy_of_Order_to_be_Given_By__c?.includes('Other')), fieldName : 'Other_Person_Details__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCopy_of_Order_to_be_Given_By__cHidden', condition : !(record.Select_Findings__c?.includes("Ordered to give a copy of this order, including pages 5 and 6 of form JV-220(A) or pages 3 and 4 of form JV-220(B) and the medication monograph attached to the form JV-220(A) to the child's caregiver either in person or by mail within two court days") || record.Additional_Finding__c?.includes("Ordered to give a copy of this order, including pages 5 and 6 of form JV-220(A) or pages 3 and 4 of form JV-220(B) and the medication monograph attached to the form JV-220(A) to the child's caregiver either in person or by mail within two court days")), fieldName : 'Copy_of_Order_to_be_Given_By__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText28Hidden', condition : !record.JV180_Request_Denied_Reason__c?.includes("other"), fieldName : 'JV_180_Other_Denial__c' ,value : '', clearErrorMsg : false } ,             
            { ruleName:  'isRequest_to_Transfer_to_Tribal_Court__cHidden', condition : !(record.Select_Findings__c?.includes('Child Comes Under ICWA') || record.Additional_Finding__c?.includes('Child Comes Under ICWA')), fieldName : 'Request_to_Transfer_to_Tribal_Court__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isDenial_of_transfer_to_Tribal_Court__cHidden', condition : !(record.Select_Findings__c?.includes('Child Comes Under ICWA') || record.Additional_Finding__c?.includes('Child Comes Under ICWA')), fieldName : 'Denial_of_transfer_to_Tribal_Court__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isEither_of__cHidden', condition : !(record.Select_Findings__c?.includes('Child Comes Under ICWA') || record.Additional_Finding__c?.includes('Child Comes Under ICWA')), fieldName : 'Either_of__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isTransfer_declined_by_tribal_court__cHidden', condition : !(record.Select_Findings__c?.includes('Child Comes Under ICWA') || record.Additional_Finding__c?.includes('Child Comes Under ICWA')), fieldName : 'Transfer_declined_by_tribal_court__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isGood_cause_exists_for_denying_transfer__cHidden', condition : !(record.Select_Findings__c?.includes('Child Comes Under ICWA') || record.Additional_Finding__c?.includes('Child Comes Under ICWA')), fieldName : 'Good_cause_exists_for_denying_transfer__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isHas_Potential_Tribal_Affiliation__cHidden', condition : !(record.Select_Findings__c?.includes('Child Comes Under ICWA') || record.Additional_Finding__c?.includes('Child Comes Under ICWA')), fieldName : 'Has_Potential_Tribal_Affiliation__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isRichText1Hidden', condition : !(record.Select_Findings__c?.includes('Child Comes Under ICWA') || record.Additional_Finding__c?.includes('Child Comes Under ICWA')), fieldName : 'Tribe_Name__c' ,value : '', clearErrorMsg : false } ,             
            { ruleName:  'isPlacement_evidence_testimony_presented__cHidden', condition : !(record.Select_Findings__c?.includes('Child Comes Under ICWA') || record.Additional_Finding__c?.includes('Child Comes Under ICWA')), fieldName : 'Placement_evidence_testimony_presented__c' ,value : '', clearErrorMsg : false } ,             
            { ruleName:  'isGood_cause_under_ICWA__cHidden', condition : !(record.Select_Findings__c?.includes('Child Comes Under ICWA') || record.Additional_Finding__c?.includes('Child Comes Under ICWA')), fieldName : 'Good_cause_under_ICWA__c' ,value : '', clearErrorMsg : false } ,             
            { ruleName:  'isBasis_for_good_cause__cHidden', condition : !(record.Select_Findings__c?.includes('Child Comes Under ICWA') || record.Additional_Finding__c?.includes('Child Comes Under ICWA')), fieldName : 'Basis_for_good_cause__c' ,value : '', clearErrorMsg : false } ,             
            { ruleName:  'isBasis_for_Good_cause_Type__cHidden', condition : record.Basis_for_good_cause__c !== 'Yes', fieldName : 'Basis_for_Good_cause_Type__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isDate_court_was_informed__cHidden', condition : !(record.Select_Findings__c?.includes('Child Comes Under ICWA') || record.Additional_Finding__c?.includes('Child Comes Under ICWA')), fieldName : 'Date_court_was_informed__c' ,value : null, clearErrorMsg : false } ,             
            { ruleName:  'isCourt_informed_of_ID_card_Possession__cHidden', condition : !(record.Select_Findings__c?.includes('Child Comes Under ICWA') || record.Additional_Finding__c?.includes('Child Comes Under ICWA')), fieldName : 'Court_informed_of_ID_card_Possession__c' ,value : '', clearErrorMsg : false } ,             
            { ruleName:  'isParentage_Determined_for__cHidden', condition : !(record.Select_Findings__c?.includes('Parentage Finding') || record.Additional_Finding__c?.includes('Parentage Finding')), fieldName : 'Parentage_Determined_for__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isParentage_Determined_for_Details__cHidden', condition : record.Parentage_Determined_for__c !== 'Other', fieldName : 'Parentage_Determined_for_Details__c' ,value : '', clearErrorMsg : true } ,             
                         
            { ruleName:  'isOther_Kin_Details__cHidden', condition : record.Select_Kin__c !== 'Other', fieldName : 'Other_Kin_Details__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isProposed_Placement_Name__cHidden', condition : !(record.Select_Findings__c?.includes('Proposed placement in the receiving state is home to kin') || record.Additional_Finding__c?.includes('Proposed placement in the receiving state is home to kin')), fieldName : 'Proposed_Placement_Name__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isLocated_at__cHidden', condition : !(record.Select_Findings__c?.includes('Proposed placement in the receiving state is home to kin') || record.Additional_Finding__c?.includes('Proposed placement in the receiving state is home to kin')), fieldName : 'Located_at__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isExpedited_Placement_Criteria_Details__cHidden', condition : !record.Applicable_Expedited_Placement_Criteria__c?.includes('Child is part of sibling group to be placed together, one is 4 or younger'), fieldName : 'Expedited_Placement_Criteria_Details__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isAre_Needs_being_met__cHidden', condition : !(record.Select_Findings__c?.includes('Needs of the child or NMD being met through placement in a family-based setting') || record.Additional_Finding__c?.includes('Needs of the child or NMD being met through placement in a family-based setting')), fieldName : 'Are_Needs_being_met__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isIs_the_level_of_Care_Consistent__cHidden', condition : !(record.Select_Findings__c?.includes("The child’s developmental needs are being met") || record.Additional_Finding__c?.includes("The child’s developmental needs are being met")), fieldName : 'Is_the_level_of_Care_Consistent__c' ,value : '', clearErrorMsg : true },
            { ruleName:  'isPlacement_Provides__cHidden', condition : !(record.Select_Findings__c?.includes('Needs of the child or NMD being met through placement in a family-based setting') || record.Additional_Finding__c?.includes('Needs of the child or NMD being met through placement in a family-based setting')) && 
record.Are_Needs_being_met__c  !== 'No', fieldName : 'Placement_Provides__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isDoes_information_align_with_WIC_36131__cHidden', condition : !(record.Select_Findings__c?.includes('In the case of an Indian Child, there is clear and convincing evidence of good cause to depart from the placement preferences stated in Welf. & Inst Code 361.31') || record.Additional_Finding__c?.includes('In the case of an Indian Child, there is clear and convincing evidence of good cause to depart from the placement preferences stated in Welf. & Inst Code 361.31')), fieldName : 'Does_information_align_with_WIC_36131__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isIs_STRTP_or_CTF_Identified_Approved__cHidden', condition : !(record.Select_Findings__c?.includes("The STRTP or CTF identified in the Placing Agency’s JV-235 filed:") || record.Additional_Finding__c?.includes("The STRTP or CTF identified in the Placing Agency’s JV-235 filed:")), fieldName : 'Is_STRTP_or_CTF_Identified_Approved__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPlacing_Agencys_JV235_Filed_Date__cHidden', condition : !(record.Select_Findings__c?.includes("The STRTP or CTF identified in the Placing Agency’s JV-235 filed:") || record.Additional_Finding__c?.includes("The STRTP or CTF identified in the Placing Agency’s JV-235 filed:")), fieldName : 'Placing_Agencys_JV235_Filed_Date__c' ,value : null, clearErrorMsg : true } ,             
            { ruleName:  'isPlacement_promotes_child_best_interest__cHidden', condition : !((record.Select_Findings__c?.includes("The basis for the court’s determination has been stated on the record or is stated in writing here") || record.Additional_Finding__c?.includes("The basis for the court’s determination has been stated on the record or is stated in writing here")) && 
record.The_Basis_for_the_Court_Determination_is__c?.includes("The placement promote the child’s or nonminor dependent’s best interest")), fieldName : 'Placement_promotes_child_best_interest__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isGood_Cause_Exists_for_Continuance__cHidden', condition : !(record.Select_Findings__c?.includes('Continuance is not contrary to the interest of the child or nonminor, and good cause exists for the continuance as stated below:') || record.Additional_Finding__c?.includes('Continuance is not contrary to the interest of the child or nonminor, and good cause exists for the continuance as stated below:')), fieldName : 'Good_Cause_Exists_for_Continuance__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isSigned_Statement_has_Been_Provided__cHidden', condition : !(record.Select_Findings__c?.includes('CW Agency has provided court with signed statement from person named in proposed placement') || record.Additional_Finding__c?.includes('CW Agency has provided court with signed statement from person named in proposed placement')), fieldName : 'Signed_Statement_has_Been_Provided__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isOther_Reason__cHidden', condition : !record.JV180_Request_Denied_Reason__c?.includes('other'), fieldName : 'Other_Reason__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isState_Specified_Modifications__cHidden', condition : !(record.Select_Findings__c?.includes('All parties and attorneys agree to the request. Request is granted as follows') || record.Additional_Finding__c?.includes('All parties and attorneys agree to the request. Request is granted as follows')), fieldName : 'State_Specified_Modifications__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isOther_Reason_FC_was_Denied__cHidden', condition : !record.Reason_NMD_return_to_FC_denied__c?.includes('Other'), fieldName : 'Other_Reason_FC_was_Denied__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isReasonable_Efforts__cHidden', condition : !(record.Select_Findings__c?.includes("The nonminor is neither present in court nor participating by telephone and the nonminor’s current location is unknown.") || record.Additional_Finding__c?.includes("The nonminor is neither present in court nor participating by telephone and the nonminor’s current location is unknown.")), fieldName : 'Reasonable_Efforts__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isIn_NM_s_Best_Interests__cHidden', condition : !(record.Select_Findings__c?.includes('NM has application pending for title XVI SSI benefits, and continuation of juvenile court jurisdiction until a final decision has been issued to ensure continued assistance') || record.Additional_Finding__c?.includes('NM has application pending for title XVI SSI benefits, and continuation of juvenile court jurisdiction until a final decision has been issued to ensure continued assistance')), fieldName : 'In_NM_s_Best_Interests__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isThe_requirements_of_WIC_607_5_were_met__cHidden', condition : !(record.Select_Findings__c?.includes("NM is subject to delinquency jurisdiction, either was previously a dependent of the court under section 300 or was placed in foster care under section 727.") || record.Additional_Finding__c?.includes('NM is subject to delinquency jurisdiction, either was previously a dependent of the court under section 300 or was placed in foster care under section 727.')), fieldName : 'The_requirements_of_WIC_607_5_were_met__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isNMD_informed_about_the_right_to_choose__cHidden', condition : !(record.Select_Findings__c?.includes('NM is an Indian child under ICWA, and has the right to choose whether the Act will continue to apply as NMD') || record.Additional_Finding__c?.includes('NM is an Indian child under ICWA, and has the right to choose whether the Act will continue to apply as NMD')), fieldName : 'NMD_informed_about_the_right_to_choose__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isNMD_wants_ICWA_to_continue_to_apply__cHidden', condition : !(record.Select_Findings__c?.includes('NM is an Indian child under ICWA, and has the right to choose whether the Act will continue to apply as NMD') || record.Additional_Finding__c?.includes('NM is an Indian child under ICWA, and has the right to choose whether the Act will continue to apply as NMD')), fieldName : 'NMD_wants_ICWA_to_continue_to_apply__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Denial_Reason__c_b56Hidden', condition : !(record.Ensure_School_Attendance__c?.includes('Other')), fieldName : 'Other_Party_Details__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isDenial_Reason__cHidden', condition : !record.Informed_and_Advised_Party__c?.includes('Other'), fieldName : 'Other_Informed_Party__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText1Hidden', condition : !record.Waived_Rights_Party__c?.includes('Other'), fieldName : 'Other_Waived_Rights__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText2Hidden', condition : !record.Case_Plan_Developed__c?.includes('Other'), fieldName : 'Other_Active_Party__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText3Hidden', condition : !record.Not_Active_Case_Plan__c?.includes('Other'), fieldName : 'Other_Non_Active_Party__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText4Hidden', condition : !record.Case_Plan_Not_Required__c?.includes('Other'), fieldName : 'Other_Non_Required_Party__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist8Hidden', condition : !(record.Select_Findings__c?.includes('Court Grants JV-430') || record.Additional_Finding__c?.includes('Court Grants JV-430')), fieldName : 'Reasonable_Efforts_Return_Child__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist9Hidden', condition : !record.Mitigation_Placement_Causes__c?.includes('Mother'), fieldName : 'Mother_Level_Progres__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist10Hidden', condition : !record.Mitigation_Placement_Causes__c?.includes('Presumed Father'), fieldName : 'Father_Level_Progress__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist11Hidden', condition : !record.Mitigation_Placement_Causes__c?.includes('Biological Father'), fieldName : 'Biolog_Father_Level__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist12Hidden', condition : !record.Mitigation_Placement_Causes__c?.includes('Legal Guardian'), fieldName : 'LegGuardian_Level__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist13Hidden', condition : !record.Mitigation_Placement_Causes__c?.includes('Indian Custodian'), fieldName : 'IndianCustodian_Level__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist14Hidden', condition : !record.Mitigation_Placement_Causes__c?.includes('Other'), fieldName : 'Other_Level_Progress__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText19Hidden', condition : !record.Mitigation_Placement_Causes__c?.includes('Other'), fieldName : 'Other_Progress_Party__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist15Hidden', condition : !(record.Select_Findings__c?.includes('Court Grants JV-430') || record.Additional_Finding__c?.includes('Court Grants JV-430')), fieldName : 'Parental_Education_Rights__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist16Hidden', condition : !(record.Select_Findings__c?.includes('Court Grants JV-426') || record.Additional_Finding__c?.includes('Court Grants JV-426')), fieldName : 'Par_Education_Rights__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist17Hidden', condition : !(record.Select_Findings__c?.includes('The additional services, assessments, and/or evaluations the child requires to meet the unmet needs specified in item 16 or other concerns are') || record.Additional_Finding__c?.includes('The additional services, assessments, and/or evaluations the child requires to meet the unmet needs specified in item 16 or other concerns are')), fieldName : 'Unmeet_Needs_16__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText20Hidden', condition : !record.Unmeet_Needs_16__c?.includes('Specified Here'), fieldName : 'Unmeet_Needs_16__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist18Hidden', condition : !(record.Select_Findings__c?.includes('The additional services, assessments, and/or evaluations the child requires to meet the unmet needs specified in item 17 or other concerns are') || record.Additional_Finding__c?.includes('The additional services, assessments, and/or evaluations the child requires to meet the unmet needs specified in item 17 or other concerns are')), fieldName : 'Unmet_Needs_17__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText21Hidden', condition : !record.Unmet_Needs_17__c?.includes('Specified Here'), fieldName : 'Unmeet_Need_Details17__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText22Hidden', condition : !record.Adu_Ser_Stated__c?.includes('As Follows'), fieldName : 'Add_Ser_Details__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText23Hidden', condition : !record.Tran_Adul_Ser__c?.includes('As Follows'), fieldName : 'Add_Ser_Details2__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText24Hidden', condition : !record.Age_Ser_Stated__c?.includes('As Follows'), fieldName : 'Add_Ser_De3__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText25Hidden', condition : !record.Po_Add_Ser_Stated__c?.includes('As Follows'), fieldName : 'Add_Ser5__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText26Hidden', condition : !record.Tra_Ind_Add_Serv__c?.includes('As Follows'), fieldName : 'Add_Ser_7__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist19Hidden', condition : !(record.Select_Findings__c?.includes('Services offered to the family by the county agency to eliminate the conditions or factors requiring court intervention were') || record.Additional_Finding__c?.includes('Services offered to the family by the county agency to eliminate the conditions or factors requiring court intervention were')), fieldName : 'Coun_Ser_Prevent__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist20Hidden', condition : !record.Admitted_Evi__c?.includes('Other 1 (specify)'), fieldName : 'Ev_Other_1__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist21Hidden', condition : !record.Admitted_Evi__c?.includes('Other 2 (specify)'), fieldName : 'Eve_Other2__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText27Hidden', condition : !record.PostSec_Ed_Ser_Added__c?.includes('As Follows'), fieldName : 'PostSec_Ed_Ser_Details__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText5Hidden', condition : !record.Progress_Placement__c?.includes('Other'), fieldName : 'Other_Prog_Plac__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText6Hidden', condition : !record.Progress_Made_Toward__c?.includes('Other'), fieldName : 'Oth_Prog_Mad_Twards__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText7Hidden', condition : !record.Progess_Made_Toward__c?.includes('Other'), fieldName : 'Other_Prog_Made__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText8Hidden', condition : !(record.Select_Findings__c?.includes('The child has identified the following as an individual important to him or her') || record.Additional_Finding__c?.includes('The child has identified the following as an individual important to him or her')), fieldName : 'Ind_1_Imp__c' ,value : '', clearErrorMsg : false } ,             
            { ruleName:  'isText9Hidden', condition : !(record.Select_Findings__c?.includes('The child has identified the following as an individual important to him or her') || record.Additional_Finding__c?.includes('The child has identified the following as an individual important to him or her')), fieldName : 'Ind_2_Imp__c' ,value : '', clearErrorMsg : false } ,             
            { ruleName:  'isText10Hidden', condition : !record.Child_Needs_Dec__c?.includes('Other'), fieldName : 'Oth_Child_Needs_Dec__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist2Hidden', condition : !(record.Select_Findings__c?.includes('Not all the information, documents, and services included in WIC section 391(b)-(c) were provided to the child') || record.Additional_Finding__c?.includes('Not all the information, documents, and services included in WIC section 391(b)-(c) were provided to the child')), fieldName : 'Barriers_to_Provide_Inf__c' ,value : '', clearErrorMsg : false } ,             
            { ruleName:  'isDate1Hidden', condition : !(record.Select_Findings__c?.includes('Likely Anticipated the NMD will achieve successful Adulthood is') || record.Additional_Finding__c?.includes('Likely Anticipated the NMD will achieve successful Adulthood is')), fieldName : 'Ant_Adult_Ach_Date__c' ,value : null, clearErrorMsg : false } ,             
            { ruleName:  'isPicklist3Hidden', condition : !(record.Select_Findings__c?.includes('Juvenile court jurisdiction over the youth as an NMD is continued and the youth’s permanent plan is') || record.Additional_Finding__c?.includes('Juvenile court jurisdiction over the youth as an NMD is continued and the youth’s permanent plan is')), fieldName : 'youth_perm_plan__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText11Hidden', condition : !record.youth_perm_plan__c?.includes('Other'), fieldName : 'Other_Perm_Plan_Details__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText12Hidden', condition : !record.Com_Reasons_Placement__c?.includes('Other'), fieldName : 'Oth_Compelling_Placement__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist4Hidden', condition : !record.WIC16501_Requirements__c?.includes('To assist the NMD in preparing for postsecondary education, the county agency must add to the case plan and provide the services'), fieldName : 'Case_Plan_Add_Stated__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText16Hidden', condition : !record.Case_Plan_Add_Stated__c?.includes('As Follows'), fieldName : 'Case_Plan_Add_Info__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist5Hidden', condition : !record.youth_perm_plan__c?.includes('Another Planned Permanent Living Arrangement'), fieldName : 'Reason_Perm_Liv_Arr__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText15Hidden', condition : !record.Reason_Perm_Liv_Arr__c?.includes('Other'), fieldName : 'Other_Living_Arr__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText13Hidden', condition : !record.Prog_Tow_Mitiga_Causes__c?.includes('Other 1'), fieldName : 'Mit_Cause_1__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isText14Hidden', condition : !record.Prog_Tow_Mitiga_Causes__c?.includes('Other 2'), fieldName : 'Mit_Cause_2__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isDate2Hidden', condition : !record.Additional_Finding__c?.includes('The likely date by which the NMD may safely reside in the family home or achieve independence or, for a youth who has chosen to have the ICWA apply, in consultation with the child’s tribe, be placed for tribal customary adoptions is'), fieldName : 'Likely_Date_for_Safe__c' ,value : null, clearErrorMsg : false } ,             
            { ruleName:  'isOther_Basis_for_Court_DeterminationHidden', condition : !((record.Select_Findings__c?.includes("The basis for the court’s determination has been stated on the record or is stated in writing here") || record.Additional_Finding__c?.includes("The basis for the court’s determination has been stated on the record or is stated in writing here")) && 
record.The_Basis_for_the_Court_Determination_is__c?.includes('Other')), fieldName : 'Other_Basis_for_Court_Determination__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Court_Denies_JV_472_Request_Findings__c_40dHidden', condition : !(record.Select_Findings__c?.includes('Court Denies JV-472 Request') || record.Additional_Finding__c?.includes('Court Denies JV-472 Request')), fieldName : 'Court_Denies_JV_472_Request_Findings__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Denial_Reason__c_da5Hidden', condition : !record.Court_Denies_JV_472_Request_Findings__c?.includes('Court finds NM won’t satisfy WIC 11403(b) or has not entered into reentry agreement'), fieldName : 'Denial_Reason__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Minute_Order_Details__c_52bHidden', condition : !(record.Minute_Order__c?.includes('Other Court Order') || record.Additional_Orders__c?.includes('Other Court Order')), fieldName : 'Minute_Order_Details__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Consent_of_TPR_Rights_was_Executed__c_157Hidden', condition : !(record.Minute_Order__c?.includes('Parental Rights Terminated - Alleged Father') || record.Additional_Orders__c?.includes('Parental Rights Terminated - Alleged Father') || record.Minute_Order__c?.includes('Parental Rights Term.- Alleged Mother') || record.Additional_Orders__c?.includes('Parental Rights Term.- Alleged Mother') || record.Minute_Order__c?.includes('Parental Rights Term.- Alleged Parents') || record.Additional_Orders__c?.includes('Parental Rights Term.- Alleged Parents') || record.Minute_Order__c?.includes('Parental Rights Term.- Legal Father') || record.Additional_Orders__c?.includes('Parental Rights Term.- Legal Father') || record.Minute_Order__c?.includes('Parental Rights Term.- Mother') || record.Additional_Orders__c?.includes('Parental Rights Term.- Mother') || record.Minute_Order__c?.includes('Parent Rights Term. - Presumed Father') || record.Additional_Orders__c?.includes('Parent Rights Term. - Presumed Father')  || record.Minute_Order__c?.includes('Parent Rights Term. - Biological Father') || record.Additional_Orders__c?.includes('Parent Rights Term. - Biological Father') || record.Minute_Order__c?.includes('Parent Rights Term. - Adoptive Father') || record.Additional_Orders__c?.includes('Parent Rights Term. - Adoptive Father') || record.Minute_Order__c?.includes('Parental Rights Term. - Anyone claiming to be the father') || record.Additional_Orders__c?.includes('Parental Rights Term. - Anyone claiming to be the father') || record.Minute_Order__c?.includes('Parental Rights Term. - Adoptive Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Adoptive Mother') || record.Minute_Order__c?.includes('Parental Rights Term. - Biological Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Biological Mother') || record.Minute_Order__c?.includes('Parental Rights Term. - Legal Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Legal Mother') || record.Minute_Order__c?.includes("Parental Rights Term.- Alleged Father") || record.Additional_Orders__c?.includes("Parental Rights Term.- Alleged Father") || record.Additional_Orders__c?.includes("Parental Rights Term. - Adoptive Father") || record.Additional_Orders__c?.includes("Parental Rights Term. - Presumed Father")), fieldName : 'Consent_of_TPR_Rights_was_Executed__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Indian_Family_Active_Efforts_Outcome__c_3d2Hidden', condition : !(record.Minute_Order__c?.includes('Parental Rights Term. - Alleged Father') || record.Additional_Orders__c?.includes('Parental Rights Term. - Alleged Father') || record.Minute_Order__c?.includes('Parental Rights Term. - Alleged Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Alleged Mother') || record.Minute_Order__c?.includes('Parental Rights Term. - Alleged Parents') || record.Additional_Orders__c?.includes('Parental Rights Term. - Alleged Parents') || record.Minute_Order__c?.includes('Parental Rights Term. - Legal Father') || record.Additional_Orders__c?.includes('Parental Rights Term. - Legal Father') || record.Minute_Order__c?.includes('Parental Rights Term. - Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Mother') || record.Minute_Order__c?.includes('Parental Rights Term. - Presumed Father') || record.Additional_Orders__c?.includes('Parental Rights Term. - Presumed Father')  || record.Minute_Order__c?.includes('Parental Rights Term. - Biological Father') || record.Additional_Orders__c?.includes('Parental Rights Term. - Biological Father') || record.Minute_Order__c?.includes('Parental Rights Term. - Adoptive Father') || record.Additional_Orders__c?.includes('Parental Rights Term. - Adoptive Father') || record.Minute_Order__c?.includes('Parental Rights Term. - Anyone claiming to be the father') || record.Additional_Orders__c?.includes('Parental Rights Term. - Anyone claiming to be the father') || record.Minute_Order__c?.includes('Parental Rights Term. - Adoptive Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Adoptive Mother') || record.Minute_Order__c?.includes('Parental Rights Term. - Biological Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Biological Mother') || record.Minute_Order__c?.includes('Parental Rights Term. - Legal Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Legal Mother') || record.Minute_Order__c?.includes('Parental Rights Terminated - Alleged Father') || record.Additional_Orders__c?.includes('Parental Rights Terminated - Alleged Father') || record.Minute_Order__c?.includes('Parental Rights Term.- Alleged Mother') || record.Additional_Orders__c?.includes('Parental Rights Term.- Alleged Mother') || record.Minute_Order__c?.includes('Parental Rights Term.- Alleged Parents') || record.Additional_Orders__c?.includes('Parental Rights Term.- Alleged Parents') || record.Minute_Order__c?.includes('Parental Rights Term.- Legal Father') || record.Additional_Orders__c?.includes('Parental Rights Term.- Legal Father') || record.Minute_Order__c?.includes('Parental Rights Term.- Mother') || record.Additional_Orders__c?.includes('Parental Rights Term.- Mother') || record.Minute_Order__c?.includes('Parent Rights Term. - Presumed Father') || record.Additional_Orders__c?.includes('Parent Rights Term. - Presumed Father')  || record.Minute_Order__c?.includes('Parent Rights Term. - Biological Father') || record.Additional_Orders__c?.includes('Parent Rights Term. - Biological Father') || record.Minute_Order__c?.includes('Parent Rights Term. - Adoptive Father') || record.Additional_Orders__c?.includes('Parent Rights Term. - Adoptive Father') || record.Minute_Order__c?.includes('Parental Rights Term. - Anyone claiming to be the father') || record.Additional_Orders__c?.includes('Parental Rights Term. - Anyone claiming to be the father') || record.Minute_Order__c?.includes('Parental Rights Term. - Adoptive Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Adoptive Mother') || record.Minute_Order__c?.includes('Parental Rights Term. - Biological Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Biological Mother') || record.Minute_Order__c?.includes('Parental Rights Term. - Legal Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Legal Mother') || record.Minute_Order__c?.includes("Parental Rights Term.- Alleged Father") || record.Additional_Orders__c?.includes("Parental Rights Term.- Alleged Father")), fieldName : 'Indian_Family_Active_Efforts_Outcome__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Qualified_Expert_Witness_Considered__c_e0dHidden', condition : !(record.Minute_Order__c?.includes('Parental Rights Terminated - Alleged Father') || record.Additional_Orders__c?.includes('Parental Rights Terminated - Alleged Father') || record.Minute_Order__c?.includes('Parental Rights Term.- Alleged Mother') || record.Additional_Orders__c?.includes('Parental Rights Term.- Alleged Mother') || record.Minute_Order__c?.includes('Parental Rights Term.- Alleged Parents') || record.Additional_Orders__c?.includes('Parental Rights Term.- Alleged Parents') || record.Minute_Order__c?.includes('Parental Rights Term.- Legal Father') || record.Additional_Orders__c?.includes('Parental Rights Term.- Legal Father') || record.Minute_Order__c?.includes('Parental Rights Term.- Mother') || record.Additional_Orders__c?.includes('Parental Rights Term.- Mother') || record.Minute_Order__c?.includes('Parent Rights Term. - Presumed Father') || record.Additional_Orders__c?.includes('Parent Rights Term. - Presumed Father')  || record.Minute_Order__c?.includes('Parent Rights Term. - Biological Father') || record.Additional_Orders__c?.includes('Parent Rights Term. - Biological Father') || record.Minute_Order__c?.includes('Parent Rights Term. - Adoptive Father') || record.Additional_Orders__c?.includes('Parent Rights Term. - Adoptive Father') || record.Minute_Order__c?.includes('Parental Rights Term. - Anyone claiming to be the father') || record.Additional_Orders__c?.includes('Parental Rights Term. - Anyone claiming to be the father') || record.Minute_Order__c?.includes('Parental Rights Term. - Adoptive Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Adoptive Mother') || record.Minute_Order__c?.includes('Parental Rights Term. - Biological Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Biological Mother') || record.Minute_Order__c?.includes('Parental Rights Term. - Legal Mother') || record.Additional_Orders__c?.includes('Parental Rights Term. - Legal Mother')  || record.Minute_Order__c?.includes("Parental Rights Term.- Alleged Father") || record.Additional_Orders__c?.includes("Parental Rights Term.- Alleged Father")
|| record.Minute_Order__c?.includes("Termination of Parental Rights") || record.Additional_Orders__c?.includes("Termination of Parental Rights")
|| record.Minute_Order__c?.includes("Modification of Parental Rights") || record.Additional_Orders__c?.includes("Modification of Parental Rights") || record.Additional_Orders__c?.includes("Parental Rights Term. - Adoptive Father") || record.Additional_Orders__c?.includes("Parental Rights Term. - Presumed Father")), fieldName : 'Qualified_Expert_Witness_Considered__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Special_program_details__c_891Hidden', condition : record.Court_Ordered_Special_program__c !== 'Yes', fieldName : 'Special_program_details__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_State_Specific_JV_180_Modifications__c_db2Hidden', condition : !(record.Minute_Order__c?.includes('JV-180 Request Granted with Modifications') || record.Additional_Orders__c?.includes('JV-180 Request Granted with Modifications')), fieldName : 'State_Specific_JV_180_Modifications__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_As_Recommended_with_Modifications_Reason__c_936Hidden', condition : !record.Court_Order_Status__c?.includes('As Recommended with modifications'), fieldName : 'As_Recommended_with_Modifications_Reason__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Contrary_to_Recommendations_Reason__c_517Hidden', condition : !record.Court_Order_Status__c?.includes('Contrary to Recommendations'), fieldName : 'Contrary_to_Recommendations_Reason__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Primary_Responsible_Agency__c_0eaHidden', condition : !(record.Minute_Order__c?.includes('Primary Responsible Agency') || record.Additional_Orders__c?.includes('Primary Responsible Agency')), fieldName : 'Primary_Responsible_Agency__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Secondary_Responsible_Agency__c_ef9Hidden', condition : !(record.Minute_Order__c?.includes('Secondary Responsible Agency') || record.Additional_Orders__c?.includes('Secondary Responsible Agency')), fieldName : 'Secondary_Responsible_Agency__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Date_of_Termination_of_Jurisdiction__c_4f2Hidden', condition : !(record.Minute_Order__c?.includes('Jurisdiction Terminated') || record.Additional_Orders__c?.includes('Jurisdiction Terminated')), fieldName : 'Date_of_Termination_of_Jurisdiction__c' ,value : null, clearErrorMsg : false } ,             
            { ruleName:  'isCourt_Minute_Order__c_Termination_of_Jurisdiction_Reason__c_e4cHidden', condition : !(record.Minute_Order__c?.includes('Jurisdiction Terminated') || record.Additional_Orders__c?.includes('Jurisdiction Terminated')), fieldName : 'Termination_of_Jurisdiction_Reason__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Termination_of_Jurisdiction_Details__c_69fHidden', condition : !record.Termination_of_Jurisdiction_Reason__c?.includes('Other'), fieldName : 'Termination_of_Jurisdiction_Details__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Termination_of_Jurisdiction_Sub_Reason__c_5b0Hidden', condition : !(record.Termination_of_Jurisdiction_Reason__c === 'Dependency Terminated' || record.Termination_of_Jurisdiction_Reason__c === 'Returned Home'), fieldName : 'Termination_of_Jurisdiction_Sub_Reason__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Specify_Modifications_and_Conditions_220__c_cdfHidden', condition : !(record.Minute_Order__c?.includes('JV-220 App Granted w modif or cond') || record.Additional_Orders__c?.includes('JV-220 App Granted w modif or cond')), fieldName : 'Specify_Modifications_and_Conditions_220__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_JV_220_Application_Resubmission_Reason__c_c5fHidden', condition : !(record.Minute_Order__c?.includes('Resubmit JV-220 App') || record.Additional_Orders__c?.includes('Resubmit JV-220 App')), fieldName : 'JV_220_Application_Resubmission_Reason__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Specify_Modifications_and_Conditions_Psy__c_d76Hidden', condition : !(record.Minute_Order__c?.includes('Psychotropic Medication Application granted with modifications or conditions') || record.Additional_Orders__c?.includes('Psychotropic Medication Application granted with modifications or conditions')), fieldName : 'Specify_Modifications_and_Conditions_Psy__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isCourt_Minute_Order__c_Specify_Reason_for_Denial__c_91aHidden', condition : !(record.Minute_Order__c?.includes('Psychotropic Medication Application Denied') || record.Additional_Orders__c?.includes('Psychotropic Medication Application Denied')), fieldName : 'Specify_Reason_for_Denial__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist6Hidden', condition : !(record.Minute_Order__c?.includes('Inter-County Transfer In Hearing Ordered') || record.Additional_Orders__c?.includes('Inter-County Transfer In Hearing Ordered')), fieldName : 'Transfer_In_County_Name__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isPicklist7Hidden', condition : !(record.Minute_Order__c?.includes('Inter-County Transfer Out Hearing Ordered') || record.Additional_Orders__c?.includes('Inter-County Transfer Out Hearing Ordered')||record.Additional_Orders__c?.includes('Inter-County Transfer Out Ordered' )), fieldName : 'Transfer_Out_County_Name__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isDateTime1Hidden', condition : !(record.Minute_Order__c?.includes('Inter-County Transfer In Hearing Ordered') || record.Additional_Orders__c?.includes('Inter-County Transfer In Hearing Ordered')), fieldName : 'Transfer_In_Date_and_Time__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isDateTime2Hidden', condition : !(record.Minute_Order__c?.includes('Inter-County Transfer Out Hearing Ordered') || record.Additional_Orders__c?.includes('Inter-County Transfer Out Hearing Ordered')||record.Additional_Orders__c?.includes('Inter-County Transfer Out Ordered' )), fieldName : 'Transfer_Out_Date_and_Time__c' ,value : '', clearErrorMsg : true } ,             
            { ruleName:  'isGrid431Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The following were actively involved in the case plan development, including the child's plan for permanent placement") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The following were actively involved in the case plan development, including the child's plan for permanent placement")), fieldName : 'Case_Plan_Developed__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid81Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes("Legal Auth. for Plcmnt. Ordered- Cont.") || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes("Legal Auth. for Plcmnt. Ordered- Cont.") || this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes("Legal Auth. for Plcmnt. Ordered- Inital.") || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes("Legal Auth. for Plcmnt. Ordered- Inital.")) } ,               
           { ruleName: 'isGRID869df1Hidden', condition: !(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Court Grants JV-472 Request Findings') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Court Grants JV-472 Request Findings') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Court Grants JV-472 Request - The Court makes the findings stated below') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Court Grants JV-472 Request - The Court makes the findings stated below')), fieldName : 'Court_Grants_JV_472_Request_Findings__c' ,value : '', clearErrorMsg : true },               
            { ruleName:  'isGRID599ca1Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Jurisdiction Terminated') || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Jurisdiction Terminated')) } ,                
            { ruleName:  'isGrid46Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Prima Facie showing has not been made. The Nonminor’s request to return to foster care is denied") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Prima Facie showing has not been made. The Nonminor’s request to return to foster care is denied")), fieldName : 'Reason_NMD_return_to_FC_denied__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid431122111111Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The child's education placement has changed since the last review hearing.") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The child's education placement has changed since the last review hearing.")), fieldName : 'Ed_Plac_Changes__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid432121Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The NMD’s Transitional Independent Living Case Plan includes a plan for them to satisfy at least one of the criteria in WIC 11403 (b) to remain in foster care under juvenile court jurisdiction as indicated below') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The NMD’s Transitional Independent Living Case Plan includes a plan for them to satisfy at least one of the criteria in WIC 11403 (b) to remain in foster care under juvenile court jurisdiction as indicated below')), fieldName : 'WIC_11404_b_Condition_Type_JV_462__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid4311221111112Hidden', condition :!this.recordMap.get('Court_Minute_Order__c').Tran_Ind_Living__c?.includes('To assist the child in making the transition to successful adulthood, the county agency must add to the case plan and provide the services'), fieldName : 'Tra_Ind_Add_Serv__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid16Hidden', condition :!(
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Parties to the case informed of their legal rights") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Parties to the case informed of their legal rights") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Parties to the case knowingly waived their legal rights") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Parties to the case knowingly waived their legal rights") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The following were actively involved in the case plan development, including the child's plan for permanent placement") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The following were actively involved in the case plan development, including the child's plan for permanent placement") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The following were not actively involved in the case plan development, including the child's plan for permanent placement. The county agency is ordered to actively involve them and submit an updated case plan within 30 days of the date of this hearing.") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The following were not actively involved in the case plan development, including the child's plan for permanent placement. The county agency is ordered to actively involve them and submit an updated case plan within 30 days of the date of this hearing.") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The following were not actively involved in the case plan development, including the child's plan for permanent placement. The county agency is not required to involve them because these persons are unable, unavailable, or unwilling to participate.") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The following were not actively involved in the case plan development, including the child's plan for permanent placement. The county agency is not required to involve them because these persons are unable, unavailable, or unwilling to participate.") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Court Grants JV-430") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Court Grants JV-430") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The following persons have made the indicated level of progress toward alleviating or mitigating the causes necessitating placement") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The following persons have made the indicated level of progress toward alleviating or mitigating the causes necessitating placement") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Court Grants JV-426") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Court Grants JV-426") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The additional services, assessments, and/or evaluations the child requires to meet the unmet needs specified in item 16 or other concerns are") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The additional services, assessments, and/or evaluations the child requires to meet the unmet needs specified in item 16 or other concerns are") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The additional services, assessments, and/or evaluations the child requires to meet the unmet needs specified in item 17 or other concerns are") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The additional services, assessments, and/or evaluations the child requires to meet the unmet needs specified in item 17 or other concerns are") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Child 16 years of age or older: The child was in foster care at 16 years of age and remains eligible for independent living services. The county agency will provide those services as stated in the child's case plan and Transitional Independent Living Plan") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Child 16 years of age or older: The child was in foster care at 16 years of age and remains eligible for independent living services. The county agency will provide those services as stated in the child's case plan and Transitional Independent Living Plan") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Child 14 years of age or older") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Child 14 years of age or older") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Findings__c?.includes("To assist the child in making the transition to successful adulthood, the county agency must add to the case plan and provide the service") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("To assist the child in preparing for postsecondary education, the county agency must add to the case plan and provide the services") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Services offered to the family by the county agency to eliminate the conditions or factors requiring court intervention were") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Services offered to the family by the county agency to eliminate the conditions or factors requiring court intervention were") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The court has read and considered and admits into evidence") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The court has read and considered and admits into evidence") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The child's education placement has changed since the last review hearing.") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The child's education placement has changed since the last review hearing.")|| this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The child is 16 years of age or older, and under the requirements of Welf. & Inst. Code 16501.1') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The child is 16 years of age or older, and under the requirements of Welf. & Inst. Code 16501.1')) } ,                
            { ruleName:  'isGrid43112211Hidden', condition :!this.recordMap.get('Court_Minute_Order__c').Trans_Adult_Ser__c?.includes("To assist the child in making the transition to successful adulthood, the county agency must add to the case plan and provide the services"), fieldName : 'Age_Ser_Stated__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid4311Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The following were not actively involved in the case plan development, including the child's plan for permanent placement. The county agency is ordered to actively involve them and submit an updated case plan within 30 days of the date of this hearing.") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The following were not actively involved in the case plan development, including the child's plan for permanent placement. The county agency is ordered to actively involve them and submit an updated case plan within 30 days of the date of this hearing.")), fieldName : 'Not_Active_Case_Plan__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid40Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The JV 180 request is denied') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The JV 180 request is denied')), fieldName : 'JV180_Request_Denied_Reason__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid4311221Hidden', condition :!this.recordMap.get('Court_Minute_Order__c').Adulthood_Services__c?.includes("To assist the child in making the transition to successful adulthood, the county agency must add to the case plan and provide the services"), fieldName : 'Tran_Adul_Ser__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGRIDac24f5Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Court orders (Drop down) to ensure child(ren)’s attendance and educational needs are met") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Court orders (Drop down) to ensure child(ren)’s attendance and educational needs are met")), fieldName : 'Ensure_School_Attendance__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid43111Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The following were not actively involved in the case plan development, including the child's plan for permanent placement. The county agency is not required to involve them because these persons are unable, unavailable, or unwilling to participate.") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The following were not actively involved in the case plan development, including the child's plan for permanent placement. The county agency is not required to involve them because these persons are unable, unavailable, or unwilling to participate.")), fieldName : 'Case_Plan_Not_Required__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid432Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The child's current placement is not appropriate.  The county agency must locate an appropriate place for the child") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The child's current placement is not appropriate.  The county agency must locate an appropriate place for the child")), fieldName : 'Progress_Placement__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid43Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Parties to the case knowingly waived their legal rights') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Parties to the case knowingly waived their legal rights')), fieldName : 'Waived_Rights_Party__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid481Hidden', condition :this.recordMap.get('Court_Minute_Order__c').Has_Potential_Tribal_Affiliation__c !== 'Reason to Know' } ,                
            { ruleName:  'isGrid48Hidden', condition :this.recordMap.get('Court_Minute_Order__c').Has_Potential_Tribal_Affiliation__c !== 'Reason to Believe' } ,                
            { ruleName:  'isGrid12Hidden', condition : !((this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Prima Facie showing has been made") && !this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Prima Facie showing has been made for the petition") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Prima Facie showing has been made') && !this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Prima Facie showing has been made for the petition")) || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Prima Facie showing has not been made. The Nonminor’s request to return to foster care is denied") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Prima Facie showing has not been made. The Nonminor’s request to return to foster care is denied") || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The nonminor is neither present in court nor participating by telephone and the nonminor’s current location is unknown.") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The nonminor is neither present in court nor participating by telephone and the nonminor’s current location is unknown.") || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('NM meets the following criteria in WIC 11403(b) to remain in foster care as NMD under juvenile court jurisdiction.') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('NM meets the following criteria in WIC 11403(b) to remain in foster care as NMD under juvenile court jurisdiction.') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('NM has application pending for title XVI SSI benefits, and continuation of juvenile court jurisdiction until a final decision has been issued to ensure continued assistance') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('NM has application pending for title XVI SSI benefits, and continuation of juvenile court jurisdiction until a final decision has been issued to ensure continued assistance') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('NM is an Indian child under ICWA, and has the right to choose whether the Act will continue to apply as NMD')   || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('NM is an Indian child under ICWA, and has the right to choose whether the Act will continue to apply as NMD') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('NM is subject to delinquency jurisdiction, either was previously a dependent of the court under section 300 or was placed in foster care under section 727.')   || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('NM is subject to delinquency jurisdiction, either was previously a dependent of the court under section 300 or was placed in foster care under section 727.')) } ,                
            { ruleName:  'isGrid24Hidden', condition :!(
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The child's current placement is not appropriate.  The county agency must locate an appropriate place for the child") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The child's current placement is not appropriate.  The county agency must locate an appropriate place for the child") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The matter is continued to the date and time indicated in item 40 for an oral report by the county agency on the progress made toward") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The matter is continued to the date and time indicated in item 40 for an oral report by the county agency on the progress made toward") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The matter is continued to the date and time indicated in item 40 for a written report by the county agency on the progress made toward") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The matter is continued to the date and time indicated in item 40 for a written report by the county agency on the progress made toward") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The child was not actively involved in the case plan development, including the child's plan for permanent placement, and") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The child was not actively involved in the case plan development, including the child's plan for permanent placement, and") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The child has identified the following as an individual important to him or her") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The child has identified the following as an individual important to him or her") ||
  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Parents’ authority to make medical decisions is suspended and vested with the County") ||
  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Parents’ authority to make medical decisions is suspended and vested with the County")
) } ,                
            { ruleName:  'isGrid4Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Child Comes Under ICWA') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Child Comes Under ICWA')) } ,                
            { ruleName:  'isGrid45Hidden', condition : !this.recordMap.get('Court_Minute_Order__c').Prima_Facie_Showing_Made_Type__c?.includes('NM intends to satisfy at least one of the conditions described in WIC 11403(b)'), fieldName : 'WIC_11403_b_Condition_Type_JV_470__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid43211Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The matter is continued to the date and time indicated in item 40 for a written report by the county agency on the progress made toward') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The matter is continued to the date and time indicated in item 40 for a written report by the county agency on the progress made toward')), fieldName : 'Progess_Made_Toward__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGRID8696ab1Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The 18-year-old doesn’t meet the requirements for Post-18 Dispositional Hearing") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The 18-year-old doesn’t meet the requirements for Post-18 Dispositional Hearing")), fieldName : 'Disqualification_Reason__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid4321212112Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Reunification services are terminated") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Reunification services are terminated")), fieldName : 'Reason_for_Term_Reu__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid41Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Court Grants JV-471 Request Findings') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Court Grants JV-471 Request Findings')), fieldName : 'Court_Grants_JV_471_Request_Findings__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid50Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('JV-220 App Granted w modif or cond') || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('JV-220 App Granted w modif or cond') || this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Resubmit JV-220 App') || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Resubmit JV-220 App') || this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Psychotropic Medication Application granted with modifications or conditions') || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Psychotropic Medication Application granted with modifications or conditions') || this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Psychotropic Medication Application Denied') || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Psychotropic Medication Application Denied')) } ,                
            { ruleName:  'isGrid38Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Child meets the expedited placement criteria') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Child meets the expedited placement criteria')), fieldName : 'Applicable_Expedited_Placement_Criteria__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid6Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Parentage Finding') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Parentage Finding')) } ,                
            { ruleName:  'isGrid161Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Court orders (Drop down) to ensure child(ren)’s attendance and educational needs are met") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Court orders (Drop down) to ensure child(ren)’s attendance and educational needs are met")) } ,                
            { ruleName:  'isGrid31Hidden', condition :!((this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The basis for the court’s determination has been stated on the record or is stated in writing here") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The basis for the court’s determination has been stated on the record or is stated in writing here")) && 
this.recordMap.get('Court_Minute_Order__c').The_Basis_for_the_Court_Determination_is__c?.includes('Other')) } ,                
            { ruleName:  'isGrid44Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Prima Facie showing has been made') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Prima Facie showing has been made')), fieldName : 'Prima_Facie_Showing_Made_Type__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid431122Hidden', condition :!this.recordMap.get('Court_Minute_Order__c').Adulthood_Services__c?.includes("To assist the child in making the transition to successful adulthood, the county agency must add to the case plan and provide the services"), fieldName : 'Adu_Ser_Stated__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid33Hidden', condition :!((this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The basis for the court’s determination has been stated on the record or is stated in writing here") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The basis for the court’s determination has been stated on the record or is stated in writing here")) && this.recordMap.get('Court_Minute_Order__c').The_Basis_for_the_Court_Determination_is__c?.includes('Other')) } ,                
            { ruleName:  'isGrid43112211111Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The court has read and considered and admits into evidence') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The court has read and considered and admits into evidence')), fieldName : 'Admitted_Evi__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid4321111Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Parents’ authority to make medical decisions is suspended and vested with the County') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Parents’ authority to make medical decisions is suspended and vested with the County')), fieldName : 'Child_Needs_Dec__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid4321212Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Juvenile court jurisdiction over the youth as an NMD is continued, and the compelling reasons why other permanent plan options are not in the nonminor’s best interest are') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Juvenile court jurisdiction over the youth as an NMD is continued, and the compelling reasons why other permanent plan options are not in the nonminor’s best interest are')), fieldName : 'Com_Reasons_Placement__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid271Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Jurisdiction Terminated') || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Jurisdiction Terminated')) } ,                
            { ruleName:  'isGrid20Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Reasonable efforts were made to Prevent Removal') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Reasonable Efforts Not Made') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Reasonable efforts were made to Prevent Removal') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Reasonable Efforts Not Made')) } ,                
            { ruleName:  'isGrid43211111Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Parents’ authority to make medical decisions is suspended and vested with the County') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Parents’ authority to make medical decisions is suspended and vested with the County')), fieldName : 'Child_Need_Dec_Able__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid47Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('NM meets the following criteria in WIC 11403(b) to remain in foster care as NMD under juvenile court jurisdiction.') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('NM meets the following criteria in WIC 11403(b) to remain in foster care as NMD under juvenile court jurisdiction.')), fieldName : 'WIC_11403_b_Condition_Type_JV_367__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid351Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The 18-year-old doesn’t meet the requirements for Post-18 Dispositional Hearing") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The 18-year-old doesn’t meet the requirements for Post-18 Dispositional Hearing")) } ,                
            { ruleName:  'isGrid39Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The basis for the court’s determination has been stated on the record or is stated in writing here") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The basis for the court’s determination has been stated on the record or is stated in writing here")), fieldName : 'The_Basis_for_the_Court_Determination_is__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid43212121Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The social worker or probation officer has done all of the following') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The social worker or probation officer has done all of the following')), fieldName : 'Social_Worker_Actions__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName: 'isGrid14Hidden', condition: !(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Court Grants JV-471 Request Findings') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Court Grants JV-471 Request Findings') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Court Denies JV-471 Request Findings - It is not in NM's best interest to grant the request to dismiss jurisdiction ") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Court Denies JV-471 Request Findings")), fieldName: 'Social_Worker_Actions__c', value: '', clearErrorMsg: true }, ,                
            { ruleName:  'isGrid4321211Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The extent of progress made by the NMD toward meeting the TILCP goals has been') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The extent of progress made by the NMD toward meeting the TILCP goals has been')), fieldName : 'Prog_TILCP_Goals__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid8Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The child’s developmental needs are being met") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The child’s developmental needs are being met") || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Proposed placement in the receiving state is home to kin') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Proposed placement in the receiving state is home to kin') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Child meets the expedited placement criteria') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Child meets the expedited placement criteria') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Needs of the child or NMD being met through placement in a family-based setting') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Needs of the child or NMD being met through placement in a family-based setting') ||  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('In the case of an Indian Child, there is clear and convincing evidence of good cause to depart from the placement preferences stated in Welf. & Inst Code 361.31') ||  this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('In the case of an Indian Child, there is clear and convincing evidence of good cause to depart from the placement preferences stated in Welf. & Inst Code 361.31') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The STRTP or CTF identified in the Placing Agency’s JV-235 filed:") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The STRTP or CTF identified in the Placing Agency’s JV-235 filed:") || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The basis for the court’s determination has been stated on the record or is stated in writing here") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The basis for the court’s determination has been stated on the record or is stated in writing here") || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Continuance is not contrary to the interest of the child or nonminor, and good cause exists for the continuance as stated below:') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Continuance is not contrary to the interest of the child or nonminor, and good cause exists for the continuance as stated below:') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('CW Agency has provided court with signed statement from person named in proposed placement') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('CW Agency has provided court with signed statement from person named in proposed placement')) } , 
            { ruleName:  'isGrid431122111112Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The child is 16 years of age or older, and under the requirements of Welf. & Inst. Code 16501.1") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The child is 16 years of age or older, and under the requirements of Welf. & Inst. Code 16501.1")), fieldName : 'wic165011__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid53Hidden', condition :!this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The JV 180 request is denied"), fieldName : 'JV180_Request_Denied_Reason__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid4321212111Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The nonminor cannot safely reside in the family home, and reunification services are continued") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The nonminor cannot safely reside in the family home, and reunification services are continued")), fieldName : 'Reason_For_Con_Reun__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid52Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Inter-County Transfer In Hearing Ordered') || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Inter-County Transfer In Hearing Ordered') || this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Inter-County Transfer Out Hearing Ordered') || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Inter-County Transfer Out Hearing Ordered')|| this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Inter-County Transfer Out Ordered')) } ,                
            { ruleName:  'isGrid29Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The NMD’s Transitional Independent Living Case Plan includes a plan for them to satisfy at least one of the criteria in WIC 11403 (b) to remain in foster care under juvenile court jurisdiction as indicated below') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The NMD’s Transitional Independent Living Case Plan includes a plan for them to satisfy at least one of the criteria in WIC 11403 (b) to remain in foster care under juvenile court jurisdiction as indicated below') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The extent of progress made by the NMD toward meeting the TILCP goals has been') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The extent of progress made by the NMD toward meeting the TILCP goals has been') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Likely Anticipated the NMD will achieve successful Adulthood is') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Likely Anticipated the NMD will achieve successful Adulthood is') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Juvenile court jurisdiction over the youth as an NMD is continued and the youth’s permanent plan is') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Juvenile court jurisdiction over the youth as an NMD is continued and the youth’s permanent plan is') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Juvenile court jurisdiction over the youth as an NMD is continued, and the compelling reasons why other permanent plan options are not in the nonminor’s best interest are') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Juvenile court jurisdiction over the youth as an NMD is continued, and the compelling reasons why other permanent plan options are not in the nonminor’s best interest are') ||  this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The social worker or probation officer has done all of the following') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The social worker or probation officer has done all of the following') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The extent of progress made toward alleviating or mitigating the causes necessitating the current out of home placement has been') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The extent of progress made toward alleviating or mitigating the causes necessitating the current out of home placement has been') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The nonminor cannot safely reside in the family home, and reunification services are continued') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The nonminor cannot safely reside in the family home, and reunification services are continued') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Reunification services are terminated') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Reunification services are terminated')  || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The likely date by which the NMD may safely reside in the family home or achieve independence or, for a youth who has chosen to have the ICWA apply, in consultation with the child’s tribe, be placed for tribal customary adoptions is') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Under the requirements of WIC 16501 1") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Under the requirements of WIC 16501 1")) } ,                
            { ruleName:  'isGrid432111Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The child was not actively involved in the case plan development, including the child's plan for permanent placement, and") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The child was not actively involved in the case plan development, including the child's plan for permanent placement, and")), fieldName : 'Child_Not_Activel__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid18Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Notice requirement were not met. The following items were not served within the time prescribed by law:') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Notice requirements were not met')   || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Notice requirement were not met. The following items were not served within the time prescribed by law:') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Notice requirements were not met')) } ,                
            { ruleName:  'isGrid4311221111Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Court Grants JV-426') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Court Grants JV-426')), fieldName : 'Tran_Ind_Living__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid4321212113Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("The extent of progress made toward alleviating or mitigating the causes necessitating the current out of home placement has been") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The extent of progress made toward alleviating or mitigating the causes necessitating the current out of home placement has been")), fieldName : 'Prog_Tow_Mitiga_Causes__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid432121211Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Under the requirements of WIC 16501 1") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Under the requirements of WIC 16501 1")), fieldName : 'WIC16501_Requirements__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid27Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The child’s TILP Case Plan includes a plan for the child to satisfy the following conditions of eligibility to remain under juvenile court jurisdiction as a NMD') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The child’s TILP Case Plan includes a plan for the child to satisfy the following conditions of eligibility to remain under juvenile court jurisdiction as a NMD') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Not all the information, documents, and services included in WIC section 391(b)-(c) were provided to the child') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Not all the information, documents, and services included in WIC section 391(b)-(c) were provided to the child')) } ,                
            { ruleName:  'isGrid43112Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Child 16 years of age or older: The child was in foster care at 16 years of age and remains eligible for independent living services. The county agency will provide those services as stated in the child's case plan and Transitional Independent Living Plan") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Child 16 years of age or older: The child was in foster care at 16 years of age and remains eligible for independent living services. The county agency will provide those services as stated in the child's case plan and Transitional Independent Living Plan")), fieldName : 'Trans_Adult_Ser__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGRID8696abHidden', condition : !this.recordMap.get('Court_Minute_Order__c').Court_Grants_JV_472_Request_Findings__c?.includes('NM intends to satisfy condition under WIC 11403(b)'), fieldName : 'WIC_11403b_Condition_Type_JV_472__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid431122111Hidden', condition :!this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("To assist the child in preparing for postsecondary education, the county agency must add to the case plan and provide the services"), fieldName : 'Po_Add_Ser_Stated__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid35Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Parent Rights Term. - Biological Father') || this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Parental Rights Term. - Biological Mother')||this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Parental Rights Term. - Adoptive Father') || this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Parental Rights Term. - Anyone claiming to be the father') ||this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Parental Rights Term. - Legal Mother')||
this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Parental Rights Term. - Biological Father') || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Parental Rights Term. - Biological Mother')||this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Parental Rights Term. - Adoptive Father') || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Parental Rights Term. - Anyone claiming to be the father') || this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Parental Rights Term. - Legal Mother')||this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Parental Rights Term.- Alleged Father')||this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Parental Rights Term.- Alleged Mother')||this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Parental Rights Term.- Alleged Parents') ||this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Parental Rights Term.- Alleged Parents') || this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Parental Rights Term.- Legal Father')||this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Parental Rights Term.- Mother')||this.recordMap.get('Court_Minute_Order__c').Minute_Order__c?.includes('Parent Rights Term. - Presumed Father')||this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Parental Rights Term.- Alleged Father')||this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Parental Rights Term.- Alleged Mother')||this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Parental Rights Term.- Legal Father')||this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Parental Rights Term.- Mother') ||this.recordMap.get('Court_Minute_Order__c').Additional_Orders__c?.includes('Parental Rights Term. - Presumed Father')
) } ,                
            { ruleName:  'isGrid37Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Proposed placement in the receiving state is home to kin') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Proposed placement in the receiving state is home to kin')), fieldName : 'Select_Kin__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid431111Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The following persons have made the indicated level of progress toward alleviating or mitigating the causes necessitating placement') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The following persons have made the indicated level of progress toward alleviating or mitigating the causes necessitating placement')), fieldName : 'Mitigation_Placement_Causes__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid42Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Parties to the case informed of their legal rights') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Parties to the case informed of their legal rights')), fieldName : 'Informed_and_Advised_Party__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid4321Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The matter is continued to the date and time indicated in item 40 for an oral report by the county agency on the progress made toward') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The matter is continued to the date and time indicated in item 40 for an oral report by the county agency on the progress made toward')), fieldName : 'Progress_Made_Toward__c' ,value : '', clearErrorMsg : true } ,                
           { ruleName: 'isGrid32Hidden', condition: !(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Court Grants JV-472 Request Findings') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Court Grants JV-472 Request Findings') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Court Denies JV-472 Request") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Court Denies JV-472 Request") || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Court Grants JV-472 Request - The Court makes the findings stated below') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Court Grants JV-472 Request - The Court makes the findings stated below')) },             
            { ruleName:  'isGrid431121Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Child 14 years of age or older') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Child 14 years of age or older')), fieldName : 'Adulthood_Services__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid10Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The JV 180 request is denied') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('All parties and attorneys agree to the request. Request is granted as follows') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The JV 180 request is denied') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('All parties and attorneys agree to the request. Request is granted as follows')) } ,                
             { ruleName:  'isGrid22Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Application made for authorization to begin or continue giving the child the psychotropic medication listed in #19 on JV-220(A) or #16 on JV-220(B)') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Application made for authorization to begin or continue giving the child the psychotropic medication listed in #19 on JV-220(A) or #16 on JV-220(B)') || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('Application to be Resubmitted') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('Application to be Resubmitted')
 || this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes("Ordered to give a copy of this order, including pages 5 and 6 of form JV-220(A) or pages 3 and 4 of form JV-220(B) and the medication monograph attached to the form JV-220(A) to the child's caregiver either in person or by mail within two court days") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("Ordered to give a copy of this order, including pages 5 and 6 of form JV-220(A) or pages 3 and 4 of form JV-220(B) and the medication monograph attached to the form JV-220(A) to the child's caregiver either in person or by mail within two court days") || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes("The JV 180 request is denied")) } ,                
            { ruleName:  'isGrid43212Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').Select_Findings__c?.includes('The child’s TILP Case Plan includes a plan for the child to satisfy the following conditions of eligibility to remain under juvenile court jurisdiction as a NMD') || this.recordMap.get('Court_Minute_Order__c').Additional_Finding__c?.includes('The child’s TILP Case Plan includes a plan for the child to satisfy the following conditions of eligibility to remain under juvenile court jurisdiction as a NMD')), fieldName : 'Select_TILCP__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isGrid4311221111111Hidden', condition :!(this.recordMap.get('Court_Minute_Order__c').wic165011__c?.includes("To assist the child in preparing for postsecondary education, the county agency must add to the case plan and provide the services")), fieldName : 'PostSec_Ed_Ser_Added__c' ,value : '', clearErrorMsg : true } ,                
            { ruleName:  'isbuttonGroup11Hidden', condition :this.pageLevelReadOnly }  
        ];
        const hiddenFieldsToCheckMap = {
                    'Court_Minute_Order__c' : courtminuteordercFieldsToCheck 
        };
        const hiddenFieldsToCheck = hiddenFieldsToCheckMap[record?.attributes?.type];
            if (hiddenFieldsToCheck) {
                 hiddenFieldsToCheck.forEach(dataForHiddenRule => {
                 setHiddenRule(this, record, dataForHiddenRule);
                });  
            }
        
    }                 
    


    handleCancel(event){
        this.upsertRecordMap.clear();
        this.upsertSobjectMap.clear();
        this.iscares_CourtMinuteOrder = false;
        this.handleLoad();
    }



	handleInputDataChangeEvent(event) {
        const recordData = handleChange(this,event);
        this.eventTracker = event.currentTarget.dataset.lwcId;
        validateInputData(recordData, this.Constants.ONCHANGE, this);
// EMPTY_CALL: onChangeHandler (auto-commented)         onChangeHandler(this,recordData,event);
    }

    handleInputDataBlurEvent(event) {
        const recordData = handleChange(this,event);
        validateInputData(recordData, this.Constants.ONBLUR, this);
// EMPTY_CALL: onBlurHandler (auto-commented)         onBlurHandler(this,recordData,event);
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

    handleDependentPickList(record, eventType) {
        if (!record || ( record.attributes.type !== 'Court_Minute_Order__c')) {
            return;
        }
        const fieldForCourtMinuteOrderc = [
                {  field: 'Termination_of_Jurisdiction_Reason__c', dependentFields: ['Termination_of_Jurisdiction_Sub_Reason__c'], pickListInfo: this.pickListInfo?.Court_Minute_Order__c_Termination_of_Jurisdiction_Sub_Reason__c_5b0, eventTracker: 'Court_Minute_Order__c|Termination_of_Jurisdiction_Reason__c'}
        ];

        const fieldsToCheckDependentPicklist = {
            'Court_Minute_Order__c' : fieldForCourtMinuteOrderc
        };
        const fieldsToCheckPicklist = fieldsToCheckDependentPicklist[record?.attributes?.type];
       
        if (fieldsToCheckPicklist) {
            fieldsToCheckPicklist.forEach(dataforpicklist => {
            if (eventType === this.Constants.ONCHANGE || eventType === this.Constants.ONLOAD) {
                handlePickList(this,eventType,record,dataforpicklist);
                }
        });
        }
        this.handleDisabledRule(record, eventType);

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
// EMPTY_CALL: renderedCallbackHelper (auto-commented)         renderedCallbackHelper(this);
    }

	importedComponentFieldMapping = {
			CourtGrantsJV471RequestFindings:{fieldValue:'Court_Minute_Order__c|Court_Grants_JV_471_Request_Findings__c'},undefined_3f8487:{fieldValue:'Court_Minute_Order__c|Tran_Adul_Ser__c'},undefined_820476:{fieldValue:'Court_Minute_Order__c|WIC_11404_b_Condition_Type_JV_462__c'},JV180RequestDeniedReason:{fieldValue:'Court_Minute_Order__c|JV180_Request_Denied_Reason__c'},WIC11403bConditionTypeJV367:{fieldValue:'Court_Minute_Order__c|WIC_11403_b_Condition_Type_JV_367__c'},undefined_dd0adc:{fieldValue:'Court_Minute_Order__c|Progess_Made_Toward__c'},ApplicableExpeditedPlacementCriteria:{fieldValue:'Court_Minute_Order__c|Applicable_Expedited_Placement_Criteria__c'},undefined_473e37:{fieldValue:'Court_Minute_Order__c|WIC16501_Requirements__c'},undefined_df1d83:{fieldValue:'Court_Minute_Order__c|Court_Grants_JV_472_Request_Findings__c'},undefined_9e83b3:{fieldValue:'Court_Minute_Order__c|Admitted_Evi__c'},undefined_de9166:{fieldValue:'Court_Minute_Order__c|Prog_TILCP_Goals__c'},undefined_f51b85:{fieldValue:'Court_Minute_Order__c|Tran_Ind_Living__c'},undefined_cb029d:{fieldValue:'Court_Minute_Order__c|Not_Active_Case_Plan__c'},undefined_04ff13:{fieldValue:'Court_Minute_Order__c|Tra_Ind_Add_Serv__c'},undefined_914547:{fieldValue:'Court_Minute_Order__c|PostSec_Ed_Ser_Added__c'},PrimaFacieShowingMadeType:{fieldValue:'Court_Minute_Order__c|Prima_Facie_Showing_Made_Type__c'},undefined_4b20ba:{fieldValue:'Court_Minute_Order__c|Select_TILCP__c'},undefined_d6a672:{fieldValue:'Court_Minute_Order__c|Po_Add_Ser_Stated__c'},undefined_1c30a8:{fieldValue:'Court_Minute_Order__c|Child_Needs_Dec__c'},undefined_202165:{fieldValue:'Court_Minute_Order__c|Prog_Tow_Mitiga_Causes__c'},undefined_f47486:{fieldValue:'Court_Minute_Order__c|wic165011__c'},undefined_675c87:{fieldValue:'Court_Minute_Order__c|Com_Reasons_Placement__c'},undefined_4f5170:{fieldValue:'Court_Minute_Order__c|Ensure_School_Attendance__c'},WIC11403bConditionTypeJV472:{fieldValue:'Court_Minute_Order__c|Waived_Rights_Party__c'},undefined_377eb7:{fieldValue:'Court_Minute_Order__c|Adulthood_Services__c'},undefined_12fb5d:{fieldValue:'Court_Minute_Order__c|Progress_Placement__c'},undefined_d6ed83:{fieldValue:'Court_Minute_Order__c|Progress_Made_Toward__c'},undefined_cbc0e9:{fieldValue:'Court_Minute_Order__c|Child_Not_Activel__c'},undefined_7c0724:{fieldValue:'Court_Minute_Order__c|Reason_for_Term_Reu__c'},undefined_10e21b:{fieldValue:'Court_Minute_Order__c|Case_Plan_Not_Required__c'},CourtGrantsJV472RequestFindings:{fieldValue:'Court_Minute_Order__c|Informed_and_Advised_Party__c'},JV_180_Request_Denied_Reason:{fieldValue:'Court_Minute_Order__c|JV180_Request_Denied_Reason__c'},undefined_0a723f:{fieldValue:'Court_Minute_Order__c|Disqualification_Reason__c'},TheBasisfortheCourtDeterminationis:{fieldValue:'Court_Minute_Order__c|The_Basis_for_the_Court_Determination_is__c'},SelectKin:{fieldValue:'Court_Minute_Order__c|Select_Kin__c'},undefined_843740:{fieldValue:'Court_Minute_Order__c|Adu_Ser_Stated__c'},undefined_cc7671:{fieldValue:'Court_Minute_Order__c|Minute_Order__c'},undefined_90a4fa:{fieldValue:'Court_Minute_Order__c|Case_Plan_Developed__c'},ReasonNMDreturntoFCdenied:{fieldValue:'Court_Minute_Order__c|Reason_NMD_return_to_FC_denied__c'},undefined_4974cb:{fieldValue:'Court_Minute_Order__c|Mitigation_Placement_Causes__c'},CWIParticipants:{fieldValue:'Court_Minute_Order__c|Court_Work_Item_Participant__c'},undefined_6abcee:{fieldValue:'Court_Minute_Order__c|WIC_11403b_Condition_Type_JV_472__c'},undefined_fcc475:{fieldValue:'Court_Minute_Order__c|Social_Worker_Actions__c'},additional_finding:{fieldValue:'Court_Minute_Order__c|Additional_Finding__c'},undefined_8ac62f:{fieldValue:'Court_Minute_Order__c|Child_Need_Dec_Able__c'},undefined_eff160:{fieldValue:'Court_Minute_Order__c|Trans_Adult_Ser__c'},undefined_a20052:{fieldValue:'Court_Minute_Order__c|Age_Ser_Stated__c'},undefined_cc7d42:{fieldValue:'Court_Minute_Order__c|Additional_Orders__c'},WIC11403bConditionTypeJV470:{fieldValue:'Court_Minute_Order__c|WIC_11403_b_Condition_Type_JV_470__c'},ReasonToBelieve:{fieldValue:'Court_Minute_Order__c|Reason_to_Believe_Selection__c'},undefined_c70a45:{fieldValue:'Court_Minute_Order__c|Ed_Plac_Changes__c'},undefined_649b3d:{fieldValue:'Court_Minute_Order__c|Reason_For_Con_Reun__c'},ReasonToKnow:{fieldValue:'Court_Minute_Order__c|Reason_to_Know_Selection__c'},SelectFindings:{fieldValue:'Court_Minute_Order__c|Select_Findings__c'}
	}
	handleImportedComponentEvt(event) {
	    addImportedCompValuesToRecord(this,event);
	    handleImportedCompEvtHelper(this,event);
	}
}
