"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, ApiError, User } from "@/lib/api";
import { LogIn, UserPlus, Lock, Loader2, Sparkles } from "lucide-react";

interface AuthCardProps {
  onSuccess: (user: User) => void;
}

export function AuthCard({ onSuccess }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMsg("Заполните имя пользователя и пароль");
      return;
    }

    setIsLoading(true);
    try {
      if (activeTab === "login") {
        const res = await api.login(trimmedUser, password);
        toast.success(`Добро пожаловать, ${res.user.username}!`);
        onSuccess(res.user);
      } else {
        const res = await api.register(trimmedUser, password);
        toast.success(
          `Пользователь ${res.user.username} успешно зарегистрирован!`,
        );
        onSuccess(res.user);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMsg("Неверное имя пользователя или пароль");
        } else if (err.status === 409) {
          setErrorMsg("Пользователь с таким логином уже существует");
        } else {
          setErrorMsg(err.message);
        }
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Произошла ошибка при выполнении запроса");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername("test_admin");
    setPassword("password123");
    setErrorMsg(null);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="size-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Вход</CardTitle>
          <CardDescription>
            Доступ к системе записной книжки отеля
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as string);
              setErrorMsg(null);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="size-4" />
                Вход
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <UserPlus className="size-4" />
                Регистрация
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя (Логин)</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="hotel_admin"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete={
                      activeTab === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300">
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : activeTab === "login" ? (
                  <LogIn className="size-4" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                {activeTab === "login"
                  ? "Войти в систему"
                  : "Зарегистрироваться"}
              </Button>
            </form>
          </Tabs>

          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Быстрый тест:</span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleFillDemo}
                className="gap-1 text-xs"
              >
                <Sparkles className="size-3 text-amber-500" />
                Подставить test_admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
