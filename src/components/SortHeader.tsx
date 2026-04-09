import { createContext, useContext, type ReactNode } from 'react';

interface SortContextType {
  isActive: boolean;
  currentOrder: 'asc' | 'desc';
}

const SortContext = createContext<SortContextType | undefined>(undefined);

interface SortHeaderProps {
  field: string;
  currentSort: string;
  currentOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  children: ReactNode;
  className?: string;
}

const SortHeader = ({
  field,
  currentSort,
  currentOrder,
  onSort,
  children,
  className = ""
}: SortHeaderProps) => {
  const isActive = currentSort === field;

  return (
    <SortContext.Provider value={{ isActive, currentOrder }}>
      <th
        className={`px-6 py-3 text-left cursor-pointer hover:bg-slate-800/50 transition-colors group ${className}`}
        onClick={() => onSort(field)}
      >
        <div className="flex items-center gap-1.5">
          {children}
        </div>
      </th>
    </SortContext.Provider>
  );
};

const Label = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  const context = useContext(SortContext);
  if (!context) throw new Error("SortHeader.Label must be used within SortHeader");

  return (
    <span className={`text-xs uppercase tracking-wider transition-colors ${context.isActive ? 'text-indigo-400 font-bold' : 'text-slate-500 font-medium group-hover:text-slate-300'} ${className}`}>
      {children}
    </span>
  );
};

const Icon = ({ className = "" }: { className?: string }) => {
  const context = useContext(SortContext);
  if (!context) throw new Error("SortHeader.Icon must be used within SortHeader");

  return (
    <div className={`flex flex-col -space-y-1 opacity-60 group-hover:opacity-100 transition-opacity ${className}`}>
      <svg className={`w-2 h-2 ${context.isActive && context.currentOrder === 'asc' ? 'text-indigo-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
      </svg>
      <svg className={`w-2 h-2 ${context.isActive && context.currentOrder === 'desc' ? 'text-indigo-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 112 0v7.586l2.293-2.293a1 1 0 011.414 0z" />
      </svg>
    </div>
  );
};

SortHeader.Label = Label;
SortHeader.Icon = Icon;

export default SortHeader;
