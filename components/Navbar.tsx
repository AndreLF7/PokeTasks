
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
// REMOVED: import { AVAILABLE_AVATARS } from '../constants'; 

const Navbar: React.FC = () => {
  const { currentUser, logout } = useUser();

  const activeStyle = "text-yellow-400 border-b-2 border-yellow-400";
  const inactiveStyle = "text-slate-300 hover:text-yellow-400 transition-colors";

  // REMOVED: currentAvatarDetails logic

  return (
    <nav className="bg-slate-800 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokeball Icon" className="h-8 w-8"/>
          <span className="text-xl font-bold text-yellow-400">Pokémon Habits</span>
        </div>
        <div className="flex items-center space-x-6">
          <NavLink to="/" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            Hábitos
          </NavLink>
          <NavLink to="/my-pokemon" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            Meus Pokémon
          </NavLink>
          <NavLink to="/pokedex" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            Pokédex
          </NavLink>
        </div>
        <div className="flex items-center space-x-4">
          {/* REMOVED: Avatar image display */}
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
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;