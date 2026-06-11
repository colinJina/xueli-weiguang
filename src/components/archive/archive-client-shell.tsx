"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { ArchivePageNav } from "@/components/archive/archive-page-nav";
import { ArchiveSubmitDialog } from "@/components/archive/archive-submit-dialog";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { useAuth } from "@/lib/auth/use-auth";

type ArchiveClientShellProps = {
  activeChannel: string;
  channelCount: string;
  supportCount: string;
  children: ReactNode;
};

export function ArchiveClientShell({
  activeChannel,
  channelCount,
  supportCount,
  children,
}: ArchiveClientShellProps) {
  const {
    user,
    isReady,
    isAuthenticated,
    isAdmin,
    logout,
    dialogMode,
    openLogin,
    openRegister,
    closeDialog,
    switchMode,
  } = useAuth();
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [shouldContinueToSubmit, setShouldContinueToSubmit] = useState(false);

  return (
    <div className="min-h-screen bg-[#020202]">
      <ArchivePageNav
        activeChannel={activeChannel}
        channelCount={channelCount}
        onLoginClick={openLogin}
        onLogout={logout}
        onRegisterClick={openRegister}
        onSubmitLoginRequest={() => {
          setShouldContinueToSubmit(true);
          openLogin();
        }}
        onSubmitOpen={() => {
          setShouldContinueToSubmit(false);
          setIsSubmitDialogOpen(true);
        }}
        supportCount={supportCount}
        user={user}
      />

      {children}

      {dialogMode ? (
        <AuthDialog
          mode={dialogMode}
          onClose={() => {
            setShouldContinueToSubmit(false);
            closeDialog();
          }}
          onSuccess={() => {
            closeDialog();
            if (shouldContinueToSubmit) {
              setShouldContinueToSubmit(false);
              setIsSubmitDialogOpen(true);
            }
          }}
          onSwitchMode={switchMode}
          open
        />
      ) : null}

      <ArchiveSubmitDialog
        onClose={() => setIsSubmitDialogOpen(false)}
        allowNativeUpload={isAdmin}
        open={isSubmitDialogOpen && isReady && isAuthenticated}
      />
    </div>
  );
}
