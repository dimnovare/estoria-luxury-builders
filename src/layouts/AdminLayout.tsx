import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background pt-20 px-6">
      <div className="container mx-auto">
        <h1 className="font-heading text-3xl text-foreground mb-8">Admin</h1>
        <Outlet />
      </div>
    </div>
  );
}
