"use client";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

function Navbar() {
  const router = useRouter();
  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        {/* Left - App Name */}
        <div
          className="flex items-center hover:cursor-pointer"
          onClick={() => router.push("/")}
        >
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AI Note Taker</h1>
        </div>

        {/* Right - Logout Button */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            size="default"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </Button>
          <SignOutButton redirectUrl="/">
            <Button variant="outline" size="default">
              Logout
            </Button>
          </SignOutButton>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
