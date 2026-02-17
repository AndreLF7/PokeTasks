
import React, { useState, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';

const CalendarPage: React.FC = () => {
  const { currentUser } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());

  const completionData = useMemo(() => {
    if (!currentUser || !currentUser.completionHistory) return new Map<string, number>();
    const map = new Map<string, number>();
    currentUser.completionHistory.forEach(item => {
      map.set(item.date, item.count);
    });
    return map;
  }, [currentUser]);

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 

  const firstDayOfMonth = new Date(year, month, 1).getDay(); 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const changeMonth = (offset: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + offset);
      return newDate;
    });
  };

  const calendarDays = (): React.ReactNode[] => {
    const days: React.ReactNode[] = [];
    
    // Empty cells for alignment
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-start-${i}`} className="p-1 sm:p-2 border border-slate-700 h-16 sm:h-20 md:h-24 bg-slate-900/50"></div>);
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const completions = completionData.get(dateStr) || 0;
      const isToday = dateStr === todayStr;

      days.push(
        <div 
          key={day} 
          className={`p-1 sm:p-2 border relative text-left align-top 
                      ${isToday ? 'bg-yellow-500 border-yellow-600' : 'bg-slate-800 border-slate-700'} 
                      h-16 sm:h-20 md:h-24 transition-colors hover:bg-slate-700`}
        >
          <span className={`text-xs sm:text-sm font-medium ${isToday ? 'text-slate-900' : 'text-slate-300'}`}>{day}</span>
          {completions > 0 && (
            <span className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 text-xs sm:text-sm font-bold px-1.5 py-0.5 rounded-full
                             ${isToday ? 'bg-slate-800 text-yellow-300' : 'bg-green-500 text-white'}
                             flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6`}>
              {completions}
            </span>
          )}
        </div>
      );
    }

    // Remaining empty cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
        days.push(<div key={`empty-end-${i}`} className="p-1 sm:p-2 border border-slate-700 h-16 sm:h-20 md:h-24 bg-slate-900/50"></div>);
    }
    
    return days;
  };
  
  if (!currentUser) return <p className="text-center text-xl py-10 text-yellow-400">Carregando...</p>;

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-yellow-400">Calendário de Hábitos</h1>
        <p className="text-slate-300 text-base sm:text-lg mt-1">Visualize suas conclusões de hábitos ao longo do tempo.</p>
      </header>

      <div className="bg-slate-800 p-3 sm:p-4 md:p-6 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center mb-4 px-2">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-700 text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl sm:text-2xl font-semibold text-yellow-300">{monthNames[month]} {year}</h2>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-700 text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-700 border border-slate-700 rounded-lg overflow-hidden">
          {daysOfWeek.map(day => (
            <div key={day} className="p-2 text-center font-medium text-slate-400 text-xs sm:text-sm bg-slate-800 border-b border-slate-700">
              {day}
            </div>
          ))}
          {calendarDays()}
        </div>
      </div>
       <p className="text-sm text-slate-400 text-center mt-4 italic">
        O calendário mostra o número total de hábitos confirmados em cada dia.
      </p>
    </div>
  );
};

export default CalendarPage;
