# Setting up the Default FME SDK Key

## For Maintainers

The extension ships with a default FME (Feature Management Engine) SDK key embedded in the source code. This allows all end users to get feature flag functionality out of the box without configuration.

### How to Set the Default Key

1. **Get the Public Client SDK Key from Harness:**
   - Log in to your Harness account
   - Navigate to: **Account Settings → Feature Flags → Environments**
   - Select the production environment (or create a dedicated "VS Code Extension" environment)
   - Go to **SDK Keys** tab
   - Create a new **Client-side SDK Key** (or use an existing one)
   - Copy the key (starts with `client-`)

2. **Update the Source Code:**
   - Open `src/fme/fmeClient.ts`
   - Replace `YOUR_PUBLIC_CLIENT_SDK_KEY_HERE` with the actual key:
     ```typescript
     const DEFAULT_FME_SDK_KEY = 'client-abc123...';
     ```

3. **Commit and Deploy:**
   ```bash
   npm run compile
   npm run package
   ```

### Security Note

**Client SDK keys are safe to embed in public code.** They are designed for client-side applications (web, mobile, desktop) and only allow:
- ✅ Reading feature flag states
- ✅ Sending impression events
- ❌ Modifying flags
- ❌ Creating/deleting flags
- ❌ Admin operations

### Feature Flags to Configure

Create these feature flags in your Harness FME environment:

| Flag Name | Type | Variations | Purpose |
|-----------|------|------------|---------|
| `vscode-log-experience` | String | `inline`, `expanded`, `drawer` | Controls log viewer UX mode |

### Testing the Default Key

1. Remove any custom `harness.fmeSdkKey` from VS Code settings
2. Remove `HARNESS_FME_SDK_KEY` from environment variables
3. Press F5 to run the extension
4. Check console logs for:
   ```
   [FME] 🚀 Initializing Harness FME (Split.io) SDK
   [FME]    Using default embedded SDK key
   ```

### User Override

End users can still override the default key in their VS Code settings if they want to test with their own FME environment:
```json
{
  "harness.fmeSdkKey": "client-custom-key-here"
}
```
