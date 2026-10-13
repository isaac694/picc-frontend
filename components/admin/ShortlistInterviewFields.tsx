'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toTimeInputValue } from '@/lib/hr-application-review';

type ShortlistInterviewFieldsProps = {
  interviewDate: string;
  interviewTime: string;
  onInterviewDateChange: (value: string) => void;
  onInterviewTimeChange: (value: string) => void;
  dateId?: string;
  timeId?: string;
};

export default function ShortlistInterviewFields({
  interviewDate,
  interviewTime,
  onInterviewDateChange,
  onInterviewTimeChange,
  dateId = 'interview-date',
  timeId = 'interview-time',
}: ShortlistInterviewFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={dateId}>Interview date *</Label>
        <Input
          id={dateId}
          type="date"
          value={interviewDate}
          onChange={(event) => onInterviewDateChange(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={timeId}>Interview time *</Label>
        <Input
          id={timeId}
          type="time"
          value={toTimeInputValue(interviewTime)}
          onChange={(event) => onInterviewTimeChange(event.target.value)}
        />
      </div>
    </>
  );
}
