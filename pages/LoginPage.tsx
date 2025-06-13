
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Added password state
  const { login } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage("Por favor, insira seu nome de treinador.");
      return;
    }
    if (!password) { // Check if password is empty
      setErrorMessage("Por favor, insira sua senha.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    // Pass password to login function
    const result = await login(username.trim(), password);
    setIsLoading(false);
    if (!result.success) {
      setErrorMessage(result.message || "Falha no login. Verifique seu nome de usuário e senha.");
    }
    // Navigation will happen automatically if login is successful due to App.tsx logic
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
          alt="Pikachu"
          className="w-32 h-32 mx-auto mb-6"
        />
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">Bem-vindo, Treinador!</h1>
        <p className="text-slate-300 mb-8">Digite seu nome e senha para começar sua jornada de Hábitos Pokémon.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1 text-left">
              Nome do Treinador
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              placeholder="Ex: Ash Ketchum"
              required
              disabled={isLoading}
              aria-label="Nome do Treinador"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1 text-left">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              placeholder="Sua senha secreta"
              required
              disabled={isLoading}
              aria-label="Senha"
            />
             <p className="text-xs text-slate-400 mt-1 text-left">Se for seu primeiro login, esta será sua senha.</p>
          </div>
          {errorMessage && (
            <p className="text-sm text-red-400 bg-red-900 bg-opacity-50 p-2 rounded-md" role="alert">{errorMessage}</p>
          )}
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isLoading || !username.trim() || !password}
          >
            {isLoading ? 'Verificando...' : 'Login'}
          </button>
        </form>
      </div>
      <footer className="text-center py-8 text-slate-500 mt-8">
        Embarque em uma jornada para construir bons hábitos e pegar todos!
      </footer>
    </div>
  );
};

export default LoginPage;
