
const NUM_0 = 0;
const NUM_10 = 10;
const NUM_2 = 2;
const NUM_127772 = 127772;
const NUM_1000 = 1000;
const NUM_60 = 60;
const NUM_24 = 24;
const NUM_365_2425 = 365.2425;
const NUM_18 = 18;
const NUM_500 = 500;
const NUM_30 = 30;
const NUM_1 = 1;
//SideKick
/**
* Name: Cares_ParentScreeningComponent.js
* Module: Intake
* Type: LWC Component's JS controller
* Description: This LWC component is created to show confirmation message.
* 
* Date               Developer/Company                 	        Description
* ---------------------------------------------------------------------------------------------------------------------------------------- *
* 7/25/2022         Soni/Deloitte                   Initial Creation and logic Build
* 8/19/2022         Prashant/ Deloitte               Enhancment CARESV1-653
* 8/19/2022         Nikhil/ Deloitte                 Design/Template CARESV1-653
* 8/29/2022         Nikhil/ Deloitte               Enhancment CARESV1-1260
* 8/25/2022          Aravind Pnsk/Deloitte          Enhancement CARESV1 - 2700
* 9/6/2022           Aravind Pnsk/Deloitte              Defect CARESV1-4108
* 9/6/2022           Moaaz/Deloitte                  Enhancement CARESV1-1328
* 9/16/2022          Ashok/Deloitte                  Enhancement CARESV1-785
* 9/22/2022           Aravind Pnsk/Deloitte               CARESV1-3735
* 9/26/2022          Ashok/Deloitte                  Enhancement CARESV1-463
* 10/3/2022         Vivek/Deloitte                      Defect 5172
* 10/11/2022        Aravind/Deloitte                    CARESV1-1286
* 10/11/2022        Soni/Deloitte                    CARESV1-4420
* 10/12/2022        Yogesh/Deloitte                    CARESV1-3588
* 10/19/2022        Mahima/Deloitte                   CARESV1-5647 
* 10/31/2022		Aravind/Deloitte				 CARESV1-6292
* 03/11/2022        Aravind/Deloitte                 CARESV1-6514 
* 01/02/2023        Nupur/Deloitte                   CARESV1-7201
* 01/03/2023        Alena/Deloitte                   CARESV1-7299 
* 13/01/2022         Vivek/Deloitte                  CARESV1-6220: Modified delete warning message for Screening Person related with allegations
* 23/01/2023         Aravind/Deloitte                CARESV1-9432
* 01/24/2022         Vivek Kuntal/Deloitte           CARESV1-7812 (changed HTML to make Start_Date__c field mandatory)
* 04/11/2023          Prashant/ Deloitte              Enhancment CARESV1-8468 Added  CSEC Justification field
* 04/18/2023          Prashant/ Deloitte              Bug fix CARESV1-13471 -HTMl Help text update. 
* 04/14/2023         Alena/Deloitte                  Defect CARESV1-13295
* 10/09/2023         Alena/Deloitte                  CARESV1-18850
* 11/14/2023         Moaaz/Deloitte                   CARESV1-6055 - Changed Call Narrative to Screening Narrative
* 06/21/2024         Vivek/Deloitte 				           CARESV1-15959 - Added validation to prevent victim child older than 18.
 24/06/2024      Vamsi Krishna/ Deloitte               CARESV1-45683
* 06/25/2024         Vivek/Deloitte 				           CARESV1-45799: Fixed validation error when date is changed to null.
* 06/27/2024         Vivek/Deloitte 				           CARESV1-46071: Fixed future date error in handleDateChange
**/
import { LightningElement, wire, track, api } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';
import ScreeningPerson_OBJECT from '@salesforce/schema/Screening_Person__c';
import Role_FIELD from '@salesforce/schema/Screening_Person__c.Role__c';
import { RefreshEvent } from 'lightning/refresh';
import CollateralType_FIELD from '@salesforce/schema/Screening_Person__c.Collateral_Type__c';
import County_FIELD from '@salesforce/schema/Screening_Person__c.CountyNew__c';
import CALL_NARRATIVE_FIELD from '@salesforce/schema/Screening__c.Call_Narrative__c';
import CALCAWS_VALIDATIONS_FIELD from '@salesforce/schema/Screening__c.CalSAWS_Validation__c';
import saveScreeningPersons from '@salesforce/apex/CARES_ScreeningPersonLwcController.saveScreeningPersons';
import loadScreeningPersons from '@salesforce/apex/CARES_ScreeningPersonLwcController.getScreeningPersons';
import deleteScreeningPerson from '@salesforce/apex/CARES_ScreeningPersonLwcController.deleteScreeningPerson';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getTodayDate from '@salesforce/apex/CARES_UtilityStringHelper.getTodayDate';
import ID from '@salesforce/user/Id';
import OWNER_ID_FIELD from '@salesforce/schema/Screening__c.OwnerId';
import APPROVAL_SUPERVISOR from '@salesforce/schema/Screening__c.Approval_Supervisor__c';
import OWNER_MANAGER_ID_FIELD from '@salesforce/schema/User.ManagerId';
import addScreeningPersonCSS from '@salesforce/resourceUrl/addScreeningPersonCSS';
import { loadStyle } from 'lightning/platformResourceLoader';
import loadScreeningRecord from '@salesforce/apex/CARES_ScreeningComponentController.getScreeningRecord'; //fetching the screeening record
import hasRelatedAllegations from '@salesforce/apex/CARES_ScreeningPersonController.showScreeningPersonDeleteWarning'; //CARESV1-6220
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation'; // for 860 | added for CARESV1-2700
import Approved_Label from '@salesforce/label/c.CARES_Option_Approved';
import Resubmitted_Label from '@salesforce/label/c.CARES_Option_Resubmitted';
import Pending_Label from '@salesforce/label/c.CARES_Option_Pending';
import Abuse_Neglect_Referral_Label from '@salesforce/label/c.CARES_Option_Abuse_Neglect_Referral';
const ABUSE_NEGLECT =Abuse_Neglect_Referral_Label;
const FIELDS = ['Screening__c.Approval_Status__c', 'Screening__c.Approval_Supervisor__c', 'Screening__c.Record_Owner_Manager_s_ID__c'];
import pubsub from 'c/cares_Pubsub';//added for CARESV1-2700
/* CARESV1-1286 changes starts */
import CSECTYPE_FIELD from '@salesforce/schema/CSEC__c.CSEC_Type__c';
import CSEC_OBJECT from '@salesforce/schema/CSEC__c';
import VICTIMATTIMEOFREMOVAL_FIELD from '@salesforce/schema/CSEC__c.CSEC_Victim_at_Time_of_Removal__c';
import VICTIMANYTIMEINPAST_FIELD from '@salesforce/schema/CSEC__c.CSEC_Victim_Anytime_in_the_Past__c';
import WASCROSSREPPAST_FIELD from '@salesforce/schema/CSEC__c.Cross_Reported_to_Law_Enforcement_Past__c';
import VICDURCURNTEPISODE_FIELD from '@salesforce/schema/CSEC__c.CSEC_Victim_During_Current_Episode__c';
import WASCROSSREPECUR_FIELD from '@salesforce/schema/CSEC__c.Cross_Reported_to_Law__c';
import FACILITY_FIELD from '@salesforce/schema/CSEC__c.Facility_for_Children_Youth__c';
import SystemModstamp from '@salesforce/schema/Account.SystemModstamp';
const CSECNARRATIVE_ERROR_MSG = 'You can enter only 127772 characters.';
import JUSTIFICATION_ERROR_MSG from '@salesforce/label/c.Justification_Error_Message_CSEC';
import  JUSTIFICATION_HELP_MSG  from '@salesforce/label/c.Justification_Help_Text_CSEC';
import  JUSTIFICATION_FEILD_LABEL  from '@salesforce/label/c.Justification_Label_CSEC';

