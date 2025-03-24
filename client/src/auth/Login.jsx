import toast from "react-hot-toast";
import AuthForm from "./AuthForm";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // Replace with your backend URL

const Login = () => {
  const handleLogin = async (values) => {
    console.log("Login Data:", values);
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/login`, values);

      if (res.status === 200) {
        const { access_token, refresh_token } = res.data;

        console.log("Login Response:", res.data);
        // Store tokens in local storage
        localStorage.setItem("accessToken", access_token);
        localStorage.setItem("refreshToken", refresh_token);
        localStorage.setItem("id", res.data.id);
        localStorage.setItem("username", res.data.username);

        toast.success("Login successful!");
        window.location.href = "/"; // Redirect to home page
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.detail || "An error occurred during login."
      );
    }
  };

  return <AuthForm type="login" onSubmit={handleLogin} />;
};

export default Login;
