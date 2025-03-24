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
import useBackendAPIClient from "../api";
import AdminNavbar from "../Components/AdminNavbar";

const { Option } = Select;
const BACKEND_URL = "http://localhost:8000"; // Update with actual backend URL

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
  const [loading, setLoading] = useState(true);
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [selectedDistance, setSelectedDistance] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [image, setImage] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  const { backendAPIClient } = useBackendAPIClient();
  const fetchedOnce = useRef(false);

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

          setLoading(false);
        }
      );
    } else {
      setLoading(false);
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

  const handleAddShelter = async (values) => {
    try {
      const latitude = useCurrentLocation
        ? userCoordinates?.latitude
        : values.latitude;
      const longitude = useCurrentLocation
        ? userCoordinates?.longitude
        : values.longitude;

      if (!latitude || !longitude) {
        toast.error("Please provide latitude and longitude.");
        return;
      }

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("address", values.address);
      formData.append("pincode", values.pincode);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("userLatitude", userCoordinates.latitude);
      formData.append("userLongitude", userCoordinates.longitude);
      if (image) {
        formData.append("image", image);
      }

      await backendAPIClient.post(`${BACKEND_URL}/shelter/add`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Shelter added successfully!");
      setIsModalOpen(false);
      form.resetFields();
      setImage(null);
      fetchShelters(latitude, longitude, selectedDistance);
    } catch (error) {
      console.error("Error adding shelter:", error);
      toast.error(error?.response?.data?.detail || "Failed to add shelter.");
    }
  };

  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spin size="large" className="flex justify-center mt-10" />
      </div>
    );

  return (
    <div className="w-full">
      <AdminNavbar />
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Shelter
          </Button>
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
                  Distance:
                  {getDistance(
                    userCoordinates.latitude,
                    userCoordinates.longitude,
                    shelter.latitude,
                    shelter.longitude
                  ).toFixed(2)}{" "}
                  km
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

      {/* Add Shelter Modal */}
      <Modal
        title="Add New Shelter"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleAddShelter}>
          <Form.Item
            name="name"
            label="Shelter Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="pincode"
            label="Pincode"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Checkbox
              checked={useCurrentLocation}
              onChange={(e) => setUseCurrentLocation(e.target.checked)}
            >
              Use my current location
            </Checkbox>
          </Form.Item>

          {!useCurrentLocation && (
            <>
              <Form.Item
                name="latitude"
                label="Latitude"
                rules={[{ required: true }]}
              >
                <Input type="number" />
              </Form.Item>
              <Form.Item
                name="longitude"
                label="Longitude"
                rules={[{ required: true }]}
              >
                <Input type="number" />
              </Form.Item>
            </>
          )}

          <Form.Item name="image" label="Image">
            <input type="file" onChange={(e) => setImage(e.target.files[0])} />
            {image && (
              <img
                src={URL.createObjectURL(image)}
                alt="Shelter"
                className="w-16 h-16 object-cover rounded-lg mt-2"
              />
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
