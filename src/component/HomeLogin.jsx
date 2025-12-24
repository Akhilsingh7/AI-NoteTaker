"use client";
import { Button } from "@/components/ui/button";
import React from "react";
import {
  SignInButton,
  SignOutButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { useRouter } from "next/navigation";

function HomeLogin() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  return (
    <div className="flex gap-4 items-center">
      <SignedOut>
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button size="lg" variant="outline">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Sign Up
          </Button>
        </SignUpButton>
      </SignedOut>

      {isSignedIn && (
        <>
          {/* Dashboard Button */}
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </Button>

          {/* Sign Out Button */}
          <SignOutButton>
            <Button
              size="lg"
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Sign Out
            </Button>
          </SignOutButton>
        </>
      )}
    </div>
  );
}

export default HomeLogin;
