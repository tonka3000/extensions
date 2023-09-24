import { authorize, client, OAuthClientId } from "./oauth";
import { calendar_v3, auth } from "@googleapis/calendar";
import { extractDateString, nowDate, stringToDate } from "./utils";

export async function getAuthorizedCalendarClient() {
  await authorize();
  const t = await client.getTokens();

  const oAuth2Client = new auth.OAuth2(OAuthClientId());
  oAuth2Client.setCredentials({
    access_token: t?.accessToken,
    refresh_token: t?.refreshToken,
    id_token: t?.idToken,
    scope: t?.scope,
    expiry_date: t?.expiresIn,
  });
  const gm = new calendar_v3.Calendar({ auth: oAuth2Client });
  return gm;
}

export interface CalendarEvent {
  calendar: calendar_v3.Schema$CalendarListEntry;
  event: calendar_v3.Schema$Event;
}

export interface CalendarEvents {
  calendar: calendar_v3.Schema$CalendarListEntry;
  events: calendar_v3.Schema$Events;
}

export async function getCalendars(calendar: calendar_v3.Calendar) {
  return await calendar.calendarList.list({ showDeleted: false, showHidden: false });
}

export async function getEventsPerCalendar(calendar: calendar_v3.Calendar) {
  const r = await calendar.calendarList.list();
  const calendars = r.data.items;
  if (calendars) {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    const promises = calendars.map((c) => {
      return calendar.events
        .list({
          calendarId: c.id || "",
          timeMin: nowDate().toISOString(),
          timeMax: maxDate.toISOString(),
          singleEvents: true,
        })
        .then((req) => {
          const data: CalendarEvents = {
            calendar: c,
            events: req.data,
          };
          return data;
        });
    });
    const res = await Promise.all(promises);
    return res;
  }
  return [];
}

export function startOfEvent(event: calendar_v3.Schema$Event | undefined) {
  if (!event?.start) {
    return undefined;
  }
  if (event.start.dateTime) {
    return stringToDate(event.start.dateTime);
  }
  if (event.start.date) {
    return stringToDate(event.start.date);
  }
}

export async function getEvents(calendar: calendar_v3.Calendar) {
  const calendars = await getEventsPerCalendar(calendar);
  let eventsAll: CalendarEvent[] = [];
  for (const cal of calendars || []) {
    const items = cal.events.items;
    if (items && items.length > 0) {
      const events: CalendarEvent[] = items.map((item) => ({ calendar: cal.calendar, event: item }));
      eventsAll = [...eventsAll, ...events];
    }
  }
  const fallbackDate = new Date(2099);
  return eventsAll.sort(
    (a, b) => (startOfEvent(a.event) || fallbackDate).getTime() - (startOfEvent(b.event) || fallbackDate).getTime()
  );
}

export interface CalendarDayEvents {
  day: Date;
  events: CalendarEvent[];
}

export function groupEventsByDay(events: CalendarEvent[] | null | undefined) {
  if (!events || events.length <= 0) {
    return undefined;
  }
  const days: Record<string, CalendarEvent[]> = {};
  for (const e of events) {
    const start = startOfEvent(e.event);
    if (!start) {
      continue;
    }
    const key = extractDateString(start);
    const d = days[key] || [];
    d.push(e);
    days[key] = d;
  }
  const result: CalendarDayEvents[] = Object.keys(days).map((k) => ({ day: new Date(k), events: days[k] }));
  return result;
}
