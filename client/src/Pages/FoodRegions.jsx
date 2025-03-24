import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Spin,
  Select,
  Button,
  Modal,
  Form,
  Input,
  Checkbox,
  Alert,
} from "antd";
import axios from "axios";
import { toast } from "react-hot-toast";
import Navbar from "../Components/Navbar";

const { Option } = Select;

const BACKEND_URL = "http://localhost:8000"; // 🔥 Replace with actual backend URL

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export default function FoodProvidingRegions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [selectedDistance, setSelectedDistance] = useState(10);
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoordinates({ latitude, longitude });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get location. Please enable GPS.");
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (userCoordinates && selectedDistance) {
      fetchRegions(
        userCoordinates.latitude,
        userCoordinates.longitude,
        selectedDistance
      );
    }
  }, [userCoordinates, selectedDistance]);

  const fetchRegions = async (latitude, longitude, distance) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/food/food?latitude=${latitude}&longitude=${longitude}&distance=${distance}`
      );
      setRegions(response.data.food);
    } catch (error) {
      console.error("Error fetching food regions:", error);
    }
    setLoading(false);
  };

  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spin size="large" className="flex justify-center mt-10" />
      </div>
    );

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto p-5">
        <h2 className="text-2xl font-bold text-center mb-5">
          🍽️ Food Providing Regions
        </h2>

        {/* Distance Filter & Add Button */}
        <div className="flex justify-between mb-5">
          <Select
            defaultValue={10}
            onChange={(value) => setSelectedDistance(value)}
            className="w-40"
          >
            <Option value={5}>5 km</Option>
            <Option value={10}>10 km</Option>
            <Option value={15}>15 km</Option>
            <Option value={20}>20 km</Option>
            <Option value={100000000}>All</Option>
          </Select>
        </div>

        {/* Grid View (Cards) */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mt-10">
          {regions.map((region) => (
            <a
              href={`https://www.google.com/maps?q=${region.latitude},${region.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Card
                key={region.id}
                title={region.address}
                className="shadow-lg rounded-lg"
                cover={
                  region.images ? (
                    <img
                      src={region.images}
                      alt="Food Region"
                      className="w-full h-40 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                      No Image
                    </div>
                  )
                }
              >
                <p className="text-gray-600">
                  {region.description || "No description available"}
                </p>
                <p className="text-gray-500 mt-2">📍 {region.pincode}</p>
                <p className="text-gray-500 mt-2">
                  📍 Distance:
                  {getDistance(
                    userCoordinates.latitude,
                    userCoordinates.longitude,
                    region.latitude,
                    region.longitude
                  ).toFixed(2)}{" "}
                  km
                </p>
              </Card>
            </a>
          ))}
          {regions.length === 0 && (
            <Alert
              message="No food providing regions found."
              type="info"
              className="col-span-full text-center"
              showIcon
              style={{ marginTop: "20px" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
