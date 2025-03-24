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
import { PlusOutlined } from "@ant-design/icons";
import useBackendAPIClient from "../api";
import AdminNavbar from "../Components/AdminNavbar";

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

export default function AdminFoodProvidingRegions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [selectedDistance, setSelectedDistance] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [image, setImage] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const { backendAPIClient } = useBackendAPIClient();

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
      console.log("Fetched food regions:", response.data.food);
      setRegions(response.data.food);
    } catch (error) {
      console.error("Error fetching food regions:", error);
    }
    setLoading(false);
  };

  const handleAddRegion = async (values) => {
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
      formData.append("address", values.address);
      formData.append("pincode", values.pincode);
      formData.append("description", values.description);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("userLatitude", userCoordinates.latitude);
      formData.append("userLongitude", userCoordinates.longitude);
      if (image) {
        formData.append("image", image);
      }

      await backendAPIClient.post(`${BACKEND_URL}/food/add`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Food region added successfully!");
      setIsModalOpen(false);
      form.resetFields();
      setImage(null);
      fetchRegions(latitude, longitude, selectedDistance);
    } catch (error) {
      console.error("Error adding food region:", error);
      toast.error(
        error?.response?.data?.detail || "Failed to add food region."
      );
    }
  };

  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spin size="large" className="flex justify-center mt-10" />
      </div>
    );

  return (
    <div>
      <AdminNavbar />
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
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Food Region
          </Button>
        </div>

        {/* Grid View (Cards) */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mt-10">
          {regions.map((region) => (
            <a
              href={`https://www.google.com/maps?q=${region.latitude},${region.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              key={region.id}
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
                  📍 Distance:{" "}
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
              message="No food regions available."
              type="info"
              showIcon
              className="col-span-3 text-center mt-5"
              style={{ width: "100%" }}
            />
          )}
        </div>
      </div>

      {/* Add Food Region Modal */}
      <Modal
        title="Add New Food Region"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleAddRegion}>
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
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
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
                alt="Food Region"
                className="w-16 h-16 object-cover rounded-lg mt-2"
              />
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
