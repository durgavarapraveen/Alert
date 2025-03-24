import { useState } from "react";
import { MenuOutlined } from "@ant-design/icons";
import { Drawer, Button } from "antd";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 🏠 Logo */}
          <Link to="/" className="text-2xl font-bold">
            🌍 Alert
          </Link>

          {/* 🖥️ Desktop Menu */}
          <div className="hidden md:flex space-x-6 justify-center items-center">
            <NavItem to="/" label="Home" />
            <NavItem to="/shelters" label="Shelters" />
            <NavItem to="/food-regions" label="Food Providing Regions" />
            <NavItem
              to="/sos-alert"
              label="SOS Alert"
              className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition"
            />
          </div>

          {/* 📱 Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              type="text"
              icon={<MenuOutlined />}
              className="md:hidden !text-white text-xl"
              onClick={() => setOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* 📱 Mobile Drawer */}
      <Drawer
        title="Menu"
        placement="right"
        closable={true}
        onClose={() => setOpen(false)}
        open={open}
      >
        <div className="flex flex-col space-y-4">
          <NavItem to="/" label="Home" onClick={() => setOpen(false)} />
          <NavItem
            to="/shelters"
            label="Shelters"
            onClick={() => setOpen(false)}
          />
          <NavItem
            to="/food-regions"
            label="Food Providing Regions"
            onClick={() => setOpen(false)}
          />
          <NavItem
            to="/sos-alert"
            label="SOS Alert"
            className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition"
            onClick={() => setOpen(false)}
          />
        </div>
      </Drawer>
    </nav>
  );
}

// ✅ Reusable Navigation Item Component
const NavItem = ({ to, label, className = "", onClick }) => (
  <Link
    to={to}
    className={`text-lg font-medium hover:text-gray-300 transition ${className}`}
    onClick={onClick}
  >
    {label}
  </Link>
);
