import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a local date to UTC based on the provided timezone
 * @param localDate The date in local time
 * @param timezone The timezone string (e.g., 'Australia/Melbourne')
 * @returns Date object in UTC time
 */
export function convertLocalToUTC(localDate: Date, timezone: string): Date {
  try {
    // First approach: Create an ISO string with timezone information
    // Get formatted date components in the correct timezone format
    const year = localDate.getFullYear();
    const month = localDate.getMonth() + 1; // JS months are 0-indexed
    const day = localDate.getDate();
    const hours = localDate.getHours();
    const minutes = localDate.getMinutes();
    const seconds = localDate.getSeconds();
    
    // Get the timezone offset for calculations
    const offset = formatInTimeZone(new Date(), timezone, 'xxx');
    
    // Create ISO string with the timezone offset
    const dateWithTzString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}${offset}`;
    
    // This creates a UTC date by parsing the string with timezone information
    const result = new Date(dateWithTzString);
    
    console.log(
      `Converting local date: ${localDate.toString()} in timezone: ${timezone}\n` +
      `Created date string with offset: ${dateWithTzString}\n` +
      `Result as UTC: ${result.toISOString()}`
    );
    
    return result;
  } catch (error) {
    console.error('Error converting local time to UTC:', error);
    // Fallback to basic conversion if there's an error
    return new Date(localDate.toISOString());
  }
}

/**
 * Formats a UTC date string to local time format (HH:MM) in the given timezone
 * @param utcDateString UTC date string
 * @param timezone The timezone string (e.g., 'Australia/Melbourne')
 * @returns Local time string in HH:MM format
 */
export function getLocalTimeFromUTC(utcDateString: string, timezone: string): string {
  try {
    // Parse the UTC date string
    const utcDate = parseISO(utcDateString);
    
    // Format directly to the target timezone time
    return formatInTimeZone(utcDate, timezone, 'HH:mm');
  } catch (error) {
    console.error('Error getting local time from UTC:', error);
    
    // Fallback to basic UTC time
    const date = new Date(utcDateString);
    return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
  }
}
