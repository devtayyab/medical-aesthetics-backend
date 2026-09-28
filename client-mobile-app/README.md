# Beauty Doctor - Client Mobile App (Expo)

This is the official **Expo React Native** client mobile application for **Beauty Doctor**.
It connects to the client portal and enforces **strict Client-Only authentication** (blocking non-client staff/admin logins).

---

## 🚀 How to Run Locally

1. Open a terminal in this directory:
   ```bash
   cd client-mobile-app
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npm start
   ```

3. Open on Android or iOS:
   - Press `a` for Android Emulator.
   - Press `i` for iOS Simulator.
   - Scan QR code with the **Expo Go** app on your phone.

---

## 📦 How to Build for Play Store & App Store

### 1. Install EAS CLI (First Time Only)
```bash
npm install -g eas-cli
eas login
```

### 2. Build Android Direct APK (for testing on real phone):
```bash
npm run build:apk
# or
eas build -p android --profile preview
```
*When finished, Expo will give you a direct download link for the `.apk` file.*

---

### 3. Build Android AAB (for Google Play Store):
```bash
npm run build:aab
# or
eas build -p android --profile production
```
*Upload the resulting `.aab` file to Google Play Console.*

---

### 4. Build iOS IPA (for Apple App Store / TestFlight):
```bash
npm run build:ios
# or
eas build -p ios --profile production
```

---

## 🔒 Client-Only Access Enforcement
The app injects a client mobile signature:
- User-Agent: `BeautyDoctorMobileApp/1.0.0 (ClientMobileApp)`
- Browser flag: `window.isClientMobileApp = true`
- If an admin, doctor, or salesperson attempts to log in, the app blocks access and displays:
  `"Access Restricted: Only client accounts can log in to the mobile app."`
