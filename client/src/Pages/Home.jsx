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
import Navbar from "../Components/Navbar";

const { Option } = Select;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // 🔥 Replace with actual backend URL

export default function NewsFeed() {
  const [news, setNews] = useState([]);
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
      setNews(response.data.news);
      console.log("Fetched news:", response.data.news);
    } catch (error) {
      console.error("Error fetching news:", error);
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
        </div>

        {/* Grid View (Cards) */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mt-10">
          {news?.map((item) => (
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
          {news?.length === 0 && (
            <Alert
              message="No news articles found."
              type="info"
              className="col-span-3 text-center mt-5"
              showIcon
              style={{ marginTop: "20px" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
