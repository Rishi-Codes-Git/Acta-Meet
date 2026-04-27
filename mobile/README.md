# Acta Mobile App

React Native mobile app for Acta - Meeting Intelligence platform using Expo.

## Features

- 🔐 **Authentication** - Email/password login with JWT tokens
- 📱 **Dashboard** - Quick overview of meetings and action items
- ✅ **Action Items** - Manage and track tasks
- 👥 **Teams** - Team management and communication
- 🎨 **Consistent Design** - Matches web app styling and branding

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing (bottom tabs + stack)
- **Zustand** for state management
- **React Hook Form** + **Zod** for forms and validation
- **Axios** for HTTP requests
- **Expo Secure Store** for secure token storage

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
cd mobile
npm install
```

### Environment Variables

Create a `.env` file (or copy from `.env.example`):

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

For development on physical devices, use your machine's local IP instead:

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api/v1
```

## Running the App

### Development

```bash
# Start Expo server
npm start

# Then press:
# a - Android emulator
# i - iOS simulator
# w - Web browser
```

### Build for Specific Platform

```bash
# Android
npm run android

# iOS (requires macOS)
npm run ios

# Web
npm run web
```

## Project Structure

```
mobile/
├── app/
│   ├── screens/           # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── ActionItemsScreen.tsx
│   │   └── TeamsScreen.tsx
│   └── App.tsx           # Root navigation setup
├── src/
│   ├── services/
│   │   └── api.ts        # API client with interceptors
│   ├── store/
│   │   └── authStore.ts  # Zustand auth store
│   ├── types/
│   │   └── theme.ts      # Colors, fonts, spacing
│   └── components/       # Reusable components
├── assets/               # Images, fonts, etc.
├── app.json              # Expo configuration
└── tsconfig.json         # TypeScript config
```

## Database Connection

The mobile app connects to the **same PostgreSQL backend** via REST API:

1. **No direct database connection** - All data operations go through the backend API
2. **JWT authentication** - Secure token-based auth with backend
3. **Same endpoints** as web app - `/api/v1/auth/*`, `/api/v1/dashboard/*`, etc.
4. **Secure storage** - JWT tokens stored in Expo Secure Store (encrypted)

## API Integration

### Authentication Flow

```
1. User enters email/password in LoginScreen
2. API call to POST /api/v1/auth/login
3. Backend validates and returns JWT token + user data
4. Token stored securely in Expo Secure Store
5. All subsequent requests include Authorization header
6. If 401 response, token cleared and user redirected to login
```

### Available Endpoints

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /dashboard/my` - Dashboard data
- `GET /action-items/my` - User's action items
- `PATCH /action-items/:id/status` - Update action item status
- `GET /teams` - Teams list

## Styling

The app uses a **consistent design system** matching the web app:

- **Primary Color**: #42A090 (Teal)
- **Typography**: Plus Jakarta Sans (system fallback)
- **Spacing**: 4px-40px scale
- **Border Radius**: 8px-20px
- **Shadows**: Subtle elevation

Colors, fonts, and spacing are centralized in `src/types/theme.ts`.

## State Management

**Zustand Store** (`src/store/authStore.ts`):

```typescript
// In any component:
import { useAuthStore } from '@/store/authStore';

const { user, isLoggedIn, login, logout } = useAuthStore();
```

Features:
- Auto token restoration on app startup
- Persistent storage using Expo Secure Store
- Automatic token cleanup on 401 errors
- Simple API - no selectors needed

## Development Tips

1. **Hot Reload** - Automatic on code changes
2. **Logs** - Open Expo console to see console logs
3. **Debug** - Use React DevTools or native debugger
4. **Network** - Use React Native Debugger to inspect HTTP requests
5. **Styling** - Test on both iOS and Android (layouts may differ)

## Next Steps

- [ ] Complete Dashboard page with meeting overview
- [ ] Implement Action Items CRUD operations
- [ ] Add Teams/Chat functionality
- [ ] Implement real-time notifications
- [ ] Add dark mode support
- [ ] Build and publish to app stores

## Support

For issues or questions:
1. Check backend `.env` configuration
2. Verify API URL in mobile `.env`
3. Check network connectivity
4. Review console logs in Expo

---

**Version**: 1.0.0  
**Last Updated**: April 2026
