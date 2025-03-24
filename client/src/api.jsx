import axios from "axios";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./context";

const useBackendAPIClient = () => {
  const { accessToken, refreshToken, setTokens } = useAuth();

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  // Memoized API client for authenticated requests
  const backendAPIClient = useMemo(() => {
    if (!accessToken) return;

    const client = axios.create({
      headers: {
        Authorization: `Bearer ${accessToken}`,
        withCredentials: true,
      },
    });

    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          try {
            const res = await axios.post(
              `${backendURL}/auth/refresh`,
              { refresh_token: refreshToken },
              {
                headers: { "Content-Type": "application/json" },
              }
            );

            if (res.status === 200) {
              const newAccessToken = res.data.access;

              // Update the tokens in the context
              setTokens(newAccessToken, refreshToken);
              // Call getUserType with the new access token
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

              return client(originalRequest);
            }
          } catch {
            toast.error("Session Expired. Please Login Again", {
              toastId: "session-expired",
            });
            localStorage.clear();
            window.location.replace("/login");
          }
        }
        return Promise.reject(error);
      }
    );

    return client;
  }, [refreshToken, backendURL, accessToken, setTokens]);

  // Memoized API client for unauthenticated requests
  const unauthorizedBackendAPIClient = useMemo(() => {
    return axios.create({
      headers: {
        "Content-Type": "application/json",
      },
    });
  }, []);

  // Return both clients so you can choose which to use
  return { backendAPIClient, unauthorizedBackendAPIClient };
};

export default useBackendAPIClient;
