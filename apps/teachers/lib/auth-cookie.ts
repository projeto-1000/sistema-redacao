export const AUTH_COOKIE_OPTIONS =
  // NODE_ENV is set by Next.js; previews and production must keep the default cookie name.
  process.env.NODE_ENV === "development" ? { name: "projeto1000-teachers-auth" } : undefined;
