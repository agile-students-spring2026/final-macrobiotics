import { getAuthToken } from "./authToken";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
const BASE_URL =
  configuredBaseUrl === undefined ? "http://localhost:3000" : configuredBaseUrl;

export const apiClient = async (endpoint, options = {}) => {
  const authToken = getAuthToken();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });
  return response;
};
