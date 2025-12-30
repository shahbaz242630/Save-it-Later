## iOS Share Extension Setup

These assets ship the Swift controller, Info.plist, and entitlements that the iOS share target needs. Because Expo cannot generate the `ios/` directory on Windows, run `npx expo prebuild --platform ios` on macOS or Linux and then:

1. Open `ios/save-it-later.xcworkspace` in Xcode and add a new **Share Extension** target named **ShareExtension** using Swift.
2. Delete the auto-generated `ShareViewController.swift` and add `ios-share-extension/ShareViewController.swift` (reference it instead of copying) to the new target.
3. In the ShareExtension target **Build Settings**, make sure the deployment target matches the main app.
4. Replace the generated `Info.plist` with `ios-share-extension/ShareExtension-Info.plist`.
5. Set the ShareExtension entitlements file to `ios-share-extension/ShareExtension.entitlements` so it shares the `group.com.saveitlater.app` App Group with the host app.
6. Add the `group.com.saveitlater.app` App Group capability to both the main app target and the extension.
7. Run `npx pod-install` so the new target links against `react-native-share-menu` (`RNShareMenu` pod).

After those steps, build the extension target once. The share sheet will show Save It Later on iOS and will forward payloads through the shared app group and custom URL scheme (`saveitlater://`) back into the React Native bundle handled by `ShareReceiverProvider`.
