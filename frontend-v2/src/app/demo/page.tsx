import { JalaliCalendarDemo } from '@/components/demo/jalali-calendar-demo';

export default function DemoPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col items-center space-y-6">
        <h1 className="text-3xl font-bold text-center">
          Jalali Calendar Demo
        </h1>
        <p className="text-muted-foreground text-center max-w-2xl">
          This demonstrates the Jalali calendar functionality implemented for the admin attendance overview.
          The calendar shows Persian month names, correct leap year handling, and proper navigation.
        </p>
        <JalaliCalendarDemo />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Jalali Calendar Demo',
  description: 'Demonstration of Jalali calendar implementation',
};