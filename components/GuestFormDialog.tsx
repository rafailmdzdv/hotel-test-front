"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Guest, GuestInput, api } from "@/lib/api";
import {
  UserPlus,
  Edit3,
  Loader2,
  Calendar,
  Phone,
  DoorClosed,
  AlertCircle,
} from "lucide-react";

interface GuestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestToEdit?: Guest | null;
  onSuccess: (guest: Guest, isEdit: boolean) => void;
}

const PHONE_REGEX = /^\+?[0-9\s\-\(\)]{6,32}$/;

interface InnerFormProps {
  guestToEdit?: Guest | null;
  onClose: () => void;
  onSuccess: (guest: Guest, isEdit: boolean) => void;
}

function GuestFormInner({ guestToEdit, onClose, onSuccess }: InnerFormProps) {
  const isEdit = Boolean(guestToEdit);

  const getInitialDates = () => {
    if (guestToEdit) {
      return {
        checkIn: guestToEdit.check_in_date || "",
        checkOut: guestToEdit.check_out_date || "",
      };
    }
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    return {
      checkIn: today.toISOString().split("T")[0],
      checkOut: tomorrow.toISOString().split("T")[0],
    };
  };

  const initialDates = getInitialDates();

  const [fullName, setFullName] = useState(guestToEdit?.full_name || "");
  const [phone, setPhone] = useState(guestToEdit?.phone || "");
  const [roomNumber, setRoomNumber] = useState(guestToEdit?.room_number || "");
  const [checkInDate, setCheckInDate] = useState(initialDates.checkIn);
  const [checkOutDate, setCheckOutDate] = useState(initialDates.checkOut);
  const [note, setNote] = useState(guestToEdit?.note || "");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return null;
    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);
    const diffTime = outDate.getTime() - inDate.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.fullName = "ФИО обязательно для заполнения";
    } else if (fullName.trim().length < 2 || fullName.trim().length > 255) {
      errs.fullName = "Длина ФИО должна быть от 2 до 255 символов";
    }

    if (!phone.trim()) {
      errs.phone = "Номер телефона обязателен";
    } else if (!PHONE_REGEX.test(phone.trim())) {
      errs.phone = "Некорректный формат телефона (пример: +7 (999) 123-45-67)";
    }

    if (!roomNumber.trim()) {
      errs.roomNumber = "Номер комнаты обязателен";
    } else if (roomNumber.trim().length > 32) {
      errs.roomNumber = "Номер комнаты не должен превышать 32 символов";
    }

    if (!checkInDate) {
      errs.checkInDate = "Дата заезда обязательна";
    }

    if (!checkOutDate) {
      errs.checkOutDate = "Дата выезда обязательна";
    }

    if (checkInDate && checkOutDate) {
      if (checkOutDate <= checkInDate) {
        errs.checkOutDate = "Дата выезда должна быть позже даты заезда";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    const input: GuestInput = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      room_number: roomNumber.trim(),
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      note: note.trim() || undefined,
    };

    try {
      let savedGuest: Guest;
      if (isEdit && guestToEdit) {
        savedGuest = await api.updateGuest(guestToEdit.id, input);
        toast.success("Запись гостя успешно обновлена");
      } else {
        savedGuest = await api.createGuest(input);
        toast.success("Гость успешно зарегистрирован");
      }
      onSuccess(savedGuest, isEdit);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Не удалось сохранить запись";
      setErrors((prev) => ({ ...prev, api: msg }));
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          {isEdit ? (
            <Edit3 className="size-5 text-primary" />
          ) : (
            <UserPlus className="size-5 text-primary" />
          )}
          <DialogTitle>
            {isEdit ? "Редактирование записи гостя" : "Новая запись гостя"}
          </DialogTitle>
        </div>
        <DialogDescription>
          {isEdit
            ? "Внесите изменения в бронирование гостя и сохраните."
            : "Заполните данные для создания новой записи в журнале отеля."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {errors.api && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300">
            <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span>{errors.api}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-xs font-semibold">
            ФИО гостя <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="full_name"
            placeholder="Иванов Иван Иванович"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName)
                setErrors((prev) => ({ ...prev, fullName: "" }));
            }}
            className={errors.fullName ? "border-rose-500" : ""}
          />
          {errors.fullName && (
            <p className="text-xs text-rose-500">{errors.fullName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="phone"
              className="text-xs font-semibold flex items-center gap-1"
            >
              <Phone className="size-3 text-muted-foreground" />
              Телефон <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="+7 (999) 123-45-67"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
              }}
              className={errors.phone ? "border-rose-500" : ""}
            />
            {errors.phone && (
              <p className="text-xs text-rose-500">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="room_number"
              className="text-xs font-semibold flex items-center gap-1"
            >
              <DoorClosed className="size-3 text-muted-foreground" />
              Номер комнаты <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="room_number"
              placeholder="402"
              value={roomNumber}
              onChange={(e) => {
                setRoomNumber(e.target.value);
                if (errors.roomNumber)
                  setErrors((prev) => ({ ...prev, roomNumber: "" }));
              }}
              className={errors.roomNumber ? "border-rose-500" : ""}
            />
            {errors.roomNumber && (
              <p className="text-xs text-rose-500">{errors.roomNumber}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="check_in_date"
              className="text-xs font-semibold flex items-center gap-1"
            >
              <Calendar className="size-3 text-muted-foreground" />
              Дата заезда <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="check_in_date"
              type="date"
              value={checkInDate}
              onChange={(e) => {
                setCheckInDate(e.target.value);
                if (errors.checkInDate)
                  setErrors((prev) => ({ ...prev, checkInDate: "" }));
              }}
              className={errors.checkInDate ? "border-rose-500" : ""}
            />
            {errors.checkInDate && (
              <p className="text-xs text-rose-500">{errors.checkInDate}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="check_out_date"
                className="text-xs font-semibold flex items-center gap-1"
              >
                <Calendar className="size-3 text-muted-foreground" />
                Дата выезда <span className="text-rose-500">*</span>
              </Label>
              {nights !== null && nights > 0 && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                  {nights}{" "}
                  {nights === 1 ? "ночь" : nights < 5 ? "ночи" : "ночей"}
                </Badge>
              )}
            </div>
            <Input
              id="check_out_date"
              type="date"
              value={checkOutDate}
              onChange={(e) => {
                setCheckOutDate(e.target.value);
                if (errors.checkOutDate)
                  setErrors((prev) => ({ ...prev, checkOutDate: "" }));
              }}
              className={errors.checkOutDate ? "border-rose-500" : ""}
            />
            {errors.checkOutDate && (
              <p className="text-xs text-rose-500">{errors.checkOutDate}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="note" className="text-xs font-semibold">
            Заметка / особые пожелания (необязательно)
          </Label>
          <Textarea
            id="note"
            placeholder="Поздний заезд после 22:00, дополнительное спальное место, парковка..."
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isEdit ? (
              <Edit3 className="size-4" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {isEdit ? "Сохранить изменения" : "Добавить гостя"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function GuestFormDialog({
  open,
  onOpenChange,
  guestToEdit,
  onSuccess,
}: GuestFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <GuestFormInner
            key={guestToEdit?.id || "new-guest"}
            guestToEdit={guestToEdit}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
