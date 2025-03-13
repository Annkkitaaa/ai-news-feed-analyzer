import { format, formatDistance, formatRelative, parseISO } from 'date-fns';

/**
 * Format a date string to a human-readable format
 */
export const formatDate = (dateString, formatString = 'MMM d, yyyy') => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Get relative time from date (e.g., "2 hours ago")
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Error getting relative time:', error);
    return '';
  }
};