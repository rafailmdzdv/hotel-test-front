"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthCard } from "@/components/AuthCard";
import { GuestTable } from "@/components/GuestTable";
import { GuestFormDialog } from "@/components/GuestFormDialog";
import { GuestDetailsDialog } from "@/components/GuestDetailsDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  User,
  Guest,
  GuestFilters,
  api,
  getStoredUser,
  getStoredToken,
  clearAuthSession,
  ApiError,
} from "@/lib/api";
import { Users, CalendarCheck, DoorOpen } from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [todayStr, setTodayStr] = useState("");

  const [guests, setGuests] = useState<Guest[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<GuestFilters>({
    limit: 20,
    offset: 0,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<Guest | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [guestDetails, setGuestDetails] = useState<Guest | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setGuests([]);
    setTotal(0);
    toast.info("Вы вышли из системы");
  }, []);

  const fetchGuests = useCallback(
    async (currentFilters = filters) => {
      if (!getStoredToken()) return;
      setIsLoading(true);
      try {
        const res = await api.getGuests(currentFilters);
        setGuests(res.data || []);
        setTotal(res.total || 0);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 401) {
          toast.error("Сессия устарела. Пожалуйста, выполните вход снова.");
          handleLogout();
        } else {
          const msg =
            err instanceof Error
              ? err.message
              : "Не удалось загрузить список гостей";
          toast.error(msg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [filters, handleLogout],
  );

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const timer = setTimeout(() => {
      setTodayStr(today);
      const token = getStoredToken();
      const storedUser = getStoredUser();
      if (token && storedUser) {
        setUser(storedUser);
      }
      setIsInitialized(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      void fetchGuests(filters);
    }, 0);
    return () => clearTimeout(timer);
  }, [user, filters, fetchGuests]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setFilters({ limit: 20, offset: 0 });
  };

  const handleOpenCreate = () => {
    setGuestToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (guest: Guest) => {
    setGuestToEdit(guest);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    void fetchGuests(filters);
  };

  const handleOpenDetails = (guest: Guest) => {
    setGuestDetails(guest);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (guest: Guest) => {
    setGuestToDelete(guest);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!guestToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteGuest(guestToDelete.id);
      toast.success(`Запись ${guestToDelete.full_name} удалена`);
      setIsDeleteOpen(false);
      setGuestToDelete(null);
      if (guests.length === 1 && (filters.offset || 0) > 0) {
        setFilters((prev) => ({
          ...prev,
          offset: Math.max(0, (prev.offset || 0) - (prev.limit || 20)),
        }));
      } else {
        void fetchGuests(filters);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Не удалось удалить запись";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const todayArrivals = todayStr
    ? guests.filter((g) => g.check_in_date === todayStr).length
    : 0;
  const todayDepartures = todayStr
    ? guests.filter((g) => g.check_out_date === todayStr).length
    : 0;

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        user={user}
        onLogout={handleLogout}
      />

      <main className="container mx-auto max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {!user ? (
          <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center py-10">
            <AuthCard onSuccess={handleLoginSuccess} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Журнал регистрации постояльцев
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="border-border/60 shadow-xs">
                <CardContent className="flex items-center gap-3.5 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      Всего записей в базе
                    </span>
                    <span className="text-xl font-bold tracking-tight text-foreground">
                      {total}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-xs">
                <CardContent className="flex items-center gap-3.5 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <CalendarCheck className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      Заезды сегодня {todayStr ? `(${todayStr})` : ""}
                    </span>
                    <span className="text-xl font-bold tracking-tight text-foreground">
                      {todayArrivals}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-xs">
                <CardContent className="flex items-center gap-3.5 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                    <DoorOpen className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      Выезды сегодня {todayStr ? `(${todayStr})` : ""}
                    </span>
                    <span className="text-xl font-bold tracking-tight text-foreground">
                      {todayDepartures}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <GuestTable
              guests={guests}
              total={total}
              filters={filters}
              isLoading={isLoading}
              onFilterChange={(newFilters) => setFilters(newFilters)}
              onRefresh={() => void fetchGuests(filters)}
              onCreateNew={handleOpenCreate}
              onViewGuest={handleOpenDetails}
              onEditGuest={handleOpenEdit}
              onDeleteGuest={handleOpenDelete}
            />
          </div>
        )}
      </main>

      <GuestFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        guestToEdit={guestToEdit}
        onSuccess={handleFormSuccess}
      />

      <GuestDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        guest={guestDetails}
        onEdit={(guest) => {
          setIsDetailsOpen(false);
          handleOpenEdit(guest);
        }}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        guest={guestToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
