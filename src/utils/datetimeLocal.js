function pad(value) {
  return String(value).padStart(2, '0');
}

export function toDatetimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocal(value, originalValue = null) {
  if (!value) return null;
  if (originalValue && value === toDatetimeLocal(originalValue)) return originalValue;
  return new Date(value).toISOString();
}
