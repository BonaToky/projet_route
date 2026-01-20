import { useState } from 'react';
import ManagerLogin from './ManagerLogin';
import ManagerDashboard from './ManagerDashboard';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <ManagerDashboard onLogout={handleLogout} />
      ) : (
        <ManagerLogin onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
