import { redirect } from 'next/navigation';

/** Customers now ask for a quotation; staff issue the invoice once they accept. Old links land on the quotation form. */
export default function RequestInvoicePage() {
  redirect('/store/request-quote');
}
