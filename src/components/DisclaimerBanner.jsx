import { AlertTriangle } from 'lucide-react';

export default function DisclaimerBanner({ message }) {
  return (
    <div className="disclaimer">
      <AlertTriangle size={18} className="disclaimer-icon" />
      <span>
        {message || 'This system provides assistive information only and does not replace professional medical judgment. Always consult a qualified healthcare provider for medical decisions.'}
      </span>
    </div>
  );
}
