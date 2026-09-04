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
  const calendarHeight = props.mode === "day" ? 640 : props.mode === "week" ? 580 : 520;
  return (
    <CalendarErrorBoundary onError={props.onCalendarError} onBack={props.onBackToList}>
      <div className={`actions-calendar actions-calendar--${props.mode}`}>
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
        height={calendarHeight}
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        buttonText={{ today: "Текущая дата" }}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        slotLabelInterval="01:00"
        scrollTime="08:00:00"
        scrollTimeReset={false}
        dayMaxEvents={props.mode === "month" ? 3 : false}
        fixedWeekCount={false}
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
        eventDidMount={(info) => info.el.setAttribute("title", info.event.title)}
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
      <style jsx global>{`
        .actions-calendar .fc {
          --fc-today-bg-color: rgba(16, 185, 129, 0.055);
          font-size: 13px;
        }
        .actions-calendar .fc.fc-media-screen {
          min-height: 0 !important;
        }
        .actions-calendar .fc .fc-toolbar.fc-header-toolbar {
          margin-bottom: 8px;
          padding: 0 !important;
          gap: 8px !important;
          flex-direction: row !important;
        }
        .actions-calendar .fc .fc-toolbar-title {
          font-size: 15px;
          font-weight: 700;
        }
        .actions-calendar .fc .fc-button {
          width: 30px !important;
          height: 30px !important;
          padding: 4px 8px;
          font-size: 12px;
          line-height: 1.25;
        }
        .actions-calendar .fc .fc-today-button {
          width: auto !important;
        }
        .actions-calendar .fc .fc-col-header-cell-cushion,
        .actions-calendar .fc .fc-daygrid-day-number {
          padding: 4px 6px;
          font-size: 11px;
          font-weight: 700;
        }
        .actions-calendar .fc .fc-daygrid-day {
          padding: 0 !important;
        }
        .actions-calendar .fc .fc-timegrid-slot-label-cushion {
          padding: 0 5px;
          font-size: 10px;
          color: #64748b;
        }
        .actions-calendar .fc .fc-event {
          cursor: pointer;
          overflow: hidden;
          border-radius: 4px;
          line-height: 1.15;
        }
        .actions-calendar .fc .fc-event-main {
          overflow: hidden;
          padding: 1px 3px;
        }
        .actions-calendar .fc .fc-event-title,
        .actions-calendar .fc .fc-event-time {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .actions-calendar--day .fc .fc-timegrid-slot {
          height: 2.35em;
        }
        .actions-calendar--day .fc .fc-event-main {
          padding: 2px 4px;
          font-size: 12px;
        }
        .actions-calendar--week .fc .fc-timegrid-slot {
          height: 1.7em;
        }
        .actions-calendar--week .fc .fc-event-main {
          padding: 1px 2px;
          font-size: 10px;
        }
        .actions-calendar--month .fc .fc-daygrid-day-frame {
          min-height: 66px;
        }
        .actions-calendar--month .fc .fc-daygrid-event {
          margin-top: 1px;
          font-size: 10px;
        }
        .actions-calendar--month .fc .fc-daygrid-more-link {
          font-size: 10px;
          font-weight: 700;
        }
      `}</style>
      </div>
    </CalendarErrorBoundary>
  );
}
