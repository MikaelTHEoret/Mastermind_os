import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

export function Button({ children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded ${
        disabled ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600'
      } text-white`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
