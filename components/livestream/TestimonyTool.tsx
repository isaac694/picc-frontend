import { Button } from '@/components/ui/button';
import { useTestimonyForm } from '@/hooks/useLivestreamTools';

type TestimonyToolProps = {
  churchEmail?: string;
};

export default function TestimonyTool({ churchEmail }: TestimonyToolProps) {
  const {
    testimonyForm,
    handleTestimonyChange,
    handleTestimonySubmit,
    isSubmitting,
    formError,
    formSuccess,
  } = useTestimonyForm(churchEmail);

  return (
    <div className="text-white">
      <h3 className="text-lg font-semibold mb-2">Submit a testimony</h3>
      <p className="text-white/70 mb-5">
        Share what God has done in your life and encourage others.
      </p>
      {formError && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {formError}
        </div>
      )}
      {formSuccess && (
        <div className="mb-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
          {formSuccess}
        </div>
      )}
      <form className="grid gap-4" onSubmit={handleTestimonySubmit}>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Full Name"
            required
            value={testimonyForm.fullName}
            onChange={handleTestimonyChange('fullName')}
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="Phone Number"
            value={testimonyForm.phone}
            onChange={handleTestimonyChange('phone')}
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
            Area of Testimony
          </label>
          <select
            value={testimonyForm.area}
            onChange={handleTestimonyChange('area') as any}
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
            required
          >
            <option value="">Select area of testimony</option>
            <option value="Healing & Health">Healing & Health</option>
            <option value="Financial Breakthrough">Financial Breakthrough</option>
            <option value="Family & Marriage">Family & Marriage</option>
            <option value="Career & Business">Career & Business</option>
            <option value="Spiritual Growth">Spiritual Growth</option>
            <option value="Protection & Safety">Protection & Safety</option>
            <option value="Academic Success">Academic Success</option>
            <option value="Fruit of the Womb">Fruit of the Womb</option>
            <option value="Salvation">Salvation</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
            How the situation was like
          </label>
          <textarea
            rows={4}
            placeholder="Describe the situation"
            required
            value={testimonyForm.situation}
            onChange={handleTestimonyChange('situation')}
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
            What God has done
          </label>
          <textarea
            rows={4}
            placeholder="Share what God has done"
            required
            value={testimonyForm.testimony}
            onChange={handleTestimonyChange('testimony')}
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </div>
        <Button className="w-full bg-white text-black hover:bg-white/90" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Submit Testimony'}
        </Button>
      </form>
    </div>
  );
}
