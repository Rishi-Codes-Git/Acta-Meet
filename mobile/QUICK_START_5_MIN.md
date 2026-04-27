# 📱 QUICK GUIDE: Run on Your Phone in 5 Minutes

## Step-by-Step Instructions

### ✅ Step 1: Install Expo Go App (2 minutes)

**On your phone:**

**iPhone:**
- Open App Store
- Search: "Expo Go"
- Tap "Get" → Install

**Android:**
- Open Google Play Store
- Search: "Expo Go"
- Tap "Install"

---

### ✅ Step 2: Check Backend is Running (1 minute)

**On your PC (PowerShell):**

```powershell
cd c:\Users\rishi\Desktop\SA\MoM\app\backend
npm run dev
```

Wait for message:
```
Server running on http://localhost:3000
```

Keep this window OPEN ⬅️ Don't close it!

---

### ✅ Step 3: Find Your PC's IP Address (1 minute)

**On your PC (PowerShell):**

```powershell
ipconfig
```

Look for:
```
IPv4 Address. . . . . . . . . . : 192.168.X.X
```

**Copy this number** (e.g., `192.168.1.100`)

---

### ✅ Step 4: Create .env File (1 minute)

**Create file:** `c:\Users\rishi\Desktop\SA\MoM\app\mobile\.env`

**Add this line:**

```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api/v1
```

Replace `192.168.1.100` with YOUR IP from Step 3.

---

### ✅ Step 5: Start Mobile App (1 minute)

**On your PC (PowerShell, new window):**

```powershell
cd c:\Users\rishi\Desktop\SA\MoM\app\mobile
npm start
```

Wait for message with QR code:
```
› Press a to open Android
› Press i to open iOS
› Press w to open web

Expo QR code:
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
█ ░░░░░ ...
```

---

### ✅ Step 6: Open App on Your Phone (< 1 minute)

#### iPhone:

1. **Open Camera app** (normal camera)
2. **Point at QR code** on PC screen
3. **Tap the notification** that appears
4. Opens in Expo Go 📱

#### Android:

1. **Open Expo Go app** (you installed it in Step 1)
2. **Tap "Scan QR Code"** button at bottom
3. **Point camera at QR code** on PC screen
4. App loads automatically 📱

---

### ✅ Test Login Page Appears

Wait 30-60 seconds...

You should see:

```
📱 Your Phone Screen:

    Acta
Meeting Intelligence


    Welcome back
    Sign in to your account

📧 Email
    [you@company.com]

🔐 Password
    [••••••••]

[   Sign in   ]

Don't have an account? Create account
```

---

## ✅ TEST IT

1. **Enter test email**: `test@example.com` (or any user in your database)
2. **Enter password**: (correct password)
3. **Tap "Sign in"**
4. **Loading spinner** appears
5. **Dashboard** should show ✅

---

## ⚠️ Make Sure

- ✅ PC and phone on **same WiFi network**
- ✅ Backend running on PC (Step 2 window still open)
- ✅ `.env` file created with correct IP
- ✅ Expo Go app installed on phone

---

## 🆘 If It Doesn't Work

### "App won't load"
```
✅ Close and reopen Expo Go
✅ Check PC IP address is correct
✅ Make sure backend is still running
✅ Try again
```

### "Cannot connect to server"
```
✅ Edit .env with correct IP (use ipconfig to check)
✅ Restart app: press 'r' in terminal
✅ Check WiFi - must be SAME network
✅ Check if firewall blocking port 3000
```

### "Login fails / 'Invalid credentials'"
```
✅ Check user exists in database
✅ Check password is correct
✅ Check backend logs for errors
```

---

## 📝 Your Files

After Step 4, you should have:

```
mobile/
├── .env  ← YOU CREATED THIS
├── .env.example
├── app/
│   ├── App.tsx
│   └── screens/
│       ├── LoginScreen.tsx
│       └── ...
└── src/
    ├── services/
    ├── store/
    └── types/
```

---

## ✨ THAT'S IT!

Your mobile app is now running on your phone!

- 🔄 Make code changes and press `r` in terminal to reload
- 📱 Changes appear instantly on phone
- 🔌 Login connects to your real backend

**Enjoy!** 🎉

---

For more details, see: `RUN_ON_PHONE.md`
