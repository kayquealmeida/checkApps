import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import PagPrincipal from './PagPrincipal/PagPrincipal';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PagPrincipal />} />
      </Routes>
    </Router>
  );
}
