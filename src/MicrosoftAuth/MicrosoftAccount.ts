import { AuthenticationError, PKCEPairType } from "../types";
import * as MicrosoftAuth from "./MicrosoftAuth";
import { Account } from "../Account";
import { HttpGet } from "../utils/HttpClient";

export class MicrosoftAccount extends Account {
    refreshToken?: string;
    authCode?: string;

    constructor() {
        super(undefined, "microsoft");
        this.alternativeValidation = true;
    }

    /**
     * Refresh the Microsoft access token
     */
    async refresh() {
        if (!this.refreshToken) {
            throw new AuthenticationError("Refresh token not provided", "Refresh token not provided for refreshing");
        }

        const resp = await MicrosoftAuth.authFlowRefresh(this.refreshToken);
        this.refreshToken = resp.refresh_token;
        this.accessToken = resp.access_token;
        return this.accessToken;
    }

    /**
     * Complete the authentication flow with an auth code
     */
    async authFlow(authCode: string, PKCEPair?: PKCEPairType) {
        this.authCode = authCode;
        const resp = await MicrosoftAuth.authFlow(this.authCode, PKCEPair);
        this.refreshToken = resp.refresh_token;
        this.accessToken = resp.access_token;
        return this.accessToken;
    }

    /**
     * Get a valid access token, refreshing if necessary
     */
    async use() {
        // Try to use current token first
        if (this.accessToken) {
            // Check if token is valid by trying to get profile
            try {
                await this.getProfile();
                return this.accessToken;
            } catch (error) {
                // Token expired, refresh it
                await this.refresh();
                return this.accessToken;
            }
        } else {
            // No token, need to refresh
            await this.refresh();
            return this.accessToken;
        }
    }

    /**
     * Fetch the Minecraft profile for this account
     */
    async getProfile() {
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        try {
            const response = await HttpGet(
                'https://api.minecraftservices.com/minecraft/profile',
                { 'Authorization': `Bearer ${this.accessToken}` }
            );

            const profile = JSON.parse(response);

            if (profile.error) {
                throw new Error(profile.errorMessage || 'Failed to fetch profile');
            }

            this.username = profile.name;
            this.uuid = profile.id;
            this.profile = profile;
            this.ownership = true;

            return profile;
        } catch (error) {
            // If we get a 404, the account doesn't own Minecraft
            if (error instanceof Error && error.message.includes('404')) {
                this.ownership = false;
                throw new Error("Account does not own Minecraft");
            }
            throw error;
        }
    }

    /**
     * Serialize Microsoft account to JSON
     */
    toJSON(): any {
        return {
            ...super.toJSON(),
            refreshToken: this.refreshToken,
            authCode: this.authCode
        };
    }

    /**
     * Deserialize Microsoft account from JSON
     */
    static fromJSON(data: any): MicrosoftAccount {
        const account = new MicrosoftAccount();
        account.accessToken = data.accessToken;
        account.ownership = data.ownership || false;
        account.uuid = data.uuid;
        account.username = data.username;
        account.profile = data.profile;
        account.properties = data.properties || {};
        account.alternativeValidation = data.alternativeValidation || true;
        account.refreshToken = data.refreshToken;
        account.authCode = data.authCode;
        return account;
    }
}
