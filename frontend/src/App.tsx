import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { GroupDetail } from './pages/GroupDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;