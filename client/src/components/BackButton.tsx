import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  onBack?: () => void;
  label?: string;
}

export default function BackButton({ onBack, label = 'Back' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(-1);
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition-colors"
    >
      <ArrowLeft size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );
}


