import toast from "react-hot-toast";
import AuthForm from "./AuthForm";
import axios from "axios";

const BACKEND_URL = "http://localhost:8000"; // Replace with your backend URL

const Register = () => {
  const handleRegister = async (values) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/register`, values);
      console.log("Response:", res);
      if (res.status === 200) {
        console.log("Registration successful:", res.data);
        window.location.href = "/login";
      } else {
        toast.error(res.data.detail || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.detail || "Registration failed!!!");
    }
  };

  return <AuthForm type="register" onSubmit={handleRegister} />;
};

export default Register;
