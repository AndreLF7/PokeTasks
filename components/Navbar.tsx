
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { MIN_LEVEL_FOR_SHARED_HABITS, AVATAR_OPTIONS, DEFAULT_AVATAR_ID } from '../constants';

const Navbar: React.FC = () => {
  const { currentUser, logout, saveProfileToCloud, calculatePlayerLevelInfo } = useUser();
  const [isSavingNavbar, setIsSavingNavbar] = useState(false);
  const [navbarSaveMessage, setNavbarSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeStyle = "text-yellow-400 border-b-2 border-yellow-400";
  const inactiveStyle = "text-slate-300 hover:text-yellow-400 transition-colors";
  
  const mobileActiveStyle = "block w-full text-left py-2 px-3 rounded-md text-yellow-400 bg-slate-700 font-semibold";
  const mobileInactiveStyle = "block w-full text-left py-2 px-3 rounded-md text-slate-300 hover:text-yellow-400 hover:bg-slate-700";
  const mobileButtonStyle = "block w-full text-left py-2 px-3 rounded-md text-slate-300 hover:text-yellow-400 hover:bg-slate-700 transition-colors disabled:opacity-70";

  const playerLevel = currentUser ? calculatePlayerLevelInfo(currentUser.experiencePoints).level : 0;
  const canAccessSharedHabits = playerLevel >= MIN_LEVEL_FOR_SHARED_HABITS;

  const selectedAvatar = currentUser 
    ? AVATAR_OPTIONS.find(av => av.id === currentUser.avatarId) || AVATAR_OPTIONS.find(av => av.id === DEFAULT_AVATAR_ID) || AVATAR_OPTIONS[0]
    : AVATAR_OPTIONS[0];


  const handleNavbarSave = async () => {
    setIsSavingNavbar(true);
    setNavbarSaveMessage(null);
    const result = await saveProfileToCloud();
    setNavbarSaveMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    setIsSavingNavbar(false);
    setTimeout(() => setNavbarSaveMessage(null), 3000);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="bg-slate-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo and App Title */}
          <div className="flex items-center space-x-2">
            {/* Avatar removed from here (desktop view beside title) */}
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokeball Icon" className="h-8 w-8"/>
            <NavLink to="/" onClick={closeMobileMenu} className="text-xl font-bold text-yellow-400">Pokémon Habits</NavLink>
          </div>

          {/* Desktop Menu (Links & Save Button) */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <NavLink to="/" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>Hábitos</NavLink>
            {canAccessSharedHabits && (
              <NavLink to="/shared-habits" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>Colaborativos</NavLink>
            )}
            <NavLink to="/my-pokemon" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>Meus Pokémon</NavLink>
            <NavLink to="/pokedex" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>Pokédex</NavLink>
            <NavLink to="/gym-leaders" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>Líderes</NavLink>
            <NavLink to="/ranking" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>Ranking</NavLink>
            <button
              onClick={handleNavbarSave}
              disabled={isSavingNavbar}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-lg text-sm transition-colors disabled:opacity-70"
              aria-live="polite"
            >
              {isSavingNavbar ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

          {/* Desktop Menu (Profile & Logout) */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser && (
              <NavLink
                to="/profile"
                className={({ isActive }) => `${isActive ? 'text-yellow-400 font-semibold' : 'text-slate-300 hover:text-yellow-400'} transition-colors px-2 py-1 rounded-md flex items-center`}
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

          {/* Mobile Menu Button with Avatar */}
          <div className="md:hidden flex items-center space-x-2">
            {selectedAvatar && <img src={selectedAvatar.navbarSpriteUrl} alt="Trainer Avatar" className="h-7 w-7 rounded-full object-contain bg-slate-700 p-0.5" />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-300 hover:text-yellow-400 focus:outline-none focus:text-yellow-400 p-1"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu (Collapsible) */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-2" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
              <NavLink to="/" className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle} onClick={closeMobileMenu}>Hábitos</NavLink>
              {canAccessSharedHabits && (
                <NavLink to="/shared-habits" className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle} onClick={closeMobileMenu}>Colaborativos</NavLink>
              )}
              <NavLink to="/my-pokemon" className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle} onClick={closeMobileMenu}>Meus Pokémon</NavLink>
              <NavLink to="/pokedex" className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle} onClick={closeMobileMenu}>Pokédex</NavLink>
              <NavLink to="/gym-leaders" className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle} onClick={closeMobileMenu}>Líderes</NavLink>
              <NavLink to="/ranking" className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle} onClick={closeMobileMenu}>Ranking</NavLink>
              
              <hr className="border-slate-700 my-2"/>
              
              {currentUser && (
                <NavLink to="/profile" className={({ isActive }) => `${isActive ? mobileActiveStyle : mobileInactiveStyle} flex items-center`} onClick={closeMobileMenu}>
                  Perfil ({currentUser.username})
                </NavLink>
              )}
              <button 
                onClick={() => { handleNavbarSave(); closeMobileMenu(); }} 
                disabled={isSavingNavbar} 
                className={mobileButtonStyle}
                aria-live="polite"
              >
                {isSavingNavbar ? 'Salvando...' : 'Salvar Dados'}
              </button>
              <button 
                onClick={() => { logout(); closeMobileMenu(); }} 
                className={mobileButtonStyle}
              >
                Sair
              </button>
            </div>
          </div>
        )}
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
