# Mobile App Setup & Connection Guide

## 🎯 What We've Built

A **React Native mobile app** (Acta Mobile) that mirrors your web app with:
- ✅ Login page (styled matching web app)
- ✅ Dashboard, Action Items, and Teams pages (placeholders)
- ✅ Bottom tab navigation
- ✅ Zustand state management
- ✅ Secure JWT token storage
- ✅ API integration with your backend

## 🗄️ Database Connection Strategy

**Important**: The mobile app does **NOT connect directly to PostgreSQL**. Instead:

### Architecture
```
React Native App 
    ↓ (HTTP Requests)
Node.js Backend (Express)
    ↓ (Database Queries)
PostgreSQL Database
```

### Flow
1. **Mobile app** sends HTTP requests to `http://backend:3000/api/v1/*`
2. **Backend** validates the request and queries PostgreSQL
3. **Backend** returns JSON response
4. **Mobile app** stores JWT token securely using Expo Secure Store
5. All subsequent requests include the JWT token in Authorization header

### Why This Approach?
- ✅ **Security**: No direct database access from mobile
- ✅ **Consistency**: All data logic in one place (backend)
- ✅ **Offline Support**: Easy to add caching later
- ✅ **Scalability**: Can change database without touching mobile code
- ✅ **Same Database**: Both web and mobile use identical backend/database

## 🚀 How to Connect Mobile App to Your Backend

### Step 1: Update `.env` File

Create `.env` in the `mobile/` directory:

```env
# For local development on your machine:
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1

# For testing on physical device (replace with your machine's IP):
# EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api/v1
```

Find your machine's IP:
```bash
# Windows
ipconfig

# macOS/Linux
ifconfig
```

### Step 2: Start Backend

```bash
cd backend
npm run dev
# Should show: Server running on http://localhost:3000
```

### Step 3: Start Mobile App

```bash
cd mobile
npm start
# Scan QR code with Expo Go app
# Or press 'a' for Android / 'i' for iOS simulator
```

### Step 4: Test Login

Use any user that exists in your PostgreSQL database:
- **Email**: test@example.com
- **Password**: (whatever is in your database)

If you don't have test users, create them via the web app first.

## 📱 API Endpoints Being Used

The mobile app calls these backend endpoints (same as web app):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | Login with email/password |
| `/auth/register` | POST | Create new account |
| `/dashboard/my` | GET | Get dashboard data |
| `/action-items/my` | GET | Get user's action items |
| `/action-items/:id/status` | PATCH | Update action item status |
| `/teams` | GET | Get teams list |

All endpoints require JWT token in header:
```
Authorization: Bearer <JWT_TOKEN>
```

## 🔐 Token Storage

**Secure Store Location**:
- **iOS**: Keychain
- **Android**: Android Keychain / Encrypted SharedPreferences
- **Web**: localStorage (if running on web)

**Token Keys**:
- `auth_token` - JWT token (used in all API requests)
- `auth_user` - User object (JSON string)

**Automatic Cleanup**:
- On 401 response, tokens are deleted automatically
- User redirected to login
- No manual token management needed

## 🛠️ Development Setup

### Requirements
```bash
Node.js 18+
npm or yarn
Expo CLI: npm install -g expo-cli
```

### Installation
```bash
cd mobile
npm install
```

### Run Development
```bash
npm start

# Then choose:
# Press 'a' for Android emulator
# Press 'i' for iOS simulator (macOS only)
# Press 'w' for web browser
# Press 's' to send the app URL via SMS
# Press 'j' to open debugger
# Press 'r' to reload the app
# Press 'm' to toggle menu
```

### Backend Must Be Running
Before testing, ensure backend is running:
```bash
cd backend
npm run dev
# Check: http://localhost:3000/health (if endpoint exists)
```

## 🧪 Testing the Login Flow

