import { useState, useEffect } from "react";
import { Card, Spin, Button, Modal, Form, Input, Upload } from "antd";
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { toast } from "react-hot-toast";
import moment from "moment";
import useBackendAPIClient from "../api";
import AdminNavbar from "../Components/AdminNavbar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // Replace with actual backend URL

export default function UploadedNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form] = Form.useForm();
  const { backendAPIClient } = useBackendAPIClient();
  const [modal, contextHolder] = Modal.useModal();

  useEffect(() => {
    fetchUserNews();
  }, [backendAPIClient]);

  const fetchUserNews = async () => {
    if (!backendAPIClient) {
      return;
    }

    setLoading(true);
    try {
      const response = await backendAPIClient.get(`${BACKEND_URL}/news/mynews`);
      setNews(response.data.news);
    } catch (error) {
      console.error("Error fetching user news:", error);
      toast.error("Failed to fetch your news articles.");
    }
    setLoading(false);
  };

  const handleUpdateNews = async (values) => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("longitude", values.longitude);
      formData.append("latitude", values.latitude);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await backendAPIClient.put(
        `${BACKEND_URL}/news/update/${selectedNews.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("News updated successfully!");
      setIsModalOpen(false);
      fetchUserNews();
    } catch (error) {
      console.error("Error updating news:", error);
      toast.error("Failed to update news.");
    }
    setUpdating(false);
  };

  const showDeleteConfirm = (newsId) => {
    modal.confirm({
      title: "Are you sure you want to delete this news?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Yes, delete it",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => handleDeleteNews(newsId),
    });
  };

  const handleDeleteNews = async (newsId) => {
    setDeleting(true);
    try {
      await backendAPIClient.delete(`${BACKEND_URL}/news/delete/${newsId}`);
      toast.success("News deleted successfully!");
      setNews(news.filter((item) => item.id !== newsId));
    } catch (error) {
      console.error("Error deleting news:", error);
      toast.error("Failed to delete news.");
    }
    setDeleting(false);
  };

  if (loading || deleting) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spin size="large" className="flex justify-center mt-10" />
      </div>
    );
  }

  return (
    <div>
      <AdminNavbar />
      <div className="max-w-6xl mx-auto p-5">
        {contextHolder} {/* ✅ Include this to enable modal context */}
        <h2 className="text-2xl font-bold text-center mb-5">
          📰 My Uploaded News
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mt-5">
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
              actions={[
                <EditOutlined
                  key="edit"
                  onClick={() => {
                    setSelectedNews(item);
                    form.setFieldsValue({
                      title: item.title,
                      description: item.description,
                      longitude: item.longitude,
                      latitude: item.latitude,
                      image: item.images,
                    });
                    setImageFile(null);
                    setIsModalOpen(true);
                  }}
                />,
                <DeleteOutlined
                  key="delete"
                  onClick={() => showDeleteConfirm(item.id)}
                  style={{ color: "red" }}
                />,
              ]}
            >
              <p className="text-gray-600">{item.description}</p>
              <p className="text-gray-500 text-sm mt-2">
                🕒 {moment(item.createdAt).format("MMMM Do YYYY, h:mm A")}
              </p>
              <p className="text-gray-500 text-sm">
                🌍 Location: {item.latitude}, {item.longitude}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Update News Modal */}
      <Modal
        title="Edit News"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={updating}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateNews}>
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
          <Form.Item
            name="longitude"
            label="Longitude"
            rules={[
              { required: true, message: "Please enter longitude!" },
              {
                pattern: /^-?\d+(\.\d+)?$/,
                message: "Enter a valid longitude",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="latitude"
            label="Latitude"
            rules={[
              { required: true, message: "Please enter latitude!" },
              { pattern: /^-?\d+(\.\d+)?$/, message: "Enter a valid latitude" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="image" label="Upload New Image">
            <Upload
              beforeUpload={(file) => {
                console.log("Selected File:", file);
                setImageFile(file);
                return false; // Prevent default upload
              }}
              maxCount={1}
              listType="picture"
              defaultFileList={
                selectedNews?.images
                  ? [
                      {
                        uid: "-1",
                        name: "Uploaded Image",
                        url: selectedNews.images,
                      },
                    ]
                  : []
              }
            >
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>

            {/* ✅ Show preview of selected image */}
            {imageFile && (
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                style={{ width: "100%", marginTop: "10px" }}
              />
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
