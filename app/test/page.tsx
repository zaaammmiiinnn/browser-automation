export default function TestPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Protected route</p>
        <h1 className="mt-2 text-2xl font-semibold">Test page</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You are signed in and can access this page.
        </p>
      </div>
    </main>
  )
}
