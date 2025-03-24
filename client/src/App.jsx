import { BrowserRouter, Route, Routes } from "react-router-dom";
import Register from "./auth/Register";
import Login from "./auth/Login";
import Home from "./Pages/Home";
import Shelters from "./Pages/Shelters";
import SOSAlert from "./Pages/sos";
import FoodRegions from "./Pages/foodRegions";
import News from "./admin/News";
import AdminShelters from "./admin/AdminShelters";
import AdminFoodProvidingRegions from "./admin/AdminFood";
import AdminSOSAlerts from "./admin/AdminSOS";
import UploadedNews from "./admin/UploadedNews";
import UploadShelters from "./admin/UploadShelters";
import UploadFood from "./admin/UploadFood";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Home />} />
          <Route path="/shelters" element={<Shelters />} />
          <Route path="/sos-alert" element={<SOSAlert />} />
          <Route path="/food-regions" element={<FoodRegions />} />

          {/* Admin  */}
          <Route path="/admin/news" element={<News />} />
          <Route path="/admin/shelters" element={<AdminShelters />} />
          <Route path="/admin/food" element={<AdminFoodProvidingRegions />} />
          <Route path="/admin/sos" element={<AdminSOSAlerts />} />
          <Route path="/admin/upload-news" element={<UploadedNews />} />
          <Route path="/admin/upload-shelters" element={<UploadShelters />} />
          <Route path="/admin/upload-food" element={<UploadFood />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
