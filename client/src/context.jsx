import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");

  // Load from storage only once on mount
  useEffect(() => {
    setAccessToken(localStorage.getItem("accessToken") || "");
    setRefreshToken(localStorage.getItem("refreshToken") || "");
    setUsername(localStorage.getItem("username") || "");
    setUserId(localStorage.getItem("id") || "");
  }, []);

  // Wrapped setter functions to update storage efficiently
  const setTokens = (accessToken, refreshToken) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  };

  const setUser = (username, userId, department) => {
    setUsername(username);
    setUserId(userId);
    localStorage.setItem("username", username);
    localStorage.setItem("id", userId);
    localStorage.setItem("department", department);
  };

  const clearAuth = () => {
    setAccessToken("");
    setRefreshToken("");
    setUsername("");
    setUserId("");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("id");
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        setTokens,
        username,
        setUsername,
        userId,
        setUserId,
        setUser,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
