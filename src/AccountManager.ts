import Store from 'electron-store';
import { Account } from './Account';
import { MicrosoftAccount } from './MicrosoftAuth/MicrosoftAccount';
import { CrackedAccount } from './CrackedAuth/CrackedAccount';
import { EncryptionService } from './EncryptionService';
import { Config } from './Config';
import { AccountType } from './types';

interface StoredAccount {
  uuid: string;
  username: string;
  type: AccountType;
  encryptedData: string;
  lastUsed: number;
  addedAt: number;
}

interface StoreSchema {
  accounts: StoredAccount[];
}

export class AccountManager {
  private store: Store<StoreSchema> | null = null;
  private encryptionToken: string;

  constructor() {
    this.encryptionToken = Config.config.encryptionToken;
  }

  /**
   * Initialize the account manager with electron-store
   * @param storagePath - Optional custom path for storage file
   */
  initialize(storagePath?: string): void {
    const storeOptions: any = {
      name: 'minecraft-profiles',
      defaults: {
        accounts: []
      }
    };

    if (storagePath) {
      storeOptions.cwd = storagePath;
    }

    this.store = new Store<StoreSchema>(storeOptions);
  }

  /**
   * Ensure store is initialized
   */
  private ensureInitialized(): void {
    if (!this.store) {
      throw new Error('AccountManager not initialized. Call initialize() first.');
    }
  }

  /**
   * Encrypt account data for storage
   */
  private _encryptAccountData(account: Account): string {
    const jsonData = JSON.stringify(account.toJSON());
    return EncryptionService.encrypt(jsonData, this.encryptionToken);
  }

  /**
   * Decrypt and reconstruct account from stored data
   */
  private _decryptAccountData(encryptedData: string, type: AccountType): Account {
    const decrypted = EncryptionService.decrypt(encryptedData, this.encryptionToken);
    const data = JSON.parse(decrypted);

    switch (type) {
      case 'microsoft':
        return MicrosoftAccount.fromJSON(data);
      case 'cracked':
        return CrackedAccount.fromJSON(data);
      default:
        return Account.fromJSON(data);
    }
  }

  /**
   * Add or update an account in storage
   * @param account - Account to add/update
   */
  async addAccount(account: Account): Promise<void> {
    this.ensureInitialized();

    if (!account.uuid) {
      throw new Error('Account must have a UUID before being stored');
    }

    const accounts = this.store!.get('accounts', []);
    const existingIndex = accounts.findIndex(a => a.uuid === account.uuid);

    const storedAccount: StoredAccount = {
      uuid: account.uuid,
      username: account.username || '',
      type: account.type,
      encryptedData: this._encryptAccountData(account),
      lastUsed: Date.now(),
      addedAt: existingIndex >= 0 ? accounts[existingIndex].addedAt : Date.now()
    };

    if (existingIndex >= 0) {
      accounts[existingIndex] = storedAccount;
    } else {
      accounts.push(storedAccount);
    }

    this.store!.set('accounts', accounts);
  }

  /**
   * Remove an account from storage
   * @param uuid - UUID of account to remove
   */
  async removeAccount(uuid: string): Promise<void> {
    this.ensureInitialized();

    const accounts = this.store!.get('accounts', []);
    const filtered = accounts.filter(a => a.uuid !== uuid);
    this.store!.set('accounts', filtered);
  }

  /**
   * Get an account by UUID
   * @param uuid - UUID of account to retrieve
   * @returns Decrypted account or undefined if not found
   */
  async getAccount(uuid: string): Promise<Account | undefined> {
    this.ensureInitialized();

    const accounts = this.store!.get('accounts', []);
    const storedAccount = accounts.find(a => a.uuid === uuid);

    if (!storedAccount) {
      return undefined;
    }

    // Update last used timestamp
    storedAccount.lastUsed = Date.now();
    this.store!.set('accounts', accounts);

    return this._decryptAccountData(storedAccount.encryptedData, storedAccount.type);
  }

  /**
   * Get an account by username
   * @param name - Username to search for
   * @returns Decrypted account or undefined if not found
   */
  async getAccountByName(name: string): Promise<Account | undefined> {
    this.ensureInitialized();

    const accounts = this.store!.get('accounts', []);
    const storedAccount = accounts.find(a => a.username.toLowerCase() === name.toLowerCase());

    if (!storedAccount) {
      return undefined;
    }

    // Update last used timestamp
    storedAccount.lastUsed = Date.now();
    this.store!.set('accounts', accounts);

    return this._decryptAccountData(storedAccount.encryptedData, storedAccount.type);
  }

  /**
   * Get all stored accounts
   * @returns Array of all decrypted accounts
   */
  async getAllAccounts(): Promise<Account[]> {
    this.ensureInitialized();

    const accounts = this.store!.get('accounts', []);
    return accounts.map(storedAccount =>
      this._decryptAccountData(storedAccount.encryptedData, storedAccount.type)
    );
  }

  /**
   * Get account metadata (without decrypting)
   * @returns Array of account metadata
   */
  getAccountsMetadata(): Array<{ uuid: string; username: string; type: AccountType; lastUsed: number; addedAt: number }> {
    this.ensureInitialized();

    const accounts = this.store!.get('accounts', []);
    return accounts.map(a => ({
      uuid: a.uuid,
      username: a.username,
      type: a.type,
      lastUsed: a.lastUsed,
      addedAt: a.addedAt
    }));
  }

  /**
   * Refresh an account's tokens and update storage
   * @param uuid - UUID of account to refresh
   * @returns Refreshed account
   */
  async refreshAccount(uuid: string): Promise<Account> {
    const account = await this.getAccount(uuid);

    if (!account) {
      throw new Error(`Account with UUID ${uuid} not found`);
    }

    // Refresh based on account type
    if (account instanceof MicrosoftAccount) {
      await account.refresh();
    }

    // Update storage with refreshed tokens
    await this.addAccount(account);

    return account;
  }

  /**
   * Clear all accounts from storage
   */
  async clearAll(): Promise<void> {
    this.ensureInitialized();
    this.store!.set('accounts', []);
  }

  /**
   * Get the number of stored accounts
   */
  getAccountCount(): number {
    this.ensureInitialized();
    return this.store!.get('accounts', []).length;
  }
}
