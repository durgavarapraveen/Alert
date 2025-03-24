import { useState, useEffect } from "react";
import { Table, Spin, Button, Select, DatePicker, Input, Checkbox } from "antd";
import { toast } from "react-hot-toast";
import useBackendAPIClient from "../api";
import moment from "moment";
import AdminNavbar from "../Components/AdminNavbar";

const { Option } = Select;
const { RangePicker } = DatePicker;
const BACKEND_URL = "http://localhost:8000"; // Replace with actual backend URL

export default function AdminSOSAlerts() {
  const [loading, setLoading] = useState(true);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [resolvedSosAlerts, setResolvedSosAlerts] = useState([]);
  const [adminCoordinates, setAdminCoordinates] = useState({
    latitude: "",
    longitude: "",
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [sortOrder, setSortOrder] = useState("asc");
  const [dateRange, setDateRange] = useState([
    moment().subtract(2, "days"),
    moment(),
  ]);
  const [selectedRadius, setSelectedRadius] = useState(10); // Default radius 10km

  const { backendAPIClient } = useBackendAPIClient();

  useEffect(() => {
    if (useCurrentLocation) {
      getAdminLocation();
    }
  }, [useCurrentLocation]);

  useEffect(() => {
    fetchSOSAlerts();
    fetchResolvedSOSAlerts();
  }, [
    adminCoordinates,
    backendAPIClient,
    sortOrder,
    dateRange,
    selectedRadius,
  ]);

  const fetchSOSAlerts = async () => {
    if (!backendAPIClient) {
      console.error("API Client is undefined!");
      return;
    }

    if (!adminCoordinates.latitude || !adminCoordinates.longitude) {
      return;
    }

    setLoading(true);
    try {
      const response = await backendAPIClient.get(`${BACKEND_URL}/sos/all`, {
        params: {
          order: sortOrder,
          start_date: dateRange[0].format("YYYY-MM-DD"),
          end_date: dateRange[1].format("YYYY-MM-DD"),
          radius: selectedRadius,
          admin_latitude: adminCoordinates.latitude,
          admin_longitude: adminCoordinates.longitude,
        },
      });
      setSosAlerts(response.data.sos_alerts);
    } catch (error) {
      console.error("Error fetching SOS alerts:", error);
      toast.error("Failed to load SOS alerts.");
    }
    setLoading(false);
  };

  const fetchResolvedSOSAlerts = async () => {
    if (!backendAPIClient) {
      console.error("API Client is undefined!");
      return;
    }

    try {
      const response = await backendAPIClient.get(
        `${BACKEND_URL}/sos/resolved`
      );

      setResolvedSosAlerts(response.data.sos_alerts);
    } catch (error) {
      console.error("Error fetching resolved SOS alerts:", error);
      toast.error("Failed to load resolved SOS alerts.");
    }
  };

  const getAdminLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAdminCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get location. Please enable GPS.");
        setLoading(false);
      }
    );
  };

  const handleResolveSOS = async (sosId) => {
    try {
      await backendAPIClient.put(`${BACKEND_URL}/sos/resolve/${sosId}`);

      // Move the resolved alert to the resolved list
      const resolvedAlert = sosAlerts.find((alert) => alert.id === sosId);
      setResolvedSosAlerts((prevAlerts) => [...prevAlerts, resolvedAlert]);

      // Remove the resolved alert from active list
      setSosAlerts((prevAlerts) =>
        prevAlerts.filter((alert) => alert.id !== sosId)
      );

      toast.success("SOS alert resolved successfully!");
    } catch (error) {
      console.error("Error resolving SOS alert:", error);
      toast.error("Failed to resolve SOS alert.");
    }
  };

  if (loading)
    return (
      <Spin
        size="large"
        className="flex justify-center mt-10 w-screen h-screen items-center"
      />
    );

  return (
    <div className="flex flex-col bg-gray-100 min-h-screen">
      <AdminNavbar />
      <div className="max-w-6xl mx-auto p-5">
        <h2 className="text-2xl font-bold text-center mb-5">
          🚨 SOS Alerts - Admin Dashboard
        </h2>

        {/* Admin Coordinates Input */}
        <div className="grid sm:grid-cols-2 gap-5 mb-5">
          <div>
            <Checkbox
              checked={useCurrentLocation}
              onChange={(e) => setUseCurrentLocation(e.target.checked)}
            >
              Use My Current Location
            </Checkbox>
          </div>

          {!useCurrentLocation && (
            <>
              <Input
                placeholder="Enter Latitude"
                type="number"
                value={adminCoordinates.latitude}
                onChange={(e) =>
                  setAdminCoordinates({
                    ...adminCoordinates,
                    latitude: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Enter Longitude"
                type="number"
                value={adminCoordinates.longitude}
                onChange={(e) =>
                  setAdminCoordinates({
                    ...adminCoordinates,
                    longitude: e.target.value,
                  })
                }
              />
            </>
          )}
        </div>

        {/* Sorting, Radius & Date Filter */}
        <div className="flex justify-between mb-5">
          <div className="flex gap-3">
            <Select defaultValue="asc" onChange={setSortOrder} className="w-40">
              <Option value="asc">Ascending</Option>
              <Option value="desc">Descending</Option>
            </Select>

            <Select
              defaultValue={10}
              onChange={setSelectedRadius}
              className="w-40"
            >
              <Option value={5}>Within 5 km</Option>
              <Option value={10}>Within 10 km</Option>
              <Option value={15}>Within 15 km</Option>
              <Option value={20}>Within 20 km</Option>
            </Select>
          </div>

          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            format="YYYY-MM-DD"
          />
        </div>

        {/* Active SOS Alerts Table */}
        <Table
          dataSource={sosAlerts}
          rowKey="id"
          columns={[
            { title: "User ID", dataIndex: "id", key: "id" },
            { title: "Latitude", dataIndex: "latitude", key: "latitude" },
            { title: "Longitude", dataIndex: "longitude", key: "longitude" },
            { title: "Persons", dataIndex: "persons", key: "persons" },
            {
              title: "Date Sent",
              dataIndex: "createdAt",
              key: "createdAt",
              render: (text) => moment(text).format("MMMM Do YYYY, h:mm A"),
            },
            {
              title: "Actions",
              key: "actions",
              render: (_, record) => (
                <Button
                  type="primary"
                  danger
                  onClick={() => handleResolveSOS(record.id)}
                >
                  Respond
                </Button>
              ),
            },
          ]}
        />

        {/* Resolved SOS Alerts Table */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-center mb-5">
            ✅ Resolved SOS Alerts
          </h2>
          <Table
            dataSource={resolvedSosAlerts}
            rowKey="id"
            columns={[
              { title: "User ID", dataIndex: "id", key: "id" },
              { title: "Latitude", dataIndex: "latitude", key: "latitude" },
              { title: "Longitude", dataIndex: "longitude", key: "longitude" },
              { title: "Persons", dataIndex: "persons", key: "persons" },
              {
                title: "Date Resolved",
                dataIndex: "resolvedAt",
                key: "resolvedAt",
                render: (text) => moment(text).format("MMMM Do YYYY, h:mm A"),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
