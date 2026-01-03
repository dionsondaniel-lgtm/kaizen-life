import React, { useState, useEffect } from 'react';
import { Settings, FileText, Search, Lock, Calendar, Clock, BarChart3, Users, MessageSquare, Download, Shield, User as UserIcon } from 'lucide-react';
import { fetchBucketFiles, getFileContent } from '../services/supabase';
import { downloadFile, generateAdminReportWord } from '../utils/exporter';

interface AdminProps {
  settings: any;
  updateSettings: (s: any) => void;
}

const Admin: React.FC<AdminProps> = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Separate search terms for tables
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [feedbackSearchTerm, setFeedbackSearchTerm] = useState('');

  // Stats for charts
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFeedback: 0,
    bugCount: 0,
    featureCount: 0
  });

  const loadData = async () => {
    setLoading(true);
    
    // 1. Fetch Users
    const { data: userFiles } = await fetchBucketFiles('kaizenusers');
    if (userFiles) {
      const userList = await Promise.all(userFiles.map(async (f) => {
        const { data } = await getFileContent('kaizenusers', f.name);
        const userData = data?.currentUser || {};
        
        return {
          ...userData,
          email: userData.email || f.name.replace('.json', '').replace(/_/g, '.').replace('.com', '@gmail.com'), 
          fileCreated: f.created_at,
          fileModified: f.updated_at,
          password: userData.password || 'N/A'
        };
      }));
      setUsers(userList.filter(u => u));
    }

    // 2. Fetch Feedback
    const { data: feedbackFiles } = await fetchBucketFiles('kaizenfeedback');
    if (feedbackFiles) {
       const feedbackList = await Promise.all(feedbackFiles.slice(0, 50).map(async (f) => {
         const { data } = await getFileContent('kaizenfeedback', f.name);
         // Ensure we handle the specific JSON structure provided
         return data ? {
             ...data,
             // Fallback if date is missing, use timestamp or current date
             date: data.date || data.timestamp || new Date().toISOString()
         } : null;
       }));
       
       const validFeedbacks = feedbackList.filter(f => f);
       setFeedbacks(validFeedbacks);

       setStats({
         totalUsers: userFiles?.length || 0,
         totalFeedback: validFeedbacks.length,
         bugCount: validFeedbacks.filter(f => f.type === 'bug').length,
         featureCount: validFeedbacks.filter(f => f.type !== 'bug').length // Count features/suggestions together for simple chart
       });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Logic
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    user.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const filteredFeedbacks = feedbacks.filter(f => 
    f.message?.toLowerCase().includes(feedbackSearchTerm.toLowerCase()) ||
    f.userName?.toLowerCase().includes(feedbackSearchTerm.toLowerCase()) ||
    f.type?.toLowerCase().includes(feedbackSearchTerm.toLowerCase()) ||
    f.userId?.toLowerCase().includes(feedbackSearchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getInitialsUser = (first: string, last: string) => {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
  };

  const getBadgeColor = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'bug': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30';
      case 'suggestion': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30';
    }
  };

  const getBadgeDot = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'bug': return 'bg-rose-500';
      case 'suggestion': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative z-10 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> 
            Admin Dashboard
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">Manage users, feedback, and system reports.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
          <Clock size={14} />
          <span>Synced: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Top Section: Overview & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Overview Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               {/* Total Users Metric */}
               <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/30"><Users size={24} /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Users</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalUsers}</p>
                    </div>
                  </div>
               </div>
               
               {/* Total Feedback Metric */}
               <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900 border border-purple-100 dark:border-purple-900/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/30"><MessageSquare size={24} /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Feedback</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalFeedback}</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Feedback Distribution Chart */}
            <div className="flex flex-col justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <BarChart3 size={16}/> Feedback Distribution
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> Bug Reports
                    </span>
                    <span className="text-slate-500 font-mono">{stats.bugCount}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-rose-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${stats.totalFeedback ? (stats.bugCount / stats.totalFeedback) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Features / Suggestions
                    </span>
                    <span className="text-slate-500 font-mono">{stats.featureCount}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${stats.totalFeedback ? (stats.featureCount / stats.totalFeedback) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Generation Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
           <div className="mb-6">
             <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
               <FileText className="w-5 h-5 text-indigo-500" />
               Generate Reports
             </h2>
             <p className="text-sm text-slate-500 mt-2">Export data for offline analysis in Microsoft Word format.</p>
           </div>
           
           <div className="flex-1 flex flex-col justify-center gap-4">
               <button 
                 onClick={() => downloadFile('Users_Report.doc', generateAdminReportWord('User Database Report', users, 'users'), 'application/msword')} 
                 className="w-full group relative flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all border border-indigo-100 dark:border-indigo-900/30"
               >
                 <div className="flex items-center gap-3">
                   <div className="bg-indigo-200 dark:bg-indigo-800 p-2 rounded-lg group-hover:scale-110 transition-transform">
                     <Users size={18} />
                   </div>
                   <div className="text-left">
                     <span className="block font-bold text-sm">User Report</span>
                     <span className="text-xs opacity-75">.DOC Format</span>
                   </div>
                 </div>
                 <Download size={18} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
               </button>

               <button 
                 onClick={() => downloadFile('Feedback_Report.doc', generateAdminReportWord('Feedback Analysis Report', feedbacks, 'feedback'), 'application/msword')} 
                 className="w-full group relative flex items-center justify-between p-4 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-all border border-teal-100 dark:border-teal-900/30"
               >
                 <div className="flex items-center gap-3">
                   <div className="bg-teal-200 dark:bg-teal-800 p-2 rounded-lg group-hover:scale-110 transition-transform">
                     <MessageSquare size={18} />
                   </div>
                   <div className="text-left">
                     <span className="block font-bold text-sm">Feedback Report</span>
                     <span className="text-xs opacity-75">.DOC Format</span>
                   </div>
                 </div>
                 <Download size={18} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
               </button>
           </div>
        </div>
      </div>
      
      {/* Users Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
         <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registered Users</h3>
              <p className="text-sm text-slate-500">View and monitor user accounts.</p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all shadow-sm"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            </div>
         </div>

         {loading ? <div className="p-16 text-center text-slate-500 animate-pulse">Fetching records...</div> : (
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-500 font-medium border-b dark:border-slate-700">
                 <tr>
                    <th className="p-5 w-16">#</th>
                    <th className="p-5">User Profile</th>
                    <th className="p-5">Credentials</th>
                    <th className="p-5">Role</th>
                    <th className="p-5">Activity</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {filteredUsers.length > 0 ? filteredUsers.map((u, i) => (
                   <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                     <td className="p-5 text-slate-400 font-mono text-xs">{i + 1}</td>
                     <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 dark:shadow-none">
                            {getInitialsUser(u.firstName, u.lastName)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {u.firstName} {u.lastName}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                          </div>
                        </div>
                     </td>
                     <td className="p-5">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg w-fit font-mono text-xs border border-slate-200 dark:border-slate-700">
                           <Lock size={12} className="text-indigo-500"/>
                           <span className="tracking-widest">{u.password}</span>
                        </div>
                     </td>
                     <td className="p-5">
                        {u.isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            <Shield size={12} /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <UserIcon size={12} /> User
                          </span>
                        )}
                     </td>
                     <td className="p-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                             <Calendar size={12} /> {formatDate(u.fileCreated)}
                          </div>
                        </div>
                     </td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan={5} className="p-12 text-center">
                       <div className="flex flex-col items-center justify-center text-slate-400">
                         <Search size={48} className="mb-4 opacity-20" />
                         <p>No users found matching "{userSearchTerm}"</p>
                       </div>
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
         )}
         {/* Footer Pagination */}
         <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs text-slate-500">
            <span>Showing {filteredUsers.length} records</span>
            <div className="flex gap-1">
              <button disabled className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded opacity-50 cursor-not-allowed">Previous</button>
              <button disabled className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded opacity-50 cursor-not-allowed">Next</button>
            </div>
         </div>
      </div>

      {/* Enhanced Feedback Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
         <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Feedback Inbox</h3>
               <p className="text-sm text-slate-500">User submitted bugs, suggestions, and feature requests.</p>
            </div>
            
            {/* Feedback Search Bar */}
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                placeholder="Search feedback..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none dark:text-white transition-all shadow-sm"
                value={feedbackSearchTerm}
                onChange={(e) => setFeedbackSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            </div>
         </div>
         
         {loading ? <div className="p-16 text-center text-slate-500 animate-pulse">Loading feedback...</div> : (
           <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm text-left">
               <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-500 font-medium sticky top-0 z-10 border-b dark:border-slate-700">
                 <tr>
                   <th className="p-5">User</th>
                   <th className="p-5">Type</th>
                   <th className="p-5">Message Content</th>
                   <th className="p-5 text-right">Date</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {filteredFeedbacks.length > 0 ? filteredFeedbacks.map((f, i) => (
                   <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                     {/* User Column */}
                     <td className="p-5">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                           {getInitials(f.userName)}
                         </div>
                         <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-xs">{f.userName || 'Guest User'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {f.userId || 'N/A'}</div>
                         </div>
                       </div>
                     </td>
                     
                     {/* Type Column */}
                     <td className="p-5 align-middle">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${getBadgeColor(f.type)}`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${getBadgeDot(f.type)}`}></span>
                         {f.type?.toUpperCase() || 'UNKNOWN'}
                       </span>
                     </td>
                     
                     {/* Message Column */}
                     <td className="p-5 align-middle">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">{f.message}</p>
                     </td>
                     
                     {/* Date Column */}
                     <td className="p-5 align-middle text-right">
                       <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500">
                         <Clock size={12} />
                         {formatDate(f.date)}
                       </div>
                     </td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan={4} className="p-12 text-center">
                       <div className="flex flex-col items-center justify-center text-slate-400">
                         <MessageSquare size={48} className="mb-4 opacity-20" />
                         <p>No feedback found matching "{feedbackSearchTerm}"</p>
                       </div>
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
         )}
         {/* Footer Pagination */}
         <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs text-slate-500">
            <span>Showing {filteredFeedbacks.length} records</span>
            <div className="flex gap-1">
              <button disabled className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded opacity-50 cursor-not-allowed">Previous</button>
              <button disabled className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded opacity-50 cursor-not-allowed">Next</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Admin;