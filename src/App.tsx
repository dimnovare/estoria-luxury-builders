import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import ErrorBoundary from "@/components/ErrorBoundary";
import CookieBanner from "@/components/CookieBanner";
import ScrollToHash from "@/components/ScrollToHash";
import MainLayout from "@/layouts/MainLayout";
import AdminLayout from "@/layouts/AdminLayout";

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

import Login from "@/pages/admin/Login";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProperties from "@/pages/admin/AdminProperties";
import PropertyForm from "@/pages/admin/PropertyForm";
import AdminBlog from "@/pages/admin/AdminBlog";
import BlogForm from "@/pages/admin/BlogForm";
import AdminTeam from "@/pages/admin/AdminTeam";
import AdminServices from "@/pages/admin/AdminServices";
import AdminPages from "@/pages/admin/AdminPages";
import AdminCareers from "@/pages/admin/AdminCareers";
import AdminNewsletter from "@/pages/admin/AdminNewsletter";
import AdminMessages from "@/pages/admin/AdminMessages";
import AdminUsers from "@/pages/admin/AdminUsers";
import UserForm from "@/pages/admin/UserForm";
import AuditLog from "@/pages/admin/AuditLog";
import AdminContacts from "@/pages/admin/AdminContacts";
import ContactForm from "@/pages/admin/ContactForm";
import ContactDetail from "@/pages/admin/ContactDetail";
import AdminDeals from "@/pages/admin/AdminDeals";
import DealForm from "@/pages/admin/DealForm";
import DealDetail from "@/pages/admin/DealDetail";
import AdminTasks from "@/pages/admin/AdminTasks";
import AdminBirthdays from "@/pages/admin/AdminBirthdays";
import AdminSavedSearches from "@/pages/admin/AdminSavedSearches";
import AdminActivities from "@/pages/admin/AdminActivities";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminInbox from "@/pages/admin/AdminInbox";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

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
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
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
