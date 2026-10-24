"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Guest, GuestFilters } from "@/lib/api";
import {
  Search,
  RotateCcw,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Phone,
  DoorClosed,
  Calendar,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface GuestTableProps {
  guests: Guest[];
  total: number;
  filters: GuestFilters;
  isLoading: boolean;
  onFilterChange: (filters: GuestFilters) => void;
  onRefresh: () => void;
  onCreateNew: () => void;
  onViewGuest: (guest: Guest) => void;
  onEditGuest: (guest: Guest) => void;
  onDeleteGuest: (guest: Guest) => void;
}

export function GuestTable({
  guests,
  total,
  filters,
  isLoading,
  onFilterChange,
  onRefresh,
  onCreateNew,
  onViewGuest,
  onEditGuest,
  onDeleteGuest,
}: GuestTableProps) {
  const [filterRoom, setFilterRoom] = useState(filters.room_number || "");
  const [filterPhone, setFilterPhone] = useState(filters.phone || "");

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      ...filters,
      offset: 0,
      room_number: filterRoom.trim() || undefined,
      phone: filterPhone.trim() || undefined,
    });
  };

  const handleResetFilters = () => {
    setFilterRoom("");
    setFilterPhone("");
    onFilterChange({
      limit,
      offset: 0,
      room_number: undefined,
      phone: undefined,
    });
  };

  const handlePageChange = (newOffset: number) => {
    onFilterChange({
      ...filters,
      offset: newOffset,
    });
  };

  const calculateNights = (inDate: string, outDate: string) => {
    try {
      const d1 = new Date(inDate);
      const d2 = new Date(outDate);
      const diff = Math.round(
        (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diff > 0 ? diff : null;
    } catch {
      return null;
    }
  };

  const isFiltered = Boolean(filters.room_number || filters.phone);

  return (
    <div className="space-y-4">
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4">
          <form
            onSubmit={handleApplyFilters}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-1">
              <div className="relative w-full sm:w-48">
                <DoorClosed className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Комната (напр. 402)"
                  value={filterRoom}
                  onChange={(e) => setFilterRoom(e.target.value)}
                  className="pl-9 h-9 text-xs sm:text-sm"
                />
              </div>

              <div className="relative w-full sm:w-60">
                <Phone className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Телефон (напр. 123-45)"
                  value={filterPhone}
                  onChange={(e) => setFilterPhone(e.target.value)}
                  className="pl-9 h-9 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 gap-1.5 text-xs font-medium"
                >
                  <Search className="size-3.5" />
                  Найти
                </Button>
                {isFiltered && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    title="Сбросить все фильтры"
                  >
                    <RotateCcw className="size-3.5" />
                    Сбросить
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                title="Обновить список"
                className="h-9 gap-1.5 text-xs"
              >
                <RefreshCw
                  className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Обновить</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={onCreateNew}
                className="h-9 gap-1.5 text-xs font-medium shadow-xs"
              >
                <Plus className="size-4" />
                Добавить гостя
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-xs overflow-hidden">
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-semibold text-xs text-muted-foreground w-[220px]">
                  Гость (ФИО)
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground w-[120px]">
                  Комната
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground w-[180px]">
                  Телефон
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground min-w-[200px]">
                  Период проживания
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground min-w-[200px]">
                  Заметка
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground text-right w-[140px]">
                  Действия
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && guests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <RefreshCw className="size-6 animate-spin text-primary" />
                      <p className="text-sm">Загрузка записей гостей...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : guests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                      <Users className="size-10 text-muted-foreground/40" />
                      <p className="text-base font-medium text-foreground">
                        {isFiltered
                          ? "Гости не найдены"
                          : "Записная книжка пуста"}
                      </p>
                      <p className="text-xs max-w-sm">
                        {isFiltered
                          ? "Попробуйте изменить параметры поиска или сбросить фильтры."
                          : "В журнале пока нет ни одного зарегистрированного гостя. Добавьте первого постояльца."}
                      </p>
                      {isFiltered ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs"
                        >
                          Сбросить фильтры
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={onCreateNew}
                          className="mt-2 gap-1.5 text-xs"
                        >
                          <Plus className="size-4" />
                          Добавить первого гостя
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                guests.map((guest) => {
                  const nights = calculateNights(
                    guest.check_in_date,
                    guest.check_out_date,
                  );

                  return (
                    <TableRow
                      key={guest.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {guest.full_name}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[180px]">
                            {guest.id}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-mono font-medium text-xs bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        >
                          № {guest.room_number}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <a
                          href={`tel:${guest.phone}`}
                          className="text-xs sm:text-sm font-mono text-primary hover:underline flex items-center gap-1.5"
                        >
                          <Phone className="size-3 text-muted-foreground shrink-0" />
                          <span>{guest.phone}</span>
                        </a>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs sm:text-sm gap-0.5">
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <Calendar className="size-3 text-muted-foreground shrink-0" />
                            <span>{guest.check_in_date}</span>
                            <span className="text-muted-foreground">→</span>
                            <span>{guest.check_out_date}</span>
                          </div>
                          {nights !== null && (
                            <span className="text-[11px] text-muted-foreground">
                              {nights}{" "}
                              {nights === 1
                                ? "ночь"
                                : nights < 5
                                  ? "ночи"
                                  : "ночей"}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {guest.note ? (
                          <div
                            className="text-xs text-muted-foreground max-w-[240px] truncate"
                            title={guest.note}
                          >
                            {guest.note}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/40 italic">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onViewGuest(guest)}
                            title="Подробнее о госте"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Eye className="size-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onEditGuest(guest)}
                            title="Редактировать запись"
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onDeleteGuest(guest)}
                            title="Удалить запись"
                            className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Всего записей:{" "}
              <strong className="text-foreground">{total}</strong>
            </span>
            {total > 0 && (
              <span>
                Показано {offset + 1}–{Math.min(offset + limit, total)} из{" "}
                {total}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Строк:</span>
              <select
                value={limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  onFilterChange({
                    ...filters,
                    limit: newLimit,
                    offset: 0,
                  });
                }}
                className="rounded border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                disabled={offset === 0 || isLoading}
                onClick={() => handlePageChange(Math.max(0, offset - limit))}
                title="Предыдущая страница"
              >
                <ChevronLeft className="size-3.5" />
              </Button>

              <span className="px-2 font-medium text-foreground">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon-xs"
                disabled={offset + limit >= total || isLoading}
                onClick={() => handlePageChange(offset + limit)}
                title="Следующая страница"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
