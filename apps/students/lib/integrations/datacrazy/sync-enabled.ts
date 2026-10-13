export function isDataCrazySyncEnabled(configuredValue: string | undefined) {
  return configuredValue !== "false";
}

export async function runDataCrazySyncIfEnabled(
  operation: () => Promise<void>,
  configuredValue = process.env.DATACRAZY_SYNC_ENABLED
) {
  if (!isDataCrazySyncEnabled(configuredValue)) {
    console.info("[DATACRAZY_SYNC_SKIPPED]");
    return;
  }

  await operation();
}
