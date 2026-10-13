async function captureDocumentCanvas(element: HTMLElement) {
  const { default: html2canvas } = await import('html2canvas');

  const mount = document.createElement('div');
  mount.setAttribute('aria-hidden', 'true');
  mount.style.position = 'fixed';
  mount.style.left = '0';
  mount.style.top = '0';
  mount.style.width = '794px';
  mount.style.zIndex = '-1';
  mount.style.pointerEvents = 'none';
  mount.style.background = '#ffffff';

  const clone = element.cloneNode(true) as HTMLElement;
  mount.appendChild(clone);
  document.body.appendChild(mount);

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      windowWidth: 794,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error('Unable to render applicant document.');
    }

    return canvas;
  } finally {
    mount.remove();
  }
}

async function buildPdfFromElement(element: HTMLElement) {
  const { default: jsPDF } = await import('jspdf');
  const canvas = await captureDocumentCanvas(element);
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({
    title: 'PICC Applicant Document',
    subject: 'Applicant profile',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf;
}

export async function downloadElementAsPdf(element: HTMLElement, fileName: string) {
  const pdf = await buildPdfFromElement(element);
  pdf.save(fileName);
}

export async function printElement(element: HTMLElement, title: string) {
  const canvas = await captureDocumentCanvas(element);
  const imgData = canvas.toDataURL('image/png');
  const safeTitle = title.replace(/</g, '&lt;').replace(/"/g, '&quot;');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.title = title;
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.srcdoc = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
      @page { margin: 10mm; size: A4; }
      html, body {
        margin: 0;
        padding: 0;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      img {
        display: block;
        width: 100%;
        height: auto;
      }
    </style>
  </head>
  <body>
    <img src="${imgData}" alt="Applicant document" />
  </body>
</html>`;
  document.body.appendChild(iframe);

  const cleanup = () => {
    iframe.remove();
  };

  await new Promise<void>((resolve, reject) => {
    const finish = () => {
      window.removeEventListener('afterprint', finish);
      cleanup();
      resolve();
    };

    window.setTimeout(() => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        cleanup();
        reject(new Error('Unable to open the print dialog.'));
        return;
      }

      try {
        frameWindow.focus();
        frameWindow.print();
      } catch {
        cleanup();
        reject(new Error('Unable to open the print dialog.'));
        return;
      }

      window.addEventListener('afterprint', finish);
      window.setTimeout(finish, 3000);
    }, 400);
  });
}

export function documentFileName(applicantName: string) {
  const slug = applicantName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'applicant';
  const date = new Date().toISOString().slice(0, 10);
  return `PICC-Applicant-${slug}-${date}.pdf`;
}
