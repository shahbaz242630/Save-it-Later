const SOURCE_KEYS = [
  'sourceApp',
  'source_application',
  'sourceApplication',
  'appPackageName',
  'packageName',
  'android.intent.extra.PROCESS_NAME',
  'UIApplicationBundleIdentifierKey',
  'hostAppId',
  'appName',
];

export function extractSourceApp(extraData?: Record<string, unknown> | null) {
  if (!extraData) return undefined;
  for (const key of SOURCE_KEYS) {
    const maybeValue = extraData[key];
    if (typeof maybeValue === 'string' && maybeValue.trim().length) {
      return maybeValue.trim();
    }
  }
  return undefined;
}
