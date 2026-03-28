import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, Heart, Eye, Users, Mail, Phone } from 'lucide-react';
import { mockTeam } from '@/data/mockContent';

const values = [
  { icon: Shield, name: 'Integrity', description: 'Transparency and honesty guide every interaction. We build lasting relationships founded on trust.' },
  { icon: Heart, name: 'Excellence', description: 'We pursue perfection in every detail — from property curation to client communication.' },
  { icon: Eye, name: 'Discretion', description: 'Your privacy is paramount. We handle every transaction with the utmost confidentiality.' },
];

const reveal = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

export default function About() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const teamPreview = mockTeam.slice(0, 3);

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-[40vh] min-h-[320px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"
            alt="About Estoria"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>
        <div className="relative container mx-auto px-6 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-4">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-foreground">{t('nav.about')}</span>
            </nav>
            <h1 className="font-heading text-5xl md:text-6xl font-light text-foreground">About Estoria</h1>
          </motion.div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-1 h-16 gold-gradient rounded-full flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-6">
                    Redefining Luxury Real Estate in <span className="italic text-primary">Estonia</span>
                  </h2>
                </div>
              </div>
              <div className="prose-estoria mt-6">
                <p>ESTORIA was born from a simple belief: that finding your ideal home should be an extraordinary experience, not a stressful one. We combine deep local expertise with international standards of service to deliver results that exceed expectations.</p>
                <p>Since our founding, we have guided hundreds of discerning clients — from first-time homeowners to seasoned investors — through the intricacies of Estonia's premium property market. Our approach is personal, our standards are uncompromising, and our commitment to your success is absolute.</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-4"
            >
              <div className="rounded-sm overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"
                  alt="ESTORIA office"
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-px gold-gradient mx-auto mb-8" />
            <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-8">Our Story</h2>
            <div className="prose-estoria text-center">
              <p>Founded in Tallinn in 2015, ESTORIA emerged at a pivotal moment in Estonia's real estate landscape. As the country's economy flourished and international interest in Baltic properties grew, there was a clear need for a real estate firm that could match global luxury standards with authentic local knowledge.</p>
              <p>What began as a boutique consultancy with three passionate professionals has evolved into Estonia's most respected premium real estate brand. Today, our team of fifteen specialists manages a curated portfolio of over 200 exclusive properties across Tallinn, Tartu, and Pärnu.</p>
              <p>Our name — ESTORIA — is a fusion of "Estonia" and "storia" (the Italian word for story). Because every property has a story, and we believe finding the right one is the beginning of yours.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="w-12 h-px gold-gradient mx-auto mb-6" />
            <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground">Our Values</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={value.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={reveal}
                className="group bg-card border border-border rounded-sm p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.2)]"
              >
                <value.icon className="text-primary mb-5" size={28} />
                <h3 className="font-heading text-xl text-foreground mb-3">{value.name}</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Teaser */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="w-12 h-px gold-gradient mx-auto mb-6" />
            <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground">Meet Our Team</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamPreview.map((member, i) => (
              <motion.div
                key={member.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={reveal}
              >
                <Link to={`/team/${member.slug}`} className="group block">
                  <div className="aspect-square overflow-hidden rounded-sm bg-muted border border-transparent group-hover:border-primary/30 transition-all duration-500">
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-heading text-xl text-foreground">{member.name}</h3>
                    <p className="text-xs text-primary font-nav uppercase tracking-wider mt-1">{member.role}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-14"
          >
            <button
              onClick={() => navigate('/team')}
              className="font-nav text-xs uppercase tracking-[0.15em] border border-primary text-primary px-8 py-3.5 rounded-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              Meet the Full Team
            </button>
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6 border-t border-primary/20">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-6">
              Ready to Find Your Future?
            </h2>
            <p className="text-muted-foreground font-body mb-10 max-w-lg mx-auto">
              Let our team guide you to the perfect property. We'd love to hear from you.
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="gold-gradient text-primary-foreground px-10 py-4 rounded-sm font-nav text-xs uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
            >
              Get in Touch
            </button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
