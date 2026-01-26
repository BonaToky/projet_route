import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ManagerLogin from './ManagerLogin';
import ManagerDashboard from './ManagerDashboard';
import './App.css';
import MapComponent from './MapComponent';
import InsertSignalement from './InsertSignalement';
import UtilisateurComponent from './UtilisateurComponent';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ManagerLogin />} />
          <Route path="/dashboard" element={<ManagerDashboard />} />
          <Route path="/map" element={<MapComponent />} />
          <Route path="/insert-signalement" element={<InsertSignalement />} />
          <Route path="/utilisateurs" element={<UtilisateurComponent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
