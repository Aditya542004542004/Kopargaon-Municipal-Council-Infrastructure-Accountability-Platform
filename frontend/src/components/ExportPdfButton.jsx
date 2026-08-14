import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ExportPdfButton({ targetRef, projectName = 'Project' }) {
  const [downloading, setDownloading] = useState(false);

  const handleExportPdf = async () => {
    if (!targetRef.current) return;
    setDownloading(true);

    try {
      const element = targetRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Fix modern Tailwind oklab/oklch colors in cloned DOM for html2canvas
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const style = window.getComputedStyle(el);
            ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'].forEach((prop) => {
              const val = style[prop];
              if (val && (val.includes('oklab') || val.includes('oklch'))) {
                if (prop === 'backgroundColor') el.style.backgroundColor = '#ffffff';
                else if (prop === 'color') el.style.color = '#111827';
                else if (prop === 'borderColor') el.style.borderColor = '#e5e7eb';
              }
            });
          });
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const formattedName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      pdf.save(`kopargaon_audit_passport_${formattedName}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF, falling back to print dialog:', err);
      // Fallback to browser print if html2canvas hits an unhandled CSS rule
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExportPdf}
      disabled={downloading}
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
    >
      <span>{downloading ? '⏳ Generating PDF...' : '📄 Download Official Audit PDF'}</span>
    </button>
  );
}