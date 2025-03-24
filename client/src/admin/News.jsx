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
  Upload,
  Alert,
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast } from "react-hot-toast";
import moment from "moment";
import useBackendAPIClient from "../api";
import AdminNavbar from "../Components/AdminNavbar";

const { Option } = Select;
const BACKEND_URL = "http://localhost:8000"; // 🔥 Replace with actual backend URL

export default function NewsPage() {
  const [news, setNews] = useState([]);
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
      fetchNews(
        userCoordinates.latitude,
        userCoordinates.longitude,
        selectedDistance
      );
    }
  }, [userCoordinates, selectedDistance]);

  const fetchNews = async (latitude, longitude, distance) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/news/news?latitude=${latitude}&longitude=${longitude}&distance=${distance}`
      );
      console.log("Fetched news:", response.data.news);
      setNews(response.data.news);
    } catch (error) {
      console.error("Error fetching news:", error);
    }
    setLoading(false);
  };

  const handleAddNews = async (values) => {
    try {
      const latitude = useCurrentLocation
        ? userCoordinates?.latitude
        : values.latitude;
      const longitude = useCurrentLocation
        ? userCoordinates?.longitude
        : values.longitude;

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);

      if (!latitude || !longitude) {
        toast.error("Please provide latitude and longitude.");
        return;
      }

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      if (image) {
        formData.append("image", image);
      }

      console.log(image);

      await backendAPIClient.post(`${BACKEND_URL}/news/add`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("News added successfully!");
      setIsModalOpen(false);
      form.resetFields();
      setImage(null);
      fetchNews(latitude, longitude, selectedDistance);
    } catch (error) {
      console.error("Error adding news:", error);
      toast.error(error?.response?.data?.detail || "Failed to add news.");
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
        <h2 className="text-2xl font-bold text-center mb-5">📰 Latest News</h2>

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
            Add News
          </Button>
        </div>

        {/* Grid View (Cards) */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mt-10">
          {news.map((item) => (
            <Card
              key={item.id}
              title={item.title}
              className="shadow-lg rounded-lg"
              cover={
                item.images ? (
                  <img
                    src={item.images}
                    alt="News"
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                    No Image
                  </div>
                )
              }
            >
              <p className="text-gray-600">{item.description}</p>
              <p className="text-gray-500 text-sm mt-2">
                🕒 {moment(item.createdAt).format("MMMM Do YYYY, h:mm A")}
              </p>
            </Card>
          ))}
          {news.length === 0 && (
            <Alert
              message="No news articles available."
              type="info"
              showIcon
              className="col-span-3 text-center mt-5"
              style={{ width: "100%" }}
            />
          )}
        </div>
      </div>

      {/* Add News Modal */}
      <Modal
        title="Add News Article"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleAddNews}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please enter a title!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter a description!" }]}
          >
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
              <Form.Item name="latitude" label="Latitude">
                <Input type="number" />
              </Form.Item>
              <Form.Item name="longitude" label="Longitude">
                <Input type="number" />
              </Form.Item>
            </>
          )}
          <Form.Item name="image" label="Image">
            <input type="file" onChange={(e) => setImage(e.target.files[0])} />
            {image && (
              <div className="mt-2">
                <strong>Selected Image:</strong> {image.name}
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
