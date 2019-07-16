import {
  LightningElement,
  track,
  wire
} from 'lwc';
import {
  CurrentPageReference
} from 'lightning/navigation';
import {
  fireEvent
} from 'c/pubsub';

export default class AppAnalyticsRequestPageWrapper extends LightningElement {

  @track showNewForm = false;

  @wire(CurrentPageReference) pageRef;


  handleNewClick() {
    window.console.log('New Request');
    this.showNewForm = true;
  }

  handleRefreshClick() {
    window.console.log('Refreshing Requests List');
    fireEvent(this.pageRef, 'refreshList','');
  }

  handleSubmitSuccess() {
    window.console.log('handle form success');
    this.showNewForm = false;
    fireEvent(this.pageRef, 'refreshList','');
  }

  handleSubmitCancel() {
    window.console.log('handle form cancel');
    this.showNewForm = false;
  }
}