/* CARESV1-1286 changes ends */

import VICTIM_OLDER_THAN_18_ERROR from '@salesforce/label/c.VictimOlderthan18Error';


import { getLogger } from 'c/logger';

import synchronousDML from '@salesforce/label/c.CARES_Exception_Synchronous_Dml';




export default class cares_AddScreeningPerson extends NavigationMixin(LightningElement) {
logger = getLogger();

    @api recordId;
    @track pid;
    @track personId;
    @track updatedRowIds = new Set();
    @track showSerialNo = false;
    @track callNarrativeValue = ' ';
    @track oldNarrativeValue = ' ';
    ApproxAgeValue = '';
    @track backendDate;
    @track role;
    @track colType;
    @track isDialogVisible = false;
    @track modalTitle;
    @track confirmationMsg;
    @track deleteInvoked = false;
    @track modalFunction = '';
    @track disableSave = false;

    @api hasEditAccess; // CARESV1-13295
    reasonFC;
    ownerId;
    mangerId;
    showCalSAWS = false;
    unknownCheckboxVar = false;
    calSAWSValidationValues = '';
    CalSAWSDetails;
    CalSAWSValidation;
    CalSAWSValidationDate;
    disableAll = false
    roles = [];
    collateralTypes = [];
    countyValues = [];
    disableDelete = false;
    /* CARESV1-1286 changes starts */
    @track showCsecCheckbox = false;
    @track showCsec = false;
    csecTypes = [];
    csecType;
    @track showDate = false;
    @track showAtRiskRelatedFields = false;
    @track showRiskFields = false;
    @track showPastFields = false;
    pastPolRepotNum;
    @track showCurrFields = false;
    justificationValue;
    justificationLabel = JUSTIFICATION_FEILD_LABEL;
    justificationHelpText= JUSTIFICATION_HELP_MSG;
    @track showWasVicPastFields = false;
    @track showWasVicCurrFields = false;
    /* CARESV1-1286 changes ends */

    allowedFormats = [//removed the link and image after discussion, there was a validation to be put in to stop the user to add image and link. to avoid, removed the access altogether
        'bold',
        'italic',
        'underline',
        'list',
        'indent',
        'align',
        'clean',
        'table',
        'header'
    ];

    @track richTextCount;//CARESV1-3588
    @track narrativeValidity = true;//CARESV1-3588
    @track remainingCharacter;//CARESV1-3588

    @track isRowExceeded = false;
    @track personList = [({ id: "", role: "", collateralType: "", lastName: "", firstName: "", dob: "", approxage: "", county: "", unknownCheckbox: false, isCollateral: false, isNotCollateral: true, DobManual: false, showAutoError: false, csecType: "", showCsec: false, csecId: "", startDate: "", endDate: "", showCsecCheckbox: false, showAtRiskRelatedFields: false, vicAtTimRem: "", vicAnyTimPast: "", showRiskFields: false, showDate: false, showPastFields: false, pastPolRepotNum: "",  showCurrFields: false, showWasVicPastFields: false, showWasVicCurrFields: false, disableAtRiskCsec: false, justificationValue: "",ValidatedPersonFlag:false })];
    //@track personList = [({ id: "", role: "", collateralType: "", lastName: "", firstName: "", dob: "", approxage: "", county: "", unknownCheckbox: false, isCollateral: false, isNotCollateral: true, DobManual: false, showAutoError: false, csecType: "", showCsec: false, startDate: "", endDate: ""})];
    @wire(getObjectInfo, { objectApiName: ScreeningPerson_OBJECT })
    objectInfo;


    @wire(CurrentPageReference) pageRef; //added for CARESV1-2700


    /**
   * Method Name  :  narrativeFieldHandler
   * Description  :  This  method(Wire) is used to fetch the current 'Call Narrative' / 'Screening Narrative' field value from Screening Page 
   * Return Type  :  NA
   * Parameter    :  RecordId , Fields (Array)
   */
    @wire(getRecord, { recordId: '$recordId', fields: [CALL_NARRATIVE_FIELD] })
    narrativeFieldHandler({ data }) {
        if (data) {
            this.callNarrativeValue = getFieldValue(data, CALL_NARRATIVE_FIELD);
            this.oldNarrativeValue = this.callNarrativeValue;
        }
    }

