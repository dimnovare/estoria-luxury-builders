import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import ErrorBoundary from "@/components/ErrorBoundary";
import CookieBanner from "@/components/CookieBanner";
import ScrollToHash from "@/components/ScrollToHash";
import MainLayout from "@/layouts/MainLayout";
import AdminLayout from "@/layouts/AdminLayout";

// Public marketing site stays eager — it's the hot path and small enough
// that splitting routes adds round-trips without meaningful savings.
import Index from "@/pages/Index";
import Properties from "@/pages/Properties";
import PropertyDetail from "@/pages/PropertyDetail";
import About from "@/pages/About";
import Team from "@/pages/Team";
import TeamMemberDetail from "@/pages/TeamMemberDetail";
import Services from "@/pages/Services";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Careers from "@/pages/Careers";
import CareerDetail from "@/pages/CareerDetail";
import Contact from "@/pages/Contact";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import NotFound from "@/pages/NotFound";

// Admin lives behind auth and is large; lazy-load every admin page so the
// public bundle doesn't pay for the admin surface area. Login stays eager
// so the redirect from a 401 isn't another network round trip.
import Login from "@/pages/admin/Login";
import ProtectedRoute from "@/components/ProtectedRoute";

const AdminDashboard      = lazy(() => import("@/pages/admin/Dashboard"));
const AdminProperties     = lazy(() => import("@/pages/admin/AdminProperties"));
const PropertyForm        = lazy(() => import("@/pages/admin/PropertyForm"));
const AdminBlog           = lazy(() => import("@/pages/admin/AdminBlog"));
const BlogForm            = lazy(() => import("@/pages/admin/BlogForm"));
const AdminTeam           = lazy(() => import("@/pages/admin/AdminTeam"));
const AdminServices       = lazy(() => import("@/pages/admin/AdminServices"));
const AdminPages          = lazy(() => import("@/pages/admin/AdminPages"));
const AdminCareers        = lazy(() => import("@/pages/admin/AdminCareers"));
const AdminNewsletter     = lazy(() => import("@/pages/admin/AdminNewsletter"));
const AdminMessages       = lazy(() => import("@/pages/admin/AdminMessages"));
const AdminUsers          = lazy(() => import("@/pages/admin/AdminUsers"));
const UserForm            = lazy(() => import("@/pages/admin/UserForm"));
const AuditLog            = lazy(() => import("@/pages/admin/AuditLog"));
const AdminContacts       = lazy(() => import("@/pages/admin/AdminContacts"));
const ContactForm         = lazy(() => import("@/pages/admin/ContactForm"));
const ContactDetail       = lazy(() => import("@/pages/admin/ContactDetail"));
const AdminDeals          = lazy(() => import("@/pages/admin/AdminDeals"));
const DealForm            = lazy(() => import("@/pages/admin/DealForm"));
const DealDetail          = lazy(() => import("@/pages/admin/DealDetail"));
const AdminTasks          = lazy(() => import("@/pages/admin/AdminTasks"));
const AdminBirthdays      = lazy(() => import("@/pages/admin/AdminBirthdays"));
const AdminSavedSearches  = lazy(() => import("@/pages/admin/AdminSavedSearches"));
const AdminActivities     = lazy(() => import("@/pages/admin/AdminActivities"));
const AdminSettings       = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminInbox          = lazy(() => import("@/pages/admin/AdminInbox"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const AdminLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <ScrollToHash />
        <ErrorBoundary>
        <CookieBanner />
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:slug" element={<PropertyDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/team" element={<Team />} />
            <Route path="/team/:slug" element={<TeamMemberDetail />} />
            <Route path="/services" element={<Services />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/careers/:slug" element={<CareerDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Route>
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Suspense fallback={<AdminLoading />}>
                  <AdminLayout />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="properties/new" element={<PropertyForm />} />
            <Route path="properties/:id/edit" element={<PropertyForm />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="blog/new" element={<BlogForm />} />
            <Route path="blog/:id/edit" element={<BlogForm />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="pages" element={<AdminPages />} />
            <Route path="careers" element={<AdminCareers />} />
            <Route path="newsletter" element={<AdminNewsletter />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/new" element={<UserForm />} />
            <Route path="users/:id/edit" element={<UserForm />} />
            <Route path="audit-log" element={<AuditLog />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="contacts/new" element={<ContactForm />} />
            <Route path="contacts/:id" element={<ContactDetail />} />
            <Route path="contacts/:id/edit" element={<ContactForm />} />
            <Route path="deals" element={<AdminDeals />} />
            <Route path="deals/new" element={<DealForm />} />
            <Route path="deals/:id" element={<DealDetail />} />
            <Route path="deals/:id/edit" element={<DealForm />} />
            <Route path="tasks" element={<AdminTasks />} />
            <Route path="birthdays" element={<AdminBirthdays />} />
            <Route path="saved-searches" element={<AdminSavedSearches />} />
            <Route path="activities" element={<AdminActivities />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="inbox" element={<AdminInbox />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
