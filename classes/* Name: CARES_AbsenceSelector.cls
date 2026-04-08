/**
* Name: CARES_AbsenceSelector
* Type: Class
* Module :
* @description : Selector class for Absence__c.
* @author : Raunak
* @date : 05/26/2025
* Test class Name:
* Date:        Developer/Company             Description
* ---------------------------------------------------------------------------------------------------------------------------------------- *
* 05/26/2025   Raunak/Deloitte         CARESV1-50015: Initial Creation
*
 * 02/12/2026 Character Tabluation Activity by prernaagrawal
 */

public with sharing class CARES_AbsenceSelector extends fflib_SObjectSelector {
	/**
	* Method Name : getSObjectFieldList
	* @description : Query Fields for selectById method
	* @return - List<Schema.SObjectField>
	*/
	public List<Schema.SObjectField> getSObjectFieldList()
	{
		return new List<Schema.SObjectField> {
			Absence__c.Id
		};
	}
	/**
	* Method Name : getSObjectType
	* @description : return SobjectType
	* @return - Schema.SObjectType
	*/
	public Schema.SObjectType getSObjectType()
	{
		return Absence__c.sObjectType;
	}
  //Gemini
	/**
	* Method Name : getAbsenceForScheduleBatch
	* @description : return Absence records
	* @param childLocationId
	* @return - List<Absence__c>
	*/
	public List<Absence__c> getAbsenceForScheduleBatch(Set<Id> childLocationId){
		fflib_QueryFactory query = newQueryFactory();
		query.selectField('Child_Location__c');
		query.selectField('End_Date_and_Time__c');
		query.setCondition('Child_Location__c IN: childLocationId and End_Date_and_Time__c =null');
		return (List<Absence__c>)Database.query(query.toSOQL());
	}
}
