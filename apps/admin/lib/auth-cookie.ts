export const AUTH_COOKIE_OPTIONS =
  // NODE_ENV is set by Next.js; previews and production must keep the default cookie name.
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.NODE_ENV === "development" ? { name: "projeto1000-admin-auth" } : undefined;
