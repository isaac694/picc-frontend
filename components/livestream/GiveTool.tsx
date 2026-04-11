import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useGiveForm } from '@/hooks/useLivestreamTools';

export default function GiveTool({ isMobile }: { isMobile?: boolean }) {
  const {
    giveForm,
    isSubmitting,
    formError,
    formSuccess,
    handleGiveChange,
    handleGiveSubmit,
  } = useGiveForm();

  const idSuffix = isMobile ? 'Mobile' : '';

  if (isMobile) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-black/10 text-black">
        <div className="border-2 border-black/10 rounded-2xl p-4">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
              <Image
                src="/logo.png"
                alt="PICC logo"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
            </div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-black/50">
              Pentecost International Christian Centre
            </p>
            <h3 className="text-lg font-semibold text-black">Give Now</h3>
          </div>

          <form onSubmit={handleGiveSubmit} className="mt-5 space-y-6">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <label className="flex flex-col gap-2 min-w-0">
                <span className="text-black/70">Booklet No.</span>
                <input
                  type="text"
                  name="bookletNumber"
                  value={giveForm.bookletNumber}
                  onChange={handleGiveChange}
                  className="w-full min-w-0 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                  placeholder="..............."
                />
              </label>
              <label className="flex flex-col gap-2 min-w-0">
                <span className="text-black/70">Date</span>
                <input
                  type="date"
                  name="givingDate"
                  value={giveForm.givingDate}
                  onChange={handleGiveChange}
                  className="w-full min-w-0 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                />
              </label>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-black/70">Tick where appropriate</p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {[
                  'First Fruit',
                  'Tithe',
                  'Service Offering',
                  'Project Offering',
                  'Thanks Giving',
                  "Prophet's Offering",
                ].map((label) => (
                  <label key={label} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="givingType"
                      value={label}
                      checked={giveForm.givingType === label}
                      onChange={handleGiveChange}
                      className="h-4 w-4 border border-black/40"
                    />
                    <span className="text-black/70">{label}</span>
                  </label>
                ))}
              </div>
              <label className="mt-2 flex flex-col gap-2 text-sm min-w-0">
                <span className="text-black/70">Special Recipient</span>
                <input
                  type="text"
                  name="specialRecipient"
                  value={giveForm.specialRecipient}
                  onChange={handleGiveChange}
                  className="w-full min-w-0 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                  placeholder="........................"
                />
              </label>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm min-w-0">
                <span className="text-black/70">Amount</span>
                <div className="flex flex-col gap-3 min-w-0">
                  <select
                    id={`currency${idSuffix}`}
                    name="currency"
                    value={giveForm.currency}
                    onChange={handleGiveChange}
                    className="h-10 w-full rounded-full border border-black/20 bg-white px-3 text-xs"
                  >
                    <option value="MWK">MWK</option>
                    <option value="USD">USD</option>
                  </select>
                  <input
                    id={`amount${idSuffix}`}
                    type="number"
                    name="amount"
                    value={giveForm.amount}
                    onChange={handleGiveChange}
                    placeholder="0.00"
                    min="1"
                    step="any"
                    inputMode="decimal"
                    className="h-10 w-full min-w-0 rounded-full border border-black/10 bg-white px-3 text-sm"
                    required
                  />
                </div>
              </div>

              <label className="flex flex-col gap-2 text-sm min-w-0">
                <span className="text-black/70">Full Names</span>
                <input
                  type="text"
                  name="fullName"
                  value={giveForm.fullName}
                  onChange={handleGiveChange}
                  className="w-full min-w-0 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                  placeholder="...................................."
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm min-w-0">
                <span className="text-black/70">Email</span>
                <input
                  type="email"
                  name="email"
                  value={giveForm.email}
                  onChange={handleGiveChange}
                  className="w-full min-w-0 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                  placeholder="name@email.com"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 min-w-0">
                <select
                  id={`phoneCountry${idSuffix}`}
                  name="phoneCountry"
                  value={giveForm.phoneCountry}
                  onChange={handleGiveChange}
                  className="h-10 w-full rounded-full border border-black/20 bg-white px-3 text-xs"
                >
                  <option value="+265">Malawi (+265)</option>
                  <option value="+233">Ghana (+233)</option>
                  <option value="+234">Nigeria (+234)</option>
                  <option value="+254">Kenya (+254)</option>
                  <option value="+255">Tanzania (+255)</option>
                  <option value="+260">Zambia (+260)</option>
                  <option value="+27">South Africa (+27)</option>
                  <option value="+44">United Kingdom (+44)</option>
                  <option value="+1">United States (+1)</option>
                </select>
                <input
                  id={`phone${idSuffix}`}
                  type="tel"
                  name="phone"
                  value={giveForm.phone}
                  onChange={handleGiveChange}
                  placeholder="Phone number"
                  className="h-10 w-full min-w-0 rounded-full border border-black/10 bg-white px-3 text-sm"
                  required
                />
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h4 className="text-base font-semibold text-black mb-3">Payment Info</h4>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-black">Payment Method</span>
                <div className="grid grid-cols-1 gap-3">
                  <label htmlFor={`paymentMethodAirtel${idSuffix}`} className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3">
                    <input
                      id={`paymentMethodAirtel${idSuffix}`}
                      type="radio"
                      name="paymentMethod"
                      value="airtel"
                      checked={giveForm.paymentMethod === 'airtel'}
                      onChange={handleGiveChange}
                    />
                    <span className="text-sm font-medium text-black">Airtel Money</span>
                  </label>
                  <label htmlFor={`paymentMethodMpamba${idSuffix}`} className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3">
                    <input
                      id={`paymentMethodMpamba${idSuffix}`}
                      type="radio"
                      name="paymentMethod"
                      value="mpamba"
                      checked={giveForm.paymentMethod === 'mpamba'}
                      onChange={handleGiveChange}
                    />
                    <span className="text-sm font-medium text-black">Mpamba</span>
                  </label>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <label htmlFor={`reason${idSuffix}`} className="text-sm font-medium text-black">
                  Giving Reason
                </label>
                <input
                  id={`reason${idSuffix}`}
                  type="text"
                  name="reason"
                  value={giveForm.reason}
                  onChange={handleGiveChange}
                  placeholder="Giving Reason"
                  className="h-12 rounded-full border border-black/10 bg-white px-4 text-sm"
                />
              </div>
              <div className="mt-5">
                <Button
                  type="submit"
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Give'}
                </Button>
              </div>
              {formError && (
                <p className="mt-4 text-sm text-red-600">{formError}</p>
              )}
              {formSuccess && (
                <p className="mt-4 text-sm text-green-600">{formSuccess}</p>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Desktop Form
  return (
    <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-black/10 text-black">
      <div className="border-2 border-black/10 rounded-2xl p-4 sm:p-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
            <Image
              src="/logo.png"
              alt="PICC logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          </div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-black/50">
            Pentecost International Christian Centre
          </p>
          <h3 className="text-xl font-semibold text-black">Give Now</h3>
        </div>

        <form onSubmit={handleGiveSubmit} className="mt-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
              <span className="sm:min-w-[110px] text-black/70">Booklet No.</span>
              <input
                type="text"
                name="bookletNumber"
                value={giveForm.bookletNumber}
                onChange={handleGiveChange}
                className="w-full min-w-0 flex-1 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                placeholder="..............."
              />
            </label>
            <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
              <span className="sm:min-w-[70px] text-black/70">Date</span>
              <input
                type="date"
                name="givingDate"
                value={giveForm.givingDate}
                onChange={handleGiveChange}
                className="w-full min-w-0 flex-1 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
            <div>
              <p className="text-sm font-semibold text-black/70 mb-3">Tick where appropriate</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  'First Fruit',
                  'Tithe',
                  'Service Offering',
                  'Project Offering',
                  'Thanks Giving',
                  "Prophet's Offering",
                ].map((label) => (
                  <label key={label} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="givingType"
                      value={label}
                      checked={giveForm.givingType === label}
                      onChange={handleGiveChange}
                      className="h-4 w-4 border border-black/40"
                    />
                    <span className="text-black/70">{label}</span>
                  </label>
                ))}
              </div>
              <label className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm min-w-0">
                <span className="sm:min-w-[130px] text-black/70">Special Recipient</span>
                <input
                  type="text"
                  name="specialRecipient"
                  value={giveForm.specialRecipient}
                  onChange={handleGiveChange}
                  className="w-full min-w-0 flex-1 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                  placeholder="........................"
                />
              </label>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] items-start sm:items-center gap-3 text-sm min-w-0">
                <span className="text-black/70">Amount</span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                  <select
                    id={`currency${idSuffix}`}
                    name="currency"
                    value={giveForm.currency}
                    onChange={handleGiveChange}
                    className="h-10 w-full sm:w-auto rounded-full border border-black/20 bg-white px-3 text-xs"
                  >
                    <option value="MWK">MWK</option>
                    <option value="USD">USD</option>
                  </select>
                  <input
                    id={`amount${idSuffix}`}
                    type="number"
                    name="amount"
                    value={giveForm.amount}
                    onChange={handleGiveChange}
                    placeholder="0.00"
                    min="1"
                    step="any"
                    inputMode="decimal"
                    className="h-10 w-full min-w-0 flex-1 rounded-full border border-black/10 bg-white px-3 text-sm"
                    required
                  />
                </div>
              </div>

              <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm min-w-0">
                <span className="sm:min-w-[110px] text-black/70">Full Names</span>
                <input
                  type="text"
                  name="fullName"
                  value={giveForm.fullName}
                  onChange={handleGiveChange}
                  className="w-full min-w-0 flex-1 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                  placeholder="...................................."
                  required
                />
              </label>

              <div className="grid grid-cols-1 gap-3 text-sm">
                <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                  <span className="sm:min-w-[110px] text-black/70">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={giveForm.email}
                    onChange={handleGiveChange}
                    className="w-full min-w-0 flex-1 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                    placeholder="name@email.com"
                  />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 min-w-0">
                  <select
                    id={`phoneCountry${idSuffix}`}
                    name="phoneCountry"
                    value={giveForm.phoneCountry}
                    onChange={handleGiveChange}
                    className="h-10 w-full rounded-full border border-black/20 bg-white px-3 text-xs"
                  >
                    <option value="+265">Malawi (+265)</option>
                    <option value="+233">Ghana (+233)</option>
                    <option value="+234">Nigeria (+234)</option>
                    <option value="+254">Kenya (+254)</option>
                    <option value="+255">Tanzania (+255)</option>
                    <option value="+260">Zambia (+260)</option>
                    <option value="+27">South Africa (+27)</option>
                    <option value="+44">United Kingdom (+44)</option>
                    <option value="+1">United States (+1)</option>
                  </select>
                  <input
                    id={`phone${idSuffix}`}
                    type="tel"
                    name="phone"
                    value={giveForm.phone}
                    onChange={handleGiveChange}
                    placeholder="Phone number"
                    className="h-10 w-full min-w-0 rounded-full border border-black/10 bg-white px-3 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <h4 className="text-lg font-semibold text-black mb-4">Payment Info</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-black">Payment Method</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label htmlFor={`paymentMethodAirtel${idSuffix}`} className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3">
                  <input
                    id={`paymentMethodAirtel${idSuffix}`}
                    type="radio"
                    name="paymentMethod"
                    value="airtel"
                    checked={giveForm.paymentMethod === 'airtel'}
                    onChange={handleGiveChange}
                  />
                  <span className="text-sm font-medium text-black">Airtel Money</span>
                </label>
                <label htmlFor={`paymentMethodMpamba${idSuffix}`} className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3">
                  <input
                    id={`paymentMethodMpamba${idSuffix}`}
                    type="radio"
                    name="paymentMethod"
                    value="mpamba"
                    checked={giveForm.paymentMethod === 'mpamba'}
                    onChange={handleGiveChange}
                  />
                  <span className="text-sm font-medium text-black">Mpamba</span>
                </label>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <label htmlFor={`reason${idSuffix}`} className="text-sm font-medium text-black">
                Giving Reason
              </label>
              <input
                id={`reason${idSuffix}`}
                type="text"
                name="reason"
                value={giveForm.reason}
                onChange={handleGiveChange}
                placeholder="Giving Reason"
                className="h-12 rounded-full border border-black/10 bg-white px-4 text-sm"
              />
            </div>
            <div className="mt-6">
              <Button
                type="submit"
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Give'}
              </Button>
            </div>
            {formError && (
              <p className="mt-4 text-sm text-red-600">{formError}</p>
            )}
            {formSuccess && (
              <p className="mt-4 text-sm text-green-600">{formSuccess}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
