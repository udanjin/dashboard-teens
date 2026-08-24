import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center p-6 sm:p-12 md:p-24 bg-[#0a0a0a] overflow-hidden">
      
      {/* Background Texture & Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-violet-500 opacity-20 blur-[100px]"></div>

      <div className="z-10 flex flex-col items-center max-w-4xl w-full mx-auto text-center space-y-8">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-tight">
          Welcome to{" "}
          <span className="block sm:inline bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500">
            ATeens
          </span>{" "}
          Dashboard
        </h1>
        
        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Manage members, track attendance, and oversee your community seamlessly. Designed for modern leaders.
        </p>

        <Link href="/login" className="mt-8">
          <button className="
            relative
            px-8 py-4 sm:px-10 sm:py-5
            bg-white text-[#0a0a0a]
            font-medium text-base sm:text-lg
            rounded-full
            shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)]
            hover:shadow-[0_0_60px_-15px_rgba(139,92,246,0.7)]
            transition-all duration-300
            transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]
            overflow-hidden
            group
          ">
            <span className="relative z-10 flex items-center gap-2">
              <span>Get Started</span>
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </span>
            <span className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </button>
        </Link>
      </div>
    </main>
  );
}