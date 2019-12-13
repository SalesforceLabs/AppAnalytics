@isTest
private class appAnalyticsRequestControllerTest {
     
@testSetup 
static void setup() {
    //Create Sample Packages
    sfLma__Package__c package1 = new sfLma__Package__c();
    package1.sfLma__Developer_Name__c = 'Test Dev';
    package1.Name = 'Test Package1';
    package1.sfLma__Package_ID__c = '033000000000001';
    insert package1;

    sfLma__Package__c package2 = new sfLma__Package__c();
    package2.sfLma__Developer_Name__c = 'Test Dev 2';
    package2.Name = 'Test Package2';
    package2.sfLma__Package_ID__c = '033000000000002';
    insert package2;


    sfLma__Package_Version__c pv1 = new sfLma__Package_Version__c();
    pv1.sfLma__Package__c = package1.id;
    pv1.Name = 'Test Package Version';
    insert pv1;

    sfLma__Package_Version__c pv2 = new sfLma__Package_Version__c();
    pv2.sfLma__Package__c = package2.id;
    pv2.Name = 'Test Package Version 2';
    insert pv2;

    //Create Sample Licenses
    Account acct1 = new Account();
    acct1.Name = 'Test Account';
    insert acct1;

    Account acct2 = new Account();
    acct2.Name = 'Test Account 2';
    insert acct2;

    sfLma__License__c lic1 = new sfLma__License__c();
    lic1.sfLma__Account__c = acct1.id;
    lic1.sfLma__Package_Version__c = pv1.id;
    lic1.sfLma__Subscriber_Org_ID__c = '00D000000000001';
    insert lic1;

    sfLma__License__c lic2 = new sfLma__License__c();
    lic2.sfLma__Account__c = acct2.id;
    lic2.sfLma__Package_Version__c = pv2.id;
    lic2.sfLma__Subscriber_Org_ID__c = '00D000000000002';
    insert lic2;

}

@isTest
static void testAnalyticsRequests() {

    List<String> packageIDs = new List<String>();
    List<String> orgIDs = new List<String>();

    //Retrieve the test package
    List<sfLMA__Package__c> packages = appAnalyticsRequestController.getPackageList();
    system.assertEquals(2,packages.size(), 'Expected to retrieve 2 test packages');
    
    //Retrieve the test Subscriber Orgs
    List<sfLma__License__c> orgs = appAnalyticsRequestController.getOrgList();
    system.assertEquals(2, orgs.size(),'Expected to retrieve 2 test Subscriber Orgs');

    //Setup to test Analytics Request Submission
    DateTime startTime = Datetime.now().addDays(-1);
    DateTime endTime = Datetime.now();
    String dataType = 'CustomObjectUsageLog';

    Boolean isError = false;
    //Expect exception -- not sending package or subscriber
    try {
        String response = appAnalyticsRequestController.submitAppAnalyticsQueryRequest(startTime, endTime, dataType, orgIDs, packageIDs);
    }
    catch (Exception ex) {
        isError = true;
    }
    system.assert(isError, 'Weird, that should have thrown an exception due to missing package and subscribers');


    //Add packages and subscribers
    for (sfLma__License__c org: orgs) {
        packageIDs.add(String.valueOf(org.sfLma__Package_Version__r.sfLma__Package__r.sfLma__Package_ID__c));
        orgIDs.add(String.valueOf(org.sfLma__Subscriber_Org_ID__c));
    }

    isError = false;
    //Expect exception -- we cannot submit test data
    try {
        String response = appAnalyticsRequestController.submitAppAnalyticsQueryRequest(startTime, endTime, dataType, orgIDs, packageIDs);
    }
    catch (Exception ex) {
        isError = true;
    }
    system.assert(isError, 'Weird, that should have thrown an exception due to invalid package and subscriber IDs');
   
    //We don't have any sample data. This should be empty
    List <AppAnalyticsQueryRequest> requests = appAnalyticsRequestController.getAppAnalyticsQueryRequests();     
    
    system.assertEquals(0,requests.size(), 'Requests list should be empty for tests');

    }

}