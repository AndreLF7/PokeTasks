
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const Navbar: React.FC = () => {
  const { currentUser, logout, saveProfileToCloud } = useUser();
  const [isSavingNavbar, setIsSavingNavbar] = useState(false);
  const [navbarSaveMessage, setNavbarSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);


  const activeStyle = "text-yellow-400 border-b-2 border-yellow-400";
  const inactiveStyle = "text-slate-300 hover:text-yellow-400 transition-colors";

  const handleNavbarSave = async () => {
    setIsSavingNavbar(true);
    setNavbarSaveMessage(null);
    const result = await saveProfileToCloud();
    setNavbarSaveMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    setIsSavingNavbar(false);
    setTimeout(() => setNavbarSaveMessage(null), 3000); // Message disappears after 3 seconds
  };

  return (
    <nav className="bg-slate-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokeball Icon" className="h-8 w-8"/>
          <span className="text-xl font-bold text-yellow-400">Pokémon Habits</span>
        </div>
        <div className="flex items-center space-x-4 md:space-x-6">
          <NavLink to="/" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            Hábitos
          </NavLink>
          <NavLink to="/my-pokemon" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            Meus Pokémon
          </NavLink>
          <NavLink to="/pokedex" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            Pokédex
          </NavLink>
          <button
            onClick={handleNavbarSave}
            disabled={isSavingNavbar}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-lg text-sm transition-colors disabled:opacity-70"
            aria-live="polite"
          >
            {isSavingNavbar ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <div className="flex items-center space-x-4">
          {currentUser && (
            <NavLink
              to="/profile"
              className={({ isActive }) => `${isActive ? 'text-yellow-400 font-semibold' : 'text-slate-300 hover:text-yellow-400'} transition-colors px-2 py-1 rounded-md`}
              title="Ver Perfil"
            >
              {currentUser.username}
            </NavLink>
          )}
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 md:px-4 rounded-lg transition-colors text-sm md:text-base"
          >
            Sair
          </button>
        </div>
      </div>
      {navbarSaveMessage && (
        <div className={`fixed top-16 right-4 text-sm p-2 rounded-md shadow-lg z-50 ${navbarSaveMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
            role="alert"
        >
            {navbarSaveMessage.text}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
