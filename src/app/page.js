import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <main className="w-full max-w-md mx-auto text-center">
        {/* Company Logo */}
        <div className="mb-12">
          <Image
            src={'/images/logo.png'} // Replace with your actual logo path
            alt="Awash Insurance Logo"
            width={180}
            height={80}
            className="mx-auto"
          />
        </div>

        {/* Welcome Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Shareholder Dividend Portal
        </h1>
        <p className="text-gray-600 mb-8">
          Welcome to Awash Insurance dividend management system. Please login to
          view your dividend details and make your decision.
        </p>

        {/* Login Button */}
<Link
  href="/login"  // Changed from "/pages/login"
  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 inline-block"
>
  Shareholder Login
</Link>

        {/* Help Section */}
        <div className="mt-12 text-sm text-gray-500">
          <p className="mb-2">Need help with your dividend decision?</p>
          <div className="flex justify-center gap-4">
            <a href="#" className="hover:text-blue-600 hover:underline">
              Contact Support
            </a>
            <a href="#" className="hover:text-blue-600 hover:underline">
              FAQ
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-8 text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Awash Insurance. All rights reserved.</p>
      </footer>
    </div>
  );
}