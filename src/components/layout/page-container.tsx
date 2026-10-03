export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col px-6 pt-2 pb-[30px]">
      {children}
    </div>
  );
}
