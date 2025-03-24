import React, { useEffect, useState } from "react";
import { Form, Input, Button, Checkbox } from "antd";
import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

const AuthForm = ({ type, onSubmit }) => {
  const [coordinates, setCoordinates] = useState({
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleSubmit = (values) => {
    onSubmit({ ...values, coordinates });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-center text-2xl font-bold mb-4">
          {type === "login" ? "Login" : "Register"}
        </h2>
        <Form layout="vertical" onFinish={handleSubmit}>
          {type === "register" && (
            <Form.Item
              name="fullName"
              rules={[{ required: true, message: "Full Name is required" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Full Name" />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            rules={[{ required: true, message: "Email is required" }]}
          >
            <Input prefix={<MailOutlined />} type="email" placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          {type === "register" && (
            <>
              <Form.Item name="phoneNumber">
                <Input prefix={<PhoneOutlined />} placeholder="Phone Number" />
              </Form.Item>

              <Form.Item name="address">
                <Input prefix={<HomeOutlined />} placeholder="Address" />
              </Form.Item>

              <Form.Item name="pincode">
                <Input prefix={<EnvironmentOutlined />} placeholder="Pincode" />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full">
              {type === "login" ? "Login" : "Register"}
            </Button>
          </Form.Item>
        </Form>

        {type === "login" && (
          <p className="text-center">
            <a href="/forgot-password" className="text-blue-500">
              Forgot Password?
            </a>
          </p>
        )}

        {type === "login" ? (
          <p className="text-center">
            Don't have an account?{" "}
            <a href="/register" className="text-blue-500">
              Register
            </a>
          </p>
        ) : (
          <p className="text-center">
            Already have an account?{" "}
            <a href="/login" className="text-blue-500">
              Login
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
