import type { ReactNode } from 'react';

interface StatCardProps {
  children: ReactNode;
  className?: string;
}

const StatCard = ({ children, className = '' }: StatCardProps) => {
  return (
    <div className={`card flex flex-col gap-1 ${className}`}>
      {children}
    </div>
  );
};

const Value = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <span className={`text-3xl font-bold text-white ${className}`}>
      {children}
    </span>
  );
};

const Label = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <span className={`text-sm font-medium ${className}`}>
      {children}
    </span>
  );
};

StatCard.Value = Value;
StatCard.Label = Label;

export default StatCard;
