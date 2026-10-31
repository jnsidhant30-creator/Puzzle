const fs = require('fs');

// AuthModal
let auth = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');
auth = auth.replace('px-8 py-10 sm:px-10', 'px-5 py-8 sm:px-10 sm:py-10');
fs.writeFileSync('src/components/AuthModal.tsx', auth);

// DashboardPage
let dash = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');
dash = dash.replace(/className="bg-pv-bg-primary p-6"/g, 'className="bg-pv-bg-primary p-4 sm:p-6"');
dash = dash.replace(/className="bg-pv-surface-primary border border-pv-border-violet rounded-2xl p-6/g, 'className="bg-pv-surface-primary border border-pv-border-violet rounded-2xl p-5 sm:p-6');
fs.writeFileSync('src/pages/DashboardPage.tsx', dash);
