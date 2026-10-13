export function examplePlaceholder(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^e\.g\./i.test(trimmed) ? trimmed.replace(/^e\.g\.\s*/i, 'e.g. ') : `e.g. ${trimmed}`;
}

export default function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}
