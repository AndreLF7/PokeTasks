
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Toast from './components/Toast'; // Import Toast
import HabitsPage from './pages/HabitsPage';
import MyPokemonPage from './pages/MyPokemonPage';
import PokedexPage from './pages/PokedexPage';
import BallFilteredPokedexPage from './pages/BallFilteredPokedexPage';
import GymLeadersPage from './pages/GymLeadersPage'; // Import GymLeadersPage
import LoginPage from './pages/LoginPage';
import BallOddsPage from './pages/BallOddsPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import RankingPage from './pages/RankingPage';
import TrainerPublicProfilePage from './pages/TrainerPublicProfilePage';
import TrainerPublicHabitsPage from './pages/TrainerPublicHabitsPage';
import SharedHabitsPage from './pages/SharedHabitsPage'; 
import HabitProgressionPage from './pages/HabitProgressionPage';
import PeriodicHabitsPage from './pages/PeriodicHabitsPage'; 
import ShopPage from './pages/ShopPage';
import { useUser } from './contexts/UserContext';

const App: React.FC = () => {
  const { currentUser, loading, toastMessage, clearToastMessage } = useUser();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (toastMessage) {
      timer = setTimeout(() => {
        clearToastMessage();
      }, 5000); // Auto-dismiss after 5 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [toastMessage, clearToastMessage]);

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
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-8">
          <Routes>
            <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/" element={currentUser ? <HabitsPage /> : <Navigate to="/login" />} />
            <Route path="/shop" element={currentUser ? <ShopPage /> : <Navigate to="/login" />} />
            <Route path="/my-pokemon" element={currentUser ? <MyPokemonPage /> : <Navigate to="/login" />} />
            <Route path="/pokedex" element={currentUser ? <PokedexPage /> : <Navigate to="/login" />} />
            <Route path="/pokedex/:ballType" element={currentUser ? <BallFilteredPokedexPage /> : <Navigate to="/login" />} />
            <Route path="/gym-leaders" element={currentUser ? <GymLeadersPage /> : <Navigate to="/login" />} />
            <Route path="/shared-habits" element={currentUser ? <SharedHabitsPage /> : <Navigate to="/login" />} />
            <Route path="/habit-progression" element={currentUser ? <HabitProgressionPage /> : <Navigate to="/login" />} />
            <Route path="/periodic-habits" element={currentUser ? <PeriodicHabitsPage /> : <Navigate to="/login" />} /> 
            <Route path="/ball-odds" element={currentUser ? <BallOddsPage /> : <Navigate to="/login" />} />
            <Route path="/stats" element={currentUser ? <StatsPage /> : <Navigate to="/login" />} />
            <Route path="/profile" element={currentUser ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="/ranking" element={currentUser ? <RankingPage /> : <Navigate to="/login" />} />
            <Route path="/trainer/:username" element={currentUser ? <TrainerPublicProfilePage /> : <Navigate to="/login" />} />
            <Route path="/trainer/:username/habits" element={currentUser ? <TrainerPublicHabitsPage /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to={currentUser ? "/" : "/login"} />} />
          </Routes>
        </main>
        {currentUser && (
          <footer className="text-center py-4 text-slate-400 border-t border-slate-700">
            Pokémon Habit Tracker - Hábitos: Temos que Pegar!
          </footer>
        )}
      </div>
      {toastMessage && (
        <Toast
          key={toastMessage.id} 
          message={toastMessage.text}
          type={toastMessage.type}
          imageUrl={toastMessage.leaderImageUrl}
          onClose={clearToastMessage}
        />
      )}
    </HashRouter>
  );
};

export default App;
