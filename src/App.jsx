import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import EditorPage from "./pages/EditorPage";
import GalleryPage from "./pages/GalleryPage";
import CreatorsPage from "./pages/CreatorsPage";
import FeedPage from "./pages/FeedPage";
import CanvasViewPage from "./pages/CanvasViewPage";
import MyCanvasesPage from "./pages/MyCanvasesPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/creators" element={<CreatorsPage />} />
          <Route path="/p/:id" element={<CanvasViewPage />} />
          <Route path="/my-canvases" element={<MyCanvasesPage />} />
          <Route path="/u/:username" element={<ProfilePage />} />
          <Route path="/settings/profile" element={<EditProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
