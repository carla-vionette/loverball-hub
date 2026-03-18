// AuraNav.tsx — Floating bottom nav with active orange pill tab

export default function AuraNav() {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] bg-base-200/90 backdrop-blur-xl rounded-[2rem] p-2 flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/10 z-50">
      {/* Active Tab */}
      <button className="flex items-center gap-2 bg-accent-orange text-black px-5 py-3.5 rounded-full font-display text-xs uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-accent-orange/20">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
          <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77Z"/>
        </svg>
        <span>Home</span>
      </button>

      {/* Icon Tabs */}
      <div className="flex gap-1 pr-2">
        <button className="w-12 h-12 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
            <path d="M104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48ZM104,136H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,200,136Zm0,64H152V152h48v48Z"/>
          </svg>
        </button>

        <button className="w-12 h-12 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
            <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z"/>
          </svg>
          <div className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full border border-base-200" />
        </button>

        <button className="w-12 h-12 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
            <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/>
          </svg>
        </button>
      </div>
    </nav>
  );
}
