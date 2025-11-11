import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { AudioProvider } from './context/AudioContext';
import SoundToggle from './components/SoundToggle';
import Footer from './components/Footer';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import CustomQuestions from './pages/CustomQuestions';
import Game from './pages/Game';
import VoteReveal from './pages/VoteReveal';
import Results from './pages/Results';
import FinalRecap from './pages/FinalRecap';

function App() {
  return (
    <AudioProvider>
      <SocketProvider>
        <Router>
          <SoundToggle />
          <Footer />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/custom-questions" element={<CustomQuestions />} />
            <Route path="/game" element={<Game />} />
            <Route path="/vote-reveal" element={<VoteReveal />} />
            <Route path="/results" element={<Results />} />
            <Route path="/final-recap" element={<FinalRecap />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AudioProvider>
  );
}

export default App;
