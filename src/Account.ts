import { AccountType, OwnershipError } from "./types";

export class Account {
    accessToken?: string;
    ownership: boolean = false;
    uuid?: string;
    username?: string;
    type: AccountType;
    profile?: any;
    properties: any = {};
    alternativeValidation: boolean = false;

    constructor(token: string | undefined, type: AccountType) {
        this.accessToken = token;
        this.type = type;
    }

    /**
     * Serialize account to JSON for storage
     */
    toJSON(): any {
        return {
            accessToken: this.accessToken,
            ownership: this.ownership,
            uuid: this.uuid,
            username: this.username,
            type: this.type,
            profile: this.profile,
            properties: this.properties,
            alternativeValidation: this.alternativeValidation
        };
    }

    /**
     * Deserialize account from JSON
     */
    static fromJSON(data: any): Account {
        const account = new Account(data.accessToken, data.type);
        account.ownership = data.ownership || false;
        account.uuid = data.uuid;
        account.username = data.username;
        account.profile = data.profile;
        account.properties = data.properties || {};
        account.alternativeValidation = data.alternativeValidation || false;
        return account;
    }
}
