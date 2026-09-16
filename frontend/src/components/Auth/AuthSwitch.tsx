"use client";

import React, { useState, useEffect } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthSwitchProps {
  initialMode?: "signin" | "signup";
}

export default function AuthSwitch({ initialMode = "signin" }: AuthSwitchProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [registeredUsername, setRegisteredUsername] = useState("");

  useEffect(() => {
    setIsSignUp(initialMode === "signup");
  }, [initialMode]);

  const handleModeChange = (signUp: boolean) => {
    setIsSignUp(signUp);
    // Sync browser URL without full reload
    const targetUrl = signUp ? "/register" : "/login";
    window.history.pushState(null, "", targetUrl);
  };

  const handleRegisterSuccess = (username: string) => {
    setRegisteredUsername(username);
    handleModeChange(false);
  };

  // Tailwind Class Constants
  const wrapperClasses = "min-h-screen w-full flex justify-center items-center bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-5 font-sans overflow-hidden";
  const cardClasses = "relative w-full max-w-[1050px] min-h-[820px] lg:min-h-[640px] bg-white rounded-3xl shadow-2xl overflow-hidden";

  const backgroundCircleClasses = `
    absolute rounded-full z-10 bg-gradient-to-tl from-sky-600 via-indigo-600 to-blue-600
    transition-all duration-[2000ms] lg:duration-[1800ms] ease-in-out
    w-[1500px] h-[1500px] lg:w-[2200px] lg:h-[2200px]
    left-[30%] lg:left-auto lg:top-[-10%]
    ${isSignUp
      ? "bottom-[32%] -translate-x-1/2 translate-y-full lg:bottom-auto lg:right-[52%] lg:translate-x-full lg:-translate-y-1/2"
      : "bottom-[68%] -translate-x-1/2 translate-y-0 lg:bottom-auto lg:right-[48%] lg:translate-x-0 lg:-translate-y-1/2"
    }
  `;

  const formsContainerClasses = "absolute w-full h-full top-0 left-0";

  const signinSignupContainerClasses = `
    absolute grid grid-cols-1 z-[5] transition-all duration-1000 delay-[800ms] lg:delay-[700ms] ease-in-out w-full lg:w-1/2
    ${isSignUp
      ? "top-[5%] left-1/2 -translate-x-1/2 translate-y-0 lg:top-1/2 lg:left-[25%] lg:-translate-x-1/2 lg:-translate-y-1/2"
      : "top-[95%] left-1/2 -translate-x-1/2 -translate-y-full lg:top-1/2 lg:left-[75%] lg:-translate-x-1/2 lg:-translate-y-1/2"
    }
  `;

  const formBaseClasses = "flex items-center justify-center flex-col px-6 lg:px-12 py-6 transition-all duration-200 delay-[800ms] lg:delay-[700ms] overflow-hidden col-start-1 row-start-1 w-full";

  const signInFormClasses = `${formBaseClasses} ${isSignUp ? "opacity-0 z-[1] pointer-events-none" : "opacity-100 z-[2] pointer-events-auto"}`;
  const signUpFormClasses = `${formBaseClasses} max-h-[580px] overflow-y-auto ${isSignUp ? "opacity-100 z-[2] pointer-events-auto" : "opacity-0 z-[1] pointer-events-none"}`;

  const panelsContainerClasses = "absolute h-full w-full top-0 left-0 grid grid-cols-1 grid-rows-[1fr_2fr_1fr] lg:grid-cols-2 lg:grid-rows-1";
  const panelBaseClasses = "flex flex-row lg:flex-col justify-around lg:justify-center items-center lg:items-end text-center z-10 px-[8%] py-8 lg:p-0 col-start-1 lg:col-auto";

  const leftPanelClasses = `${panelBaseClasses} row-start-1 lg:row-start-auto lg:pr-[16%] lg:pl-[10%] lg:pt-[3rem] lg:pb-[2rem] ${isSignUp ? "pointer-events-none" : "pointer-events-auto"}`;
  const rightPanelClasses = `${panelBaseClasses} row-start-3 lg:row-start-auto lg:pl-[16%] lg:pr-[10%] lg:pt-[3rem] lg:pb-[2rem] ${isSignUp ? "pointer-events-auto" : "pointer-events-none"}`;

  const panelContentBaseClasses = "text-white transition-transform duration-[900ms] delay-[800ms] lg:delay-[600ms] ease-in-out flex flex-col items-center";

  const leftPanelContentClasses = `${panelContentBaseClasses} ${isSignUp ? "-translate-y-[300px] lg:translate-y-0 lg:-translate-x-[800px]" : "translate-y-0 lg:translate-x-0"}`;
  const rightPanelContentClasses = `${panelContentBaseClasses} ${isSignUp ? "translate-y-0 lg:translate-x-0" : "translate-y-[300px] lg:translate-y-0 lg:translate-x-[800px]"}`;

  const panelTitleClasses = "font-bold leading-tight text-[1.75rem] mb-3 text-white";
  const panelTextClasses = "text-[0.925rem] py-2 pb-6 text-white/85 leading-[1.5] max-w-[280px]";
  const outlineButtonClasses = "bg-transparent border-2 border-white w-[140px] h-[44px] rounded-full font-semibold text-[0.9rem] text-white transition-all duration-300 cursor-pointer hover:bg-white/15 hover:-translate-y-0.5";

  return (
    <div className={wrapperClasses}>
      <div className={cardClasses}>
        <div className={backgroundCircleClasses} />

        <div className={formsContainerClasses}>
          <div className={signinSignupContainerClasses}>
            <LoginForm 
              className={signInFormClasses} 
              onSwitchMode={() => handleModeChange(true)}
              prefilledUsername={registeredUsername}
            />
            <RegisterForm 
              className={signUpFormClasses} 
              onSwitchMode={() => handleModeChange(false)}
              onRegisterSuccess={handleRegisterSuccess}
            />
          </div>
        </div>

        {/* SIDE PANELS */}
        <div className={panelsContainerClasses}>
          {/* Left Panel (Visible during Sign In) */}
          <div className={leftPanelClasses}>
            <div className={leftPanelContentClasses}>
              <h3 className={panelTitleClasses}>New here?</h3>
              <p className={panelTextClasses}>
                Join ATeens today! Register your account to manage FC groups,
                fellowship attendance, and sports activities.
              </p>
              <button
                type="button"
                className={outlineButtonClasses}
                onClick={() => handleModeChange(true)}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Right Panel (Visible during Sign Up) */}
          <div className={rightPanelClasses}>
            <div className={rightPanelContentClasses}>
              <h3 className={panelTitleClasses}>One of us?</h3>
              <p className={panelTextClasses}>
                Welcome back! Sign in with your username and password to continue
                to your dashboard.
              </p>
              <button
                type="button"
                className={outlineButtonClasses}
                onClick={() => handleModeChange(false)}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
