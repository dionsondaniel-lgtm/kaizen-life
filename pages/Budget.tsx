import React, { useState, useMemo } from 'react';
import { 
  Plus, FileText, Presentation, TrendingUp, BarChart2, 
  Pencil, Trash2, BatteryWarning, BatteryCharging,
  PieChart as PieIcon, BarChart as BarIcon, AlertTriangle, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Transaction } from '../types';
import { getCurrencySymbol } from '../services/storage';
import { COMMON_DESCRIPTIONS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';
import { downloadFile, generateBudgetWord, generateBudgetPPT } from '../utils/exporter';
import Modal from '../components/Modal';

interface BudgetProps {
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  currency: string;
  updateCurrency: (c: string) => void;
  colorTheme: string;
  t: (k: string) => string;
}

const Budget: React.FC<BudgetProps> = ({ transactions, setTransactions, currency, updateCurrency, colorTheme, t }) => {
  const [view, setView] = useState<'overview' | 'transactions'>('overview');
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ 
    title: '', 
    amount: '', 
    type: 'expense' as 'expense'|'income', 
    category: 'Others', 
    date: format(new Date(), 'yyyy-MM-dd') 
  });

  const currencySymbol = getCurrencySymbol(currency);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ title: '', amount: '', type: 'expense', category: 'Others', date: format(new Date(), 'yyyy-MM-dd') });
    setIsFormOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setEditingId(t.id);
    setFormData({
      title: t.title,
      amount: t.amount.toString(),
      type: t.type,
      category: t.category,
      date: format(new Date(t.date), 'yyyy-MM-dd')
    });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if(!formData.title || !formData.amount) return;
    const val = parseFloat(formData.amount);
    
    if (editingId) {
       setTransactions(transactions.map(t => t.id === editingId ? {
          ...t,
          title: formData.title,
          amount: val,
          type: formData.type,
          category: formData.category,
          date: new Date(formData.date).toISOString()
       } : t));
    } else {
       const tx: Transaction = {
         id: Date.now().toString(),
         title: formData.title,
         amount: val,
         type: formData.type,
         category: formData.category,
         date: new Date(formData.date).toISOString()
       };
       setTransactions([tx, ...transactions]);
    }
    setIsFormOpen(false);
  };

  const promptDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setTransactions(transactions.filter(t => t.id !== deleteId));
      setDeleteId(null);
    }
  };

  // Explicit number typing for calculations
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((acc: number, t) => acc + Number(t.amount), 0);
    
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: number, t) => acc + Number(t.amount), 0);
    
  const balance = income - expense;

  // Analysis Logic
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const isDeficit = expense > income;

  let batteryColor = 'bg-green-500';
  let batteryStatus = 'Excellent';
  let batteryMessage = 'You are in great financial shape!';
  
  if (isDeficit) {
    batteryColor = 'bg-red-500 animate-pulse';
    batteryStatus = 'Critical';
    batteryMessage = 'Expenses exceed income. Review your budget.';
  } else if (savingsRate < 10) {
    batteryColor = 'bg-red-500';
    batteryStatus = 'Warning';
    batteryMessage = 'Savings rate is low (<10%).';
  } else if (savingsRate < 25) {
    batteryColor = 'bg-yellow-400';
    batteryStatus = 'Fair';
    batteryMessage = 'You are saving a moderate amount.';
  } else {
    batteryColor = 'bg-green-500';
    batteryStatus = 'Healthy';
    batteryMessage = 'Great job! High savings rate.';
  }

  // --- Chart Data Preparation ---
  const chartData = useMemo(() => {
    const grouped = transactions.reduce((acc, t) => {
      const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = 0;
      const val = Number(t.amount);
      acc[dateKey] += t.type === 'income' ? val : -val;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, amount]) => ({ 
        date, 
        label: format(parseISO(date), 'MMM dd'),
        fullLabel: format(parseISO(date), 'MMM dd, yyyy'),
        amount 
      }))
      .sort((a,b) => a.date.localeCompare(b.date));
  }, [transactions]);

  const chartWidth = Math.max(100, (chartData.length || 0) * 8); 

  // --- FIX: Explicitly typed accumulator and explicit Number() casting ---
  const categoryData = Object.entries(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((acc: Record<string, number>, t) => { 
        const current = acc[t.category] || 0;
        acc[t.category] = current + Number(t.amount); 
        return acc; 
      }, {} as Record<string, number>)
  )
  .map(([name, value]) => ({ name, value: Number(value) })) // Ensure value is a Number
  .sort((a, b) => Number(b.value) - Number(a.value)); // Explicit subtraction

  const barData = [
    { name: 'Income', amount: income, fill: '#22c55e' },
    { name: 'Expense', amount: expense, fill: '#ef4444' }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ef4444', '#f97316'];

  return (
    <div className="space-y-6 animate-fade-in relative z-10 pb-20">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('budgetPlanner')}</h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-slate-500 text-sm">Currency:</span>
               <select 
                 className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 border-none outline-none cursor-pointer"
                 value={currency}
                 onChange={(e) => updateCurrency(e.target.value)}
               >
                 {['PHP','USD','EUR','JPY','GBP'].map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
         </div>
         <div className="flex gap-2">
            <button onClick={() => {
               const includeCharts = window.confirm("Do you want to include visual charts in the export?");
               const content = generateBudgetWord(transactions, currencySymbol, includeCharts);
               downloadFile('Budget_Report.doc', content, 'application/msword');
            }} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200" title="Export Word">
               <FileText size={20} />
            </button>
            <button onClick={() => {
               const includeCharts = window.confirm("Do you want to include visual charts in the export?");
               const content = generateBudgetPPT(transactions, currencySymbol, includeCharts);
               downloadFile('Budget_Report.html', content, 'text/html');
            }} className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200" title="Export PPT">
               <Presentation size={20} />
            </button>
            <button onClick={openAdd} className={`flex items-center gap-2 px-4 py-2 bg-${colorTheme}-600 text-white rounded-lg font-bold hover:bg-${colorTheme}-700 shadow-lg shadow-${colorTheme}-500/30`}>
               <Plus size={18} /> {t('addTransaction')}
            </button>
         </div>
       </div>

       {/* Financial Health Battery */}
       <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-2">
                   {isDeficit ? <BatteryWarning className="text-red-500" size={28} /> : <BatteryCharging className="text-green-500" size={28}/>}
                   <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg">Financial Health Status: {batteryStatus}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{batteryMessage}</p>
                   </div>
                </div>
                
                {/* Segmented Battery Bar */}
                <div className="flex gap-1 h-6 mt-3 w-full max-w-md">
                   {Array.from({ length: 10 }).map((_, i) => {
                      const segmentValue = (i + 1) * 10;
                      const level = isDeficit ? 100 : Math.min(100, Math.max(0, savingsRate));
                      const isActive = isDeficit || (level >= segmentValue - 5);
                      
                      return (
                        <div 
                          key={i} 
                          className={`flex-1 rounded-sm transition-all duration-500 ${isActive ? (isDeficit ? 'bg-red-500' : batteryColor) : 'bg-slate-200 dark:bg-slate-700'}`}
                        />
                      );
                   })}
                </div>
                <div className="flex justify-between w-full max-w-md mt-1 text-xs text-slate-400 font-mono">
                   <span>0%</span>
                   <span>Savings Rate: {isDeficit ? 'Deficit' : `${savingsRate.toFixed(1)}%`}</span>
                   <span>100%</span>
                </div>
             </div>

             <div className="flex gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center min-w-[100px]">
                   <p className="text-xs text-slate-500 uppercase font-bold">Income</p>
                   <p className="text-lg font-bold text-green-600">{currencySymbol}{income.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center min-w-[100px]">
                   <p className="text-xs text-slate-500 uppercase font-bold">Expense</p>
                   <p className="text-lg font-bold text-red-600">{currencySymbol}{expense.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center min-w-[100px] border-l-4 border-slate-300 dark:border-slate-600">
                   <p className="text-xs text-slate-500 uppercase font-bold">Net</p>
                   <p className={`text-lg font-bold ${balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>{currencySymbol}{balance.toLocaleString()}</p>
                </div>
             </div>
          </div>
       </div>

       <div className="border-b border-slate-200 dark:border-slate-700 flex gap-4">
          <button onClick={() => setView('overview')} className={`pb-2 font-medium flex items-center gap-2 ${view === 'overview' ? `text-${colorTheme}-600 border-b-2 border-${colorTheme}-600` : 'text-slate-500 hover:text-slate-700'}`}>
            <PieIcon size={18}/> Analysis
          </button>
          <button onClick={() => setView('transactions')} className={`pb-2 font-medium flex items-center gap-2 ${view === 'transactions' ? `text-${colorTheme}-600 border-b-2 border-${colorTheme}-600` : 'text-slate-500 hover:text-slate-700'}`}>
            <FileText size={18}/> Transactions
          </button>
       </div>

       {view === 'overview' && (
         <div className="space-y-6">
            
            {/* Main Net Flow Chart */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
               <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <TrendingUp size={16}/> Daily Net Flow
                  </h3>
                  
                  {/* Chart Type Toggles */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setChartType('area')} className={`p-1.5 rounded-md transition ${chartType === 'area' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`} title="Area Chart">
                      <TrendingUp size={16} />
                    </button>
                    <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-md transition ${chartType === 'bar' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`} title="Bar Chart">
                      <BarIcon size={16} />
                    </button>
                    <button onClick={() => setChartType('line')} className={`p-1.5 rounded-md transition ${chartType === 'line' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`} title="Line Chart">
                      <Activity size={16} />
                    </button>
                  </div>
               </div>
               
               {/* Scrollable Container */}
               <div className="overflow-x-auto custom-scrollbar pb-2">
                 <div style={{ width: `${chartWidth}%`, minWidth: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'area' ? (
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                              <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={`#${colorTheme === 'orange' ? 'f97316' : '0ea5e9'}`} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={`#${colorTheme === 'orange' ? 'f97316' : '0ea5e9'}`} stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                          <XAxis dataKey="label" tick={{fontSize: 12}} />
                          <YAxis tick={{fontSize: 12}} />
                          <Tooltip 
                              contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                              labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                          />
                          <Area type="monotone" dataKey="amount" stroke={`#${colorTheme === 'orange' ? 'f97316' : '0ea5e9'}`} fillOpacity={1} fill="url(#colorAmt)" />
                        </AreaChart>
                      ) : chartType === 'bar' ? (
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                           <XAxis dataKey="label" tick={{fontSize: 12}} />
                           <YAxis tick={{fontSize: 12}} />
                           <Tooltip 
                              cursor={{fill: 'rgba(255,255,255,0.1)'}}
                              contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                              labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                           />
                           <Bar dataKey="amount" fill={`#${colorTheme === 'orange' ? 'f97316' : '0ea5e9'}`} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                           <XAxis dataKey="label" tick={{fontSize: 12}} />
                           <YAxis tick={{fontSize: 12}} />
                           <Tooltip 
                              contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                              labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                           />
                           <Line type="monotone" dataKey="amount" stroke={`#${colorTheme === 'orange' ? 'f97316' : '0ea5e9'}`} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income vs Expense Chart */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-80">
                   <h3 className="font-bold mb-4 text-slate-700 dark:text-slate-300 flex items-center gap-2"><BarChart2 size={16}/> Income vs Expense</h3>
                   <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={barData}>
                         <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                         <XAxis dataKey="name" tick={{fontSize: 12}} />
                         <YAxis tick={{fontSize: 12}} />
                         <Tooltip 
                           contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                           itemStyle={{color: '#fff'}}
                         />
                         <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                            {barData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>

                {/* Category Pie Chart */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-80 flex flex-col">
                  <h3 className="font-bold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2"><PieIcon size={16}/> Expense Breakdown</h3>
                  <div className="flex-1 flex items-center">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                              {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                         </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Top Expenses List */}
                    <div className="w-1/2 pl-4 h-full overflow-y-auto custom-scrollbar">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-2">Top Categories</p>
                       {categoryData.length > 0 ? categoryData.map((c, i) => (
                          <div key={i} className="flex justify-between items-center text-xs mb-2 pb-1 border-b border-slate-100 dark:border-slate-700 last:border-0">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                                <span className="text-slate-700 dark:text-slate-300 truncate w-20">{c.name}</span>
                             </div>
                             <span className="font-bold">{currencySymbol}{c.value.toLocaleString()}</span>
                          </div>
                       )) : <p className="text-xs text-slate-400">No expenses yet.</p>}
                    </div>
                  </div>
                </div>
            </div>
         </div>
       )}

       {view === 'transactions' && (
         <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                  <tr>
                     <th className="p-4">Date</th>
                     <th className="p-4">Description</th>
                     <th className="p-4">Category</th>
                     <th className="p-4 text-right">Amount</th>
                     <th className="p-4 text-center">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map(t => (
                     <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4 text-slate-500">{format(new Date(t.date), 'MMM dd')}</td>
                        <td className="p-4 font-medium text-slate-900 dark:text-white">{t.title}</td>
                        <td className="p-4">
                           <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400">{t.category}</span>
                        </td>
                        <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                           {t.type === 'expense' ? '-' : '+'}{Number(t.amount).toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                           <div className="flex items-center justify-center gap-2">
                             <button onClick={() => openEdit(t)} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full hover:bg-blue-100 transition">
                                <Pencil size={16} />
                             </button>
                             <button onClick={() => promptDelete(t.id)} className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-full hover:bg-red-100 transition">
                                <Trash2 size={16} />
                             </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
       )}

       <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? "Edit Transaction" : "Add Transaction"}>
          <div className="space-y-4">
             <div className="flex gap-2">
                <button onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${formData.type === 'expense' ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 text-slate-400 dark:border-slate-700'}`}>Expense</button>
                <button onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${formData.type === 'income' ? 'border-green-500 text-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 text-slate-400 dark:border-slate-700'}`}>Income</button>
             </div>
             <div>
                <label className="block text-sm text-slate-500 mb-1">Amount</label>
                <input type="number" className="w-full p-3 text-xl font-bold rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
             </div>
             <div>
                <label className="block text-sm text-slate-500 mb-1">Description</label>
                <input list="common-desc" className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" placeholder="What is this for?" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <datalist id="common-desc">{COMMON_DESCRIPTIONS.map((d, i) => <option key={i} value={d} />)}</datalist>
             </div>
             <div>
                <label className="block text-sm text-slate-500 mb-1">Category</label>
                <select className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                   {(formData.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm text-slate-500 mb-1">Date</label>
                <input type="date" className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
             </div>
             <button onClick={handleSave} className={`w-full py-3 bg-${colorTheme}-600 text-white font-bold rounded-xl hover:bg-${colorTheme}-700 shadow-lg shadow-${colorTheme}-500/30 transition-all transform hover:scale-[1.02]`}>
               {editingId ? 'Update Transaction' : 'Save Transaction'}
             </button>
          </div>
       </Modal>

       <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete">
          <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
             <div className="p-4 bg-red-100 text-red-600 rounded-full animate-bounce">
               <AlertTriangle size={48} />
             </div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white">Are you sure?</h3>
             <p className="text-slate-500">This action cannot be undone. This record will be permanently removed.</p>
             <div className="flex gap-4 w-full">
               <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold">Cancel</button>
               <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Delete</button>
             </div>
          </div>
       </Modal>
    </div>
  );
};

export default Budget;