export * as MicrosoftAuth from "./MicrosoftAuth/MicrosoftAuth"
export * as CrackedAuth from "./CrackedAuth/CrackedAuth"

export { MicrosoftAccount } from "./MicrosoftAuth/MicrosoftAccount"
export { CrackedAccount } from "./CrackedAuth/CrackedAccount"
export { Account } from "./Account"

// Core exports for v3.0
export { AccountManager } from "./AccountManager"
export { Config } from "./Config"
export { EncryptionService } from "./EncryptionService"

// Type exports
export type { AccountType, PKCEPairType } from "./types"
export { AuthenticationError, OwnershipError } from "./types"
