
import { LightningElement } from 'lwc';
//check
export default class enterpriseComp1 extends LightningElement {
    message = 'V1 message';

    get computed() {
        return this.message.toUpperCase();
    }
}
