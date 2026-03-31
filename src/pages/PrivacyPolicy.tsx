import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  return (
    <>
      <section className="pt-20 pb-12 bg-gradient-to-b from-secondary/80 to-background">
        <div className="container mx-auto px-6 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-6">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-foreground">Privacy Policy</span>
            </nav>
            <h1 className="font-heading text-5xl md:text-6xl font-light text-foreground">
              Privacy Policy
            </h1>
            <div className="w-16 h-px gold-gradient mt-4" />
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-6">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="container mx-auto max-w-3xl prose prose-invert prose-headings:font-heading prose-headings:font-light prose-p:font-body prose-p:text-muted-foreground prose-a:text-primary"
        >
          <p className="text-sm text-muted-foreground font-body mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-10 font-body text-muted-foreground leading-relaxed">

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">1. Who We Are</h2>
              <p>
                ESTORIA OÜ (registry code: <strong className="text-foreground">[REG_NO]</strong>),
                registered address <strong className="text-foreground">[ADDRESS], Tallinn, Estonia</strong>,
                is the data controller responsible for the personal data collected through this website
                (estoria.ee).
              </p>
              <p className="mt-2">
                Contact: <a href="mailto:info@estoria.ee" className="text-primary hover:underline">info@estoria.ee</a>
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">2. Data We Collect</h2>
              <p>We collect personal data in the following situations:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                <li>
                  <strong className="text-foreground">Contact form</strong> — name, email address,
                  phone number (optional), and your message. Lawful basis: your consent / legitimate
                  interest in responding to your inquiry.
                </li>
                <li>
                  <strong className="text-foreground">Property inquiry</strong> — same as contact form,
                  plus a reference to the property you are enquiring about.
                </li>
                <li>
                  <strong className="text-foreground">Newsletter subscription</strong> — email address
                  and preferred language. Lawful basis: your explicit consent.
                </li>
              </ul>
              <p className="mt-3">
                We do not collect sensitive personal data (health, financial, or identity documents)
                through this website.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">3. How We Use Your Data</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Responding to your contact or property enquiry</li>
                <li>Sending newsletter emails you have subscribed to</li>
                <li>Improving our services based on the enquiries we receive</li>
              </ul>
              <p className="mt-3">
                We do not sell, rent, or share your personal data with third parties for their own
                marketing purposes.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">4. Data Retention</h2>
              <p>
                Contact and inquiry messages are retained for up to <strong className="text-foreground">3 years</strong> from
                the date of submission, after which they are deleted.
                Newsletter subscriptions are retained until you unsubscribe.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">5. Your Rights Under GDPR</h2>
              <p>As a data subject you have the right to:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                <li><strong className="text-foreground">Access</strong> — request a copy of the personal data we hold about you</li>
                <li><strong className="text-foreground">Rectification</strong> — correct inaccurate or incomplete data</li>
                <li><strong className="text-foreground">Erasure</strong> — request deletion of your data</li>
                <li><strong className="text-foreground">Restriction</strong> — ask us to pause processing your data</li>
                <li><strong className="text-foreground">Portability</strong> — receive your data in a machine-readable format</li>
                <li><strong className="text-foreground">Objection</strong> — object to processing based on legitimate interest</li>
                <li><strong className="text-foreground">Withdraw consent</strong> — unsubscribe from the newsletter at any time</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, email us at{' '}
                <a href="mailto:info@estoria.ee" className="text-primary hover:underline">info@estoria.ee</a>.
                We will respond within 30 days.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">6. Cookies</h2>
              <p>
                This website uses only technically necessary cookies required for basic functionality
                (e.g. language preference). We do not use advertising or tracking cookies.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">7. Complaints</h2>
              <p>
                You have the right to lodge a complaint with the Estonian Data Protection Inspectorate
                (Andmekaitse Inspektsioon) at{' '}
                <a
                  href="https://www.aki.ee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.aki.ee
                </a>{' '}
                if you believe we are processing your data unlawfully.
              </p>
            </div>

          </div>
        </motion.article>
      </section>
    </>
  );
}
