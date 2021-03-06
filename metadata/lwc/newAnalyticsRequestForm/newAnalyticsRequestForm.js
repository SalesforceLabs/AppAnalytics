import {
  LightningElement,
  track,
  wire
} from 'lwc';
import getPackageList from '@salesforce/apex/appAnalyticsRequestController.getPackageList';
import getOrgList from '@salesforce/apex/appAnalyticsRequestController.getOrgList';

import submitAppAnalyticsQueryRequest from '@salesforce/apex/appAnalyticsRequestController.submitAppAnalyticsQueryRequest';
import {
  ShowToastEvent
} from 'lightning/platformShowToastEvent';


export default class NewAnalyticsRequestForm extends LightningElement {
  @track error;
  @track packages = [];
  @track activeOrgs = true;
  @track orgs;
  @track startTime;
  @track endTime;
  orgSearchString = '';
  selectedPackages = [];
  @track selectedOrgs = [];
  dataType='CustomObjectUsageLog';

  allPackagesOption = {label: '---All Packages---', value: ''};
  allOrgsOption = {label: '---All Subscriber Orgs---', value: ''};


  @wire(getPackageList)
  wiredPackages({
    error,
    data
  }) {
    if (data) {
      this.error = undefined;
      this.packages.push(this.allPackagesOption);
      this.selectedPackages.push(this.allPackagesOption.value);
      for (let i = 0; i < data.length; i++) {
        if (this.isValidId(data[i].sfLma__Package_ID__c,'033')) {
          this.packages.push({
            label: data[i].Name,
            value: this.santizeId15Char(data[i].sfLma__Package_ID__c)
          });
        }
      }
      
      if (this.packages.length === 0) {
        this.packages = [{
          label: '---No Packages Available---',
          value: ''
        }, ];
      }
      window.console.log(this.packages);
      
    } else if (error) {
      this.error = error;
      window.console.log('Error getting packages list');
      window.console.log(error);
      this.packages = [{
        label: '---No Packages Available---',
        value: ''
      }, ];
    }
  }


  @wire(getOrgList)
  wiredOrgs({
    error,
    data
  }) {
    if (data) {
      this.error = undefined;
     // this._rawOrgs = data;
     this._rawOrgs = [];
     for (let i = 0; i < data.length; i++) {
       let subscriber = this.buildSubscriberRecord(data[i]);
  //     window.console.log('Org Record: ' + JSON.stringify(subscriber));
       if (subscriber.isValidRecord) {
  //       window.console.log('Adding Subscriber');
        this._rawOrgs.push(subscriber);
      }
    }
  
      this.buildOrgList();
    } 
    else if (error) {
      this.error = error;
      window.console.log('Error getting subscriber orgs');
      window.console.log(error);
      this._rawOrgs = [];
      this.buildOrgList();

    }
  }

  buildSubscriberRecord(org) {
    let subscriber  = {};
    //valid Record if we have a valid PackageID and a valid OrgID
  //  window.console.log('Building Subscriber Record: ' + JSON.stringify(org));
    subscriber.isValidRecord = (this.isValidId(org.sfLma__Subscriber_Org_ID__c,'00D') && org.sfLma__Package_Version__r !== undefined && org.sfLma__Package_Version__r.sfLma__Package__r !== undefined && this.isValidId(org.sfLma__Package_Version__r.sfLma__Package__r.sfLma__Package_ID__c,'033'));
    if (!subscriber.isValidRecord) {
      return subscriber;
    }
    subscriber.isActive = (org.sfLma__Status__c === 'Active');
    subscriber.AccountName = (org.sfLma__Account__r) ? org.sfLma__Account__r.Name : '';
    subscriber.LeadName = (org.sfLma__Lead__r) ? org.sfLma__Lead__r.Name : '';
    subscriber.OrgName = (subscriber.AccountName !== '') ? subscriber.AccountName : subscriber.LeadName;
    subscriber.Status = (org.sfLma__Status__c === 'Trial') ? `Trial [${org.sfLma__Expiration__c}]` : org.sfLma__Status__c;
    subscriber.DisplayName = `${subscriber.OrgName} (${subscriber.Status})`;
    subscriber.OrgID = this.santizeId15Char(org.sfLma__Subscriber_Org_ID__c);
    subscriber.PackageID = this.santizeId15Char(org.sfLma__Package_Version__r.sfLma__Package__r.sfLma__Package_ID__c);
    return subscriber;
  }
  filterOrgList(org) {
    // include active orgs
//    window.console.log('Filtering Org: ' + JSON.stringify(org));
   let passActiveCheck = ((this.activeOrgs !== true) || org.isActive === true);
//    window.console.log('Active Check: ' + passActiveCheck);
    // Seach based on Account or Lead Name
    let passSearchCheck = (this.orgSearchString.length === 0) || (org.AccountName.toLowerCase().includes(this.orgSearchString.toLowerCase())) || (org.LeadName.toLowerCase().includes(this.orgSearchString.toLowerCase()));
//    window.console.log('Search Check: ' + passSearchCheck);
// if search string is 15 or 18 characters, filter based on OrgID
    let passOrgIDSearchCheck =  ((this.orgSearchString.length === 15 || this.orgSearchString.length === 18) && org.OrgID === this.santizeId15Char(this.orgSearchString)); 
//    window.console.log('ID Search Check: ' + passOrgIDSearchCheck);

    //include orgs associated with selected packages
    let passPackageSelectedCheck = (this.selectedPackages.includes(this.allPackagesOption.value) || this.selectedPackages.includes(org.PackageID));
  //  window.console.log('Package Selected Check: ' + passPackageSelectedCheck);
    //include already selected orgs
    let orgAlreadySelected = this.selectedOrgs.includes(org.OrgID);
  //  window.console.log('Org Already Selected:' + orgAlreadySelected);

    return  (orgAlreadySelected || (passPackageSelectedCheck && (passSearchCheck || passOrgIDSearchCheck) && passActiveCheck));
  }

