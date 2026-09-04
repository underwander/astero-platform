"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export type CalendarAction = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  color: string;
  source: unknown;
};

type Props = {
  mode: "day" | "week" | "month";
  date: string;
  events: CalendarAction[];
  onDateChange: (date: string) => void;
  onEventClick: (source: unknown) => void;
  onSlotClick: (start: Date, end?: Date) => void;
  onMonthDayClick: (date: string) => void;
  onMove: (id: string, start: Date, end: Date | null) => Promise<void>;
  onCalendarError: (error: Error) => void;
  onBackToList: () => void;
};

const viewNames = {
  day: "timeGridDay",
  week: "timeGridWeek",
  month: "dayGridMonth",
} as const;

class CalendarErrorBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void; onBack: () => void },
  { error: Error | null; retryKey: number }
> {
  state = { error: null as Error | null, retryKey: 0 };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") console.error("Actions Calendar crashed", error, info);
    this.props.onError(error);
  }

  retry = () => this.setState(({ retryKey }) => ({ error: null, retryKey: retryKey + 1 }));

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-96 place-items-center rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <div>
            <h3 className="font-bold text-red-800">Не удалось отобразить календарь.</h3>
            <p className="mt-2 text-sm text-red-600">Список действий продолжает работать.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={this.retry} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Повторить</button>
              <button onClick={this.props.onBack} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700">Вернуться к списку</button>
            </div>
          </div>
        </div>
      );
    }
    return <div key={this.state.retryKey}>{this.props.children}</div>;
  }
}

export default function ActionsCalendarClient(props: Props) {
  return (
    <CalendarErrorBoundary onError={props.onCalendarError} onBack={props.onBackToList}>
      <FullCalendar
        key={props.mode}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={viewNames[props.mode]}
        initialDate={props.date}
        locale="ru"
        firstDay={1}
        nowIndicator
        editable
        selectable
        height="auto"
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        buttonText={{ today: "Сегодня" }}
        events={props.events.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          backgroundColor: event.color,
          borderColor: "transparent",
          extendedProps: { source: event.source },
        }))}
        eventClick={(info) => props.onEventClick(info.event.extendedProps.source)}
        select={(info) => props.onSlotClick(info.start, info.end)}
        dateClick={(info) => {
          if (props.mode === "month") props.onMonthDayClick(info.dateStr);
          else props.onSlotClick(info.date);
        }}
        eventDrop={(info) => {
          if (!info.event.start) return info.revert();
          void props.onMove(info.event.id, info.event.start, info.event.end).catch(() => info.revert());
        }}
        eventResize={(info) => {
          if (!info.event.start) return info.revert();
          void props.onMove(info.event.id, info.event.start, info.event.end).catch(() => info.revert());
        }}
        datesSet={(info) => {
          const current = info.view.currentStart;
          const next = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
          props.onDateChange(next);
        }}
      />
    </CalendarErrorBoundary>
  );
}
