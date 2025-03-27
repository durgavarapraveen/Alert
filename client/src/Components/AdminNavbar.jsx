import { useState } from "react";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { Drawer, Button } from "antd";
import { Link } from "react-router-dom";
import { useAuth } from "../context";

export default function AdminNavbar() {
  const [open, setOpen] = useState(false);
  const { accessToken } = useAuth(); // Assuming you have a useAuth hook to manage authentication

  return (
    <nav className="bg-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 🏠 Logo */}
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">🌍</span> Alert
          </Link>

          {/* 📱 Mobile Menu Button */}
          <div className="">
            <Button
              type="text"
              icon={<MenuOutlined />}
              className=" !text-white text-2xl"
              onClick={() => setOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* 📱 Mobile Drawer */}
      <Drawer
        title={
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold text-blue-700">Menu</span>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setOpen(false)}
            />
          </div>
        }
        placement="right"
        closable={false}
        onClose={() => setOpen(false)}
        open={open}
        bodyStyle={{ padding: "1.5rem" }}
      >
        <div className="flex flex-col space-y-5">
          <NavItem
            to="/admin/news"
            label="Home"
            onClick={() => setOpen(false)}
          />
          <NavItem
            to="/admin/upload-news"
            label="Uploaded News"
            onClick={() => setOpen(false)}
          />
          <NavItem
            to="/admin/shelters"
            label="Shelters"
            onClick={() => setOpen(false)}
          />
          <NavItem
            to="/admin/upload-shelters"
            label="Upload Shelters"
            onClick={() => setOpen(false)}
          />
          <NavItem
            to="/admin/food"
            label="Food Providing Regions"
            onClick={() => setOpen(false)}
          />
          <NavItem
            to="/admin/upload-food"
            label="Upload Food Providing Regions"
            onClick={() => setOpen(false)}
          />
          <NavItem
            to="/admin/sos"
            label="SOS Alert"
            className="!bg-red-500 text-white px-4 py-2 rounded-lg !hover:bg-red-600 transition duration-300"
            onClick={() => setOpen(false)}
          />
          {accessToken ? (
            <NavItem
              to="/"
              label="Logout"
              className="bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              onClick={() => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("username");
                localStorage.removeItem("id");
                window.location.reload();
              }}
            />
          ) : (
            <NavItem
              to="/login"
              label="Login"
              className="bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            />
          )}
        </div>
      </Drawer>
    </nav>
  );
}

// ✅ Reusable Navigation Item Component
const NavItem = ({ to, label, className = "", onClick }) => (
  <a
    href={to}
    className={`text-lg font-medium !text-black hover:text-gray-300 transition duration-300 ${className}`}
    onClick={onClick}
  >
    {label}
  </a>
);
