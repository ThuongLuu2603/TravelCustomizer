import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { vi } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { forwardRef } from "react";

export interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label?: string;
  className?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ date, setDate, label, className, placeholder = "Chọn ngày", icon, disabled, minDate, maxDate, ...props }, ref) => {
    return (
      <div className={cn("grid gap-1", className)}>
        {label && <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant={"outline"}
              disabled={disabled}
              className={cn(
                "w-full h-10 justify-start text-left font-normal",
                !date && "text-muted-foreground",
                icon && "pl-9",
                className
              )}
              {...props}
            >
              {icon && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-600">
                  {icon}
                </span>
              )}
              {!icon && <CalendarIcon className="mr-2 h-4 w-4" />}
              {date ? format(date, "dd/MM/yyyy", { locale: vi }) : <span>{placeholder}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              locale={vi}
              fromDate={minDate}
              toDate={maxDate}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export { DatePicker };
