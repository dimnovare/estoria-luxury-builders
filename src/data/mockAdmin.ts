export interface AdminMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  propertyId?: string;
  date: string;
  status: 'new' | 'read' | 'replied';
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  language: string;
  subscribedAt: string;
  status: 'active' | 'unsubscribed';
}

export interface PageContent {
  key: string;
  label: string;
  translations: Record<string, { title: string; body: string; imageUrl?: string; videoUrl?: string }>;
}

export const mockMessages: AdminMessage[] = [
  { id: '1', name: 'John Smith', email: 'john@example.com', phone: '+372 5551 0001', subject: 'Interested in Penthouse', message: 'I would like to schedule a viewing of the luxury penthouse in Old Town. I am available next week on Tuesday or Wednesday afternoon. Please let me know what times work best.', propertyId: 'luxury-penthouse-tallinn', date: '2026-03-27', status: 'new' },
  { id: '2', name: 'Katrin Laar', email: 'katrin@mail.ee', subject: 'Valuation Request', message: 'We are considering selling our property in Kadriorg and would like to request a professional valuation. The property is a 4-bedroom house built in 2015, approximately 240 sqm.', date: '2026-03-26', status: 'new' },
  { id: '3', name: 'Dmitri Volkov', email: 'dmitri@company.com', phone: '+372 5551 0003', subject: 'Commercial Space Inquiry', message: 'Looking for office space in Tallinn city center, approximately 200-300 sqm, for our tech startup expanding to Estonia.', date: '2026-03-25', status: 'read' },
  { id: '4', name: 'Sophie Martin', email: 'sophie@gmail.com', subject: 'Relocation from France', message: 'My family is relocating to Tallinn and we are looking for a 3-bedroom apartment or house for rent. Budget up to €2,500/month. Need pet-friendly options.', date: '2026-03-24', status: 'read' },
  { id: '5', name: 'Andres Tamm', email: 'andres@inbox.ee', subject: 'Investment Portfolio', message: 'I would like to discuss building a real estate investment portfolio in the Tallinn market. Interested in both residential and commercial properties.', date: '2026-03-22', status: 'replied' },
  { id: '6', name: 'Lisa Chen', email: 'lisa.chen@outlook.com', subject: 'Seaside Villa Question', message: 'Is the seaside villa in Pirita still available? Can you provide more details about the neighborhood and nearby amenities?', propertyId: 'seaside-villa-pirita', date: '2026-03-21', status: 'replied' },
];

export const mockSubscribers: NewsletterSubscriber[] = [
  { id: '1', email: 'subscriber1@example.com', language: 'en', subscribedAt: '2026-03-15', status: 'active' },
  { id: '2', email: 'abonent@mail.ee', language: 'et', subscribedAt: '2026-03-12', status: 'active' },
  { id: '3', email: 'reader@gmail.com', language: 'en', subscribedAt: '2026-03-10', status: 'active' },
  { id: '4', email: 'info@firma.ee', language: 'et', subscribedAt: '2026-03-08', status: 'active' },
  { id: '5', email: 'podpischik@mail.ru', language: 'ru', subscribedAt: '2026-03-05', status: 'active' },
  { id: '6', email: 'news@company.com', language: 'en', subscribedAt: '2026-02-28', status: 'unsubscribed' },
  { id: '7', email: 'uudised@inbox.ee', language: 'et', subscribedAt: '2026-02-20', status: 'active' },
  { id: '8', email: 'novosti@yandex.ru', language: 'ru', subscribedAt: '2026-02-15', status: 'active' },
];

export const mockPages: PageContent[] = [
  { key: 'home.hero', label: 'Homepage Hero', translations: { et: { title: 'Kus Teie Tulevik Elab', body: 'Estoria — luksuskinnisvara Eestis', videoUrl: '' }, en: { title: 'Where Your Future Lives', body: 'Estoria — luxury real estate in Estonia', videoUrl: '' }, ru: { title: 'Где Живёт Ваше Будущее', body: 'Estoria — элитная недвижимость в Эстонии', videoUrl: '' } } },
  { key: 'about.intro', label: 'About – Introduction', translations: { et: { title: 'Meie Lugu', body: 'ESTORIA loodi visiooniga muuta luksuskinnisvara maastikku Eestis.', imageUrl: '' }, en: { title: 'Our Story', body: 'ESTORIA was founded with a vision to redefine luxury real estate in Estonia.', imageUrl: '' }, ru: { title: 'Наша История', body: 'ESTORIA была основана с целью изменить рынок элитной недвижимости в Эстонии.', imageUrl: '' } } },
  { key: 'about.story', label: 'About – Story', translations: { et: { title: 'Meie Teekond', body: '' }, en: { title: 'Our Journey', body: '' }, ru: { title: 'Наш Путь', body: '' } } },
  { key: 'about.values', label: 'About – Values', translations: { et: { title: 'Meie Väärtused', body: '' }, en: { title: 'Our Values', body: '' }, ru: { title: 'Наши Ценности', body: '' } } },
  { key: 'contact.info', label: 'Contact Info', translations: { et: { title: 'Kontakt', body: 'Ahtri 12, Tallinn 10151\nE-R 9:00-18:00' }, en: { title: 'Contact', body: 'Ahtri 12, Tallinn 10151\nMon-Fri 9:00-18:00' }, ru: { title: 'Контакт', body: 'Ahtri 12, Tallinn 10151\nПн-Пт 9:00-18:00' } } },
];
