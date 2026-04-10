import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission, canPerformAction } from '../config/rbacConfig';
import { generateMedicalReportPDF } from '../services/reportGeneration';
import { Download, Loader } from 'lucide-react';

/**
 * ReportDownloadButton Component
 * Allows authorized users to download comprehensive medical reports for a patient
 * 
 * Props:
 *  - patient: Patient object
 *  - visits: Array of visit records
 *  - alerts: Array of alert records
 *  - prescriptions: Array of prescription records
 *  - labReports: Array of lab report records
 *  - onDownload: Callback after successful download
 */
export default function ReportDownloadButton({
  patient,
  visits = [],
  alerts = [],
  prescriptions = [],
  labReports = [],
  onDownload = null,
}) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user can download reports based on their role
  if (!canPerformAction(profile?.role, 'download-report')) {
    return null;
  }

  // For family members, only allow downloading their own assigned patient's report
  if (profile?.role === 'family') {
    // This check should be handled by PatientProfile component
    // but we add it here as an additional security layer
  }

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!patient?.id) {
        throw new Error('Patient information is incomplete');
      }

      // Additional RLS-like validation (frontend)
      if (profile?.role === 'family') {
        // Verify the patient is assigned to this family member
        // This assumes patient has assignments array with user_id
        const isAssigned = patient.assignments?.some(
          a => a.profile_id === profile.id || a.profile?.id === profile.id
        );
        
        if (!isAssigned) {
          throw new Error('You only have access to assigned patient reports');
        }
      }

      // Prepare report data
      const reportData = {
        patient,
        visits: visits || [],
        alerts: alerts || [],
        prescriptions: prescriptions || [],
        labReports: labReports || [],
      };

      // Generate and download PDF
      await generateMedicalReportPDF(reportData);

      // Call callback if provided
      if (onDownload) {
        onDownload();
      }

      console.log('Report downloaded successfully');
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className="btn btn-primary"
        onClick={handleDownload}
        disabled={loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        title="Download your medical information as a PDF"
      >
        {loading ? (
          <>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Generating Report...
          </>
        ) : (
          <>
            <Download size={18} />
            Download Report
          </>
        )}
      </button>

      {error && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: 'var(--color-danger-light)',
          color: 'var(--color-danger)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
