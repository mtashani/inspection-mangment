'use client';

import * as React from "react";
import { PSV, PSVCalibration } from "./types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface CalibrationCertificateProps {
  psv: PSV;
  calibration: PSVCalibration;
}

export function CalibrationCertificate({ psv, calibration }: CalibrationCertificateProps) {
  const certificateRef = React.useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handlePrint = () => {
    const content = certificateRef.current;
    if (!content) return;

    const printWindow = window.open('', '', 'width=800,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>PSV TEST INSPECTION REPORT</title>
          <style>
            @media print {
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
              }
              .certificate {
                max-width: 210mm;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                padding: 20px;
                border-bottom: 2px solid #000;
              }
              .section {
                margin: 15px 0;
                padding: 15px;
                border: 1px solid #000;
              }
              h1 {
                font-size: 20px;
                margin: 0;
                font-weight: bold;
                text-transform: uppercase;
              }
              h2 {
                font-size: 16px;
                margin: 0 0 10px 0;
                font-weight: bold;
                text-transform: uppercase;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
              }
              table, th, td {
                border: 1px solid #000;
              }
              th, td {
                padding: 8px;
                vertical-align: top;
              }
              th {
                background-color: #f5f5f5;
              }
              .signature-box {
                margin-top: 30px;
                page-break-inside: avoid;
              }
              @page {
                size: A4;
                margin: 20mm;
              }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownload = async () => {
    const content = certificateRef.current;
    if (!content) return;

    try {
      setIsGenerating(true);
      toast.message("Generating PDF...", {
        description: "Please wait while we prepare your certificate"
      });

      content.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 795px;
        min-height: 1122px;
        background-color: #ffffff;
        margin: 0;
        padding: 0;
        visibility: visible;
        opacity: 1;
        z-index: 9999;
      `;

      content.getBoundingClientRect();
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(content, {
        scale: 2,
        backgroundColor: "#ffffff",
        width: 795,
        height: 1122,
        windowWidth: 795,
        windowHeight: 1122,
        allowTaint: true,
        useCORS: true,
        logging: true
      });

      if (!canvas) {
        throw new Error('Canvas generation failed - canvas is null');
      }

      content.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 795px;
        padding: 20px;
        background-color: #ffffff;
        font-family: Arial, sans-serif;
        visibility: hidden;
      `;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [795, 1122],
        hotfixes: ['px_scaling']
      });

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');

      const canvasImage = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(
        canvasImage,
        'PNG',
        0,
        0,
        pdf.internal.pageSize.getWidth(),
        pdf.internal.pageSize.getHeight()
      );

      const fileName = `${psv.tag}-${format(new Date(calibration.calibrationDate), 'yyyyMMdd')}-certificate.pdf`;
      pdf.save(fileName);

      toast.success("Certificate Downloaded", {
        description: "Your PDF has been generated successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF", {
        description: "Please try again or contact support if the problem persists"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Certificate
        </Button>
        <Button
          onClick={handleDownload}
          variant="secondary"
          className="flex items-center gap-2"
          disabled={isGenerating}
        >
          <Download className="h-4 w-4" />
          {isGenerating ? "Generating PDF..." : "Download PDF"}
        </Button>
      </div>

      <div
        ref={certificateRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '795px',
          padding: '20px',
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        <div className="certificate" style={{ width: '100%' }}>
          <div className="header">
            <h1>PSV TEST INSPECTION REPORT</h1>
          </div>

          <table>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', width: '50%' }}>
                  <strong>Doc No:</strong> {calibration.docNumber || '---'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '50%' }}>
                  <strong>Date:</strong> {format(new Date(calibration.calibrationDate), 'P')}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  <strong>Equipment Tag:</strong> {psv.tag}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  <strong>Serial #:</strong> {psv.serialNo || '---'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  <strong>Manufacturer:</strong> {psv.manufacturer || '---'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  <strong>Manuf. S/No.:</strong> {psv.manufacturerSerialNo || '---'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  <strong>Location:</strong> {psv.location}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  <strong>Unit:</strong> {psv.unit}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  <strong>Frequency (M):</strong> {calibration.frequencyMonths || '---'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  <strong>Oldest Interval:</strong> {calibration.oldestInterval || '---'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  <strong>Report No.:</strong> {calibration.reportNo || '---'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  <strong>Next Date:</strong> {calibration.nextCalibrationDate
                    ? format(new Date(calibration.nextCalibrationDate), 'P')
                    : '---'
                  }
                </td>
              </tr>
            </tbody>
          </table>

          <div className="section">
            <h2>TEST RESULTS BEFORE OVERHAUL</h2>
            <table>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', width: '50%' }}>
                    <strong>First pop pressure (bar):</strong> {calibration.initialPopPressure || '---'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', width: '50%' }}>
                    <strong>Second pop pressure (bar):</strong> {calibration.initialSecondPopPressure || '---'}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>
                    <strong>Leakage (bubbles/min):</strong> {calibration.initialLeakage || '---'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>
                    <strong>General Condition:</strong> {calibration.generalCondition || '---'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="section">
            <h2>FINAL TEST RESULTS AFTER OVERHAUL</h2>
            <table>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', width: '50%' }}>
                    <strong>First pop pressure (bar):</strong> {calibration.finalPopPressure || '---'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', width: '50%' }}>
                    <strong>Second pop pressure (bar):</strong> {calibration.finalSecondPopPressure || '---'}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>
                    <strong>Leakage (bubbles/min):</strong> {calibration.finalLeakage || '---'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>
                    <strong>Work Performed:</strong>{" "}
                    {calibration.workPerformed && calibration.workPerformed.length
                      ? calibration.workPerformed.join(", ")
                      : '---'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="section">
            <h2>PERSONNEL INFORMATION</h2>
            <table>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>
                    <strong>Performed by:</strong> {calibration.operator || '---'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>
                    <strong>Approved by:</strong> {calibration.approver || '---'}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>
                    <strong>Inspector:</strong> {calibration.inspector || '---'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>
                    <strong>Supervisor:</strong> {calibration.supervisor || '---'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="signature-box">
            <table>
              <tbody>
                <tr>
                  <td style={{ width: '50%', border: 'none', padding: '8px', textAlign: 'center' }}>
                    <p>Inspector Signature: _______________________</p>
                    <p style={{ marginTop: '16px' }}>Date: _______________________</p>
                  </td>
                  <td style={{ width: '50%', border: 'none', padding: '8px', textAlign: 'center' }}>
                    <p>Approver Signature: _______________________</p>
                    <p style={{ marginTop: '16px' }}>Date: _______________________</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}