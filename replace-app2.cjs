const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `import { AuthLayout } from './components/AuthLayout'; export default function App() {`;
const replacement1 = `import { AuthLayout } from './components/AuthLayout';\nimport { BottomNavigation } from './components/BottomNavigation';\n\nexport default function App() {`;
content = content.replace(target1, replacement1);

const target2 = `return ( <div className="h-[100dvh] bg-gradient-premium text-white flex font-sans selection:bg-pv-dragon-fruit selection:text-pv-bg-primary overflow-hidden"> <Sidebar /> <div className="flex-1 flex flex-col min-w-0 overflow-hidden"> <Navbar /> <main className="flex-1 overflow-y-auto scrollbar-none"> {renderActiveTab()} </main> </div> <LevelUpModal /> <ToastContainer /> <OnboardingTour /> </div> );`;
const replacement2 = `return ( <div className="h-[100dvh] bg-gradient-premium text-white flex font-sans selection:bg-pv-dragon-fruit selection:text-pv-bg-primary overflow-hidden"> <Sidebar /> <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative"> <Navbar /> <main className="flex-1 overflow-y-auto scrollbar-none pb-[80px] lg:pb-0 relative"> {renderActiveTab()} </main> </div> <BottomNavigation /> <LevelUpModal /> <ToastContainer /> <OnboardingTour /> </div> );`;
content = content.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', content);
