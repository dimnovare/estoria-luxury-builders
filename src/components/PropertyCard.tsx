import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Property } from '@/hooks/api/useProperties';
import { useTranslation } from 'react-i18next';
import { Maximize2, DoorOpen, BedDouble } from 'lucide-react';

interface Props {
  property: Property;
  index?: number;
}

export default function PropertyCard({ property, index = 0 }: Props) {
  const { t } = useTranslation();

  const formatPrice = (price: number, type: string) => {
    const formatted = new Intl.NumberFormat('et-EE').format(price);
    return type === 'rent' ? `€${formatted}/mo` : `€${formatted}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link to={`/properties/${property.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-sm aspect-[4/3] bg-muted">
          <img
            src={property.coverImageUrl || '/placeholder.jpg'}
            alt={property.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Gold overlay on hover */}
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-500" />

          {/* Transaction badge */}
          <span className="absolute top-4 left-4 bg-background/90 text-foreground text-[10px] font-nav uppercase tracking-wider px-3 py-1.5 rounded-sm">
            {property.transactionType === 'sale' ? t('properties.forSale') : t('properties.forRent')}
          </span>

          {/* Price badge */}
          <span className="absolute bottom-4 right-4 gold-gradient text-primary-foreground text-sm font-semibold font-body px-4 py-2 rounded-sm">
            {formatPrice(property.price, property.transactionType)}
          </span>
        </div>

        {/* Info */}
        <div className="mt-4 space-y-2">
          <h3 className="font-heading text-xl text-foreground group-hover:text-primary transition-colors duration-300">
            {property.title}
          </h3>
          <p className="text-xs text-muted-foreground font-body">{property.address}</p>

          {/* Specs */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-body pt-1">
            <span className="flex items-center gap-1.5">
              <Maximize2 size={12} className="text-primary" />
              {property.size} m²
            </span>
            {property.rooms != null && (
              <span className="flex items-center gap-1.5">
                <DoorOpen size={12} className="text-primary" />
                {property.rooms} {t('properties.rooms')}
              </span>
            )}
            {property.bedrooms != null && (
              <span className="flex items-center gap-1.5">
                <BedDouble size={12} className="text-primary" />
                {property.bedrooms} {t('properties.beds')}
              </span>
            )}
          </div>
        </div>

        {/* Bottom gold border animation */}
        <div className="mt-4 h-px bg-border relative overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 w-0 group-hover:left-0 group-hover:w-full gold-gradient transition-all duration-500" />
        </div>
      </Link>
    </motion.div>
  );
}
