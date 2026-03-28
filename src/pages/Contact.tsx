import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Check, Loader2, Instagram, Facebook, Linkedin } from 'lucide-react';
import { z } from 'zod';
import { allMockProperties } from '@/data/mockProperties';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  phone: z.string().max(30).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

export default function Contact() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const propertySlug = searchParams.get('property');
  const linkedProperty = propertySlug ? allMockProperties.find(p => p.slug === propertySlug) : null;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: linkedProperty ? `Inquiry: ${linkedProperty.title}` : '',
    message: linkedProperty ? `I'm interested in the property "${linkedProperty.title}" at ${linkedProperty.address}.` : '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setStatus('loading');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStatus('success');
  };

  return (
    <>
      {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-b from-secondary/80 to-background">
        <div className="container mx-auto px-6 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-6">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-foreground">{t('nav.contact')}</span>
            </nav>
            <h1 className="font-heading text-5xl md:text-6xl font-light text-foreground mb-3">{t('nav.contact')}</h1>
            <p className="text-muted-foreground font-body text-lg max-w-xl">
              We'd love to hear from you. Reach out and let's start a conversation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left — Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {linkedProperty && (
                <div className="bg-card border border-border rounded-sm p-4 mb-6 flex items-center gap-3">
                  <img src={linkedProperty.imageUrl} alt="" className="w-16 h-12 rounded-sm object-cover" />
                  <div>
                    <p className="text-xs text-muted-foreground font-body">Inquiry about:</p>
                    <Link to={`/properties/${linkedProperty.slug}`} className="text-sm text-primary font-body hover:underline">
                      {linkedProperty.title}
                    </Link>
                  </div>
                </div>
              )}

              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-success/10 flex items-center justify-center">
                    <Check className="text-success" size={28} />
                  </div>
                  <h2 className="font-heading text-3xl text-foreground mb-3">Thank You</h2>
                  <p className="text-muted-foreground font-body">We'll be in touch within 24 hours.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <input
                      type="text"
                      placeholder="Your name *"
                      value={form.name}
                      onChange={e => handleChange('name', e.target.value)}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-5 py-3.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    {errors.name && <p className="text-destructive text-xs mt-1 font-body">{errors.name}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email address *"
                      value={form.email}
                      onChange={e => handleChange('email', e.target.value)}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-5 py-3.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    {errors.email && <p className="text-destructive text-xs mt-1 font-body">{errors.email}</p>}
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={form.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    className="w-full bg-secondary border border-border text-foreground text-sm font-body px-5 py-3.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Subject"
                    value={form.subject}
                    onChange={e => handleChange('subject', e.target.value)}
                    className="w-full bg-secondary border border-border text-foreground text-sm font-body px-5 py-3.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  />
                  <div>
                    <textarea
                      placeholder="Your message *"
                      rows={5}
                      value={form.message}
                      onChange={e => handleChange('message', e.target.value)}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-5 py-3.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground resize-none"
                    />
                    {errors.message && <p className="text-destructive text-xs mt-1 font-body">{errors.message}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full gold-gradient text-primary-foreground py-4 rounded-sm font-nav text-xs uppercase tracking-[0.15em] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {status === 'loading' && <Loader2 size={14} className="animate-spin" />}
                    Send Message
                  </button>
                  {status === 'error' && (
                    <p className="text-destructive text-sm font-body text-center">Something went wrong. Please try again.</p>
                  )}
                </form>
              )}
            </motion.div>

            {/* Right — Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-10"
            >
              {/* Contact details */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-sm bg-card border border-border flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-nav text-xs uppercase tracking-wider text-foreground mb-1">Office Address</h3>
                    <p className="text-sm text-muted-foreground font-body">Pärnu mnt 15, 10141 Tallinn, Estonia</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-sm bg-card border border-border flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-nav text-xs uppercase tracking-wider text-foreground mb-1">Phone</h3>
                    <a href="tel:+3726000000" className="text-sm text-muted-foreground hover:text-primary font-body transition-colors">
                      +372 600 0000
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-sm bg-card border border-border flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-nav text-xs uppercase tracking-wider text-foreground mb-1">Email</h3>
                    <a href="mailto:info@estoria.ee" className="text-sm text-muted-foreground hover:text-primary font-body transition-colors">
                      info@estoria.ee
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-sm bg-card border border-border flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-nav text-xs uppercase tracking-wider text-foreground mb-1">Office Hours</h3>
                    <p className="text-sm text-muted-foreground font-body">Mon – Fri: 9:00 – 18:00</p>
                    <p className="text-sm text-muted-foreground font-body">Sat: 10:00 – 14:00 (by appointment)</p>
                    <p className="text-sm text-muted-foreground font-body">Sun: Closed</p>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="rounded-sm overflow-hidden border border-border">
                <iframe
                  title="ESTORIA Office Location"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=24.735%2C59.430%2C24.765%2C59.445&layer=mapnik&marker=59.437%2C24.750"
                  className="w-full h-[280px] border-0 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                  loading="lazy"
                />
              </div>

              {/* Social */}
              <div>
                <h3 className="font-nav text-xs uppercase tracking-wider text-foreground mb-4">Follow Us</h3>
                <div className="flex items-center gap-4">
                  {[
                    { icon: Instagram, label: 'Instagram', href: '#' },
                    { icon: Facebook, label: 'Facebook', href: '#' },
                    { icon: Linkedin, label: 'LinkedIn', href: '#' },
                  ].map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="w-10 h-10 rounded-sm bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-300"
                    >
                      <Icon size={18} />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
