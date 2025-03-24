import { useState, useEffect, useRef } from "react";
import {
  Table,
  Select,
  Spin,
  Alert,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Checkbox,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast } from "react-hot-toast";
import Navbar from "../Components/Navbar";

const { Option } = Select;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // Update with actual backend URL

// Distance between two points in km
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

export default function AdminShelters() {
  const [shelters, setShelters] = useState([]);

  const [userCoordinates, setUserCoordinates] = useState(null);
  const [selectedDistance, setSelectedDistance] = useState(10);
  const fetchedOnce = useRef(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userCoordinates) return;
    fetchShelters(
      userCoordinates.latitude,
      userCoordinates.longitude,
      selectedDistance
    );
  }, [selectedDistance, userCoordinates]);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoordinates({ latitude, longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const fetchShelters = async (latitude, longitude, distance) => {
    try {
      const url = `${BACKEND_URL}/shelter/get-shelters`;
      const response = await axios.get(url, {
        params: { latitude, longitude, dist: distance },
      });

      if (response.data.shelters && Array.isArray(response.data.shelters)) {
        setShelters(response.data.shelters);
      } else {
        toast.error("Invalid shelter data received");
      }
    } catch (error) {
      console.error("Error fetching shelters:", error);
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
    <div className="w-full">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-5">
          Available Shelters
        </h2>

        <p className="text-center text-gray-500 mb-4">
          📍 Your Location:{" "}
          {userCoordinates
            ? `${userCoordinates.latitude}, ${userCoordinates.longitude}`
            : "Fetching..."}
        </p>

        <div className="flex justify-between items-center mb-5">
          <div className="flex">
            <span className="mr-2 text-gray-600 hidden sm:block">
              Filter by Distance (km):
            </span>
            <Select
              value={selectedDistance}
              onChange={setSelectedDistance}
              className="w-full sm:w-40"
            >
              <Option value={5}>5 km</Option>
              <Option value={10}>10 km</Option>
              <Option value={15}>15 km</Option>
              <Option value={20}>20 km</Option>
              <Option value={150}>150 km</Option>
              <Option value={10000000}>All</Option>
            </Select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mt-10">
          {shelters.map((shelter) => (
            <a
              href={`https://www.google.com/maps?q=${shelter.latitude},${shelter.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              key={shelter.id}
            >
              <Card
                key={shelter.id}
                title={shelter.name}
                className="shadow-lg rounded-lg"
              >
                {shelter.images ? (
                  <img
                    src={shelter.images}
                    alt="Shelter"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                    No Image
                  </div>
                )}
                <p className="text-gray-500 mt-2">
                  📍 {shelter.address}, {shelter.pincode}
                </p>
                <p className="text-gray-500 font-semibold mt-2">
                  Distance:{" "}
                  {getDistance(
                    userCoordinates.latitude,
                    userCoordinates.longitude,
                    shelter.latitude,
                    shelter.longitude
                  ).toFixed(2)}{" "}
                </p>
              </Card>
            </a>
          ))}
          {shelters.length === 0 && (
            <div className="col-span-full">
              <Alert
                message="No shelters available within the selected distance."
                type="info"
                showIcon
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