1. **Start backend**: `cd backend && npm run dev`
2. **Start mobile**: `cd mobile && npm start`
3. **Test user credentials**: Use any user from your database
4. **Expected flow**:
   - Enter email and password
   - Click "Sign in"
   - Loading spinner appears
   - On success: Redirected to Dashboard
   - On failure: Alert with error message

## 📝 Project Structure

```
mobile/
├── app/
│   ├── App.tsx              ← Root navigation
│   └── screens/             ← Screen components
│       ├── LoginScreen.tsx
│       ├── DashboardScreen.tsx
│       ├── ActionItemsScreen.tsx
│       └── TeamsScreen.tsx
├── src/
│   ├── services/
│   │   └── api.ts           ← API client with Axios
│   ├── store/
│   │   └── authStore.ts     ← Zustand auth store
│   ├── types/
│   │   └── theme.ts         ← Colors, fonts, spacing
│   └── components/          ← Reusable components
├── .env                     ← Your config (don't commit)
├── .env.example             ← Template
├── package.json
├── tsconfig.json
└── README.md
```

## 🎨 Styling

All colors and design tokens are centralized:

**File**: `src/types/theme.ts`

```typescript
export const COLORS = {
  primary: '#42A090',      // Teal - matches web app
  primaryDark: '#389080',
  // ... other colors
};

export const FONTS = {
  sizes: { xs: 12, sm: 14, base: 16, lg: 18, ... },
  weights: { regular: 400, semibold: 600, bold: 700, ... },
};

export const SPACING = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, ...
};
```

Change styling globally from one place!

## 🔄 State Management (Zustand)

**Auth Store** (`src/store/authStore.ts`):

```typescript
import { useAuthStore } from '@/store/authStore';

// In any component:
function MyComponent() {
  const { user, isLoggedIn, login, logout } = useAuthStore();
  
  return (
    <>
      {isLoggedIn && <p>Welcome, {user?.name}</p>}
    </>
  );
}
```

Features:
- Auto-restore token on app launch
- Persistent storage (survives app restart)
- Clean API (no selectors needed)
- Global state accessible anywhere

## ⚠️ Common Issues

### "Cannot connect to server"
- ✅ Check backend is running: `npm run dev` in `backend/`
- ✅ Check `.env` API URL is correct
- ✅ On physical device: use local IP instead of `localhost`

### "Invalid token" or "401 Unauthorized"
- ✅ User not in database - create via web app first
- ✅ Wrong password
- ✅ Backend JWT_SECRET mismatch

### "Empty screens" (no data showing)
- ✅ Dashboard/ActionItems are placeholders - update the screens
- ✅ Check network tab in debugger for API errors

### Module import errors
- ✅ Run `npm install` again
- ✅ Clear cache: `npm start -- --clear`
- ✅ Check path aliases in `tsconfig.json`

## 📦 Next Steps

### Phase 1 (Done ✅)
- ✅ React Native setup with Expo
- ✅ Login page with API integration
- ✅ Navigation structure (tabs + stack)
- ✅ State management (Zustand)
- ✅ Theme system

### Phase 2 (Next)
- Dashboard page (show meetings, action items count)
- Action Items page (list, mark complete, filter)
- Teams page (list, chat UI)
- Logout button
- User profile menu

### Phase 3 (Future)
- Real-time notifications
- Offline support with local caching
- Dark mode
- Deep linking
- Push notifications

## 🔗 Quick Links

- **Mobile Repo**: `mobile/`
- **Backend Repo**: `backend/`
- **Frontend Repo**: `frontend/`
- **Database**: PostgreSQL (port 5432)
- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev

## 📞 Support

If mobile app can't connect:

1. Check backend is running: `cd backend && npm run dev`
2. Test API manually: `curl http://localhost:3000/api/v1/auth/login -X POST`
3. Check `.env` file exists and API URL is correct
4. On device: use machine IP instead of localhost
5. Check firewall isn't blocking port 3000

---

✨ **Your mobile app is ready!** The login page is fully designed and styled to match your web app. 

**Next**: Connect it to your backend, test the login flow, then build out the Dashboard, Action Items, and Teams pages.
