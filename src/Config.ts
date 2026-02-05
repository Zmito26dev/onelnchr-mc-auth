import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface ConfigType {
    appID: string;
    appSecret?: string;
    encryptionToken: string;
}

class Configuration {
    private _config: ConfigType | null = null;

    get config(): ConfigType {
        if (!this._config) {
            this._config = this.loadConfig();
        }
        return this._config;
    }

    private loadConfig(): ConfigType {
        const appID = process.env.MS_APP_ID;
        const appSecret = process.env.MS_APP_SECRET;
        const encryptionToken = process.env.ENCRYPTION_TOKEN;

        if (!appID) {
            throw new Error('MS_APP_ID is required in .env file');
        }

        if (!encryptionToken) {
            throw new Error('ENCRYPTION_TOKEN is required in .env file');
        }

        if (encryptionToken.length < 32) {
            console.warn('WARNING: ENCRYPTION_TOKEN should be at least 32 characters for better security');
        }

        return {
            appID,
            appSecret,
            encryptionToken
        };
    }

    // Allow manual configuration override (useful for testing)
    setConfig(config: Partial<ConfigType>) {
        this._config = {
            ...this.config,
            ...config
        };
    }
}

export const Config = new Configuration();
