const Index = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
    <h1 className="text-4xl font-bold text-foreground tracking-tight mb-4">
      GST Platform
    </h1>
    <p className="text-muted-foreground text-lg max-w-md text-center">
      Multi-user GST dashboard — backend powered by FastAPI, PostgreSQL &amp; SQLAlchemy.
    </p>
    <div className="mt-8 rounded-md border border-border bg-muted/50 px-6 py-4 text-sm text-muted-foreground max-w-lg">
      <p className="font-semibold text-foreground mb-2">Backend status</p>
      <ul className="list-disc list-inside space-y-1">
        <li>34 ORM tables auto-created on startup</li>
        <li>OTP session auth with 5h30m auto-refresh</li>
        <li>GSTR-1, 2A, 2B, 3B, 9 &amp; Ledger endpoints</li>
      </ul>
    </div>
  </div>
);

export default Index;
