import { createContext, useContext, useState, ReactNode } from "react";

const TabsContext = createContext<any>(null);

export function Tabs({ defaultValue, children, className = "" }: { defaultValue: string; children: ReactNode; className?: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex bg-zinc-800 p-1 rounded-xl gap-2 ${className}`}>{children}</div>;
}

export function TabsTrigger({ value, children, className = "" }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext);
  const isActive = ctx?.value === value;
  return (
    <button
      onClick={() => ctx?.setValue(value)}
      className={`text-sm px-4 py-2 rounded-lg transition ${
        isActive ? "bg-zinc-700 text-white" : "text-zinc-400 hover:bg-zinc-600"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext);
  return ctx?.value === value ? <div className="mt-4">{children}</div> : null;
}