    /**
    * Method Name  :  rolePicklistValues
    * Description  :  This  method(Wire) is used to fetch the picklist values of role field from Screening Person
    * Return Type  :  NA
    * Parameter    :  RecordTypeId , FieldAPIName
    *
    */
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: Role_FIELD })
    rolePicklistValues({data}) {
        if (data) {
            this.roles = data.values;
        }
    }


    /**
        * Method Name  :  validationPicklistValues
        * Description  :  This  method(Wire) is used to fetch the picklist values of CalCAWSValidation field from Screening 
        * Return Type  :  NA
        * Parameter    :  RecordTypeId , FieldAPIName
        *  ------------------------------------------------------------------------------------------------------------------------------
        *  8/19/2022         Prashant/ Deloitte               Enhancment CARESV1-653
        *  
        */

    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: CALCAWS_VALIDATIONS_FIELD })
    validationPicklistValues({ data }) {
        if (data) {
            this.calSAWSValidationValues = data.values;
        }
    }

    /**
    * Method Name  :  collateralTypePicklistValues
    * Description  :  This  method(Wire) is used to fetch the picklist values of Collateral Type field from Screening Person
    * Return Type  :  NA
    * Parameter    :  RecordTypeId , FieldAPIName
    */
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: CollateralType_FIELD })
    collateralTypePicklistValues({data}) {
        if (data) {
            this.collateralTypes = data.values;
        }
    }
    /**
    * Method Name  :  countyPicklistValues
    * Description  :  This  method(Wire) is used to fetch the picklist values of county field from Screening Person
    * Return Type  :  NA
    * Parameter    :  RecordTypeId , FieldAPIName
    */
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: County_FIELD })
    countyPicklistValues({data}) {
        if (data) {
            this.countyValues = data.values;
        }
    }
    /**
    * Method Name  :  ownerIdHandler
    * Description  :  This method(Wire) is used to fetch the ownerId value of Screening Record
    * Return Type  :  NA
    * Parameter    :  RecordId , Fields (Array)
    */
    @wire(getRecord, { recordId: '$recordId', fields: [OWNER_ID_FIELD, APPROVAL_SUPERVISOR] })
    ownerIdHandler({ data }) {
        if (data) {
            this.ownerId = getFieldValue(data, OWNER_ID_FIELD)
            this.approvalSupervisor = getFieldValue(data, APPROVAL_SUPERVISOR)
        }
    }
    /**
   * Method Name  :  ownerIdManagerHandler
   * Description  :  This method(Wire) is used to fetch the ManagerId value of Screening Record Owner
   * Return Type  :  NA
   * Parameter    :  RecordId , Fields (Array)
   */
    @track approvalSupervisor;
    @wire(getRecord, { recordId: '$ownerId', fields: [OWNER_MANAGER_ID_FIELD] })
    ownerIdManagerHandler({ data }) {
        if (data) {
            this.mangerId = getFieldValue(data, OWNER_MANAGER_ID_FIELD)
            if (this.approvalSupervisor != null) {
                if (this.ownerId != ID && this.mangerId != ID && this.approvalSupervisor != ID && !this.hasEditAccess) //added hasEditAccess as part of CARESV1-13295
                {
                    this.disableAll = true;
                    this.setRoleVisibilityTrue();
                    this.disableDelete = true;
                }
            } else {
                if (this.ownerId != ID && this.mangerId != ID && !this.hasEditAccess) //added hasEditAccess as part of CARESV1-13295
                {
                    this.disableAll = true;
                    this.setRoleVisibilityTrue();
                    this.disableDelete = true;
                }
            }
        }
    }

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord({data}) {

        if (data) {
            if (this.mangerId == null) {
                this.mangerId = data.fields.Record_Owner_Manager_s_ID__c.value;
            }
            this.approvalStatus = data.fields.Approval_Status__c.value;
            this.approvalSupervisor = data.fields.Approval_Supervisor__c.value;
            if (this.approvalSupervisor != null) {
                if (this.ownerId != ID && this.mangerId != ID && this.approvalSupervisor != ID && !this.hasEditAccess) //added hasEditAccess as part of CARESV1-13295
                {
                    this.disableAll = true;
                    this.setRoleVisibilityTrue();
                    this.disableDelete = true;
                }
            } else {
                if (this.ownerId != ID && this.mangerId != ID && !this.hasEditAccess) //added hasEditAccess as part of CARESV1-13295
                {
                    this.disableAll = true;
                    this.setRoleVisibilityTrue();
                    this.disableDelete = true;
                }
            }
            if (this.ownerId == ID && ID != this.approvalSupervisor)
            { //CARESV1-5172: ID != this.approvalSupervisor
                if (this.approvalStatus == Pending_Label || this.approvalStatus == Resubmitted_Label) {
                    this.disableAll = true;
                    this.setRoleVisibilityTrue();
                    this.disableDelete = true;
                } else if (this.approvalStatus == Approved_Label) {
                    this.disableAll = true;
                    this.setRoleVisibilityTrue();
                    this.disableDelete = true;
                }
            } else if (this.mangerId == ID && this.mangerId != this.approvalSupervisor) {
                if (this.approvalStatus == Pending_Label || this.approvalStatus == Resubmitted_Label) {
                    this.disableAll = true;
                    this.setRoleVisibilityTrue();
                    this.disableDelete = true;
                } else if (this.approvalStatus == Approved_Label) {
                    this.disableAll = true;
                    this.setRoleVisibilityTrue();
                    this.disableDelete = true;
                }
            } else if (this.approvalSupervisor == ID && this.mangerId != this.approvalSupervisor) {
                if (this.approvalStatus == Pending_Label || this.approvalStatus == Resubmitted_Label) {
                    this.disableAll = false;
                    this.setRoleVisibilityFalse();
                    this.disableDelete = false;
                } else if (this.approvalStatus == Approved_Label) {
                    this.disableAll = true;
                    this.setRoleVisibilityTrue();
                    this.disableDelete = true;
                }
            } else if (this.mangerId == this.approvalSupervisor && this.approvalSupervisor == ID) { /* added ==ID for CARESV1-5647 */
            if (this.approvalStatus == Pending_Label || this.approvalStatus == Resubmitted_Label) {  // added if condition for CARESV1-6514  
            this.disableAll = false;
                this.setRoleVisibilityFalse();
                this.disableDelete = false;
            }
                else if (this.approvalStatus == Approved_Label) {
                    this.disableAll = true;
                    this.setRoleVisibilityTrue();
                    this.disableDelete = true;
                }
            }
            this.dispatchEvent(new RefreshEvent());
        }
    }

    connectedCallback() {


        if (this.recordId != null) {
            this.isDetailPage = true;
            this.loadScreeningPersons();
            this.loadScreening(); // Loads the screeing record data. CARESV1-653
        }
        getTodayDate().then(result => {
            this.backendDate = result;
        }).catch(error => {

        
        this.logger.error('Exception in connectedCallback of cares_AddScreeningPerson').setExceptionDetails(error);
            this.logger.saveLog(synchronousDML);

        })
    }

    renderedCallback() {
        Promise.all([loadStyle(this, addScreeningPersonCSS)]);
    }



    @api
    loadScreeningPersons() {
        loadScreeningPersons({
            scrRecordId: this.recordId
        })
            .then(result => {
                this.deleteInvoked = false;
                this.disableSave = false;
                if (result != null) {
                    this.personList = [];
                    for (const person of result) {
                        var collateralRole = false;
                        var isDobManual = false;
                        let isValidatedPersonFlag=false;
                        if (person.Role__c == "Collateral") {
                            collateralRole = true; }
                        if (person.Birthdate__c != null && person.Birthdate__c != '' && person.Birthdate__c != 'undefined') {
                            isDobManual = true; }
                        if (person.Validated_Person_Name__c != null && person.Validated_Person_Name__c != '' && person.Validated_Person_Name__c!= 'undefined') {
                            isValidatedPersonFlag= true; }  
                        /*this.personList.push({
                            id: person.Id, role: person.Role__c, collateralType: person.Collateral_Type__c,
                            lastName: person.Last_Name__c, firstName: person.First_Name__c, unknownCheckbox: person.UnknownPersonCheck__c, dob: person.Birthdate__c, approxage: person.Approximate_Age__c, county: person.CountyNew__c, isCollateral: collateralRole, isNotCollateral: !collateralRole, DobManual: isDobManual, showAutoError: false, disableRole: true, disableCollateral: true
                        });*/
                      var csecChecks=(person.CSECs__r!=null && person.CSECs__r!='')?true:false;
                        this.personList.push({
                            id: person.Id, role: person.Role__c, collateralType: person.Collateral_Type__c,
                            lastName: person.Last_Name__c, firstName: person.First_Name__c, unknownCheckbox: person.UnknownPersonCheck__c, dob: person.Birthdate__c, approxage: person.Approximate_Age__c, county: person.CountyNew__c, isCollateral: collateralRole, isNotCollateral: !collateralRole, DobManual: isDobManual,ValidatedPersonFlag :isValidatedPersonFlag, showAutoError: false, disableRole: true, disableCollateral: true, disableAtRiskCsec: (person.At_risk_of_CSEC__c) ? true : (this.disableAll ? true : false),
                            atRiskCsecCheckbox: (person.At_risk_of_CSEC__c ==true)?true:false, showCsecCheckbox: person.Role__c=='Alleged Victim' ?true:false, showCsec: person.At_risk_of_CSEC__c, csecId: (person.At_risk_of_CSEC__c) ? ((csecChecks ) ? person.CSECs__r[NUM_0].Id : "") : "",
                            csecType: (person.At_risk_of_CSEC__c) ? ((csecChecks ) ? person.CSECs__r[NUM_0].CSEC_Type__c : "") : "", showDate: (person.At_risk_of_CSEC__c) ? ((csecChecks ) ? ((person.CSECs__r[NUM_0].CSEC_Type__c != null && person.CSECs__r[NUM_0].CSEC_Type__c != '') ? true : false) : false) : false, startDate: (person.At_risk_of_CSEC__c) ? ((csecChecks ) ? person.CSECs__r[NUM_0].Start_Date__c : "") : "", endDate: (person.At_risk_of_CSEC__c) ? ((csecChecks ) ? person.CSECs__r[NUM_0].End_Date__c : "") : "", justificationValue: (person.At_risk_of_CSEC__c) ? ((csecChecks ) ? person.CSECs__r[NUM_0].Worker_Supervisor_Update_Justification__c : "") : "",showRiskFields: (person.At_risk_of_CSEC__c) ? ((csecChecks ) ? (person.CSECs__r[NUM_0].CSEC_Type__c == 'At Risk' ? true : false) : false) : false,
                            vicAtTimRem: (person.At_risk_of_CSEC__c) ? ((person.At_risk_of_CSEC__c && csecChecks ) ? person.CSECs__r[NUM_0].CSEC_Victim_at_Time_of_Removal__c : "") : "", vicAnyTimPast: (person.At_risk_of_CSEC__c) ? ((csecChecks ) ? person.CSECs__r[NUM_0].CSEC_Victim_Anytime_in_the_Past__c : "") : "", showWasVicPastFields: (person.At_risk_of_CSEC__c) ? ((csecChecks ) ? (person.CSECs__r[NUM_0].CSEC_Victim_Anytime_in_the_Past__c == 'Yes' ? true : false) : false) : false, showPastFields: (person.At_risk_of_CSEC__c) ? ((csecChecks ) ? (person.CSECs__r[NUM_0].Cross_Reported_to_Law_Enforcement_Past__c == 'Yes' ? true : false) : false) : false
                        });
                        
                    }
                    if (this.personList.length >= NUM_10) {
                        this.isRowExceeded = true; }
                    if (this.personList.length >= NUM_2) {
                        this.showSerialNo = true;
                    }
                  
                }
            }).catch(error => {
                this.error = error;
                const evt = new ShowToastEvent({
                    title: 'Error',
                    message: 'Something went wrong. Please contact your Administrator',
                    variant: 'error'
                });
                this.dispatchEvent(evt);
            
            this.logger.error('Exception in loadScreeningPersons of cares_AddScreeningPerson').setExceptionDetails(error);
            this.logger.saveLog(synchronousDML);

            });
            this.dispatchEvent(new RefreshEvent());

    }
    /**
   * Method Name  :  setRoleVisibilityTrue
   * Description  :  This method is used to set disableRole = true
   * Return Type  :  NA
   * Parameter    :  NA
   */
    setRoleVisibilityTrue() {
        for (const p of this.personList) {
            p.disableRole = true;
        }
    }
    /**
   * Method Name  :  setRoleVisibilityFalse
   * Description  :  This method is used to set disableRole = false
   * Return Type  :  NA
   * Parameter    :  NA
   */
    setRoleVisibilityFalse() {
        for (const p of this.personList) {
            p.disableRole = false;
        }
    }
    /**
   * Method Name  :  handleChangeCallnarative
   * Description  :  This method is used to store changed value of 'Call Narrative' / 'Screening Narrative' Field
   * Return Type  :  NA
   * Parameter    :  Event
   */
    handleChangeCallnarative(event) {
        this.callNarrativeValue = event.detail.value;
        //CARESV1-3588
        if (this.callNarrativeValue != null && this.callNarrativeValue != '') {
            this.richTextCount = true;
            this.remainingCharacter = NUM_127772 - this.callNarrativeValue.length;
            if (this.callNarrativeValue != null && this.callNarrativeValue != '') {
                this.richTextCount = true;
                this.remainingCharacter = NUM_127772 - this.callNarrativeValue.length;
                if (this.remainingCharacter == NUM_127772) {
                    this.remainingCharacter = NUM_127772
                    this.richTextCount = false;
                } else if (this.remainingCharacter < NUM_0) {
                    this.remainingCharacter = NUM_0
                }
            }
            if (this.callNarrativeValue.length > NUM_127772) {
                this.narrativeValidity = false;
                this.richTextCount = false;
            }
            else {
                this.narrativeValidity = true;
                this.richTextCount = true;
            }
        }
        this.modalFunction = '';
        this.compStepperTabPubSub();//added for CARESV1-2700
    }
    /**
    * Method Name  :  handleRoleChange
    * Description  :  This method is used to store changed value of 'Role' Field
    * Return Type  :  NA
    * Parameter    :  Event
    */
    handleRoleChange(event) {

        var role = event.detail.value;
        this.modalFunction = '';
        var key = event.currentTarget.dataset.value;
        this.personList[key].role = role;

        //CARESV1-45799: To revalidate victim age validation on role change
        var dob = this.personList[key].dob;
        var approxAge = this.personList[key].approxage;

        var ageErrorEle;
        var isOlderThan18;


        // If dob exists, need to show the validation on Date of Birth element otherwise on Approximate Age element.
        if(dob) {
            var today = new Date(this.backendDate);
            var birthdate = new Date(dob);
            var calculatedAge = (today - birthdate) / (NUM_1000 * NUM_60 * NUM_60 * NUM_24);
            var year = parseInt(calculatedAge / NUM_365_2425);

            isOlderThan18 = year >= NUM_18;
            ageErrorEle = this.template.querySelector(`[data-id="dob"][data-value="${key}"]`)
            
        } else {
            isOlderThan18 = approxAge >= NUM_18;
            ageErrorEle = (this.template.querySelector(`[data-id="aprroxAgeAutoError"][data-value="${key}"]`)
            || this.template.querySelector(`[data-id="aprroxAgeNoAutoError"][data-value="${key}"]`)
            || this.template.querySelector(`[data-id="aprroxAgeManual"][data-value="${key}"]`));
        }

        //Resetting custom validation. If validation needs to fire, it will be set in the if condition for Alleged Vicitm role.
        ageErrorEle.setCustomValidity('');
        ageErrorEle.reportValidity('');


        if (role == "Collateral") {
            this.personList[key].isCollateral = true;
            this.personList[key].isNotCollateral = false;
            this.personList[key].showCsecCheckbox = false;// added for CARESV1-1286.
            this.personList[key].showCsec = false;// added for CARESV1-1286.
            this.personList[key].atRiskCsecCheckbox = false;// added for CARESV1-1286.

        }
        else if (role == "Alleged Victim") {
            this.personList[key].isCollateral = false;
            this.personList[key].isNotCollateral = true;
            this.personList[key].collateralType = "";
            this.personList[key].showCsecCheckbox = true;// added for CARESV1-1286.
            this.personList[key].showCsec = false;// added for CARESV1-1286.
            this.personList[key].atRiskCsecCheckbox = false;// added for CARESV1-1286.

            //Fire VICTIM_OLDER_THAN_18_ERROR validation if role is Alleged Victim and age is >= 18.
            if(isOlderThan18) {

                ageErrorEle.setCustomValidity(VICTIM_OLDER_THAN_18_ERROR);
                ageErrorEle.reportValidity('');

            }
            
        }
        else {
            this.personList[key].isCollateral = false;
            this.personList[key].isNotCollateral = true;
            this.personList[key].collateralType = "";
            this.personList[key].showCsecCheckbox = false;// added for CARESV1-1286.
            this.personList[key].showCsec = false;// added for CARESV1-1286.
            this.personList[key].atRiskCsecCheckbox = false;// added for CARESV1-1286.
        }
        if (this.personList[key].id != null && this.personList[key].id != '' && this.personList[key].id != 'undefined') {
            this.updatedRowIds.add(this.personList[key].id); }

        this.compStepperTabPubSub();//added for CARESV1-2700
    }
    /**
    * Method Name  :  handleUnknownChange
    * Description  :  This method is used to store changed value of 'Unknown Person at the time of Screening' Field
    * Return Type  :  NA
    * Parameter    :  Event
    */
    handleUnknownChange(event) {

        var unknownCheckbox = event.target.checked;
        this.modalFunction = '';
        var key = event.currentTarget.dataset.value;
        this.personList[key].unknownCheckbox = unknownCheckbox;
        if (this.personList[key].id != null && this.personList[key].id != '' && this.personList[key].id != 'undefined') {
            this.updatedRowIds.add(this.personList[key].id); }

        this.compStepperTabPubSub();//added for CARESV1-2700
    }

    /* CARESV1-1286 changes starts */

    /**
        * Method Name  :  handleAtRiskCsecChange
        * Description  :  This method is used to store changed value of 'At risk of Commercial Sexual Exploitation (CSEC)' Field
        * Return Type  :  NA
        * Parameter    :  Event
        */
    handleAtRiskCsecChange(event) {
        var atRiskCsecCheckbox = event.target.checked;
        this.modalFunction = '';
        var key = event.currentTarget.dataset.value;
        this.personList[key].atRiskCsecCheckbox = (atRiskCsecCheckbox == true) ? true : false;
        if (this.personList[key].id != null && this.personList[key].id != '' && this.personList[key].id != 'undefined') {
            this.updatedRowIds.add(this.personList[key].id);
        }
        this.personList[key].showCsec = (this.personList[key].atRiskCsecCheckbox == true) ? true : false;
        this.personList[key].csecType = "";
        this.personList[key].startDate = "";
        this.personList[key].endDate = "";
        this.personList[key].justificationValue = '';
        this.personList[key].vicAtTimRem = "";
        this.personList[key].vicAnyTimPast = "";
        this.personList[key].showPastFields = false;
        this.personList[key].showRiskFields = false;
        this.personList[key].showDate = false;
        this.personList[key].showPastFields = false;
        this.personList[key].showWasVicPastFields = false;
        this.personList[key].showWasVicCurrFields = false;
        this.personList[key].pastPolRepotNum = "";
        this.compStepperTabPubSub();
    }

    /* CARESV1-1286 changes ends */

    /**
    * Method Name  :  handleColTypeChange
    * Description  :  This method is used to store changed value of 'Collateral Type' Field
    * Return Type  :  NA
    * Parameter    :  Event
    */
    handleColTypeChange(event) {
        var collateralType = event.detail.value;
        this.modalFunction = '';
        var key = event.currentTarget.dataset.value;
        this.personList[key].collateralType = collateralType;
        if (this.personList[key].id != null && this.personList[key].id != '' && this.personList[key].id != 'undefined') {
            this.updatedRowIds.add(this.personList[key].id); }

        this.compStepperTabPubSub();//added for CARESV1-2700
    }
    /**
    * Method Name  :  handleDOBchange
    * Description  :  This method is used to store changed value of 'Date of Birth' Field
    * Return Type  :  NA
    * Parameter    :  Event
    */
    handleDOBchange(event) {
        this.modalFunction = '';
        var dob = event.detail.value;
        var key = event.currentTarget.dataset.value;
        this.personList[key].dob = dob;
        if (this.personList[key].id != null && this.personList[key].id != '' && this.personList[key].id != 'undefined') {
            this.updatedRowIds.add(this.personList[key].id); }

        // Changed the validation to reset whenever date changes without the following if condition.
        event.currentTarget.setCustomValidity('');
        if (this.validateDate(dob)) {

            var today = new Date(this.backendDate);
            var birthdate = new Date(dob);
            var calculatedAge = (today - birthdate) / (NUM_1000 * NUM_60 * NUM_60 * NUM_24);
            if (dob != null) {
                this.personList[key].showAutoError = true;
                var year = parseInt(calculatedAge / NUM_365_2425);

                if (year >= NUM_18 && this.personList[key].role == 'Alleged Victim') {
                       event.currentTarget.setCustomValidity(VICTIM_OLDER_THAN_18_ERROR);

                } 
                
                setTimeout((event) => {
                    this.personList[key].showAutoError = false;

                }, NUM_500);

                

                var month = Math.floor((calculatedAge % NUM_365_2425) / NUM_30);
                this.personList[key].approxage = year + ' year(s), ' + month + ' month(s)';
                this.personList[key].DobManual = true;
            }
            else {

                this.personList[key].DobManual = false;
                this.ApproxAgeValue = '';
                var key = event.currentTarget.dataset.value;
                this.personList[key].approxage = '';
            }
        }
        else {
            this.personList[key].DobManual = true;
            this.ApproxAgeValue = '';
            var key = event.currentTarget.dataset.value;
            this.personList[key].approxage = '';
        }

        this.compStepperTabPubSub();//added for CARESV1-2700
    }
    /**
    * Method Name  :  validateDate
    * Description  :  This method is used to validate date field on the screen.
    * Return Type  :  NA
    * Parameter    :  dob
    */
    validateDate(dob) {
        var uiArray = null;
        var todayArray = null;
        var todayYear;
        var todayMonth;
        var todayDate;
        var uiYear;
        var uiMonth;
        var uiDate;
        var validDate = true;

        var dateFromUI = dob;
        if (dateFromUI != null) {
            uiArray = dateFromUI.split('-');
        }
        if (this.backendDate != null) {
            todayArray = this.backendDate.split('-');
        }

        if (todayArray != null) {
            todayYear = Number(todayArray[NUM_0]);
            todayMonth = Number(todayArray[NUM_1]);
            todayDate = Number(todayArray[NUM_2]);
        }

        if (uiArray != null) {
            uiYear = Number(uiArray[NUM_0]);
            uiMonth = Number(uiArray[NUM_1]);
            uiDate = Number(uiArray[NUM_2]);
        }

        if (uiArray != null) {
            if (uiYear == todayYear) {
                if (uiMonth == todayMonth) {
                    if (uiDate > todayDate) {
                        validDate = false;
                    } else {
                        validDate = true;
                    }
                } else if (uiMonth > todayMonth) {
                    validDate = false;
                } else {
                    validDate = true;
                }
            } else if (uiYear > todayYear) {
                validDate = false;
            } else {
                validDate = true;
            }
        } else {
            validDate = true;
        }

        return validDate;
    }
    /**
    * Method Name  :  handlefirstNameChange
    * Description  :  This method is used to store changed value of 'First Name' Field
    * Return Type  :  NA
    * Parameter    :  Event
    */
    handlefirstNameChange(event) {
        var firstName = event.detail.value;
        this.modalFunction = '';
        var key = event.currentTarget.dataset.value;
        this.personList[key].firstName = firstName;
        if (this.personList[key].id != null && this.personList[key].id != '' && this.personList[key].id != 'undefined') {
            this.updatedRowIds.add(this.personList[key].id); }

        this.compStepperTabPubSub();//added for CARESV1-2700
    }
    /**
    * Method Name  :  handleLastNameChange
    * Description  :  This method is used to store changed value of 'Last Name' Field
    * Return Type  :  NA
    * Parameter    :  Event
    */
    handleLastNameChange(event) {
        var lastName = event.detail.value;
        this.modalFunction = '';
        var key = event.currentTarget.dataset.value;
        this.personList[key].lastName = lastName;
        if (this.personList[key].id != null && this.personList[key].id != '' && this.personList[key].id != 'undefined') {
            this.updatedRowIds.add(this.personList[key].id); }

        this.compStepperTabPubSub();//added for CARESV1-2700
    }

    /**
    * Method Name  :  handleAgeChange
    * Description  :  This method is used to store changed value of 'Approximate Age' Field
    * Return Type  :  NA
    * Parameter    :  Event
    */
    handleAgeChange(event) {
        var age = event.detail.value;
        var key = event.currentTarget.dataset.value;
        this.modalFunction = '';

        if (this.personList[key].DobManual == true) {

            if (age != this.personList[key].approxage) {
                event.currentTarget.setCustomValidity('Approximate Age can only be entered if BirthDate is unknown.');
            }
            else if (age >= NUM_18 && this.personList[key].role == 'Alleged Victim') {
                event.currentTarget.setCustomValidity(VICTIM_OLDER_THAN_18_ERROR);
            }
            else {
                this.personList[key].approxage = age;
                event.currentTarget.setCustomValidity('');
            }
        } else {

            if (age >= NUM_18 && this.personList[key].role == 'Alleged Victim') {
                event.currentTarget.setCustomValidity(VICTIM_OLDER_THAN_18_ERROR);
            }
            else {
                event.target.setCustomValidity('');
            }
            this.personList[key].approxage = age;
        }
        if (this.personList[key].id != null && this.personList[key].id != '' && this.personList[key].id != 'undefined') {
            this.updatedRowIds.add(this.personList[key].id); }

        this.compStepperTabPubSub();//added for CARESV1-2700
    }
    /**
    * Method Name  :  handleCountyChange
    * Description  :  This method is used to store changed value of 'County' Field
    * Return Type  :  NA
    * Parameter    :  Event
    */
    handleCountyChange(event) {
        var county = event.detail.value;
        this.modalFunction = '';
        var key = event.currentTarget.dataset.value;
        this.personList[key].county = county;
        if (this.personList[key].id != null && this.personList[key].id != '' && this.personList[key].id != 'undefined') {
            this.updatedRowIds.add(this.personList[key].id); }

        this.compStepperTabPubSub();//added for CARESV1-2700
    }


    /**
       * Method Name  :  loadScreening
       * Description  :  Contains the method to get the details of the Screening record from the database
       * Return Type  :   NA
       * Parameter    :   NA
       */
    loadScreening() {
        loadScreeningRecord({
            scrRecordId: this.recordId
        })
            .then(result => {
                if (result != null) {
                    if (result.Reason_for_the_Call__c == ABUSE_NEGLECT) {
                        this.showCalSAWS = true;
                    }
                    else {
                        this.showCalSAWS = false;
                    }
                    this.calSAWSValidation = result.CalSAWS_Validation__c;
                    this.calSAWSValidationDate = result.CalSAWS_Validation_Date__c;
                    this.CalSAWSDetails = result.CalSAWS_Details__c;
                    this.reasonFC = result.Reason_for_the_Call__c;
                }
            }).catch(error => {
                this.errors = error;
            
            this.logger.error('Exception in loadScreening of cares_AddScreeningPerson').setExceptionDetails(error);
            this.logger.saveLog(synchronousDML);

            });
    }
    /**
        * Method Name  :  onCalSAWSDetails
        * Description  :  To handle change event of the CalSAWS Details field  
        * Return Type  :  NA
        * Parameter    : Event
        *  ------------------------------------------------------------------------------------------------------------------------------
        *  8/19/2022         Prashant/ Deloitte               Enhancment CARESV1-653
        *  
        */
    onCalSAWSDetails(event) {
        this.CalSAWSDetails = event.target.value;
        this.compStepperTabPubSub();//added for CARESV1-2700
    }

    /**
    * Method Name  :  OnCalSAWSDate
    * Description  :  To handle change event of the CalSAWS Validation Date field
    * Return Type  :  NA
    * Parameter    :  Event
    *  ------------------------------------------------------------------------------------------------------------------------------
    *  8/19/2022         Prashant/ Deloitte               Enhancment CARESV1-653
    *  
    */

    OnCalSAWSDate(event) {
        this.CalSAWSValidationDate = event.target.value;
        this.compStepperTabPubSub();//added for CARESV1-2700
    }
    /**
     * Method Name  : onCalSAWSValidation
     * Description  : To handle change event of the CalSAWS Validation  field
     * Return Type  : NA
     * Parameter    : Event
     *  ------------------------------------------------------------------------------------------------------------------------------
     *  8/19/2022         Prashant/ Deloitte               Enhancment CARESV1-653
     *  
     */
    onCalSAWSValidation(event) {
        this.CalSAWSValidation = event.target.value;
        this.compStepperTabPubSub();//added for CARESV1-2700
    }


    /**
        * Method Name  :  handleStepperEvent
        * Description  :  This method is used to handle stepper steps
        * Return Type  :  NA
        * Parameter    :  NA
        */
    //for 1260
    handleStepperEvent() {
        if (this.reasonFC == "Information & Referral: Comprehensive Prevention Services") {

            const stepperComponentMap = 'Caller Information=Completed;Add a Person=Completed;Tribal Inquiry & Collaboration=Not Started';

            const stepperEvent = new CustomEvent('stepperstatus', {
                detail: stepperComponentMap
            });
            this.dispatchEvent(stepperEvent);

        }
        else if (this.reasonFC == "Information & Referral: Social Worker Information Request") {

            const stepperComponentMap = 'Caller Information=Completed;Add a Person=Completed;Tribal Inquiry & Collaboration=Not Started';

            const stepperEvent = new CustomEvent('stepperstatus', {
                detail: stepperComponentMap
            });
            this.dispatchEvent(stepperEvent);

        }
        else {
            const stepperComponentMap = 'Caller Information=Completed;Add a Person=Completed;Add Address=Not Started';

            const stepperEvent = new CustomEvent('stepperstatus', {
                detail: stepperComponentMap
            });
            this.dispatchEvent(stepperEvent);
        }


    }

    /**
    * Method Name  :  addRow
    * Description  :  This method is used to add new row to enter person details.
    * Return Type  :  NA
    * Parameter    :  Event
    */
    addRow() {
        this.deleteInvoked = false;
        this.modalFunction = '';
        this.personList.push({ id: "", role: "", collateralType: "", lastName: "", firstName: "", dob: "", approxage: "", county: "", unknownCheckbox: false, isCollateral: false, collateralRole: false, isNotCollateral: true, DobManual: false, showAutoError: false, disableRole: false, disableCollateral: false, csecType: "", showCsec: false, csecId: "", startDate: "", endDate: "", showCsecCheckbox: false, showAtRiskRelatedFields: false, vicAtTimRem: "", vicAnyTimPast: "", showRiskFields: false, showDate: false,  showPastFields: false, pastPolRepotNum: "", showCurrFields: false, justificationValue:"",showWasVicPastFields: false, showWasVicCurrFields: false, disableAtRiskCsec: false});
        //this.personList.push({ id: "", role: "", collateralType: "", lastName: "", firstName: "", dob: "", approxage: "", county: "", unknownCheckbox: false, isCollateral: false, collateralRole: false, isNotCollateral: true, DobManual: false, showAutoError: false, disableRole: false, disableCollateral: false});

        if (this.personList.length >= NUM_10) {
            this.isRowExceeded = true; }
        if (this.personList.length >= NUM_1) {
            this.showSerialNo = true;
        }
    }
   
  
    
    /**
     * Method Name  :  processScreeningPersons
     * Description  :  This method is hit when we click on save and proceed.
     * Return Type  :  NA
     * Parameter    :  Event
     */
    processScreeningPersons() {
        if (this.validateData() && this.validateDate() && this.narrativeValidity) {
            if ((this.oldNarrativeValue != null && this.oldNarrativeValue != '') && (this.callNarrativeValue == null || this.callNarrativeValue == '')) {
                this.isDialogVisible = true;
                this.modalFunction = 'DeleteNarrative';
                this.confirmationMsg = 'Are you sure you want to delete the "Screening Narrative" information?';
            }
            else {
                this.oldNarrativeValue = this.callNarrativeValue;
                this.modalFunction = '';
                this.isDialogVisible = false;
                if (this.disableSave == false) {
                    this.saveData(); }
                    debugger;
                    alert('Record is Saved');
                    console.log('Record is saved');
            }
        } else if (!this.narrativeValidity) {
            const evt = new ShowToastEvent({
                message: 'Screening Narrative exceeded maximum length.',
                variant: 'error'
            });
            this.dispatchEvent(evt);
        }
    }
    /**
    * Method Name  :  saveData
    * Description  :  This method is used to Save person details.
    * Return Type  :  NA
    * Parameter    :  NA
    */
    //updated logic for story v1-653

    saveData() {
        this.deleteInvoked = false;
        this.disableSave = true;

        const scrRecord = { 'sobjectType': 'Screening__c' }; // Sending Screening object data
        if (this.recordId != null) {
            scrRecord.Id = this.recordId;
        }
        scrRecord.CalSAWS_Validation__c = this.CalSAWSValidation;
        scrRecord.CalSAWS_Validation_Date__c = this.CalSAWSValidationDate;
        scrRecord.CalSAWS_Details__c = this.CalSAWSDetails;
        scrRecord.Call_Narrative__c = this.callNarrativeValue;
        //Removed Convesrion for loop not required. fixed //CARESV1-8468 Prashant
        saveScreeningPersons({ newRecord: JSON.stringify(this.personList), screeningRecord: scrRecord })
            .then(result => {
                /* initial code 
                this.showsuccess('Record(s) saved successfully');
                pubsub.fire('checkvaluechanged1', true);//added for US4108
                eval("$A.get('e.force:refreshView').fire();");
                this.handleStepperEvent();*/
                /* changes for CARESV1-1286 starts*/
                var temp = JSON.stringify(result);
                var splitTemp = temp.split(',');
                var tempScpStatus=(splitTemp[NUM_1]!='null' && splitTemp[NUM_1]!='' && splitTemp[NUM_1]!=null)?splitTemp[NUM_1].includes('success'):'';
                
                 if (splitTemp[NUM_0].includes('error')) {//added for 1286
                    this.disableSave = false;
                    this.showerror('Something went wrong while creating/updating CSE records, Contact your System Administrator!');
                }
                else if (!tempScpStatus && tempScpStatus!='') {//added for 1286
                    this.disableSave = false;
                    this.showerror('Something went wrong, Contact your System Administrator!');
                }
                else if ((splitTemp[NUM_0].includes('success')|| tempScpStatus)||(splitTemp[NUM_0].includes('screeningupdate'))) {
                    this.disableSave = false;//added for 1286
                    this.showsuccess('Record(s) saved successfully');
                    pubsub.fire('checkvaluechanged1', true);
                    this.dispatchEvent(new RefreshEvent());
                    this.handleStepperEvent();
                }
                /* changes for CARESV1-1286 ends*/
                //for navigation for 860
                /* if(this.reasonFC == "Information & Referral: Social Worker Information Request"){
                       this.navigateToSobject();
                 } */
            })
            .catch(error => {
                /*code for CARESV1-3735* starts*/
                this.errorFromServer = error;
                var errorMessage = this.errorFromServer.body.message;
                if (errorMessage.includes('INSUFFICIENT_ACCESS_OR_READONLY')) {
                    const evt = new ShowToastEvent({
                        title: 'Error',
                        message: 'You have insufficient access to edit this record.',
                        variant: 'error'
                    });
                    this.dispatchEvent(evt);
                }
                else if (errorMessage.includes('STRING_TOO_LONG')) {
                    const evt = new ShowToastEvent({
                        message: 'Screening Narrative exceeded maximum length',
                        variant: 'error'
                    });
                    this.dispatchEvent(evt);
                }
                /*code for CARESV1-3735* ends*/
                else {
                    this.showerror(error.body.message);
                }
            
            this.logger.error('Exception in saveData of cares_AddScreeningPerson').setExceptionDetails(error);
            this.logger.saveLog(synchronousDML);

            });
    }

    navigateToSobject() {
        this[NavigationMixin.Navigate]({
            type: "standard__objectPage",
            attributes: {
                objectApiName: "Screening__c",
                actionName: "home"
            },
            state: {
                nooverride: NUM_1,
                useRecordTypeCheck: NUM_1,
                navigationLocation: 'LIST_VIEW',
                backgroundContext: '/lightning/o/Screening__c/list?filterName=Recent'

            }
        });

    }

    /**
    * Method Name  :  validateData
    * Description  :  This method is used to validate date entered on the screen.
    * Return Type  :  NA
    * Parameter    :  NA
    */
    validateData() {
        var areAllValid = true;
        var inputs = this.template.querySelectorAll(".inputfield");
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                areAllValid = false;
            }
        });

        var input = this.template.querySelectorAll("lightning-textarea[data-id=jsid]");
        var input1=  this.template.querySelectorAll("lightning-input[data-id=edate]");
        if(input1.length > NUM_0){
            for (var i = NUM_0; i < input.length; i++) {
               if(input1[i].value!='' && input1[i].value!=null){
                if(input[i].value=='' || input[i].value==null){
                    input[i].setCustomValidity(JUSTIFICATION_ERROR_MSG);
                    input[i].reportValidity();
                    areAllValid = false;
                }
               }
            }
    }
           

        return areAllValid;
    }
    /**
    * Method Name  :  showsuccess
    * Description  :  This method is used to show 'success' toast message.
    * Return Type  :  NA
    * Parameter    :  String
    */
    showsuccess(message) {
        const event = new ShowToastEvent({
            title: 'Success!',
            message: message,
            variant: 'success'
        });
        this.dispatchEvent(event);
    }
    /**
   * Method Name  :  showerror
   * Description  :  This method is used to show 'error' toast message.
   * Return Type  :  NA
   * Parameter    :  String
   */
    showerror(message) {
        const event = new ShowToastEvent({
            title: 'Error!',
            message: message,
            variant: 'error'

        });
        this.dispatchEvent(event);
    }
    /**
    * Method Name  :  handleremove
    * Description  :  This method is used delete row from add person screen.
    * Return Type  :  NA
    * Parameter    :  Event
    */
    handleremove(event) {

        this.pid = event.currentTarget.dataset.id;
        if ((this.personList[this.pid].id == null || this.personList[this.pid].id == '' || this.personList[this.pid].id == 'undefined')
            && (this.personList[this.pid].role == null || this.personList[this.pid].role == '' || this.personList[this.pid].role == 'undefined')
            && (this.personList[this.pid].collateralType == null || this.personList[this.pid].collateralType == '' || this.personList[this.pid].collateralType == 'undefined')
            && (this.personList[this.pid].firstName == null || this.personList[this.pid].firstName == '' || this.personList[this.pid].firstName == 'undefined')
            && (this.personList[this.pid].lastName == null || this.personList[this.pid].lastName == '' || this.personList[this.pid].lastName == 'undefined')
            && (this.personList[this.pid].dob == null || this.personList[this.pid].dob == '' || this.personList[this.pid].dob == 'undefined')
            && (this.personList[this.pid].approxage == null || this.personList[this.pid].approxage == '' || this.personList[this.pid].approxage == 'undefined')
            && (this.personList[this.pid].county == null || this.personList[this.pid].county == '' || this.personList[this.pid].county == 'undefined')) {
            this.isPersonNull = true;
        }
        else {
            this.isPersonNull = false;
        }
        if (this.isPersonNull == true) {
            this.splice();
            var inputs = this.template.querySelectorAll(".inputfield");
            inputs.forEach(input => {
                input.setCustomValidity('');
            });

            this.deleteInvoked = true;
            setTimeout((event) => {
                this.deleteInvoked = false;
            }, NUM_500);
            for (const p in this.personList) {
                this.personList[p].showAutoError = true;
                setTimeout((event) => {
                    this.personList[p].showAutoError = false;

                }, NUM_500);
            }
        }
        else {
            this.personId = this.personList[this.pid].id;
            this.modalFunction = 'DeletePerson'
            if (this.personId == null || this.personId == '' || this.personId == 'undefined') {
                this.confirmationMsg = 'Are you sure you want to delete this unsaved person?';
                this.isDialogVisible = true;
            }
             else {
                this.isDialogVisible = false;
                hasRelatedAllegations({ scrPersonId: this.personList[this.pid].id})
                    .then(result => {
                        if (result) {
                            this.confirmationMsg = 'The person you are removing from this Screening is involved in one or more related allegations. Are you sure you want to proceed?';
                        } else {
                            this.confirmationMsg = 'Are you sure you want to delete this saved person?';
                        }

                        this.isDialogVisible = true;
                    })
                    .catch(error => {
                        this.error = error;
                        const evt = new ShowToastEvent({
                            title: 'Error',
                            message: error.body.message,
                            variant: 'error'
                        });
                        this.dispatchEvent(evt);
                    
                    this.logger.error('Exception in handleremove of cares_AddScreeningPerson').setExceptionDetails(error);
            this.logger.saveLog(synchronousDML);

                    })
            } 

        }

    }

    /**
    * Method Name  :  Hide Error
    * Description  :  This method is used remove one array value.
    * Return Type  :  NA
    * Parameter    :  NA
    */

    //
    /**
    * Method Name  :  splice
    * Description  :  This method is used remove one array value.
    * Return Type  :  NA
    * Parameter    :  NA
    */
    splice() {
        var fieldsarray = this.personList;
        fieldsarray.splice(this.pid, NUM_1);
        if (fieldsarray.length > NUM_0) {
            this.personList = fieldsarray;
        }
        else {
            this.personList = [({ id: "", role: "", collateralType: "", lastName: "", firstName: "", dob: "", approxage: "", county: "", unknownCheckbox: false })];
        }
        if (this.personList.length < NUM_10) {
            this.isRowExceeded = false;
        }
        if (this.personList.length <= NUM_1) {
            this.showSerialNo = false;
        }
    }
    /**
    * Method Name  :  splice
    * Description  :  This method is used to handle modal actions.
    * Return Type  :  NA
    * Parameter    :  event
    */
    handlemodal(event) {
        if (this.modalFunction == 'DeletePerson') {
            if (event.detail != NUM_1) {
                if (event.detail.status == 'confirm') {
                    this.isDialogVisible = false;
                    if (this.personId == null || this.personId == '' || this.personId == 'undefined') {

                        this.splice();
                        var Errors = this.template.querySelectorAll('.inputfield');
                        Errors.forEach(inputError => {
                            inputError.setCustomValidity('');
                            inputError.reportValidity();
                        });

                        this.deleteInvoked = true;
                        this.disableDelete = true;
                        this.showsuccess('Screening Person(s) deleted successfully');

                        setTimeout((event) => {
                            this.deleteInvoked = false;
                            this.disableDelete = false;
                        }, NUM_500);
                        for (const p in this.personList) {
                            this.personList[p].showAutoError = true;
                            setTimeout((event) => {
                                this.personList[p].showAutoError = false;

                            }, NUM_500);
                        }
                    }
                    else {
                        deleteScreeningPerson({ personId: this.personId })
                            .then(result => {
                                if (result == 'success') {
                                    this.splice();
                                    var Errors = this.template.querySelectorAll('.inputfield');
                                    Errors.forEach(inputError => {
                                        inputError.setCustomValidity('');
                                    });
                                    this.deleteInvoked = true;
                                    this.disableDelete = true;
                                    this.showsuccess('Screening Person(s) deleted successfully');

                                    setTimeout((event) => {
                                        this.deleteInvoked = false;
                                        this.disableDelete = false;
                                    }, NUM_500);
                                    for (const p in this.personList) {
                                        this.personList[p].showAutoError = true;
                                        setTimeout((event) => {
                                            this.personList[p].showAutoError = false;

                                        }, NUM_500);
                                    }
                                    this.dispatchEvent(new RefreshEvent());
                                }
                                else {
                                    this.showerror('You have another Alleged Victim with "At Risk-Sibling Abused" you cannot proceed with your deletion');
                                }
                            })
                            .catch(error => {
                                this.showerror('Something went wrong, Contact your System Administrator!');
                            
                            this.logger.error('Exception in handlemodal of cares_AddScreeningPerson').setExceptionDetails(error);
            this.logger.saveLog(synchronousDML);

                            })
                    }

                } else if (event.detail.status == 'cancel') {
                    this.isDialogVisible = false;
                }
            }

        }
        else if (this.modalFunction == 'DeleteNarrative') {
            if (event.detail != NUM_1) {

                if (event.detail.status == 'confirm') {
                    this.oldNarrativeValue = '';
                    this.isDialogVisible = false;
                    this.saveData();
                } else if (event.detail.status == 'cancel') {
                    this.callNarrativeValue = this.oldNarrativeValue;
                    this.isDialogVisible = false;
                    this.saveData();
                }
            }

        }

    }

    // * Method Name  :  compStepperTabPubSub
    // * Description  :  This method is used to fire the pubsub event when an onchange event occurs.
    // * Return Type  :  NA
    // * Parameter    :  Event
    // */
    //added for CARESV1-2700
    compStepperTabPubSub() {
        pubsub.fire('checkvaluechanged', true);
    }
    
}
