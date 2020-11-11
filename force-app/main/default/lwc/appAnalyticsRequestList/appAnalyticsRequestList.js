import {
  LightningElement,
  wire,
  track
} from 'lwc';
import getAppAnalyticsQueryRequests from '@salesforce/apex/appAnalyticsRequestController.getAppAnalyticsQueryRequests';
import {
  refreshApex
} from '@salesforce/apex';
import {
  CurrentPageReference
} from 'lightning/navigation';
import {
  registerListener,
  unregisterAllListeners
} from 'c/pubsub';


const columnDefs = [
  {
    label: 'Name',
    fieldName: 'Name',
    sortable: true,
    initialWidth: 100
  },
//  {
//    label: 'RequestId',
//    fieldName: 'Id'
//  },
  
{
  label: 'Request Date',
  fieldName: 'CreatedDate',
  type: 'date',
  typeAttributes:{
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
},
  sortable: true, 
},

  {
    label: 'Request Status',
    fieldName: 'RequestState',
    sortable: true,
  },
  {
    label: 'Start',
    fieldName: 'StartTime',
    type: 'date',
    typeAttributes:{
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
  },
    sortable: true, 
  },
  {
    label: 'End',
    fieldName: 'EndTime',
    type: 'date',
    typeAttributes:{
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
  },
    sortable: true, 
  },
//  {
//    label: 'Orgs',
//    fieldName: 'OrganizationIds',
//    sortable: true, 
//    initialWidth: 165
//  },
//  {
//    label: 'Packages',
//    fieldName: 'PackageIds',
//    sortable: true, 
//    initialWidth: 145
//  },
  {
    label: 'Error Message',
    fieldName: 'ErrorMessage',
    sortable: true, 
  },
  {
    label: 'Download Url',
    fieldName: 'DownloadUrl',
    type: 'url',
    sortable: true
  },
//  {
//    label: 'Download Expiration',
//    fieldName: 'DownloadExpirationTime',
//    type: 'date',
//    sortable: true, 
//    initialWidth: 100
//  },
//  {
//    label: 'Data Type',
//    fieldName: 'DataType',
//    sortable: true
//  },
{type: "button",
  initialWidth: 100,
  typeAttributes: {
  label: 'View',
  name: 'View',
  title: 'View',
  disabled: false,
  value: 'view',
  iconPosition: 'left'
}},
];

const filterOptions = [ 
  {value: 'show_active', label: 'Show Active Requests'},
  {value: 'all', label: 'Show All Requests'},
  {value: 'show_expired', label: 'Show Expired Requests'},
  {value: 'show_error', label: 'Show Requests with Errors'},
//  {value: 'show_nodata', label: 'Show Requests with No Data'},
];
/*
actions: [
  { label: 'Active Requests', checked: true, name: 'show_active' },
  { label: 'All', checked: false, name:'all' },
  { label: 'Expired Requests', checked: false, name:'show_expired' },
  { label: 'Errored Requests', checked: false, name:'show_error' },
  { label: 'No Data', checked: false, name:'show_nodata'},
] 
*/
export default class AppAnalyticsRequestList extends LightningElement {

  @track error;
  @track data;
  @track columns = {};
  @track sortedBy;
  @track sortedDirection;
  @track showDetail = false;
  @track selectedRow;
  @track activeRequestFilter = 'show_active';
  @track filterOptions = filterOptions;


  @wire(getAppAnalyticsQueryRequests)
  appAnalyticsRequests(result) {
    this.wiredRequests = result;
    if (result.data) {
      this.error = undefined;
      this._rawData = result.data;
      window.console.log('retrieved requests list');
      //window.console.log(this.data);
      //window.console.log(result.data);
      this.buildRequestsList();
    } else if (result.error) {
      this.error = result.error;
      this._rawData = [];
      window.console.log('Error getting requests list');
      window.console.log(this.error);
      this.buildRequestsList();
    }
    
  }

  @wire(CurrentPageReference) pageRef; // Required by pubsub
  
