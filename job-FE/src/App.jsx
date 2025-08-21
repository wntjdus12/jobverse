import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MapPage from "./components/MapPage";
import { useEffect, useState } from "react";
import PrivateRoute from "./route/PrivateRoute";
import api from "./utils/api";
import MainPage from "./pages/MainPage";
import MyPage from "./pages/MyPage";
import MusicPage from "./components/vid/MusicPage";




function App() {
  const [user, setUser] = useState();
  const getUser = async () => {
     try {
      const storedToken = sessionStorage.getItem("token");
      console.log("storedToken", storedToken)
      if (storedToken) {
        const response = await api.get("/user/me");
        console.log("dsds", response)
        setUser(response.data.user);
      }
     } catch (error) {
      setUser(null);
     }
  }

useEffect(()=> {
  getUser()
}, [])

  return (
    <Routes>
      <Route path="/" element={<PrivateRoute user={user}><MainPage /></PrivateRoute>} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/login" element={<LoginPage user={user} setUser={setUser}/>} />
      <Route path="/mypage" element={<MyPage/>} />
      <Route path="/musicpage" element={<MusicPage/>} />
      
    </Routes>
  );
}

export default App;

