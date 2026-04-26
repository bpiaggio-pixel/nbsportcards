export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-gray-200 p-5">
        <h2 className="text-xl font-bold mb-6">Admin</h2>

        <nav className="flex flex-col gap-3 text-sm">
          <a href="/admin" className="hover:text-blue-600">Dashboard</a>
          <a href="/admin/blog" className="hover:text-blue-600">Blog</a>
          <a href="/admin/guides" className="hover:text-blue-600">Guides</a>
          <a href="/admin/orders" className="hover:text-blue-600">Orders</a>
          <a href="/admin/top-sales" className="hover:text-blue-600">
            Top Sales
          </a>

          <a href="/admin/analytics" className="hover:text-blue-600">
            Analytics
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}