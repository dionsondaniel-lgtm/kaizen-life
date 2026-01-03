import { Transaction } from '../types';
import { format } from 'date-fns';

/**
 * Trigger a file download in the browser.
 */
export const downloadFile = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob(['\ufeff', content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// --- Budget Exporters ---

const generateChartHTML = (income: number, expense: number, currency: string) => {
  const total = Math.max(income + expense, 1);
  const incPct = Math.round((income / total) * 100);
  const expPct = Math.round((expense / total) * 100);
  const balance = income - expense;

  return `
    <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9;">
      <h3 style="color: #333;">Financial Visualization</h3>
      <div style="margin-bottom: 15px;">
        <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom: 5px;">
          <span style="color: #166534;">Income (${currency}${income.toLocaleString()})</span>
          <span>${incPct}%</span>
        </div>
        <div style="width: 100%; background-color: #e5e7eb; height: 20px; border-radius: 4px;">
          <div style="width: ${incPct}%; background-color: #22c55e; height: 100%; border-radius: 4px;"></div>
        </div>
      </div>
      <div style="margin-bottom: 15px;">
        <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom: 5px;">
          <span style="color: #991b1b;">Expense (${currency}${expense.toLocaleString()})</span>
          <span>${expPct}%</span>
        </div>
        <div style="width: 100%; background-color: #e5e7eb; height: 20px; border-radius: 4px;">
          <div style="width: ${expPct}%; background-color: #ef4444; height: 100%; border-radius: 4px;"></div>
        </div>
      </div>
      <div style="border-top: 1px solid #ccc; padding-top: 10px; text-align: center;">
        <strong>Net Balance: </strong> 
        <span style="color: ${balance >= 0 ? '#166534' : '#991b1b'}; font-size: 1.2em;">
          ${currency}${balance.toLocaleString()}
        </span>
      </div>
    </div>
  `;
};

export const generateBudgetWord = (transactions: Transaction[], currencySymbol: string, includeCharts: boolean) => {
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);

  const chartSection = includeCharts ? generateChartHTML(income, expense, currencySymbol) : '';

  const rows = transactions.map(t => `
    <tr>
      <td>${format(new Date(t.date), 'yyyy-MM-dd')}</td>
      <td>${t.title}</td>
      <td>${t.type.toUpperCase()}</td>
      <td>${t.category}</td>
      <td style="text-align:right; color: ${t.type === 'income' ? 'green' : 'red'}">
        ${t.type === 'expense' ? '-' : '+'}${currencySymbol}${Number(t.amount).toLocaleString()}
      </td>
    </tr>
  `).join('');

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Budget Report</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
        th { background-color: #f3f4f6; font-weight: bold; }
        h1 { color: #0284c7; }
      </style>
    </head>
    <body>
      <h1>Kaizen Budget Report</h1>
      <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
      ${chartSection}
      <h3>Transaction Details</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Type</th>
            <th>Category</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

export const generateBudgetPPT = (transactions: Transaction[], currencySymbol: string, includeCharts: boolean) => {
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const balance = income - expense;

  const chartHtml = includeCharts ? `
    <div style="margin-top: 30px; width: 80%;">
      <p style="text-align: left; margin: 5px;">Income</p>
      <div style="width: 100%; background: #eee; height: 30px;">
        <div style="width: ${Math.round((income / (income + expense || 1)) * 100)}%; background: #22c55e; height: 30px;"></div>
      </div>
      <p style="text-align: left; margin: 5px; margin-top: 15px;">Expenses</p>
      <div style="width: 100%; background: #eee; height: 30px;">
        <div style="width: ${Math.round((expense / (income + expense || 1)) * 100)}%; background: #ef4444; height: 30px;"></div>
      </div>
    </div>
  ` : '';

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns:v='urn:schemas-microsoft-com:vml' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Budget Summary</title>
      <style>
        .slide { 
          border: 1px solid #ccc; padding: 50px; margin: 20px auto; width: 960px; height: 540px; 
          font-family: Arial, sans-serif; background: white; page-break-after: always;
          display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;
        }
        h1 { color: #0284c7; font-size: 48px; margin-bottom: 10px; }
        h2 { color: #334155; font-size: 32px; }
        .stat { font-size: 28px; margin: 15px 0; }
        .positive { color: green; font-weight: bold; }
        .negative { color: red; font-weight: bold; }
        .balance { font-size: 36px; color: #0f172a; margin-top: 30px; border-top: 3px solid #0284c7; padding-top: 20px; width: 60%; }
      </style>
    </head>
    <body>
      <div class="slide">
        <h1>Financial Snapshot</h1>
        <h2>Kaizen Life Report</h2>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <p>Total Transactions: ${transactions.length}</p>
      </div>
      <div class="slide">
        <h1>Overview</h1>
        <div class="stat">Total Income: <span class="positive">${currencySymbol}${income.toLocaleString()}</span></div>
        <div class="stat">Total Expenses: <span class="negative">${currencySymbol}${expense.toLocaleString()}</span></div>
        ${chartHtml}
        <div class="balance">Net Balance: <strong>${currencySymbol}${balance.toLocaleString()}</strong></div>
      </div>
    </body>
    </html>
  `;
};

// --- Admin Exporters ---

export const generateAdminReportWord = (title: string, data: any[], type: 'users' | 'feedback') => {
  const date = new Date().toLocaleDateString();

  const styles = `
    <style>
      body { font-family: 'Arial', sans-serif; color: #333; }
      h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 5px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10pt; }
      th { background-color: #4f46e5; color: white; padding: 10px; text-align: left; border: 1px solid #3730a3; }
      td { padding: 8px 10px; border: 1px solid #e2e8f0; vertical-align: top; }
      tr:nth-child(even) { background-color: #f8fafc; }
    </style>
  `;

  let tableHeader = '';
  let tableRows = '';

  if (type === 'users') {
    tableHeader = `
      <tr>
        <th width="25%">User Name</th>
        <th width="30%">Email Address</th>
        <th width="15%">Password (PIN)</th>
        <th width="10%">Role</th>
        <th width="20%">Date Registered</th>
      </tr>
    `;
    tableRows = data.map(u => {
      const isAdmin = u.isAdmin === true;
      const roleColor = isAdmin ? '#4f46e5' : '#64748b'; 
      const roleText = isAdmin ? 'ADMIN' : 'USER';
      
      return `
      <tr>
        <td><strong>${u.firstName} ${u.lastName}</strong></td>
        <td>${u.email}</td>
        <td>${u.password || 'N/A'}</td>
        <td>
           <span style="color: ${roleColor}; font-weight: bold; text-transform: uppercase;">
             ${roleText}
           </span>
        </td>
        <td>${u.fileCreated ? new Date(u.fileCreated).toLocaleDateString() : '-'}</td>
      </tr>
    `}).join('');
  } else {
    tableHeader = `
      <tr>
        <th width="20%">Submitted By</th>
        <th width="15%">Type</th>
        <th width="45%">Message</th>
        <th width="20%">Date</th>
      </tr>
    `;
    tableRows = data.map(f => {
      const fType = f.type ? f.type.toLowerCase() : 'unknown';
      let typeColor = '#059669'; 
      if (fType === 'bug') typeColor = '#e11d48'; 
      if (fType === 'suggestion') typeColor = '#d97706'; 

      return `
      <tr>
        <td>
          <strong>${f.userName || 'Guest'}</strong><br/>
          <span style="font-size:8pt; color:#666;">ID: ${f.userId || 'N/A'}</span>
        </td>
        <td>
           <span style="color: ${typeColor}; font-weight: bold; text-transform: uppercase;">
             ${f.type || 'Unknown'}
           </span>
        </td>
        <td>${f.message}</td>
        <td>${f.date ? new Date(f.date).toLocaleString() : '-'}</td>
      </tr>
    `}).join('');
  }

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      ${styles}
    </head>
    <body>
      <h1>${title}</h1>
      <p style="font-size: 11px; color: #666; font-style: italic; margin-bottom: 20px;">
        System Report generated on ${date} | Kaizen Admin Dashboard
      </p>
      
      <table>
        <thead>${tableHeader}</thead>
        <tbody>${tableRows}</tbody>
      </table>
      
      <br />
      <p style="font-size: 10px; color: #999; text-align: center;">End of Report</p>
    </body>
    </html>
  `;
};

export const generateAdminReportPPT = (title: string, data: any[]) => "";