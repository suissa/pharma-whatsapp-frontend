import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import WhatsAppPage from './pages';
import DLQ from './pages/DLQ';
import './App.css';

// Componente de navegação
function Navigation() {
  const location = useLocation();
  
}

function App() {
  return (
    <Router>
      <div className="relative">
        <Routes>
          <Route path="/" element={<WhatsAppPage />} />
          <Route path="/dlq" element={<DLQ />} />
          <Route path="/:instanceId" element={<WhatsAppPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
