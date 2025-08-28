import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black">
      <h1 className="text-6xl font-bold mb-8 text-center text-white">
        WELCOME TO{" "}
        <span className="gradient-text text-transparent animate-gradient">
          ATEENS
        </span>{" "}
        DASHBOARD
      </h1>

      <Link href="/login">
        <button className="
          relative
          px-8 py-4
          bg-gradient-to-r from-indigo-500 to-purple-600
          text-white
          font-semibold
          rounded-full
          shadow-lg
          hover:shadow-xl
          transition-all
          duration-300
          transform
          hover:scale-105
          active:scale-95
          overflow-hidden
          group
        ">
          <span className="relative z-10 flex items-center">
            <span className="mr-3">Login</span>
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              ></path>
            </svg>
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
          <span className="absolute top-0 left-0 w-1/3 h-full bg-white/30 -skew-x-12 transform-gpu transition-all duration-700 group-hover:translate-x-[300%]"></span>
        </button>
      </Link>
    </main>
  );
}