import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import { isAuthed } from './session.js';
import Layout from './components/Layout.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Bildirishnomalar from './pages/Bildirishnomalar.jsx';
import Sinfim from './pages/Sinfim.jsx';
import Darslar from './pages/Darslar.jsx';
import DarslarStudy from './pages/DarslarStudy.jsx';
import Vazifalar from './pages/Vazifalar.jsx';
import AmaliyDetail from './pages/AmaliyDetail.jsx';
import OyinCallback from './pages/OyinCallback.jsx';
import Tolovlar from './pages/Tolovlar.jsx';
import Ijtimoiy from './pages/Ijtimoiy.jsx';
import Natijalarim from './pages/Natijalarim.jsx';
import AdminGaYozish from './pages/AdminGaYozish.jsx';
import Sozlamalar from './pages/Sozlamalar.jsx';
import Bilet from './pages/Bilet.jsx';
import DTM from './pages/DTM.jsx';
import Kelajak from './pages/Kelajak.jsx';
import FeedbackTarix from './pages/FeedbackTarix.jsx';
import TestJarayoni from './pages/TestJarayoni.jsx';
import TestNatija from './pages/TestNatija.jsx';
import TestYechim from './pages/TestYechim.jsx';
import Tarif from './pages/Tarif.jsx';
import { Login, Register } from './pages/Auth.jsx';

// School edition: subjects are fixed per class -> no onboarding gate.
function RequireAuth({ children }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* immersive / no-sidebar routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/test/jarayon" element={<RequireAuth><TestJarayoni /></RequireAuth>} />
      <Route path="/test/natija" element={<RequireAuth><TestNatija /></RequireAuth>} />
      <Route path="/test/yechim" element={<RequireAuth><TestYechim /></RequireAuth>} />

      {/* sidebar pages */}
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/test" element={<Natijalarim />} />
        <Route path="/amaliy" element={<Navigate to="/vazifalar" replace />} />
        <Route path="/amaliy/:id" element={<AmaliyDetail />} />
        <Route path="/vazifalar" element={<Vazifalar />} />
        <Route path="/darslar" element={<Darslar />} />
        <Route path="/darslar/:courseId" element={<DarslarStudy />} />
        <Route path="/videodarslar" element={<Navigate to="/darslar?tab=video" replace />} />
        <Route path="/oyin/callback" element={<OyinCallback />} />
        <Route path="/bilet" element={<Bilet />} />
        <Route path="/natijalar" element={<Navigate to="/test" replace />} />
        <Route path="/sinfim" element={<Sinfim />} />
        <Route path="/dtm" element={<DTM />} />
        <Route path="/kelajak" element={<Kelajak />} />
        <Route path="/feedback-tarix" element={<FeedbackTarix />} />
        <Route path="/tolovlar" element={<Tolovlar />} />
        <Route path="/ijtimoiy" element={<Ijtimoiy />} />
        <Route path="/adminga-yozish" element={<AdminGaYozish />} />
        <Route path="/bildirishnomalar" element={<Bildirishnomalar />} />
        <Route path="/sozlamalar" element={<Sozlamalar />} />
        <Route path="/tarif" element={<Tarif />} />
        {/* legacy redirect */}
        <Route path="/guruhlarim" element={<Navigate to="/sinfim" replace />} />
      </Route>
    </Routes>
    </>
  );
}
