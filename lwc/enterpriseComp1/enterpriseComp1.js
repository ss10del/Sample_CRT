import { LightningElement } from 'lwc';

export default class enterpriseComp1 extends LightningElement {
    message = 'V1 message';
//123
    get computed() {
        return this.message.toUpperCase();
    }
}
