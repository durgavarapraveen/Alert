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

export default function UploadShelters() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form] = Form.useForm();
  const { backendAPIClient } = useBackendAPIClient();
  const [modal, contextHolder] = Modal.useModal();

  useEffect(() => {
    fetchUserShelters();
  }, [backendAPIClient]);

  const fetchUserShelters = async () => {
    if (!backendAPIClient) {
      return;
    }

    setLoading(true);
    try {
      const response = await backendAPIClient.get(
        `${BACKEND_URL}/shelter/get-shelters-by-user`
      );
      setShelters(response.data.shelters);
    } catch (error) {
      console.error("Error fetching shelters:", error);
      toast.error("Failed to fetch your uploaded shelters.");
    }
    setLoading(false);
  };

  const handleUpdateShelter = async (values) => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("address", values.address);
      formData.append("contactNumber", values.contactNumber);
      formData.append("capacity", values.capacity);
      formData.append("longitude", values.longitude);
      formData.append("latitude", values.latitude);
      formData.append("pincode", values.pincode);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await backendAPIClient.put(
        `${BACKEND_URL}/shelter/update/${selectedShelter.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Shelter updated successfully!");
      setIsModalOpen(false);
      fetchUserShelters();
    } catch (error) {
      console.error("Error updating shelter:", error);
      toast.error("Failed to update shelter.");
    }
    setUpdating(false);
  };

  const showDeleteConfirm = (shelterId) => {
    modal.confirm({
      title: "Are you sure you want to delete this shelter?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Yes, delete it",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => handleDeleteShelter(shelterId),
    });
  };

  const handleDeleteShelter = async (shelterId) => {
    setDeleting(true);
    try {
      await backendAPIClient.delete(
        `${BACKEND_URL}/shelter/delete/${shelterId}`
      );
      toast.success("Shelter deleted successfully!");
      setShelters(shelters.filter((item) => item.id !== shelterId));
    } catch (error) {
      console.error("Error deleting shelter:", error);
      toast.error("Failed to delete shelter.");
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
          🏠 My Uploaded Shelters
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mt-5">
          {shelters.map((item) => (
            <Card
              key={item.id}
              title={item.name}
              className="shadow-lg rounded-lg"
              cover={
                item.images ? (
                  <img
                    src={item.images}
                    alt="Shelter"
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
                    setSelectedShelter(item);
                    form.setFieldsValue({
                      name: item.name,
                      description: item.description,
                      address: item.address,
                      contactNumber: item.contactNumber,
                      capacity: item.capacity,
                      longitude: item.longitude,
                      latitude: item.latitude,
                      pincode: item.pincode,
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
                🌍 Location: {item.latitude}, {item.longitude}
              </p>
              <p className="text-gray-500 text-sm">
                🕒 {moment(item.createdAt).format("MMMM Do YYYY, h:mm A")}
              </p>
              <p className="text-gray-500 text-sm">
                🌍 Pincode: {item.pincode}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Update Shelter Modal */}
      <Modal
        title="Edit Shelter"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={updating}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateShelter}>
          <Form.Item
            name="name"
            label="Shelter Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true }]}
          >
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
          <Form.Item
            name="pincode"
            label="Pincode"
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
                selectedShelter?.images
                  ? [
                      {
                        uid: "-1",
                        name: "Uploaded Image",
                        url: selectedShelter.images,
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
