import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, parse, isValid } from 'date-fns';

export function formatDateForSheet(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDateForSpreadsheet(date: Date): string {
  return format(date, 'MM/dd/yyyy');
}

export function normalizeSheetDateToStorage(dateValue: string): string {
  if (!dateValue) return '';

  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (isoPattern.test(dateValue)) {
    return dateValue;
  }

  const parsedUsDate = parse(dateValue, 'M/d/yyyy', new Date());
  if (isValid(parsedUsDate)) {
    return formatDateForSheet(parsedUsDate);
  }

  const fallback = new Date(dateValue);
  return isValid(fallback) ? formatDateForSheet(fallback) : '';
}

export function formatDateDisplay(date: Date): string {
  return format(date, 'EEE, dd-MMM'); // "Mon, 30-Dec"
}

export function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

export function getLastWeekRange(): { start: Date; end: Date } {
  const lastWeek = subWeeks(new Date(), 1);
  return {
    start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
    end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
  };
}

export function getThisMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

export function getLastMonthRange(): { start: Date; end: Date } {
  const lastMonth = subMonths(new Date(), 1);
  return {
    start: startOfMonth(lastMonth),
    end: endOfMonth(lastMonth),
  };
}
