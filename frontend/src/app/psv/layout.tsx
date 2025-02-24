export default function PSVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">PSV Management</h2>
          <p className="text-muted-foreground">
            Manage and monitor Pressure Safety Valve calibrations
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}