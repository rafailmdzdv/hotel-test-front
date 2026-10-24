"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Guest } from "@/lib/api";
import {
  User,
  Phone,
  DoorClosed,
  Calendar,
  FileText,
  Clock,
  Edit,
  Hash,
} from "lucide-react";

interface GuestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: Guest | null;
  onEdit: (guest: Guest) => void;
}

export function GuestDetailsDialog({
  open,
  onOpenChange,
  guest,
  onEdit,
}: GuestDetailsDialogProps) {
  if (!guest) return null;

  const calculateNights = () => {
    if (!guest.check_in_date || !guest.check_out_date) return null;
    const inDate = new Date(guest.check_in_date);
    const outDate = new Date(guest.check_out_date);
    const diffTime = outDate.getTime() - inDate.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg">
                  {guest.full_name}
                </DialogTitle>
                <DialogDescription>Информация о проживании</DialogDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs px-2.5 py-0.5">
              Комната {guest.room_number}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
            <div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="size-3" /> Телефон
              </span>
              <a
                href={`tel:${guest.phone}`}
                className="font-medium text-primary hover:underline block mt-0.5"
              >
                {guest.phone}
              </a>
            </div>

            <div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <DoorClosed className="size-3" /> Номер
              </span>
              <span className="font-semibold block mt-0.5">
                Комната {guest.room_number}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" /> Заезд
              </span>
              <span className="font-medium block mt-0.5">
                {guest.check_in_date}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" /> Выезд
              </span>
              <span className="font-medium block mt-0.5">
                {guest.check_out_date}{" "}
                {nights !== null && (
                  <span className="text-xs text-muted-foreground">
                    ({nights}{" "}
                    {nights === 1 ? "ночь" : nights < 5 ? "ночи" : "ночей"})
                  </span>
                )}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <FileText className="size-3" /> Заметка / примечание
            </span>
            <div className="rounded-lg border p-3 bg-background text-sm">
              {guest.note ? (
                <p className="whitespace-pre-wrap">{guest.note}</p>
              ) : (
                <span className="text-muted-foreground italic text-xs">
                  Заметки отсутствуют
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-dashed p-2.5 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> Создано:
              </span>
              <span>{formatDateTime(guest.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> Обновлено:
              </span>
              <span>{formatDateTime(guest.updated_at)}</span>
            </div>
            <div className="flex items-center justify-between truncate font-mono text-[11px] pt-1 border-t">
              <span className="flex items-center gap-1 shrink-0">
                <Hash className="size-3" /> ID:
              </span>
              <span className="truncate ml-2">{guest.id}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Закрыть
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onEdit(guest);
            }}
            className="gap-1.5"
          >
            <Edit className="size-3.5" />
            Редактировать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
