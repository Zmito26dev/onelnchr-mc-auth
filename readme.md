# OneLnchr MC Auth

![npm bundle size](https://img.shields.io/bundlephobia/min/onelnchr-mc-auth?label=npm%20size)

**Encrypted Minecraft authentication and profile manager for Electron launchers** with Microsoft authentication support.

## Features

- 🔐 **AES-256-GCM Encryption** - All profiles encrypted at rest
- 🎮 **Microsoft Authentication** - Full Xbox Live / Microsoft account support
- 📦 **Profile Management** - Add, remove, and manage multiple Minecraft profiles
- 🔄 **Auto-refresh** - Automatic token refresh when expired
- ⚡ **Electron-optimized** - Built specifically for Electron launchers
- � **MCLC Integration** - Ready to use with Minecraft Launcher Core
- �🛡️ **Type-safe** - Full TypeScript support

## Installation

```bash
npm install onelnchr-mc-auth
```

## Configuration

Create a `.env` file in your project root:

```env
# Microsoft Azure App ID (Required)
MS_APP_ID=your-app-id-here

# Microsoft Azure App Secret (Optional - for confidential clients)
MS_APP_SECRET=your-app-secret

# Encryption Token (Required - min 32 characters)
ENCRYPTION_TOKEN=your-secret-encryption-key
```

> **Get Microsoft App ID**: [Azure App Registration Guide](https://github.com/dommilosz/minecraft-auth/wiki/How-to-setup-Microsoft-Auth)

## Quick Start

```typescript
import { AccountManager, MicrosoftAuth, MicrosoftAccount } from 'onelnchr-mc-auth';

// Initialize profile manager
const manager = new AccountManager();
manager.initialize();

// Authenticate with Microsoft
const account = new MicrosoftAccount();
const code = await MicrosoftAuth.listenForCode();
await account.authFlow(code);
await account.getProfile();

// Save profile (encrypted automatically)
await manager.addAccount(account);

console.log(`Logged in as ${account.username}`);
```

## Usage Examples

### Microsoft Authentication

```typescript
import { AccountManager, MicrosoftAuth, MicrosoftAccount } from 'onelnchr-mc-auth';

const manager = new AccountManager();
manager.initialize();

// Create and authenticate
const account = new MicrosoftAccount();
const code = await MicrosoftAuth.listenForCode();
await account.authFlow(code);
await account.getProfile();

// Save to encrypted storage
await manager.addAccount(account);

// Access profile data
console.log(account.username);      // Minecraft username
console.log(account.uuid);          // UUID
console.log(account.accessToken);   // Access token for game
console.log(account.profile);       // Full profile with skins
```

### Integration with MCLC (Minecraft Launcher Core)

```typescript
import { Client } from 'minecraft-launcher-core';
import { AccountManager, MicrosoftAccount } from 'onelnchr-mc-auth';

const manager = new AccountManager();
manager.initialize();

// Get saved profile
const profile = await manager.getAccount('uuid-here');

if (profile instanceof MicrosoftAccount) {
    // Ensure token is valid (auto-refresh if needed)
    await profile.use();
    
    // Launch Minecraft with MCLC
    const launcher = new Client();
    
    const opts = {
        clientPackage: null,
        authorization: {
            access_token: profile.accessToken,
            client_token: profile.uuid,
            uuid: profile.uuid,
            name: profile.username,
            user_properties: JSON.stringify(profile.properties || {})
        },
        root: "./minecraft",
        version: {
            number: "1.20.4",
            type: "release"
        },
        memory: {
            max: "4G",
            min: "2G"
        }
    };
    
    launcher.launch(opts);
    
    launcher.on('debug', (e) => console.log(e));
    launcher.on('data', (e) => console.log(e));
}
```

### Complete Electron + MCLC Example

```typescript
// main.js (Electron main process)
import { app, ipcMain } from 'electron';
import { AccountManager, MicrosoftAuth, MicrosoftAccount } from 'onelnchr-mc-auth';
import { Client } from 'minecraft-launcher-core';
import path from 'path';

const manager = new AccountManager();
manager.initialize(path.join(app.getPath('userData'), 'profiles'));

// Handle authentication
ipcMain.handle('auth:microsoft', async () => {
    const account = new MicrosoftAccount();
    const code = await MicrosoftAuth.listenForCode();
    await account.authFlow(code);
    await account.getProfile();
    await manager.addAccount(account);
    
    return {
        uuid: account.uuid,
        username: account.username,
        profile: account.profile
    };
});

// Get all profiles
ipcMain.handle('profiles:getAll', async () => {
    return manager.getAccountsMetadata();
});

// Launch Minecraft
ipcMain.handle('game:launch', async (event, uuid, version) => {
    const profile = await manager.getAccount(uuid);
    
    if (!profile || !(profile instanceof MicrosoftAccount)) {
        throw new Error('Invalid profile');
    }
    
    // Refresh token if needed
    await profile.use();
    
    const launcher = new Client();
    const opts = {
        clientPackage: null,
        authorization: {
            access_token: profile.accessToken,
            client_token: profile.uuid,
            uuid: profile.uuid,
            name: profile.username,
            user_properties: JSON.stringify(profile.properties || {})
        },
        root: path.join(app.getPath('userData'), 'minecraft'),
        version: {
            number: version,
            type: "release"
        },
        memory: {
            max: "4G",
            min: "2G"
        }
    };
    
    launcher.launch(opts);
    
    launcher.on('debug', (e) => event.sender.send('game:log', e));
    launcher.on('data', (e) => event.sender.send('game:log', e));
    launcher.on('close', (code) => event.sender.send('game:close', code));
    
    return true;
});
```

### Retrieving Profiles

```typescript
// Get profile by UUID
const profile = await manager.getAccount('uuid-here');

// Get profile by username
const profile = await manager.getAccountByName('PlayerName');

// Get all profiles
const allProfiles = await manager.getAllAccounts();

// Get metadata without decrypting
const metadata = manager.getAccountsMetadata();
// [{ uuid, username, type, lastUsed, addedAt }]
```

### Using Profiles

```typescript
// Get valid access token (auto-refreshes if expired)
const profile = await manager.getAccount('uuid-here');
await profile.use(); // Returns valid access token

// Manually refresh
await profile.refresh();
await manager.addAccount(profile); // Update storage
```

### Profile Management

```typescript
// Remove profile
await manager.removeAccount('uuid-here');

// Clear all profiles
await manager.clearAll();

// Get profile count
const count = manager.getAccountCount();
```

### Cracked Accounts (Offline Mode)

```typescript
import { CrackedAccount } from 'onelnchr-mc-auth';

const account = new CrackedAccount('username');
await manager.addAccount(account);

// Use with MCLC
const opts = {
    authorization: {
        access_token: account.accessToken,
        client_token: account.uuid,
        uuid: account.uuid,
        name: account.username,
        user_properties: '{}'
    },
    // ... other options
};
```

### Custom Storage Path

```typescript
import { app } from 'electron';
import path from 'path';

const manager = new AccountManager();
manager.initialize(path.join(app.getPath('userData'), 'profiles'));
```

## API Reference

### AccountManager

| Method | Description |
|--------|-------------|
| `initialize(path?)` | Initialize storage with optional custom path |
| `addAccount(account)` | Add or update profile (encrypted) |
| `removeAccount(uuid)` | Remove profile by UUID |
| `getAccount(uuid)` | Get profile by UUID |
| `getAccountByName(name)` | Get profile by username |
| `getAllAccounts()` | Get all profiles |
| `getAccountsMetadata()` | Get metadata without decrypting |
| `refreshAccount(uuid)` | Refresh tokens and update storage |
| `clearAll()` | Remove all profiles |
| `getAccountCount()` | Get number of profiles |

### MicrosoftAccount

| Method | Description |
|--------|-------------|
| `authFlow(code, PKCEPair?)` | Complete authentication with code |
| `refresh()` | Refresh access token |
| `use()` | Get valid token (auto-refresh) |
| `getProfile()` | Fetch Minecraft profile |

### MicrosoftAuth

| Method | Description |
|--------|-------------|
| `setup(config)` | Configure Microsoft auth |
| `listenForCode(config?)` | Start auth server and get code |
| `createUrl(PKCEPair?)` | Generate auth URL |
| `generatePKCEPair()` | Generate PKCE pair for auth |

### Account Properties

| Property | Type | Description |
|----------|------|-------------|
| `accessToken` | `string` | Minecraft access token |
| `uuid` | `string` | Account UUID |
| `username` | `string` | Minecraft username |
| `ownership` | `boolean` | Whether account owns Minecraft |
| `profile` | `object` | Full profile with skins/capes |
| `type` | `AccountType` | Account type (microsoft/cracked) |

## Security

- **AES-256-GCM** encryption for all profile data
- **PBKDF2** key derivation (100,000 iterations)
- **Unique IVs** for each encryption operation
- **Authentication tags** for integrity verification

> ⚠️ **Keep your `ENCRYPTION_TOKEN` secure!** If lost, all encrypted data is unrecoverable.

## For Electron Launchers

This library is specifically designed for Electron-based Minecraft launchers:

```typescript
// In your Electron main process
import { AccountManager } from 'onelnchr-mc-auth';
import { app } from 'electron';
import path from 'path';

const manager = new AccountManager();
manager.initialize(path.join(app.getPath('userData'), 'profiles'));

// Expose to renderer via IPC
ipcMain.handle('get-profiles', async () => {
    return await manager.getAllAccounts();
});

ipcMain.handle('add-profile', async (event, account) => {
    await manager.addAccount(account);
});
```

## Error Handling

```typescript
import { AuthenticationError, OwnershipError } from 'onelnchr-mc-auth';

try {
    await account.authFlow(code);
} catch (error) {
    if (error instanceof AuthenticationError) {
        console.error('Auth failed:', error.message);
    } else if (error instanceof OwnershipError) {
        console.error('Account does not own Minecraft');
    }
}
```

## MCLC Integration Tips

### Handling Token Expiration

```typescript
launcher.on('arguments', async (args) => {
    // Token might have expired, refresh before launch
    const profile = await manager.getAccount(currentUUID);
    if (profile instanceof MicrosoftAccount) {
        await profile.use(); // Auto-refresh
        await manager.addAccount(profile); // Save updated token
    }
});
```

### Profile Switching

```typescript
ipcMain.handle('profile:switch', async (event, uuid) => {
    const profile = await manager.getAccount(uuid);
    await profile.use(); // Ensure valid token
    
    // Update current profile
    store.set('currentProfile', uuid);
    
    return {
        uuid: profile.uuid,
        username: profile.username,
        profile: profile.profile
    };
});
```

## Credits

This library is a complete rewrite of [minecraft-auth](https://github.com/dommilosz/minecraft-auth) by **dommilosz**.

**Original Author**: [dommilosz](https://github.com/dommilosz)  
**Rewritten by**: [Zmito26dev](https://github.com/Zmito26dev)

### What Changed in This Rewrite

This version has been completely rewritten with a new focus:
- **Electron-first design** - Built specifically for Electron launchers
- **Encrypted storage** - AES-256-GCM encryption with electron-store
- **Simplified API** - Removed deprecated Mojang authentication
- **Profile management** - Centralized AccountManager for all operations
- **MCLC integration** - Ready-to-use examples for Minecraft Launcher Core
- **Modern TypeScript** - Updated to latest standards and best practices

Special thanks to dommilosz for the original implementation that served as the foundation for this project.

## License

MIT

## Author

Zmito26dev

## Links

- [GitHub Repository](https://github.com/Zmito26dev/onelnchr-mc-auth)
- [NPM Package](https://www.npmjs.com/package/onelnchr-mc-auth)
- [MCLC Documentation](https://github.com/Pierce01/MinecraftLauncher-core)