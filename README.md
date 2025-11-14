# WorkOS Authentication - React Native Expo App

A production-ready React Native application demonstrating enterprise-grade authentication using **WorkOS** with **OAuth 2.0 + PKCE** (Proof Key for Code Exchange). This implementation follows security best practices and provides a clean, modular architecture suitable for scaling.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [User Flow](#user-flow)
- [Architecture](#architecture)
- [Technical Decisions](#technical-decisions)
- [Security Implementation](#security-implementation)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [How It Works Under the Hood](#how-it-works-under-the-hood)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This application demonstrates how to implement secure, enterprise-grade authentication in a React Native mobile app using WorkOS as the identity provider. The implementation uses OAuth 2.0 with PKCE, which is the industry standard for mobile applications.

### Why WorkOS?

- **Enterprise SSO**: Support for SAML, Google OAuth, Microsoft Azure, Okta, and more
- **User Management**: Built-in user directory and management
- **Organizations**: Multi-tenant support out of the box
- **Security**: Enterprise-grade security and compliance
- **Developer Experience**: Clean APIs and excellent documentation

---

## ✨ Features

### Authentication Features
- ✅ OAuth 2.0 with PKCE flow
- ✅ Secure token storage using platform-specific encrypted storage
- ✅ Automatic token refresh
- ✅ Session persistence across app restarts
- ✅ Secure logout with token cleanup

### User Experience
- ✅ Protected routes (authentication required)
- ✅ Automatic session restoration
- ✅ Loading states and error handling
- ✅ Clean, intuitive UI
- ✅ Profile management

### Code Quality
- ✅ TypeScript for type safety
- ✅ Modular, maintainable architecture
- ✅ Comprehensive inline documentation
- ✅ Error handling with custom error types
- ✅ No hardcoded credentials

---

## 👤 User Flow

### First-Time User (Login)

```
1. User opens app
   ↓
2. App checks for existing session
   ↓
3. No session found → Show Login Screen
   ↓
4. User taps "Sign in with WorkOS"
   ↓
5. App generates PKCE code verifier and challenge
   ↓
6. Browser opens with WorkOS login page
   ↓
7. User authenticates with their identity provider
   (Google, Microsoft, SAML, etc.)
   ↓
8. WorkOS redirects back to app with authorization code
   ↓
9. App exchanges code + verifier for access tokens
   ↓
10. Tokens stored securely in encrypted storage
    ↓
11. User profile fetched and displayed
    ↓
12. User redirected to Home Screen
```

### Returning User (Session Restoration)

```
1. User opens app
   ↓
2. App checks encrypted storage for tokens
   ↓
3. Tokens found → Check expiration
   ↓
4. If expired and refresh token exists:
   - Request new access token
   - Store new tokens
   ↓
5. Fetch user profile with valid token
   ↓
6. Restore session → Show Home Screen

(All happens automatically in 1-2 seconds)
```

### Token Refresh (Background)

```
1. App detects token expiring soon (< 5 minutes)
   ↓
2. Automatically use refresh token
   ↓
3. Get new access token from WorkOS
   ↓
4. Update encrypted storage
   ↓
5. Continue seamlessly (user doesn't notice)
```

### Logout Flow

```
1. User taps Logout button
   ↓
2. Confirmation dialog shown
   ↓
3. User confirms
   ↓
4. All tokens cleared from encrypted storage
   ↓
5. Auth state reset
   ↓
6. Navigation redirected to Login Screen
```

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                    App.tsx                      │
│              (Root Component)                   │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              AuthProvider                       │
│        (Authentication Context)                 │
│   • Manages global auth state                   │
│   • Provides auth methods to children           │
│   • Handles session restoration                 │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│            RootNavigator                        │
│         (Navigation Manager)                    │
│   • Routes based on auth state                  │
│   • Protected routes                            │
│   • Smooth transitions                          │
└───┬─────────────────────────────────────────┬───┘
    │                                         │
    │ Not Authenticated                       │ Authenticated
    │                                         │
┌───▼──────────┐                    ┌─────────▼────────┐
│ LoginScreen  │                    │   HomeScreen     │
└──────────────┘                    │   ProfileScreen  │
                                    └──────────────────┘
```

### Data Flow

```
┌──────────────┐
│   UI Layer   │  (Screens & Components)
│   Screens    │  - Access auth via useAuth()
└──────┬───────┘  - Display user data
       │          - Trigger auth actions
       │
┌──────▼───────┐
│  Hook Layer  │  (Custom Hooks)
│   useAuth    │  - useAuth()
└──────┬───────┘  - useIsAuthenticated()
       │          - useCurrentUser()
       │
┌──────▼───────┐
│Context Layer │  (State Management)
│ AuthContext  │  - Global auth state
└──────┬───────┘  - Auth methods
       │          - Session restoration
       │
┌──────▼───────┐
│Service Layer │  (Business Logic)
│  authService │  - OAuth flow
│tokenStorage  │  - Token management
└──────┬───────┘  - API calls
       │
┌──────▼───────┐
│ Storage/API  │  (External)
│SecureStore   │  - Encrypted storage
│WorkOS API    │  - Authentication server
└──────────────┘
```

---

## 🎯 Technical Decisions

### 1. OAuth 2.0 with PKCE (Not Implicit Flow)

**Decision**: Use Authorization Code Flow with PKCE

**Rationale**:
- **More Secure**: PKCE prevents authorization code interception attacks
- **No Client Secret**: Mobile apps can't securely store secrets
- **Industry Standard**: Recommended by OAuth 2.0 best practices for mobile
- **Unique Per Request**: Each auth request has a unique code verifier

**How PKCE Works**:
```
1. Generate random code verifier (43-128 characters)
2. Create code challenge: SHA256(code_verifier)
3. Send challenge to auth server
4. Receive authorization code
5. Exchange code + verifier for tokens
   (attacker can't use code without verifier)
```

### 2. Secure Token Storage (expo-secure-store)

**Decision**: Use Expo SecureStore instead of AsyncStorage

**Rationale**:
- **Encryption**: Tokens encrypted at rest
- **Platform Security**:
  - iOS: Uses Keychain (hardware-backed on modern devices)
  - Android: Uses EncryptedSharedPreferences + Android Keystore
- **Automatic**: No manual encryption needed
- **Secure Against**: Rooted/jailbroken device attacks (to some extent)

**Alternative Considered**:
- AsyncStorage: ❌ Not encrypted, vulnerable to attacks
- react-native-keychain: ✅ Also good, but SecureStore is Expo-native

### 3. Context API (Not Redux/MobX)

**Decision**: Use React Context for state management

**Rationale**:
- **Simplicity**: Auth state is relatively simple
- **Built-in**: No external dependencies
- **Performance**: Auth state doesn't change frequently
- **Type-Safe**: Works well with TypeScript

**When to Consider Redux**:
- Multiple global state domains
- Complex state interactions
- Time-travel debugging needed
- Large team with Redux experience

### 4. TypeScript (Not JavaScript)

**Decision**: Full TypeScript implementation

**Rationale**:
- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Autocomplete, refactoring
- **Self-Documenting**: Types serve as documentation
- **Maintainability**: Easier to refactor with confidence

### 5. Modular Architecture (Feature-Based)

**Decision**: Organize by feature/domain, not by file type

**Rationale**:
```
✅ Good: src/services/auth/authService.ts
❌ Bad:  src/services/authService.ts

✅ Good: src/types/auth.types.ts
❌ Bad:  src/types.ts
```

**Benefits**:
- Easy to find related code
- Clear boundaries between features
- Easier to test in isolation
- Scales better as app grows

### 6. Automatic Token Refresh (Proactive)

**Decision**: Refresh tokens 5 minutes before expiration

**Rationale**:
- **Better UX**: User never sees expired token errors
- **Reliability**: Account for clock skew and network delays
- **Transparent**: Happens in background

**Implementation**:
```typescript
// Refresh 300 seconds (5 minutes) before expiration
const REFRESH_BUFFER = 300;

if (timeUntilExpiration <= REFRESH_BUFFER && refreshToken) {
  await refreshAccessToken(refreshToken);
}
```

### 7. Error Handling Strategy

**Decision**: Custom error types with context

**Rationale**:
- **User-Friendly**: Different messages for different errors
- **Debugging**: Original error preserved for logging
- **Type-Safe**: TypeScript enums for error types

**Error Types**:
```typescript
enum AuthErrorType {
  NETWORK_ERROR      // Show "Check connection"
  USER_CANCELLED     // Silent, don't alert
  TOKEN_EXPIRED      // Auto-refresh or re-login
  REFRESH_FAILED     // Force re-login
  INVALID_CREDENTIALS // "Authentication failed"
  UNKNOWN_ERROR      // Generic message
}
```

### 8. Navigation Library (React Navigation)

**Decision**: Use React Navigation v6

**Rationale**:
- **Most Popular**: Community standard
- **TypeScript Support**: Excellent type safety
- **Flexible**: Easy to implement protected routes
- **Native Feel**: Uses native navigation components

### 9. Session Restoration on App Start

**Decision**: Always attempt session restoration

**Rationale**:
- **Better UX**: User stays logged in
- **Fast**: 1-2 second check on startup
- **Secure**: Validates token before restoring

**Flow**:
```typescript
useEffect(() => {
  async function restoreSession() {
    const tokens = await getTokens();
    if (tokens && !isExpired(tokens)) {
      setUser(await fetchUserInfo(tokens));
    }
  }
  restoreSession();
}, []);
```

---

## 🔒 Security Implementation

### 1. PKCE Flow Implementation

```typescript
// 1. Generate code verifier (random string)
const codeVerifier = generateRandomString(128);

// 2. Create code challenge (SHA-256 hash, base64 encoded)
const codeChallenge = base64url(sha256(codeVerifier));

// 3. Send to auth endpoint with challenge
GET https://api.workos.com/sso/authorize
  ?client_id=client_xxx
  &redirect_uri=myapp://callback
  &code_challenge=CHALLENGE_HERE
  &code_challenge_method=S256

// 4. User authenticates, receives code
myapp://callback?code=AUTH_CODE

// 5. Exchange code + verifier for tokens
POST https://api.workos.com/sso/token
  client_id=client_xxx
  &code=AUTH_CODE
  &code_verifier=ORIGINAL_VERIFIER
```

### 2. Token Storage Security

```typescript
// iOS: Stored in Keychain
// - Encrypted by OS
// - Survives app uninstall (optional)
// - Protected by device passcode/biometrics

// Android: EncryptedSharedPreferences
// - AES-256 encryption
// - Keys in Android Keystore (hardware-backed)
// - Encrypted even on rooted devices
```

### 3. No Secrets in Code

```typescript
// ❌ NEVER do this
const CLIENT_SECRET = "sk_live_xxxx";

// ✅ Always do this
const CLIENT_ID = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID;

// Why: Mobile apps are decompilable
// Anyone can extract hardcoded strings
```

### 4. Token Expiration Handling

```typescript
// Token refresh strategy
const REFRESH_BUFFER = 300; // 5 minutes

// Refresh proactively
if (expiresIn <= REFRESH_BUFFER) {
  await refreshToken();
}

// Never use expired tokens
// Always check before API calls
```

### 5. Secure Redirect URIs

```typescript
// Development: Expo scheme
redirectUri: "exp://localhost:8081"

// Production: Custom scheme or Universal Links
redirectUri: "myapp://oauth/callback"  // Custom scheme
redirectUri: "https://myapp.com/auth"  // Universal Link

// Must match exactly in WorkOS Dashboard
// Prevents redirect hijacking attacks
```

### 6. State Parameter (CSRF Protection)

While not explicitly shown in this implementation, production apps should add:

```typescript
// Generate random state
const state = generateRandomString(32);

// Send to auth endpoint
authUrl += `&state=${state}`;

// Verify on callback
if (receivedState !== storedState) {
  throw new Error("CSRF attack detected");
}
```

---

## 📁 Project Structure

```
expo-auth-poc/
├── src/
│   ├── config/
│   │   └── environment.ts          # Environment configuration
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   ├── authService.ts      # OAuth flow, token exchange
│   │   │   └── tokenStorage.ts     # Secure token storage
│   │   └── api/                    # Future: API client services
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx         # Global auth state & provider
│   │
│   ├── hooks/
│   │   └── useAuth.ts              # Auth hooks for components
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx         # Login/landing screen
│   │   ├── HomeScreen.tsx          # Main authenticated screen
│   │   └── ProfileScreen.tsx       # User profile screen
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx  # Route protection wrapper
│   │   └── common/
│   │       └── LoadingSpinner.tsx  # Reusable loading component
│   │
│   ├── navigation/
│   │   └── RootNavigator.tsx       # Navigation configuration
│   │
│   └── types/
│       └── auth.types.ts           # TypeScript type definitions
│
├── App.tsx                         # Root component
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript configuration
├── .env.example                    # Environment variables template
└── .gitignore                      # Git ignore rules
```

### Key Files Explained

#### `src/services/auth/authService.ts`
Core authentication logic. Handles:
- OAuth authorization flow
- Token exchange
- Token refresh
- User info fetching
- Session restoration

#### `src/services/auth/tokenStorage.ts`
Secure token storage using expo-secure-store. Provides:
- Encrypted token storage
- Token retrieval
- Expiration checking
- Token cleanup

#### `src/contexts/AuthContext.tsx`
React Context that:
- Manages global auth state
- Provides auth methods to all components
- Handles session restoration on app start
- Manages loading and error states

#### `src/hooks/useAuth.ts`
Custom React hooks:
- `useAuth()` - Full auth state and methods
- `useIsAuthenticated()` - Just auth status
- `useCurrentUser()` - Just user object

#### `src/navigation/RootNavigator.tsx`
Navigation logic:
- Conditional rendering based on auth state
- Protected routes
- Smooth transitions

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- WorkOS account ([sign up here](https://workos.com))
- iOS Simulator (Mac) or Android Emulator

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd expo-auth-poc

# Install dependencies
npm install
```

### Step 2: WorkOS Configuration

1. **Create WorkOS Account**
   - Go to [https://workos.com](https://workos.com)
   - Sign up for a free account

2. **Create an Application**
   - Navigate to Dashboard
   - Create a new application
   - Note your **Client ID**

3. **Configure Redirect URI**
   - In your WorkOS application settings
   - Add redirect URI: `exp://localhost:8081`
   - For production, add your app's custom scheme

4. **Set Up Identity Provider** (Optional for testing)
   - Add a connection (Google OAuth, Microsoft, etc.)
   - Or use WorkOS's test mode

### Step 3: Environment Configuration

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values
EXPO_PUBLIC_WORKOS_CLIENT_ID=client_01XXXXXX
EXPO_PUBLIC_WORKOS_REDIRECT_URI=exp://localhost:8081
```

### Step 4: Run the App

```bash
# Start Expo development server
npm start

# Or run directly on platform
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser (limited functionality)
```

### Step 5: Test Authentication

1. App loads → See Login Screen
2. Tap "Sign in with WorkOS"
3. Browser opens with WorkOS login
4. Sign in with configured provider
5. Redirect back to app
6. See Home Screen with your profile

---

## ⚙️ How It Works Under the Hood

### 1. App Initialization

```typescript
// App.tsx
<AuthProvider>  {/* Sets up auth context */}
  <RootNavigator />  {/* Manages navigation */}
</AuthProvider>

// AuthProvider immediately runs:
useEffect(() => {
  restoreSession();  // Check for existing tokens
}, []);
```

### 2. Session Restoration

```typescript
// src/services/auth/authService.ts
export const restoreSession = async () => {
  // 1. Get tokens from SecureStore
  const tokens = await getTokens();

  if (!tokens) return null;  // No session

  // 2. Check if expired
  const expired = await isTokenExpired();

  if (expired && tokens.refreshToken) {
    // 3. Try to refresh
    const newTokens = await refreshAccessToken(tokens.refreshToken);
    const user = await fetchUserInfo(newTokens.accessToken);
    return { tokens: newTokens, user };
  }

  if (expired) {
    // No refresh token, session lost
    await clearTokens();
    return null;
  }

  // 4. Token still valid
  const user = await fetchUserInfo(tokens.accessToken);
  return { tokens, user };
};
```

### 3. Login Flow (OAuth PKCE)

```typescript
// User taps "Sign in"
await login();

// src/services/auth/authService.ts
export const loginWithWorkOS = async () => {
  // 1. Generate PKCE values
  const codeVerifier = generateCodeVerifier();  // Random string
  const codeChallenge = await sha256(codeVerifier);  // SHA-256 hash

  // 2. Create authorization URL
  const authUrl = buildAuthUrl({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: 'openid profile email',
  });

  // 3. Open browser for user authentication
  const result = await promptAsync(authUrl);

  // 4. User authenticates, redirects back with code
  const authCode = result.params.code;

  // 5. Exchange code + verifier for tokens
  const tokens = await exchangeCodeForTokens(authCode, codeVerifier);

  // 6. Store tokens securely
  await storeTokens(tokens);

  // 7. Fetch user info
  const user = await fetchUserInfo(tokens.accessToken);

  return { tokens, user };
};
```

### 4. Token Exchange (Code → Tokens)

```typescript
const exchangeCodeForTokens = async (code, codeVerifier) => {
  // POST to WorkOS token endpoint
  const response = await fetch('https://api.workos.com/sso/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code: code,
      code_verifier: codeVerifier,  // Proves we initiated the request
      redirect_uri: REDIRECT_URI,
    }),
  });

  const data = await response.json();
  // Returns: { access_token, refresh_token, id_token, expires_in }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresIn: data.expires_in,  // Usually 3600 (1 hour)
    tokenType: data.token_type,  // "Bearer"
  };
};
```

### 5. Token Storage (Encrypted)

```typescript
// src/services/auth/tokenStorage.ts
export const storeTokens = async (tokens) => {
  // Calculate absolute expiration time
  const expiresAt = Date.now() + (tokens.expiresIn * 1000);

  // Store each value separately in SecureStore
  // iOS: Goes to Keychain (encrypted by OS)
  // Android: EncryptedSharedPreferences (AES-256)
  await Promise.all([
    SecureStore.setItemAsync('access_token', tokens.accessToken),
    SecureStore.setItemAsync('refresh_token', tokens.refreshToken),
    SecureStore.setItemAsync('expires_at', expiresAt.toString()),
    // ... other tokens
  ]);
};
```

### 6. Fetching User Info

```typescript
export const fetchUserInfo = async (accessToken) => {
  // Call WorkOS UserInfo endpoint
  const response = await fetch('https://api.workos.com/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const userInfo = await response.json();
  // Returns OpenID Connect standard claims:
  // {
  //   sub: "user_01XXXXXX",           // User ID
  //   email: "user@example.com",
  //   given_name: "John",
  //   family_name: "Doe",
  //   picture: "https://...",
  //   organization_id: "org_01XXXXXX"
  // }

  return {
    id: userInfo.sub,
    email: userInfo.email,
    firstName: userInfo.given_name,
    lastName: userInfo.family_name,
    profilePictureUrl: userInfo.picture,
    organizationId: userInfo.organization_id,
  };
};
```

### 7. Token Refresh (Automatic)

```typescript
// Triggered automatically when token is about to expire

export const refreshAccessToken = async (refreshToken) => {
  // POST to token endpoint with refresh grant
  const response = await fetch('https://api.workos.com/sso/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  // Returns new access_token, possibly new refresh_token

  const newTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,  // Reuse if not provided
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };

  // Store new tokens
  await storeTokens(newTokens);

  return newTokens;
};
```

### 8. Protected Routes (Navigation)

```typescript
// src/navigation/RootNavigator.tsx
export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          // Show login for unauthenticated users
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // Show app for authenticated users
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### 9. Using Auth in Components

```typescript
// Any component can access auth state
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <Button onPress={login}>Login</Button>;
  }

  return (
    <View>
      <Text>Welcome, {user.firstName}!</Text>
      <Button onPress={logout}>Logout</Button>
    </View>
  );
}
```

---

## 📚 API Reference

### AuthContext

```typescript
interface AuthContextType {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Methods
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}
```

### useAuth Hook

```typescript
const {
  user,              // Current user object or null
  tokens,            // Current tokens or null
  isLoading,         // Loading state
  isAuthenticated,   // Boolean auth status
  error,             // Error message or null
  login,             // Initiate login flow
  logout,            // Logout and clear tokens
  refreshToken,      // Manually refresh token
  clearError,        // Clear error message
} = useAuth();
```

### authService Methods

```typescript
// Initiate login
loginWithWorkOS(): Promise<{ tokens, user }>

// Logout
logout(): Promise<void>

// Restore session
restoreSession(): Promise<{ tokens, user } | null>

// Refresh token
refreshAccessToken(refreshToken: string): Promise<AuthTokens>

// Fetch user info
fetchUserInfo(accessToken: string): Promise<User>

// Get valid access token (with auto-refresh)
getValidAccessToken(): Promise<string | null>
```

### tokenStorage Methods

```typescript
// Store tokens
storeTokens(tokens: AuthTokens): Promise<void>

// Get tokens
getTokens(): Promise<AuthTokens | null>

// Check expiration
isTokenExpired(bufferSeconds?: number): Promise<boolean>

// Clear all tokens
clearTokens(): Promise<void>

// Get valid access token
getValidAccessToken(): Promise<string | null>
```

---

## 🐛 Troubleshooting

### "Environment variable not configured"

**Cause**: Missing or invalid `.env` file

**Solution**:
```bash
# Create .env from template
cp .env.example .env

# Edit with your WorkOS credentials
nano .env
```

### "Invalid redirect URI"

**Cause**: Redirect URI mismatch between app and WorkOS Dashboard

**Solution**:
1. Check your `.env` file: `EXPO_PUBLIC_WORKOS_REDIRECT_URI`
2. Check WorkOS Dashboard → Your App → Redirect URIs
3. They must match **exactly** (including scheme and path)

For development:
- Use: `exp://localhost:8081`
- Or: `exp://192.168.1.x:8081` (your local IP)

### "User cancelled authentication"

**Cause**: User closed the browser before completing auth

**Solution**: This is normal behavior. User can try again.

### "Token expired" or session lost

**Cause**:
- App was closed for extended period
- Refresh token expired
- Manual token deletion

**Solution**: User needs to log in again. This is expected behavior.

### iOS Simulator: Browser doesn't redirect back

**Cause**: iOS Simulator WebBrowser quirk

**Solution**:
- Try on physical device
- Or use iOS Simulator → Features → Shake Gesture → Return to app

### Android: "No activity found to handle intent"

**Cause**: Redirect URI scheme not registered

**Solution**: For custom schemes, update `app.json`:
```json
{
  "expo": {
    "scheme": "myapp"
  }
}
```

### Network request failed

**Cause**:
- No internet connection
- WorkOS API down
- Firewall blocking requests

**Solution**:
- Check internet connection
- Check WorkOS status: https://status.workos.com
- Try different network

---

## 🚀 Production Considerations

### Before Going to Production

1. **Environment Variables**
   - Use environment-specific `.env` files
   - Never commit production credentials
   - Use a secrets management service

2. **Redirect URIs**
   - Register production redirect URI in WorkOS
   - Use custom scheme: `yourapp://oauth/callback`
   - Or universal links: `https://yourapp.com/auth`

3. **Error Monitoring**
   - Add Sentry or similar
   - Monitor auth failures
   - Track token refresh failures

4. **Analytics**
   - Track login success/failure
   - Monitor session restoration
   - Track logout events

5. **Testing**
   - Test on real devices (iOS and Android)
   - Test with poor network conditions
   - Test token expiration and refresh
   - Test app restart scenarios

6. **Security Audit**
   - Review token storage
   - Verify no secrets in code
   - Test on rooted/jailbroken devices
   - Implement certificate pinning (optional)

7. **App Store Requirements**
   - Add privacy policy
   - Declare data collection
   - Add OAuth terms

---

## 📄 License

MIT

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

---

## 📞 Support

- WorkOS Docs: https://workos.com/docs
- WorkOS Support: support@workos.com
- Expo Docs: https://docs.expo.dev

---

**Built with ❤️ using React Native, Expo, and WorkOS**
