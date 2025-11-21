export const temp_host =
  process.env.NODE_ENV === "development"
    ? "https://storage.googleapis.com/token-list-swapkit-dev"
    : "https://storage.googleapis.com/token-list-swapkit";
