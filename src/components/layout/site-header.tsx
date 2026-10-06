"use client";

import { useState } from "react";
import { ArchiveSubmitDialog } from "@/components/archive/archive-submit-dialog";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { SiteNavigation } from "@/components/layout/site-navigation";
import { useAuth } from "@/lib/auth/use-auth";

export function SiteHeader({ activeHref }: { activeHref?: string }) {
  const { user, isReady, isAuthenticated, isAdmin, logout, dialogMode, openLogin, openRegister, closeDialog, switchMode } = useAuth();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [continueToSubmit, setContinueToSubmit] = useState(false);
  function handleSubmitClick() {
    if (isReady && isAuthenticated) {
      setSubmitOpen(true);
      return;
    }
    setContinueToSubmit(true);
    openLogin();
  }
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-surface">
        <SiteNavigation activeHref={activeHref} user={user} onLoginClick={openLogin} onRegisterClick={openRegister} onLogout={logout} onSubmitClick={handleSubmitClick} />
      </header>
      {dialogMode ? <AuthDialog mode={dialogMode} open onSwitchMode={switchMode}
        onClose={() => { setContinueToSubmit(false); closeDialog(); }}
        onSuccess={() => {
          closeDialog();
          if (continueToSubmit) { setContinueToSubmit(false); setSubmitOpen(true); }
        }} /> : null}
      <ArchiveSubmitDialog open={submitOpen && isReady && isAuthenticated} allowNativeUpload={isAdmin} onClose={() => setSubmitOpen(false)} />
    </>
  );
}
