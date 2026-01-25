import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ManagerLogin from './ManagerLogin';
import ManagerDashboard from './ManagerDashboard';
import VisitorDashboard from './VisitorDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ManagerLogin />} />
          <Route path="/dashboard" element={<ManagerDashboard />} />
          <Route path="/visiteur" element={<VisitorDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
