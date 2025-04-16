"use client";

import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

const formVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [errorMsg, setErrorMsg] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [successMsg, setSuccessMsg] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // Verifies if the user exists for the given email.
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsVerifying(true);
    try {
      const res = await fetch(
        "https://estatewise-backend.vercel.app/api/auth/verify-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      if (res.status === 200) {
        setIsVerified(true);
        setSuccessMsg("Email verified. Please enter your new password.");
        toast.success("Email verified. Please enter your new password.");
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Email verification failed");
        toast.error(errData.error || "Email verification failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Resets the password for the verified email.
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch(
        "https://estatewise-backend.vercel.app/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, newPassword }),
        },
      );
      if (res.status === 200) {
        const data = await res.json();
        setSuccessMsg(data.message || "Password reset successfully");
        toast.success("Password reset successfully");
        setTimeout(() => router.push("/login"), 1000);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failed to reset password");
        toast.error(errData.error || "Failed to reset password");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Head>
        <title>EstateWise | Reset Password</title>
        <meta name="description" content="Reset your password for EstateWise" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 px-4">
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <Card className="p-8 rounded-xl shadow-2xl bg-card">
            <h1 className="text-3xl font-bold mb-0 text-center text-card-foreground">
              Reset Password
            </h1>
            <p className="text-sm text-center text-card-foreground">
              Forgot your password? Don&apos;t worry, we got you covered!
            </p>
            {!isVerified ? (
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-card-foreground">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleVerifyEmail(e);
                      }
                    }}
                    required
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full py-2 mt-4 cursor-pointer"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-card-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleResetPassword(e);
                        }
                      }}
                      required
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 focus:outline-none"
                      aria-label="Toggle new password visibility"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-card-foreground">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleResetPassword(e);
                        }
                      }}
                      required
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 focus:outline-none"
                      aria-label="Toggle confirm new password visibility"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full py-2 mt-4 cursor-pointer"
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}
            <p className="text-sm text-center mt-4 text-card-foreground">
              Remembered your password?{" "}
              <Link href="/login" className="text-primary underline">
                Log In
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
