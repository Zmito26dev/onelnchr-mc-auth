import * as CrackedAuth from "./CrackedAuth";
import { Account } from "../Account";

export class CrackedAccount extends Account {
    constructor(username: string) {
        super(undefined, "cracked");
        this.ownership = false;
        this.setUsername(username);
    }

    setUsername(username: string) {
        if (!username) return;
        this.username = username;
        this.uuid = CrackedAuth.uuid(username);
    }

    /**
     * Serialize Cracked account to JSON
     */
    toJSON(): any {
        return super.toJSON();
    }

    /**
     * Deserialize Cracked account from JSON
     */
    static fromJSON(data: any): CrackedAccount {
        const account = new CrackedAccount(data.username || '');
        account.accessToken = data.accessToken;
        account.ownership = data.ownership || false;
        account.uuid = data.uuid;
        account.profile = data.profile;
        account.properties = data.properties || {};
        account.alternativeValidation = data.alternativeValidation || false;
        return account;
    }
}
