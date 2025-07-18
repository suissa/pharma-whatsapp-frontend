interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ message, size = 'medium' }: LoadingSpinnerProps) {
  return (
    <div className="loading-section flex flex-col items-center justify-center py-8">
      <div className={`spinner animate-spin ${size === 'small' ? 'w-6 h-6' : size === 'large' ? 'w-12 h-12' : 'w-8 h-8'}`}></div>
      {message && <p className="text-gray-600 mt-4">{message}</p>}
    </div>
  );
} 