# How to Run Mobile App on Your Phone 📱

There are 3 ways to get the app on your phone:

## Option 1: Using Expo Go App (Easiest) ⭐ RECOMMENDED

### Requirements
- iPhone or Android phone
- Expo Go app installed (free from App Store/Play Store)
- WiFi connection

### Steps

#### 1. Install Expo Go on Your Phone
- **iPhone**: Search "Expo Go" in App Store → Install
- **Android**: Search "Expo Go" in Google Play → Install

#### 2. Start the Development Server

On your PC, in terminal:

```bash
cd c:\Users\rishi\Desktop\SA\MoM\app\mobile
npm start
```

You'll see:
```
› Press a to open Android
› Press i to open iOS
› Press w to open web
› Press r to reload the app
› Press m to toggle menu
› Press q to quit

Expo QR code:
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
█ ░░░░░ █▀█▄█ ░░░░░ █
█ █████ █▄█▄█ █████ █
...
```

#### 3. Open App on Your Phone

**On iPhone:**
- Open Camera app
- Point at QR code on screen
- Tap notification that appears
- Opens in Expo Go

**On Android:**
- Open Expo Go app
- Tap "Scan QR Code" button
- Point at QR code on screen
- App starts loading

#### 4. Wait for App to Load
- First time takes 30-60 seconds
- Shows "Downloading JavaScript bundle"
- Then you see login page 🎉

### Advantages
- ✅ Easy setup
- ✅ Hot reload (changes instant)
- ✅ Works over WiFi
- ✅ No complicated build process

### Disadvantages
- ❌ Expo Go must be installed
- ❌ Slower than native
- ❌ Can't install on someone else's phone easily

---

## Option 2: Build APK (Android Only)

### Requirements
- Android phone
- USB cable
- Enable USB Debugging on phone

### Steps

#### 1. Build APK on Your PC

```bash
cd c:\Users\rishi\Desktop\SA\MoM\app\mobile
npm install -g eas-cli
eas login
eas build --platform android --local
```

Takes 10-15 minutes. Creates `app-release.apk` file.

#### 2. Transfer APK to Phone

```bash
# Connect phone with USB cable
adb devices  # Should show your phone
adb push ./app-release.apk /sdcard/Download/
```

#### 3. Install on Phone

- Open File Manager on phone
- Navigate to Downloads
- Tap `app-release.apk`
- Tap "Install"
- Done! App appears on home screen

### Advantages
- ✅ Standalone (works without Expo Go)
- ✅ Can share with others
- ✅ Better performance
- ✅ Appears as normal app on home screen

### Disadvantages
- ❌ Takes 10-15 minutes to build
- ❌ Need USB cable
- ❌ Need ADB (Android Debug Bridge) installed
- ❌ Android only (no iOS)

---

## Option 3: Build IPA (iOS Only, macOS Required)

### Requirements
- iPhone
- macOS computer
- Xcode installed
- Apple Developer Account

### Steps (Complex - similar to APK but for iOS)

Not recommended for quick testing. Use Option 1 instead.

---

## 🎯 QUICK START (Recommended)

```bash
# 1. Install Expo Go on your phone from App Store/Play Store

# 2. Make sure backend is running on your PC:
cd c:\Users\rishi\Desktop\SA\MoM\app\backend
npm run dev

# 3. Create .env file in mobile folder:
# Create file: mobile/.env
# Add this line:
EXPO_PUBLIC_API_URL=http://192.168.X.X:3000/api/v1
# Replace 192.168.X.X with your PC's local IP

# 4. Start mobile app:
cd c:\Users\rishi\Desktop\SA\MoM\app\mobile
npm start

# 5. Scan QR code with phone camera (iPhone) or Expo Go app (Android)

# 6. Login with test credentials from your database
```

---

## 🔧 Finding Your PC's IP Address

The mobile app needs to connect to backend on your PC.

### On Windows

Open PowerShell:

```powershell
ipconfig
```

Look for:
```
IPv4 Address. . . . . . . . . . : 192.168.X.X
```

Example: `192.168.1.100`

### On Phone's Same WiFi Network

1. PC and phone must be on **same WiFi network**
2. Replace `.env` URL:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api/v1
   ```

3. Restart mobile app after changing `.env`

---

## ✅ Testing Checklist

After app loads on phone:

- [ ] Phone shows login page
- [ ] Backend is running on PC (`npm run dev` in backend/)
- [ ] Phone is on same WiFi as PC
- [ ] `.env` has correct IP address
- [ ] Can type email
- [ ] Can type password
- [ ] Click "Sign in"
- [ ] Loading spinner appears
- [ ] Login succeeds and shows Dashboard ✅

---

## 🐛 Troubleshooting

### "App won't load"
- Check backend is running: `cd backend && npm run dev`
- Check WiFi connection
- Try scanner QR code again

### "Cannot connect to server" (API error)
- ✅ Check `.env` file exists with correct IP
- ✅ Use machine IP (not localhost)
- ✅ Both on same WiFi network
- ✅ Check firewall isn't blocking port 3000

### "Blank screen / Expo Go not opening"
- iPhone: Tap notification from camera
- Android: App should open automatically
- Try again if fails first time

### "Login fails with error message"
- Check backend logs for error
- Test user exists in database?
- Correct password?

### "Changes not showing after I edited code"
- Press `r` in terminal to reload
- Or restart app on phone

---

## 📋 Summary

| Method | Time | Effort | Share | Notes |
|--------|------|--------|-------|-------|
| **Expo Go** | Instant | Easy ⭐ | Share QR | Perfect for testing |
| **APK** | 15 min | Medium | Send file | Android only |
| **IPA** | 30 min | Hard | App Store | iOS only, need Mac |

---

## 🚀 Next: Build for App Store

When ready to release:

1. Android → Google Play Store (APK/Bundle)
2. iOS → Apple App Store (IPA)

But that's for later! For now, use **Expo Go** for instant testing. ✨
