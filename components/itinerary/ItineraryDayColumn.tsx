import {
  Bus,
  Car,
  Clock,
  Hotel,
  Landmark,
  Map,
  MoreHorizontal,
  Mountain,
  Plane,
  ShoppingBag,
  Ship,
  Ticket,
  Train,
  Utensils,
} from "lucide-react";
import type {
  Activity,
  ActivityType,
  Lodging,
  Transportation,
  TransportationType,
} from "@/lib/types";

export type ItineraryDayItem =
  | { kind: "lodging"; event: "checkin" | "checkout"; data: Lodging; sortKey: string }
  | { kind: "transportation"; data: Transportation; sortKey: string }
  | { kind: "activity"; data: Activity; sortKey: string };

const TRANSPORT_ICONS: Record<
  TransportationType,
  React.FC<{ size?: number; className?: string }>
> = {
  flight: Plane,
  train: Train,
  "car-rental": Car,
  ferry: Ship,
  bus: Bus,
};

const TRANSPORT_LABELS: Record<TransportationType, string> = {
  flight: "Flight",
  train: "Train",
  "car-rental": "Car Rental",
  ferry: "Ferry",
  bus: "Bus",
};

const ACTIVITY_ICONS: Record<
  ActivityType,
  React.FC<{ size?: number; className?: string }>
> = {
  restaurant: Utensils,
  museum: Landmark,
  tour: Map,
  show: Ticket,
  outdoor: Mountain,
  shopping: ShoppingBag,
  "free-time": Clock,
  other: MoreHorizontal,
};

function fmtTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function fmtDayHeader(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function ItemRow({
  item,
  isLast,
}: {
  item: ItineraryDayItem;
  isLast: boolean;
}) {
  let dotClass: string;
  let iconBg: string;
  let iconColor: string;
  let Icon: React.FC<{ size?: number; className?: string }>;
  let label: string;
  let sublabel: string;
  let timeStr: string;

  if (item.kind === "lodging") {
    dotClass = "bg-blue-400 dark:bg-blue-500";
    iconBg = "bg-blue-100 dark:bg-blue-900/40";
    iconColor = "text-blue-600 dark:text-blue-400";
    Icon = Hotel;
    const verb = item.event === "checkin" ? "Check in" : "Check out";
    label = `${verb} — ${item.data.name}`;
    sublabel = item.data.address ?? "";
    timeStr = item.event === "checkin" ? "Afternoon" : "Morning";
  } else if (item.kind === "transportation") {
    dotClass = "bg-amber-400 dark:bg-amber-500";
    iconBg = "bg-amber-100 dark:bg-amber-900/40";
    iconColor = "text-amber-700 dark:text-amber-400";
    Icon = TRANSPORT_ICONS[item.data.type];
    const t = item.data;
    label = t.arrivalLocation
      ? `${TRANSPORT_LABELS[t.type]}: ${t.departureLocation} → ${t.arrivalLocation}`
      : `${TRANSPORT_LABELS[t.type]}: ${t.departureLocation}`;
    sublabel = t.confirmationNumber ? `#${t.confirmationNumber}` : "";
    const timePart = item.data.departureDateTime.slice(11, 16);
    timeStr = timePart ? fmtTime(timePart) : "";
  } else {
    dotClass = "bg-teal-400 dark:bg-teal-500";
    iconBg = "bg-teal-100 dark:bg-teal-900/40";
    iconColor = "text-teal-600 dark:text-teal-400";
    Icon = ACTIVITY_ICONS[item.data.type];
    label = item.data.title;
    sublabel = item.data.location ?? "";
    timeStr = item.data.startTime ? fmtTime(item.data.startTime) : "";
  }

  return (
    <div
      className={`flex gap-3 px-4 py-3.5 ${
        !isLast ? "border-b border-zinc-100 dark:border-zinc-800" : ""
      }`}
    >
      {/* Timeline dot + connector */}
      <div className="flex w-4 flex-none flex-col items-center pt-1.5">
        <div className={`h-2 w-2 flex-none rounded-full ${dotClass}`} />
        {!isLast && (
          <div className="mt-1.5 w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        )}
      </div>

      {/* Type icon */}
      <div
        className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md ${iconBg}`}
      >
        <Icon size={12} className={iconColor} />
      </div>

      {/* Label + sublabel */}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {label}
        </div>
        {sublabel && (
          <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {sublabel}
          </div>
        )}
      </div>

      {/* Time */}
      {timeStr && (
        <div className="flex-none text-right text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
          {timeStr}
        </div>
      )}
    </div>
  );
}

interface Props {
  date: string;
  dayNumber: number;
  items: ItineraryDayItem[];
}

export default function ItineraryDayColumn({ date, dayNumber, items }: Props) {
  return (
    <div>
      {/* Day header */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="rounded-md bg-teal-700 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white">
          Day {dayNumber}
        </span>
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          {fmtDayHeader(date)}
        </span>
      </div>

      {/* Items or empty placeholder */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-5 text-center text-xs text-zinc-400 dark:border-zinc-800">
          Nothing planned yet
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {items.map((item, i) => (
            <ItemRow key={i} item={item} isLast={i === items.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}