  buildOrgList() {
    //this.orgs = [];
    this.orgs = undefined;
    let orgDedupe = [];
    
    let filteredOrgs = this._rawOrgs && Array.isArray(this._rawOrgs) ? this._rawOrgs.filter(this.filterOrgList.bind(this)) : [];

    if (filteredOrgs.length === 0) {
      this.orgs = [{
        label: '---No Subscriber Orgs Available---',
        value: ''
      }, ];
    } else {
      let tmpOrgs = []; 
      tmpOrgs.push(this.allOrgsOption);
      for (let i = 0; i < filteredOrgs.length; i++) {
        if (!orgDedupe.includes(filteredOrgs[i].OrgID)) {
          tmpOrgs.push({
              label: filteredOrgs[i].DisplayName,
              value: filteredOrgs[i].OrgID
            });
          orgDedupe.push(filteredOrgs[i].OrgID);
          }
        }
      this.orgs = tmpOrgs;
      }
    
    if (this.selectedOrgs.length === 0) {
      this.selectedOrgs.push(this.allOrgsOption.value);
    }
    
  }

 
  isValidId(idToValidate,idPrefix) {
    window.console.log(`Checking to see if ${idToValidate} is valid. Prefix ${idPrefix}`);
    let re = new RegExp(idPrefix + '([a-zA-Z0-9]{12}|[a-zA-Z0-9]{15})');
   // 033([a-zA-Z0-9]{12}|[a-zA-Z0-9]{15})
   let isValidId = re.test(idToValidate);
   window.console.log('Is it valid?' + isValidId);
    return isValidId;
  }

  santizeId15Char(idToSanitize) {
  //  window.console.log(`SantizingID:  ${idToSanitize}. Prefix ${idPrefix}`)
   // let santizedId = this.isValidId(idToSanitize,idPrefix) ? idToSanitize.substr(0, 15) : null;
   let santizedId = idToSanitize.substr(0, 15);
   // window.console.log('Santized ID: ' + santizedId);
    return santizedId;
    
    //idToSanitize.padEnd(15, '0').substr(0, 15);

  }

  get dataTypeOptions() {
    return [{
        label: 'Custom Object Usage Summary',
        value: 'CustomObjectUsageSummary'
      },
      {
        label: 'Custom Object Usage Log',
        value: 'CustomObjectUsageLog'
      },
    ];
  }

  get startTimeMax() {
    // If we have an endTime set, then the latest possible startTime is the endTime
    // If endTime is not set, then the latest possible startTime is right now.
    let startMax = new Date();
    if (this.endTime) {
      startMax = new Date(this.endTime);
    }
    return startMax;
  }

  get startTimeMin() {
    // If we have an endTime set, then the earliest possible startTime is 7 days prior
    // If we do not, then there is no lower bound on startTime
    let startMin = '';
    if (this.endTime) {
      startMin = new Date(this.endTime);
      startMin.setDate(startMin.getDate() - 7);
    }
    return startMin;
  }

  get endTimeMax() {
    //End Time Max is the lesser of startTime + 7 days and now.
    let endMax = new Date();
    if (this.startTime) {
      let startTime = new Date(this.startTime);
      endMax.setDate(startTime.getDate() + 7);
      if (endMax.valueOf() > Date.now())  {
        endMax = new Date();
      }
    }
    return endMax;
  }

