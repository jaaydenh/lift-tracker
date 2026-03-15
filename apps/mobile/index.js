import * as ReactNative from 'react-native';

/**
 * Temporary compatibility shim for React Native 0.79 + third-party wildcard imports.
 * Some dependencies enumerate all `react-native` exports at startup, which can invoke
 * deprecated lazy getters (Clipboard / PushNotificationIOS / ProgressBarAndroid).
 * Those getters may touch native modules that are not present in Expo Go and crash app boot.
 */
function overrideReactNativeExport(name, value) {
  try {
    Object.defineProperty(ReactNative, name, {
      configurable: true,
      enumerable: false,
      get: () => value,
    });
  } catch (error) {
    console.warn(`[mobile] Failed to override react-native export: ${name}`, error);
  }
}

overrideReactNativeExport('Clipboard', {
  getString: async () => '',
  setString: () => {},
});

overrideReactNativeExport('PushNotificationIOS', {
  addEventListener: () => {},
  removeEventListener: () => {},
  requestPermissions: async () => ({}),
  abandonPermissions: () => {},
  checkPermissions: () => {},
});

overrideReactNativeExport('ProgressBarAndroid', () => null);

import 'expo-router/entry';
