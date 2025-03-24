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

export default function UploadFood() {
  const [foodRegions, setFoodRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form] = Form.useForm();
  const { backendAPIClient } = useBackendAPIClient();
  const [modal, contextHolder] = Modal.useModal();

  useEffect(() => {
    fetchFoodRegions();
  }, [backendAPIClient]);

  const fetchFoodRegions = async () => {
    if (!backendAPIClient) {
      return;
    }

    setLoading(true);
    try {
      const response = await backendAPIClient.get(
        `${BACKEND_URL}/food/get-food-regions`
      );
      setFoodRegions(response.data.food);
    } catch (error) {
      console.error("Error fetching food regions:", error);
      toast.error("Failed to fetch food-providing regions.");
    }
    setLoading(false);
  };

  const handleUpdateFood = async (values) => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("address", values.address);
      formData.append("pincode", values.pincode);
      formData.append("description", values.description);
      formData.append("longitude", values.longitude);
      formData.append("latitude", values.latitude);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await backendAPIClient.put(
        `${BACKEND_URL}/food/update/${selectedFood.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Food-providing region updated successfully!");
      setIsModalOpen(false);
      fetchFoodRegions();
    } catch (error) {
      console.error("Error updating food region:", error);
      toast.error("Failed to update food region.");
    }
    setUpdating(false);
  };

  const showDeleteConfirm = (foodId) => {
    modal.confirm({
      title: "Are you sure you want to delete this food region?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Yes, delete it",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => handleDeleteFood(foodId),
    });
  };

  const handleDeleteFood = async (foodId) => {
    setDeleting(true);
    try {
      await backendAPIClient.delete(`${BACKEND_URL}/food/delete/${foodId}`);
      toast.success("Food region deleted successfully!");
      setFoodRegions(foodRegions.filter((item) => item.id !== foodId));
    } catch (error) {
      console.error("Error deleting food region:", error);
      toast.error("Failed to delete food region.");
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
        {contextHolder}
        <h2 className="text-2xl font-bold text-center mb-5">
          🍽️ Food Providing Regions
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mt-5">
          {foodRegions.map((item) => (
            <Card
              key={item.id}
              title={item.address}
              className="shadow-lg rounded-lg"
              cover={
                item.images ? (
                  <img
                    src={item.images}
                    alt="Food Region"
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
                    setSelectedFood(item);
                    form.setFieldsValue({
                      address: item.address,
                      pincode: item.pincode,
                      description: item.description,
                      longitude: item.longitude,
                      latitude: item.latitude,
                      distance: item.distance,
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
              <p className="text-gray-500 text-sm mt-2">📍 {item.address}</p>
              <p className="text-gray-500 text-sm">
                📌 Pincode: {item.pincode}
              </p>
              <p className="text-gray-500 text-sm">
                🌍 Location: {item.latitude}, {item.longitude}
              </p>

              <p className="text-gray-500 text-sm">
                🕒 {moment(item.createdAt).format("MMMM Do YYYY, h:mm A")}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Update Food Modal */}
      <Modal
        title="Edit Food Providing Region"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={updating}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateFood}>
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} />
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
          <Form.Item
            name="longitude"
            label="Longitude"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="latitude"
            label="Latitude"
            rules={[{ required: true }]}
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
                selectedFood?.images
                  ? [
                      {
                        uid: "-1",
                        name: "Uploaded Image",
                        url: selectedFood.images,
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
