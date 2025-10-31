import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import CustomQuestions from './pages/CustomQuestions';
import Game from './pages/Game';
import VoteReveal from './pages/VoteReveal';
import Results from './pages/Results';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/custom-questions" element={<CustomQuestions />} />
          <Route path="/game" element={<Game />} />
          <Route path="/vote-reveal" element={<VoteReveal />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
