export const MALAWI_TIME_ZONE = 'Africa/Blantyre';
export const MALAWI_UTC_OFFSET = '+02:00';

const datePartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MALAWI_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const dateTimePartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MALAWI_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const partsToObject = (parts: Intl.DateTimeFormatPart[]) =>
  Object.fromEntries(parts.map((part) => [part.type, part.value]));

export const getDateInputValueInMalawi = (value: Date) => {
  const parts = partsToObject(datePartsFormatter.formatToParts(value));
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const getTomorrowDateInputValueInMalawi = () => {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return getDateInputValueInMalawi(tomorrow);
};

export const getDateTimeInputValueInMalawi = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const parts = partsToObject(dateTimePartsFormatter.formatToParts(parsed));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
};

export const toMalawiIsoInstant = (date: string, time: string) =>
  new Date(`${date}T${time}:00${MALAWI_UTC_OFFSET}`).toISOString();
