export function getPublicStorageObjectPath(
  publicUrl: string | null | undefined,
  bucket: string,
  ownerId?: string,
): string | null {
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    const bucketPathPrefix = `/storage/v1/object/public/${bucket}/`;

    if (!url.pathname.startsWith(bucketPathPrefix)) return null;

    const objectPath = decodeURIComponent(url.pathname.slice(bucketPathPrefix.length));

    const belongsToOwner =
      !ownerId ||
      objectPath.startsWith(`${ownerId}/`) ||
      objectPath.startsWith(`${ownerId}-`);

    if (!objectPath || !belongsToOwner) {
      return null;
    }

    return objectPath;
  } catch {
    return null;
  }
}
