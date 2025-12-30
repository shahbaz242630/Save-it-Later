# Save It Later - Mobile App

Expo Router + React Native application for saving links to Supabase with end-to-end share-sheet support.

## Getting Started

```bash
cd apps/mobile
npm install
npm run start
```

Create a `.env.local` (based on `.env.example`) with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`. The Expo CLI automatically loads it when you run any script.

> **Note:** Share-sheet features rely on `react-native-share-menu`, which is not available inside Expo Go. Use `npm run android`/`npm run ios` (development builds) or EAS builds to exercise sharing flows without runtime errors.

## Native Builds & Share Targets

The app uses [`react-native-share-menu`](https://github.com/meedan/react-native-share-menu) so Save It Later shows up after the user taps **Share** inside other apps.

### Android

1. Run `npx expo prebuild` so the `android/` directory exists (already committed to the repo).
2. Build locally with `npm run android` or ship via EAS. The Android manifest already contains the `ACTION_SEND` and `ACTION_SEND_MULTIPLE` intent filters for text, URLs, and images.

When a user shares from another Android app, Save It Later opens straight to the Save Link screen with the URL/text pre-filled.

### iOS

Because the Expo CLI cannot generate iOS projects on Windows, the `ios/` directory is not committed. The repo includes a pre-configured share extension in `ios-share-extension/`. On macOS or Linux:

1. Run `npx expo prebuild --platform ios` to generate `ios/`.
2. Follow `ios-share-extension/README.md` to add the Share Extension target and copy the provided `ShareViewController.swift`, entitlements, and Info.plist.
3. Run `npx pod-install` inside `ios/` and build with `npm run ios` (development) or EAS.

The extension forwards data through the `saveitlater://` scheme and the `group.com.saveitlater.app` app group to the React Native bundle, which routes the user to the Save Link screen.

## Share Flow Details

- `src/providers/ShareReceiverProvider.tsx` listens for share intents/extension events and stores the payload in `useShareStore`.
- `app/add-item.tsx` consumes the payload to pre-fill the URL, notes, and title fields, then clears it after saving or navigating away.
- If the user is signed out when something is shared, the app first redirects to the login screen and then continues into the save flow once a session exists.

## Useful Commands

- `npm run start` - Metro bundler in development mode.
- `npm run android` / `npm run ios` - Build and install development builds that include the share targets.
- `npm run lint` - Run ESLint.
