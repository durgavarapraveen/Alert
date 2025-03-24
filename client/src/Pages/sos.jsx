import { useState } from "react";
import { Button, Card, Spin, Input } from "antd";
import { toast } from "react-hot-toast";
import Navbar from "../Components/Navbar";
import useBackendAPIClient from "../api";

const BACKEND_URL = "http://localhost:8000"; // Replace with actual backend URL

export default function SOSAlert() {
  const [loading, setLoading] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [persons, setPersons] = useState(1); // Default 1 person

  const { backendAPIClient } = useBackendAPIClient();

  const handleSOS = async () => {
    if (persons <= 0) {
      toast.error("Please enter a valid number of persons.");
      return;
    }

    setLoading(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoordinates({ latitude, longitude });

        try {
          await backendAPIClient.post(
            `${BACKEND_URL}/sos/sos?latitude=${latitude}&longitude=${longitude}&persons=${persons}`,

            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              },
            }
          );
          toast.success("🚨 SOS Alert Sent to Admin!");
        } catch (error) {
          console.error("Error sending SOS:", error);
          toast.error("Failed to send SOS alert.");
        }

        setLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get location. Please enable GPS.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="flex flex-col bg-gray-100 h-screen">
      <Navbar />
      <div className="flex justify-center items-center mt-32">
        <Card className="shadow-lg p-6 rounded-lg text-center max-w-md bg-white">
          <h2 className="text-2xl font-bold text-red-600">
            🚨 SOS Emergency Alert
          </h2>
          <p className="text-gray-500 mt-2">
            Enter the number of persons and click the button below to send your
            location to the admin.
          </p>

          {/* Number of Persons Input */}
          <Input
            type="number"
            min={1}
            value={persons}
            onChange={(e) => setPersons(parseInt(e.target.value) || 0)}
            className="mt-3 text-center"
            placeholder="Enter number of persons"
          />

          {/* Show Current Location */}
          {userCoordinates && (
            <div className="mt-4 text-gray-700">
              <p>
                <strong>Latitude:</strong> {userCoordinates.latitude}
              </p>
              <p>
                <strong>Longitude:</strong> {userCoordinates.longitude}
              </p>
            </div>
          )}

          {/* SOS Button */}
          <Button
            type="primary"
            danger
            className="mt-5 text-lg font-semibold bg-red-500 hover:bg-red-600 transition rounded-lg"
            onClick={handleSOS}
            disabled={loading}
            style={{
              height: "200px",
              borderRadius: "50%",
              width: "200px",
            }}
          >
            {loading ? <Spin /> : "Send SOS Alert"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