  filterReqList(request) {
    const activeStatus = ['New','Pending','Complete'];
    const errorStatus = ['Failed', 'NoData'];
    const noDataStatus = ['NoData'];
    const expiredStatus = ['Expired'];

    let showRequest = true;
    switch(this.activeRequestFilter) {
      case 'all':
        break;
      case 'show_expired':
       // showRequest = expiredStatus.inclues(request.RequestState);
        showRequest = request.RequestState === 'Expired';
        break;
      case 'show_active':
        showRequest = activeStatus.includes(request.RequestState);
        break;
      case 'show_error':
        showRequest = errorStatus.includes(request.RequestState);
        break;
      case 'show_nodata':
        showRequest = noDataStatus.includes(request.RequestState);
        break;
      default:
        showRequest = true;
    }

    return showRequest;
  }

  buildColumnList() {
    let cols = [];
    switch(this.activeRequestFilter) {
      
      case 'show_active':
        //Don't show error col for active requests
        for (let i = 0; i < columnDefs.length; i++) {
          if (columnDefs[i].fieldName !== 'ErrorMessage') {
            cols.push(columnDefs[i]);
          }
        }
        break;
      case 'show_error':
        //Don't show Download col for Error requests
        for (let i = 0; i < columnDefs.length; i++) {
          if (columnDefs[i].fieldName !== 'DownloadUrl') {
            cols.push(columnDefs[i]);
          }
        }
        break;
      case 'show_nodata':
       //Don't show Download col for No Data requests
       for (let i = 0; i < columnDefs.length; i++) {
        if (columnDefs[i].fieldName !== 'DownloadUrl') {
          cols.push(columnDefs[i]);
        }
      }
      break;
      default:
        //If in doubt, show all columns
        cols = columnDefs;
    }
    return cols;
  }
  
  buildRequestsList() {
    let data = JSON.parse(JSON.stringify(this._rawData));
    this.data = data.filter(this.filterReqList.bind(this));
    this.columns = this.buildColumnList();
  }



  connectedCallback() {
    // subscribe to refreshList event
    registerListener('refreshlist', this.handleRefreshList, this);
  }
  disconnectedCallback() {
    unregisterAllListeners(this);
  }

  handleFilterChange(event) {
      const selectedFilter = event.detail.value;
      window.console.log('Request Filter Change from ' + this.activeRequestFilter + ' to ' + selectedFilter);
      this.activeRequestFilter = selectedFilter;
      this.buildRequestsList();
  }

  handleRowAction(event) {
    window.console.log('Handle Row Action');
    const action = event.detail.action;
    const row = event.detail.row;
    window.console.log(JSON.stringify(action));
    window.console.log(JSON.stringify(row));

    if (action.value === 'view') { 
      this.selectedRow = row;
      this.showDetail = true;
    }
  }

  handleModalClose() {
    this.showDetail = false;
    this.selectedRow = undefined;
  }
     
  handleRefreshList() {
    window.console.log('Handle RefreshList in RefreshList component');
    refreshApex(this.wiredRequests);
  }

  sortData(fieldName, sortDirection) {
  let data = JSON.parse(JSON.stringify(this.data));
   let key = (a) => a[fieldName];
    let reverse = sortDirection === 'asc' ? 1 : -1;
    data.sort((a, b) => {
      let valueA = key(a) ? key(a).toLowerCase() : '';
      let valueB = key(b) ? key(b).toLowerCase() : '';
      return reverse * ((valueA > valueB) - (valueB > valueA));
    });

    return data;
  }

  handleSort(event) {
    var fieldName = event.detail.fieldName;
    var sortDirection = event.detail.sortDirection;
    this.sortedBy = fieldName;
    this.sortedDirection = sortDirection;
    window.console.log('Sorting on: ' + this.sortedBy + ' in Direction: ' + this.sortedDirection);
    this.data = this.sortData(fieldName, sortDirection);
    window.console.log(this.data);

  }


}