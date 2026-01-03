import React, { useState } from 'react';
import { Plus, Check, Flame, Trash2, MoreVertical, X, AlertTriangle } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Habit } from '../types';
import Modal from './Modal';

interface HabitTrackerProps {
  habits: Habit[];
  onUpdateHabits: (habits: Habit[]) => void;
  colorTheme: string;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ habits, onUpdateHabits, colorTheme }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({ title: '', color: 'bg-blue-500' });
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const colors = [
    'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 
    'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'
  ];

  const today = format(new Date(), 'yyyy-MM-dd');

  const toggleHabitForDate = (habitId: string, dateStr: string) => {
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      const exists = h.history.includes(dateStr);
      return {
        ...h,
        history: exists 
          ? h.history.filter(d => d !== dateStr)
          : [...h.history, dateStr].sort()
      };
    });
    onUpdateHabits(updated);
  };

  const addHabit = () => {
    if (!newHabit.title.trim()) return;
    const habit: Habit = {
      id: Date.now().toString(),
      title: newHabit.title,
      color: newHabit.color,
      history: [],
      createdAt: Date.now()
    };
    onUpdateHabits([...habits, habit]);
    setNewHabit({ title: '', color: 'bg-blue-500' });
    setShowAdd(false);
  };

  const initiateDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      const updated = habits.filter(h => h.id !== deleteId);
      onUpdateHabits(updated);
      setDeleteId(null);
    }
  };

  const getStreak = (habit: Habit) => {
    let streak = 0;
    const sortedHistory = [...habit.history].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let checkDate = new Date();
    // Check if done today or yesterday to maintain streak
    if (!sortedHistory.includes(format(checkDate, 'yyyy-MM-dd'))) {
        checkDate = subDays(checkDate, 1);
        if (!sortedHistory.includes(format(checkDate, 'yyyy-MM-dd'))) {
            return 0;
        }
    }

    while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        if (habit.history.includes(dateStr)) {
            streak++;
            checkDate = subDays(checkDate, 1);
        } else {
            break;
        }
    }
    return streak;
  };

  return (
    <div className="relative z-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Flame className={`text-${colorTheme}-500`} size={24} /> Atomic Habits
        </h2>
        <button onClick={() => setShowAdd(true)} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-${colorTheme}-100 text-${colorTheme}-700 font-bold hover:bg-${colorTheme}-200 transition shadow-sm`}>
          <Plus size={14} /> New Habit
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map(habit => {
          const isDoneToday = habit.history.includes(today);
          const streak = getStreak(habit);
          const isMenuOpen = menuOpenId === habit.id;

          return (
            <div 
              key={habit.id} 
              className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between relative transition-all ${isMenuOpen ? 'z-30 ring-2 ring-slate-300 dark:ring-slate-600' : 'z-0 hover:shadow-md'}`}
            >
               <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white truncate pr-2 text-lg">{habit.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                      <Flame size={14} className={streak > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-slate-300'} />
                      <span className={streak > 0 ? 'text-orange-600 dark:text-orange-400' : ''}>
                        {streak} day streak
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 relative">
                      <button 
                        onClick={() => toggleHabitForDate(habit.id, today)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all transform active:scale-90 ${isDoneToday ? `${habit.color} shadow-lg shadow-${habit.color.replace('bg-', '')}/30` : 'bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        title={isDoneToday ? "Completed today" : "Mark done"}
                      >
                        <Check className={`w-6 h-6 ${isDoneToday ? 'text-white' : ''}`} strokeWidth={3} />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : habit.id);
                        }}
                        className={`p-1 rounded-full transition ${isMenuOpen ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-12 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-32 overflow-hidden animate-scale-in z-50">
                           <button 
                             onClick={(e) => initiateDelete(e, habit.id)}
                             className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
                           >
                             <Trash2 size={14} /> Delete
                           </button>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setMenuOpenId(null);
                             }}
                             className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                           >
                             <X size={14} /> Cancel
                           </button>
                        </div>
                      )}
                  </div>
               </div>
               
               <div className="flex gap-1 mt-4">
                  {Array.from({length: 7}).map((_, i) => {
                     const d = subDays(new Date(), 6 - i);
                     const dStr = format(d, 'yyyy-MM-dd');
                     const done = habit.history.includes(dStr);
                     const isToday = dStr === today;
                     return (
                       <div key={i} className="flex-1 flex flex-col items-center gap-1 group/day">
                         <div 
                           className={`w-full h-1.5 rounded-full transition-all ${done ? habit.color : 'bg-slate-200 dark:bg-slate-800'} ${isToday ? 'h-2 ring-2 ring-offset-1 ring-slate-200 dark:ring-slate-700' : ''}`} 
                           title={format(d, 'MMM d')}
                         />
                       </div>
                     );
                  })}
               </div>
            </div>
          );
        })}
        
        {habits.length === 0 && (
          <div 
            onClick={() => setShowAdd(true)}
            className="col-span-full py-8 text-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
          >
            <p className="font-medium">No habits tracking yet.</p>
            <p className="text-sm">Click to start your first atomic habit.</p>
          </div>
        )}
      </div>

      {/* Add Habit Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create New Habit">
         <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Habit Name</label>
              <input 
                placeholder="e.g. Read 10 pages, Drink Water"
                className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={newHabit.title}
                onChange={e => setNewHabit({...newHabit, title: e.target.value})}
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Color Tag</label>
              <div className="flex gap-3 flex-wrap">
                {colors.map(c => (
                  <button 
                    key={c}
                    onClick={() => setNewHabit({...newHabit, color: c})}
                    className={`w-10 h-10 rounded-full ${c} transition-transform hover:scale-110 ${newHabit.color === c ? 'ring-4 ring-offset-2 ring-slate-200 dark:ring-slate-700 scale-110' : 'opacity-70 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>

            <button onClick={addHabit} className={`w-full py-3.5 bg-${colorTheme}-600 text-white font-bold rounded-xl hover:bg-${colorTheme}-700 shadow-lg shadow-${colorTheme}-500/30 transition-all transform active:scale-95`}>
              Start Building Habit
            </button>
         </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Habit">
         <div className="flex flex-col items-center justify-center space-y-6 text-center p-2">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full animate-bounce">
               <AlertTriangle size={48} />
            </div>
            <div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirm Deletion</h3>
               <p className="text-slate-500 dark:text-slate-400">Are you sure you want to delete this habit? All tracking history for it will be lost permanently.</p>
            </div>
            <div className="flex gap-4 w-full">
               <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition hover:bg-slate-200 dark:hover:bg-slate-700">Cancel</button>
               <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/30">Delete Habit</button>
            </div>
         </div>
      </Modal>
    </div>
  );
};