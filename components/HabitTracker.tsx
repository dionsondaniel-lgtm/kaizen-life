import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, Check, Flame, Trash2, MoreVertical, X, AlertTriangle, 
  Trophy, BarChart3, Activity
} from 'lucide-react';
import { 
  format, subDays, eachDayOfInterval, differenceInDays, 
  parseISO, isSameDay
} from 'date-fns';
import { Habit } from '../types';
import Modal from './Modal';

interface HabitTrackerProps {
  habits: Habit[];
  onUpdateHabits: (habits: Habit[]) => void;
  colorTheme: string;
}

type ViewMode = 'week' | 'month' | 'quarter' | 'year';

export const HabitTracker: React.FC<HabitTrackerProps> = ({ habits, onUpdateHabits, colorTheme }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({ title: '', color: 'bg-blue-500' });
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  
  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const colors = [
    'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 
    'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'
  ];

  const today = format(new Date(), 'yyyy-MM-dd');

  // --- LOGIC HANDLERS ---

  const toggleHabitForDate = (habitId: string, dateStr: string) => {
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      const exists = h.history.includes(dateStr);
      const newHistory = exists 
        ? h.history.filter(d => d !== dateStr)
        : [...h.history, dateStr].sort();
      
      if (selectedHabit?.id === habitId) {
        setSelectedHabit({ ...h, history: newHistory });
      }
      return { ...h, history: newHistory };
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
      setSelectedHabit(null);
    }
  };

  // --- STATS CALCULATIONS ---

  const getStreak = (history: string[]) => {
    let streak = 0;
    const sortedHistory = [...history].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let checkDate = new Date();
    const todayStr = format(checkDate, 'yyyy-MM-dd');
    
    if (!sortedHistory.includes(todayStr)) {
      checkDate = subDays(checkDate, 1);
    }

    while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        if (history.includes(dateStr)) {
            streak++;
            checkDate = subDays(checkDate, 1);
        } else {
            break;
        }
    }
    return streak;
  };

  const getLongestStreak = (history: string[]) => {
    if (history.length === 0) return 0;
    const sorted = [...history].sort();
    let max = 1;
    let current = 1;

    for (let i = 1; i < sorted.length; i++) {
        const prev = parseISO(sorted[i-1]);
        const curr = parseISO(sorted[i]);
        if (differenceInDays(curr, prev) === 1) {
            current++;
        } else {
            max = Math.max(max, current);
            current = 1;
        }
    }
    return Math.max(max, current);
  };

  const getConsistency = (habit: Habit) => {
    const daysSinceCreation = differenceInDays(new Date(), new Date(habit.createdAt || Date.now())) + 1;
    const window = Math.min(daysSinceCreation, 30); 
    if (window === 0) return 0;
    
    let count = 0;
    for(let i=0; i<window; i++) {
      if(habit.history.includes(format(subDays(new Date(), i), 'yyyy-MM-dd'))) count++;
    }
    return Math.round((count / window) * 100);
  };

  // --- HEATMAP COMPONENT ---

  const Heatmap = ({ habit }: { habit: Habit }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to end when Year view is active
    useEffect(() => {
      if (viewMode === 'year' && scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    }, [viewMode]);

    const { days, gridClass, containerClass } = useMemo(() => {
      let start: Date;
      let grid = '';
      let container = '';

      switch (viewMode) {
        case 'week':
          start = subDays(new Date(), 6);
          grid = 'grid-cols-7 gap-3'; 
          break;
        case 'month':
          start = subDays(new Date(), 29);
          grid = 'grid-cols-7 gap-2'; 
          break;
        case 'quarter':
          start = subDays(new Date(), 89);
          grid = 'grid-cols-10 gap-1.5'; 
          break;
        case 'year':
          start = subDays(new Date(), 364);
          // Fixed height grid, fills columns first
          grid = 'grid-flow-col grid-rows-7 gap-1'; 
          // Scrollable container with padding right for the "Today" indicator
          container = 'overflow-x-auto pb-2 pr-4'; 
          break;
        default:
          start = subDays(new Date(), 29);
          grid = 'grid-cols-7 gap-2';
      }

      return {
        days: eachDayOfInterval({ start, end: new Date() }),
        gridClass: grid,
        containerClass: container
      };
    }, [viewMode]);

    return (
      <div className="space-y-4">
        {/* View Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg w-full sm:w-auto self-start">
          {(['week', 'month', 'quarter', 'year'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                viewMode === mode 
                  ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {mode === 'quarter' ? '3 Months' : mode}
            </button>
          ))}
        </div>

        {/* The Grid Container */}
        <div 
          ref={scrollRef} 
          className={`w-full ${containerClass} scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent`}
        >
           <div className={`grid ${gridClass}`}>
            {days.map((day) => {
               const dateStr = format(day, 'yyyy-MM-dd');
               const isDone = habit.history.includes(dateStr);
               const isToday = isSameDay(day, new Date());
               
               // Dynamic Sizing
               let sizeClass = 'h-3 w-3'; 
               if (viewMode === 'month') sizeClass = 'aspect-square w-full';
               if (viewMode === 'week') sizeClass = 'h-10 w-full';

               return (
                 <div 
                   key={dateStr}
                   className="group relative flex flex-col items-center justify-center"
                 >
                   <div 
                     className={`
                       ${sizeClass} rounded-md transition-all duration-300
                       ${isDone 
                         ? `${habit.color} shadow-sm shadow-${habit.color.replace('bg-', '')}/40` 
                         : 'bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600'
                       }
                       ${isToday && !isDone ? 'ring-2 ring-slate-300 dark:ring-slate-500' : ''}
                     `}
                   />
                   
                   {/* Tooltip */}
                   <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 whitespace-nowrap pointer-events-none">
                      <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                        {format(day, 'MMM d, yyyy')} • {isDone ? 'Completed' : 'Missed'}
                      </div>
                      <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1"></div>
                   </div>

                   {/* Labels for Week View */}
                   {viewMode === 'week' && (
                     <span className="text-[10px] text-slate-400 mt-1">{format(day, 'EEE')}</span>
                   )}
                 </div>
               );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3">
           <span>Total: <strong className="text-slate-700 dark:text-slate-200">{days.filter(d => habit.history.includes(format(d, 'yyyy-MM-dd'))).length}</strong></span>
           <div className="flex gap-1 items-center">
             <span>Missed</span>
             <div className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-700/50"></div>
             <div className={`w-3 h-3 rounded ${habit.color}`}></div>
             <span>Done</span>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative z-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className={`text-${colorTheme}-500 fill-${colorTheme}-500`} size={24} /> 
            Atomic Habits
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">1% better every day.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)} 
          className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-${colorTheme}-600 text-white font-bold hover:bg-${colorTheme}-700 transition shadow-lg shadow-${colorTheme}-500/20 active:scale-95`}
        >
          <Plus size={16} /> <span className="hidden sm:inline">New Habit</span>
        </button>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {habits.map(habit => {
          const isDoneToday = habit.history.includes(today);
          const streak = getStreak(habit.history);
          const isMenuOpen = menuOpenId === habit.id;

          return (
            <div 
              key={habit.id} 
              onClick={() => setSelectedHabit(habit)}
              className={`
                 group relative bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700
                 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer
                 ${isMenuOpen ? 'z-30 ring-2 ring-slate-300 dark:ring-slate-600' : ''}
              `}
            >
               <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 bg-gradient-to-br from-${habit.color.replace('bg-', '')} to-transparent transition-opacity`} />

               <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex-1 min-w-0 pr-3">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate mb-1">{habit.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <div className={`flex items-center gap-1 ${streak > 0 ? 'text-orange-500' : ''}`}>
                         <Flame size={14} className={streak > 0 ? 'fill-orange-500 animate-pulse' : ''} />
                         <span>{streak} day streak</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          toggleHabitForDate(habit.id, today);
                        }}
                        className={`
                          w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 transform active:scale-90
                          ${isDoneToday 
                             ? `${habit.color} text-white shadow-lg shadow-${habit.color.replace('bg-', '')}/40` 
                             : 'bg-slate-100 dark:bg-slate-700 text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}
                        `}
                      >
                        <Check className="w-6 h-6" strokeWidth={3} />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : habit.id);
                        }}
                        className={`p-2 rounded-full transition ${isMenuOpen ? 'bg-slate-200 dark:bg-slate-700' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >
                        <MoreVertical size={18} />
                      </button>
                  </div>
               </div>

               {/* Mini Weekly Chart */}
               <div className="flex gap-1.5 relative z-10">
                  {Array.from({length: 7}).map((_, i) => {
                     const d = subDays(new Date(), 6 - i);
                     const dStr = format(d, 'yyyy-MM-dd');
                     const done = habit.history.includes(dStr);
                     const isToday = dStr === today;
                     return (
                       <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                         <div 
                           className={`
                             w-full h-1.5 rounded-full transition-all duration-300
                             ${done ? habit.color : 'bg-slate-100 dark:bg-slate-700'} 
                             ${isToday ? 'h-2 ring-1 ring-slate-300 dark:ring-slate-500' : ''}
                           `} 
                         />
                       </div>
                     );
                  })}
               </div>

               {/* Dropdown Menu */}
               {isMenuOpen && (
                  <div className="absolute right-4 top-16 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-36 overflow-hidden animate-scale-in z-50">
                      <button onClick={(e) => initiateDelete(e, habit.id)} className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-left">
                        <Trash2 size={14} /> Delete
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); }} className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 text-left">
                        <X size={14} /> Cancel
                      </button>
                  </div>
                )}
            </div>
          );
        })}
        
        {habits.length === 0 && (
          <div onClick={() => setShowAdd(true)} className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Plus size={32} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500" />
            </div>
            <p className="font-bold text-lg text-slate-600 dark:text-slate-300">No habits yet</p>
            <p className="text-sm">Click to start your journey of 1% improvement.</p>
          </div>
        )}
      </div>

      {/* --- ADD MODAL --- */}
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

      {/* --- DETAIL MODAL --- */}
      {selectedHabit && (
        <Modal isOpen={!!selectedHabit} onClose={() => setSelectedHabit(null)} title={selectedHabit.title}>
           <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Streak</div>
                    <div className="flex items-center gap-1 text-xl font-black text-slate-800 dark:text-white">
                       <Flame size={16} className="text-orange-500 fill-orange-500" />
                       {getStreak(selectedHabit.history)}
                    </div>
                 </div>
                 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Best</div>
                    <div className="flex items-center gap-1 text-xl font-black text-slate-800 dark:text-white">
                       <Trophy size={16} className="text-yellow-500 fill-yellow-500" />
                       {getLongestStreak(selectedHabit.history)}
                    </div>
                 </div>
                 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total</div>
                    <div className="flex items-center gap-1 text-xl font-black text-slate-800 dark:text-white">
                       <Check size={16} className={`text-${colorTheme}-500`} />
                       {selectedHabit.history.length}
                    </div>
                 </div>
                 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Score</div>
                    <div className="flex items-center gap-1 text-xl font-black text-slate-800 dark:text-white">
                       <Activity size={16} className="text-emerald-500" />
                       {getConsistency(selectedHabit)}%
                    </div>
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BarChart3 size={18} /> History
                    </h4>
                 </div>
                 <Heatmap habit={selectedHabit} />
              </div>
              
              <div className="flex gap-3 pt-2">
                 <button onClick={(e) => initiateDelete(e, selectedHabit.id)} className="flex-1 py-2.5 border border-red-200 dark:border-red-900/50 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm">
                   <Trash2 size={16} /> Delete
                 </button>
                 <button onClick={() => setSelectedHabit(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-bold transition text-sm">
                   Close
                 </button>
              </div>
           </div>
        </Modal>
      )}

      {/* --- DELETE MODAL --- */}
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