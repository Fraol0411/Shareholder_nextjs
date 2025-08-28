import Link from "next/link";
import Image from "next/image";
import LoginPage from "./login/page";

export default function Home() {
  return (
    <div className="font-sans min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <main className="w-full max-w-md mx-auto text-center">
        
        <LoginPage/>
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-8 text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Awash Insurance. All rights reserved.</p>
      </footer>
    </div>
  );
}