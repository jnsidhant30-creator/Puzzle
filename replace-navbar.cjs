const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

const target1 = `<header className="bg-pv-surface-primary border-b border-pv-border-violet px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm"> {/* Left Area: Mobile Menu + Greeting */} <div className="flex items-center gap-4"> <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 -ml-2 rounded-xl text-pv-text-secondary hover:text-white hover:bg-white/5 transition-colors" > <Menu className="w-6 h-6" /> </button> <div> <h2 className="text-xl font-black text-white tracking-tight"> {greeting}, {firstName} </h2> <p className="text-sm text-pv-text-secondary font-medium hidden sm:block"> Ready for your next puzzle? </p> </div> </div>`;

const replacement1 = `<header className="bg-pv-surface-primary border-b border-pv-border-violet px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm"> {/* Left Area: Mobile Menu + Greeting */} <div className="flex items-center gap-3 sm:gap-4"> <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 -ml-2 rounded-xl text-pv-text-secondary hover:text-white hover:bg-white/5 transition-colors" > <Menu className="w-6 h-6" /> </button> <div className="hidden sm:block"> <h2 className="text-xl font-black text-white tracking-tight"> {greeting}, {firstName} </h2> <p className="text-sm text-pv-text-secondary font-medium"> Ready for your next puzzle? </p> </div> <div className="sm:hidden flex items-center gap-2"> <h1 className="font-black text-lg tracking-wide text-white">PuzzleVerse</h1> </div> </div>`;

content = content.replace(target1, replacement1);
fs.writeFileSync('src/components/Navbar.tsx', content);
