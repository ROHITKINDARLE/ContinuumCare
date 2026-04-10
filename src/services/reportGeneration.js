/**
 * Medical Report Generation Service
 * Generates downloadable PDFs for patients
 * Uses jsPDF and html2canvas for client-side generation
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate a comprehensive medical report PDF
 * @param {Object} data - Report data containing patient, visits, alerts, prescriptions, reports
 * @returns {Promise<void>}
 */
export async function generateMedicalReportPDF(data) {
  const {
    patient,
    visits = [],
    alerts = [],
    prescriptions = [],
    labReports = [],
  } = data;

  if (!patient) {
    throw new Error('Patient data is required to generate report');
  }

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    const lineHeight = 7;
    const sectionSpacing = 10;

    // ===== HEADER =====
    doc.setFontSize(20);
    doc.setTextColor(31, 41, 55); // dark color
    doc.text('ContinuumCare', margin, yPosition);
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('Medical Report', margin, yPosition + 8);

    yPosition += 18;

    // ===== PATIENT INFORMATION SECTION =====
    addSection(doc, 'PATIENT INFORMATION', margin, yPosition, maxWidth);
    yPosition += sectionSpacing;

    const patientInfo = [
      ['Full Name:', patient.full_name || 'N/A'],
      ['Date of Birth:', patient.date_of_birth ? formatDate(patient.date_of_birth) : 'N/A'],
      ['Gender:', patient.gender || 'N/A'],
      ['Phone:', patient.phone || 'N/A'],
      ['Address:', patient.address || 'N/A'],
      ['Medical History:', patient.medical_history || 'None recorded'],
      ['Allergies:', patient.allergies || 'None recorded'],
      ['Report Generated:', new Date().toLocaleDateString()],
    ];

    patientInfo.forEach(([label, value]) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.setFont(undefined, 'bold');
      doc.text(label, margin, yPosition);
      
      doc.setFont(undefined, 'normal');
      doc.setTextColor(75, 85, 99);
      const labelWidth = doc.getTextWidth(label) + 5;
      const wrappedValue = doc.splitTextToSize(value, maxWidth - labelWidth);
      doc.text(wrappedValue, margin + labelWidth, yPosition);
      
      yPosition += lineHeight * wrappedValue.length + 2;
    });

    yPosition += sectionSpacing;

    // ===== VISIT HISTORY SECTION =====
    if (visits.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      addSection(doc, 'VISIT HISTORY', margin, yPosition, maxWidth);
      yPosition += sectionSpacing;

      visits.slice(0, 5).forEach((visit, index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(10);
        doc.setTextColor(31, 41, 55);
        doc.setFont(undefined, 'bold');
        doc.text(`Visit ${index + 1} - ${formatDate(visit.visit_date)}`, margin, yPosition);
        yPosition += lineHeight;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(75, 85, 99);
        doc.setFontSize(9);

        const visitDetails = [
          `Chief Complaint: ${visit.chief_complaint || 'N/A'}`,
          `Assessment: ${visit.assessment || 'N/A'}`,
          `Plan: ${visit.plan || 'N/A'}`,
        ];

        if (visit.vitals) {
          const v = visit.vitals;
          visitDetails.push(
            `Vitals - SpO₂: ${v.spo2 || 'N/A'}%, BP: ${v.bp || 'N/A'}, HR: ${v.hr || 'N/A'} bpm, Temp: ${v.temperature || 'N/A'}°C, Weight: ${v.weight || 'N/A'} kg`
          );
        }

        visitDetails.forEach(detail => {
          if (yPosition > pageHeight - 25) {
            doc.addPage();
            yPosition = margin;
          }
          const wrapped = doc.splitTextToSize(detail, maxWidth);
          doc.text(wrapped, margin + 5, yPosition);
          yPosition += lineHeight * wrapped.length;
        });

        yPosition += 3;
      });

      if (visits.length > 5) {
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(`... and ${visits.length - 5} more visits`, margin + 5, yPosition);
        yPosition += lineHeight;
      }

      yPosition += sectionSpacing;
    }

    // ===== ALERTS SECTION =====
    if (alerts.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      addSection(doc, 'HEALTH ALERTS', margin, yPosition, maxWidth);
      yPosition += sectionSpacing;

      const activeAlerts = alerts.filter(a => a.status === 'active');
      if (activeAlerts.length > 0) {
        activeAlerts.slice(0, 5).forEach((alert) => {
          if (yPosition > pageHeight - 25) {
            doc.addPage();
            yPosition = margin;
          }

          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(239, 68, 68);
          doc.text(`[${alert.severity?.toUpperCase() || 'INFO'}]`, margin, yPosition);

          doc.setFont(undefined, 'normal');
          doc.setTextColor(75, 85, 99);
          const wrapped = doc.splitTextToSize(alert.message || '', maxWidth - 30);
          doc.text(wrapped, margin + 25, yPosition);

          yPosition += lineHeight * Math.max(wrapped.length, 1) + 2;
        });

        if (activeAlerts.length > 5) {
          doc.setFontSize(9);
          doc.setTextColor(107, 114, 128);
          doc.text(`... and ${activeAlerts.length - 5} more alerts`, margin + 5, yPosition);
          yPosition += lineHeight;
        }
      }

      yPosition += sectionSpacing;
    }

    // ===== PRESCRIPTIONS SECTION =====
    if (prescriptions.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      addSection(doc, 'PRESCRIPTIONS', margin, yPosition, maxWidth);
      yPosition += sectionSpacing;

      prescriptions.slice(0, 5).forEach((rx) => {
        if (yPosition > pageHeight - 25) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(31, 41, 55);
        const medicineWrapped = doc.splitTextToSize(rx.medicine_name || '', maxWidth);
        doc.text(medicineWrapped, margin, yPosition);
        yPosition += lineHeight * medicineWrapped.length;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(75, 85, 99);
        doc.setFontSize(8);

        const rxDetails = [
          `Dosage: ${rx.dosage || 'N/A'}`,
          `Duration: ${rx.duration || 'N/A'}`,
          `Prescribed: ${rx.prescribed_at ? formatDate(rx.prescribed_at) : 'N/A'}`,
        ];

        rxDetails.forEach(detail => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(detail, margin + 5, yPosition);
          yPosition += lineHeight;
        });

        yPosition += 3;
      });

      if (prescriptions.length > 5) {
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`... and ${prescriptions.length - 5} more prescriptions`, margin + 5, yPosition);
        yPosition += lineHeight;
      }

      yPosition += sectionSpacing;
    }

    // ===== LAB REPORTS SECTION =====
    if (labReports.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      addSection(doc, 'LAB REPORTS', margin, yPosition, maxWidth);
      yPosition += sectionSpacing;

      labReports.slice(0, 5).forEach((report) => {
        if (yPosition > pageHeight - 25) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text(report.file_name || 'Lab Report', margin, yPosition);
        yPosition += lineHeight;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(75, 85, 99);
        doc.setFontSize(8);
        doc.text(`Uploaded: ${report.created_at ? formatDate(report.created_at) : 'N/A'}`, margin + 5, yPosition);
        yPosition += lineHeight;

        if (report.file_url) {
          doc.setTextColor(99, 102, 241);
          doc.textWithLink(
            'View Report',
            margin + 5,
            yPosition,
            { pageNumber: 1 }
          );
          yPosition += lineHeight;
        }

        yPosition += 3;
      });

      if (labReports.length > 5) {
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`... and ${labReports.length - 5} more reports`, margin + 5, yPosition);
      }
    }

    // ===== FOOTER =====
    const totalPages = doc.internal.pages.length;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
      doc.text(
        `Generated by ContinuumCare on ${new Date().toLocaleString()}`,
        pageWidth / 2,
        pageHeight - 3,
        { align: 'center' }
      );
    }

    // Download the PDF
    doc.save(`${patient.full_name}_medical_report_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate report: ${error.message}`);
  }
}

