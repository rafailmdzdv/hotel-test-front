"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Hotel,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { User, api } from "@/lib/api";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Hotel className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Записная книжка отеля
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Hotel Guest Notebook
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="gap-1.5 py-1 px-2.5 text-xs"
              >
                <UserIcon className="size-3.5 text-muted-foreground" />
                <span className="font-semibold">{user.username}</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </div>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Не авторизован
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