  get endTimeMin() {
    //End Time min is the lesser of startTime and Now.
    let endMin = '';
    if (this.startTime) {
      endMin = new Date(this.startTime);
    }
    return endMin;
  }
  handlePackageIdChange(event) {
    let selections = event.detail.value;
    if (selections.length === 0) {
      window.console.log('No options selected. Pushing default');
      selections.push(this.allPackagesOption.value);
   //   this.selectedPackages = [];
    }
    else if (selections.length > 0 && selections.includes(this.allPackagesOption.value) &&  !this.selectedPackages.includes(this.allPackagesOption.value)) {
      window.console.log('All added to selection. Remove the rest')
      selections = [this.allPackagesOption.value];
 //     this.selectedPackages = [];
    }
    else if (selections.length > 1 && selections.includes(this.allPackagesOption.value) && this.selectedPackages.includes(this.allPackagesOption.value)) {
      window.console.log('Specific value added. Remove default');
      for(let i = 0; i < selections.length; i++){ 
        if (selections[i] === this.allPackagesOption.value) {
          selections.splice(i, 1); 
        }
     }
    }
    this.selectedPackages = selections;
    window.console.log('Selected Packages Change');
    window.console.log(this.selectedPackages);
  //  this.orgdependent = (!this.selectedPackages.includes(this.allPackagesOption.value));
    this.buildOrgList();
  }

  handleOrgIdChange(event) {
    let selections = event.detail.value;
    if (selections.length === 0) {
      window.console.log('No options selected. Pushing default');
      selections.push(this.allOrgsOption.value);
    }
    else if (selections.length > 0 && selections.includes(this.allOrgsOption.value) &&  !this.selectedOrgs.includes(this.allOrgsOption.value)) {
      window.console.log('All added to selection. Remove the rest')
      selections = [this.allOrgsOption.value];
    }
    else if (selections.length > 1 && selections.includes(this.allOrgsOption.value) && this.selectedOrgs.includes(this.allOrgsOption.value)) {
      window.console.log('Specific value added. Remove default');
      for(let i = 0; i < selections.length; i++){ 
        if (selections[i] === this.allOrgsOption.value) {
          selections.splice(i, 1); 
        }
     }
    }
    this.selectedOrgs = selections;
    window.console.log('Selected Orgs Change');
    window.console.log(this.selectedOrgs);
  }
/*
  handleOrgDependentChange(event) {
    window.console.log('Toggle org Dependent on Package List');
    this.orgdependent = event.target.checked;
    window.console.log(this.orgdependent);
    this.buildOrgList();
  }
*/
  handleOrgActiveChange(event) {
    window.console.log('Toggle only active orgs');
    this.activeOrgs = event.target.checked;
    window.console.log(this.activeOrgs);
    this.buildOrgList();
  }

  handleEndTimeChange(event) {
    window.console.log('End Time Change');
    this.endTime = event.target.value;
    window.console.log(this.endTime);

  }

  handleStartTimeChange(event) {
    window.console.log('Start Time Change');
    this.startTime = event.target.value;
    window.console.log(this.startTime);
  }

  handleOrgSearch(event) {
    window.console.log('Search Orgs');
    this.orgSearchString = event.target.value;
    window.console.log(this.orgSearchString);
    this.buildOrgList();
  }

  handleDataTypeChange(event) {
    window.console.log('Data Type Change');
    this.dataType = event.target.value;
    window.console.log(this.dataType);
  }

  handleCancel() {
    window.console.log('Cancelled');
    this.dispatchEvent(new CustomEvent('cancel'));
  }

  handleSubmit() {
    window.console.log('Saved');
    submitAppAnalyticsQueryRequest({
        startTime: this.startTime,
        endTime: this.endTime,
        dataType: this.dataType,
        orgIDs: this.selectedOrgs,
        packageIDs: this.selectedPackages
      })
      .then(result => {
        window.console.log('Success');
        window.console.log(result);

        this.dispatchEvent(new ShowToastEvent({
          title: 'Success',
          message: 'Request Submitted',
          variant: 'success'
        }));
        this.dispatchEvent(new CustomEvent('success'));

      })
      .catch(error => {
        window.console.log('Fail');
        window.console.log(error.body.message);
        let errorMessage = error.body.message;
        this.dispatchEvent(new ShowToastEvent({
          title: 'Error Submitting Request',
          message: errorMessage,
          variant: 'error'
        }));

      });
  }
}