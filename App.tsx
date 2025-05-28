
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HabitsPage from './pages/HabitsPage';
import MyPokemonPage from './pages/MyPokemonPage';
import PokedexPage from './pages/PokedexPage';
import LoginPage from './pages/LoginPage';
import BallOddsPage from './pages/BallOddsPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage'; // Import the ProfilePage
import RankingPage from './pages/RankingPage'; // Import the RankingPage
import { useUser } from './contexts/UserContext';

const App: React.FC = () => {
  const { currentUser, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-2xl font-bold text-yellow-400">Carregando Dados do Treinador...</div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
        {currentUser && <Navbar />}
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/" element={currentUser ? <HabitsPage /> : <Navigate to="/login" />} />
            <Route path="/my-pokemon" element={currentUser ? <MyPokemonPage /> : <Navigate to="/login" />} />
            <Route path="/pokedex" element={currentUser ? <PokedexPage /> : <Navigate to="/login" />} />
            <Route path="/ball-odds" element={currentUser ? <BallOddsPage /> : <Navigate to="/login" />} />
            <Route path="/stats" element={currentUser ? <StatsPage /> : <Navigate to="/login" />} />
            <Route path="/profile" element={currentUser ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="/ranking" element={currentUser ? <RankingPage /> : <Navigate to="/login" />} /> {/* Add new route for RankingPage */}
            <Route path="*" element={<Navigate to={currentUser ? "/" : "/login"} />} />
          </Routes>
        </main>
        {currentUser && (
          <footer className="text-center py-4 text-slate-400 border-t border-slate-700">
            Pokémon Habit Tracker - Hábitos: Temos que Pegar!
          </footer>
        )}
      </div>
    </HashRouter>
  );
};

export default App;