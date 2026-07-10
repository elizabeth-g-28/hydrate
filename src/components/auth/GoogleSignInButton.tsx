import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError: () => void;
  disabled?: boolean;
}

export const GoogleSignInButton = ({
  onSuccess,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) => {
  const handleSuccess = (response: CredentialResponse) => {
    if (!response.credential) {
      onError();
      return;
    }
    onSuccess(response.credential);
  };

  return (
    <div
      className={`flex justify-center w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      aria-disabled={disabled}
    >
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={onError}
        theme="outline"
        size="large"
        width={320}
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
};
