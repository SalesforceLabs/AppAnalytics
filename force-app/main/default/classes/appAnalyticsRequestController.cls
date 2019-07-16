public with sharing class appAnalyticsRequestController {

    @AuraEnabled(cacheable=true)
    public static List <AppAnalyticsQueryRequest> getAppAnalyticsQueryRequests() {

        String [] checkFields = new String [] {'id', 'DataType', 'DownloadExpirationTime', 'DownloadUrl', 'EndTime', 'ErrorMessage', 'Name', 'OrganizationIds', 'PackageIds', 'RequestState', 'StartTime', 'CreatedDate'};
        checkFLSRead(checkFields, AppAnalyticsQueryRequest.SObjectType);

        List<AppAnalyticsQueryRequest> aaqr = [select id, DataType, DownloadExpirationTime, DownloadUrl, EndTime, ErrorMessage, Name, OrganizationIds, PackageIds, RequestState, StartTime, CreatedDate from AppAnalyticsQueryRequest order by CreatedDate DESC LIMIT 1000];
        return aaqr;
    }

    @AuraEnabled(cacheable=true)
    public static List<sfLMA__Package__c> getPackageList() {

        String [] checkFields = new String [] {'id', 'Name', 'sfLma__Package_ID__c'};
        checkFLSRead(checkFields, sfLMA__Package__c.SObjectType);

        List<sfLMA__Package__c> packages = [select id, Name, sfLma__Package_ID__c from sfLMA__Package__c order by Name];
        return packages;
    }

    @AuraEnabled(cacheable=true)
    public static List<sfLma__License__c> getOrgList() {

        String [] checkFields = new String [] {'id', 'sfLma__Account__c', 'sfLma__Lead__c', 'sfLma__Expiration_Date__c', 'sfLma__Expiration__c', 'sfLma__Install_Date__c', 'sfLma__Is_Sandbox__c', 'sfLma__License_Status__c', 'sfLma__Status__c', 'sfLma__Subscriber_Org_ID__c', 'sfLma__Package_Version__c'};
        checkFLSRead(checkFields, sfLma__License__c.SObjectType);

        checkFields = new String []{'id','Name'};
        checkFLSRead(checkFields, Account.SObjectType);

        checkFields = new String []{'id','Name'};
        checkFLSRead(checkFields, Lead.SObjectType);

        checkFields = new String []{'id','sfLma__Package__c'};
        checkFLSRead(checkFields, sfLma__Package_Version__c.SObjectType);

        checkFields = new String []{'id','sfLma__Package_ID__c'};
        checkFLSRead(checkFields, sfLma__Package__c.SObjectType);

        List<sfLma__License__c> orgs = [SELECT Id, sfLma__Account__r.Name, sfLma__Lead__r.Name, sfLma__Expiration_Date__c, sfLma__Expiration__c, sfLma__Install_Date__c, sfLma__Is_Sandbox__c, sfLma__License_Status__c, sfLma__Status__c, sfLma__Subscriber_Org_ID__c, sfLma__Package_Version__r.sfLma__Package__r.sfLma__Package_ID__c  FROM sfLma__License__c];
        return orgs;
    }

    @AuraEnabled
    public static String submitAppAnalyticsQueryRequest(DateTime startTime, DateTime endTime, String dataType, List<String> orgIDs, List<String> packageIDs) {
        String[] checkFields = new String []{'startTime','endTime', 'OrganizationIds', 'PackageIds', 'dataType'};
        checkFLSCreate(checkFields, AppAnalyticsQueryRequest.SObjectType);

        String orgIDString = '';
        String packageIDString = '';

        if (orgIDs.size() > 0) {
            orgIDString = String.join(orgIDs, ',');
        }
        if (packageIDs.size() > 0) {
            packageIDString = String.join(packageIDs, ',');
        }
        try {
            AppAnalyticsQueryRequest newReq = new AppAnalyticsQueryRequest();
            newReq.startTime = startTime;
            newReq.endTime = endTime;
            newReq.OrganizationIds = orgIDString;
            newReq.PackageIds = packageIDString;
            newReq.dataType = dataType;
            insert newReq;
            return newReq.id;
        } catch (Exception e) {
            system.debug(e);
            throw new AuraHandledException(getExceptionMessage(e.getMessage()));
        }
    }

    private static void checkFLSRead(String[] selectFields, Schema.SObjectType sot) {
        Map<String,Schema.SObjectField> fieldMap = sot.getDescribe().fields.getMap();
					for (String fieldToCheck : selectFields) {
            			if (!fieldMap.get(fieldToCheck).getDescribe().isAccessible()) {
							 throw new AuraHandledException(
            					'Were sorry, but you do not have access to field: ' 
            					+ fieldMap.get(fieldToCheck).getDescribe().getName());
                        }
                    }
    }

    private static void checkFLSCreate(String[] selectFields, Schema.SObjectType sot) {
        Map<String,Schema.SObjectField> fieldMap = sot.getDescribe().fields.getMap();
					for (String fieldToCheck : selectFields) {
            			if (!fieldMap.get(fieldToCheck).getDescribe().IsCreateable()) {
							 throw new AuraHandledException(
            					'Were sorry, but you do not have access to field: ' 
            					+ fieldMap.get(fieldToCheck).getDescribe().getName());
                        }
                    }
    }

    private static String getExceptionMessage(String rawMessage) {
        String customMessage = rawMessage;
            if (rawMessage.contains('At least one package must be specified')) {
                customMessage = 'Please select at least one Package or Subscriber';
            }
            else if (rawMessage.contains('Query rate limit exceeded')) {
                customMessage = 'Please select a shorter timeframe. A maximum of 7 days of logs can be requested per 24 hour period.';
            }
            else if (rawMessage.contains('Specify a 15-character package ID')) {
                customMessage = 'Invalid Package ID. Please specify a 15 character package ID';
            }

        return customMessage;
    }
}