/**
 * Add a styled section header
 */
function addSection(doc, title, x, y, width) {
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(title, x, y);

  // Add a line under the section
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.5);
  doc.line(x, y + 2, x + width, y + 2);
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Alternative: Generate HTML-based report for preview
 */
export function generateReportHTML(data) {
  const {
    patient = {},
    visits = [],
    alerts = [],
    prescriptions = [],
    labReports = [],
  } = data;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h1>ContinuumCare - Medical Report</h1>
      
      <section style="border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 8px;">
        <h2>Patient Information</h2>
        <p><strong>Name:</strong> ${patient.full_name || 'N/A'}</p>
        <p><strong>DOB:</strong> ${patient.date_of_birth || 'N/A'}</p>
        <p><strong>Gender:</strong> ${patient.gender || 'N/A'}</p>
        <p><strong>Phone:</strong> ${patient.phone || 'N/A'}</p>
        <p><strong>Medical History:</strong> ${patient.medical_history || 'None'}</p>
        <p><strong>Allergies:</strong> ${patient.allergies || 'None'}</p>
      </section>

      ${visits.length > 0 ? `
        <section style="border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 8px;">
          <h2>Visit History</h2>
          ${visits.map(v => `
            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f3f4f6;">
              <p><strong>${v.visit_date || 'N/A'}</strong></p>
              <p>Chief Complaint: ${v.chief_complaint || 'N/A'}</p>
              <p>Assessment: ${v.assessment || 'N/A'}</p>
            </div>
          `).join('')}
        </section>
      ` : ''}

      ${prescriptions.length > 0 ? `
        <section style="border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 8px;">
          <h2>Prescriptions</h2>
          ${prescriptions.map(rx => `
            <div style="margin-bottom: 10px; padding: 10px; background: #f9fafb; border-radius: 4px;">
              <p><strong>${rx.medicine_name || 'N/A'}</strong></p>
              <p>Dosage: ${rx.dosage || 'N/A'} - Duration: ${rx.duration || 'N/A'}</p>
            </div>
          `).join('')}
        </section>
      ` : ''}
    </div>
  `;
}
