export type Translator = {
  (key: string, values?: Record<string, string | number>): string;
  raw: (key: string) => unknown;
};

export const getContent = (t: Translator) => ({
  brand: {
    name: t("content.brand.name"),
    tagline: t("content.brand.tagline"),
  },

  hero: {
    mainText: t.raw("content.hero.mainText") as string[],
    businessCategories: t.raw("content.hero.businessCategories") as string[],
    ctaText: t("content.hero.ctaText"),
    ctaHref: t("content.hero.ctaHref"),
  },

  directOffer: {
    badge: t("content.directOffer.badge"),
    headline: t("content.directOffer.headline"),
    price: t.raw("content.directOffer.price") as number,
    currency: t("content.directOffer.currency"),
    priceLabel: t("content.directOffer.priceLabel"),
    includes: t.raw("content.directOffer.includes") as string[],
    machineValue: t.raw("content.directOffer.machineValue") as number,
    ctaText: t("content.directOffer.ctaText"),
    ctaHref: t("content.directOffer.ctaHref"),
    note: t("content.directOffer.note"),
    whatsappNumber: t("content.directOffer.whatsappNumber"),
    whatsappMessage: t("content.directOffer.whatsappMessage"),
  },

  brandStatement: {
    heading: t("content.brandStatement.heading"),
    subheading: t("content.brandStatement.subheading"),
    cta: t("content.brandStatement.cta"),
  },

  productSection: {
    heading: t("content.productSection.heading"),
  },

  freeMachineOffer: {
    heading: t("content.freeMachineOffer.heading"),
    subheading: t("content.freeMachineOffer.subheading"),
    description: t("content.freeMachineOffer.description"),
    benefits: t.raw("content.freeMachineOffer.benefits") as string[],
    ctaText: t("content.freeMachineOffer.ctaText"),
    secondaryCta: t("content.freeMachineOffer.secondaryCta"),
    whatsappNumber: t("content.freeMachineOffer.whatsappNumber"),
    whatsappMessage: t("content.freeMachineOffer.whatsappMessage"),
  },

  about: {
    paragraphs: t.raw("content.about.paragraphs") as string[],
    founders: {
      heading: t("content.about.founders.heading"),
      names: t.raw("content.about.founders.names") as string[],
    },
  },

  newsletter: {
    heading: t("content.newsletter.heading"),
    subHeading: t("content.newsletter.subHeading"),
    placeholder: t("content.newsletter.placeholder"),
    buttonText: t("content.newsletter.buttonText"),
    successMessage: t("content.newsletter.successMessage"),
  },

  footer: {
    tagline: t("content.footer.tagline"),
    bottomLine: t("content.footer.bottomLine"),
    legal: t.raw("content.footer.legal") as { label: string; href: string }[],
  },

  trustBadges: t.raw("content.trustBadges") as {
    icon: string;
    label: string;
    description: string;
  }[],

  subscription: {
    heading: t("content.subscription.heading"),
    steps: t.raw("content.subscription.steps") as {
      number: string;
      title: string;
      description: string;
    }[],
  },

  contact: {
    heading: t("content.contact.heading"),
    subheading: t("content.contact.subheading"),
    whatsappNumber: t("content.contact.whatsappNumber"),
    whatsappMessage: t("content.contact.whatsappMessage"),
    email: t("content.contact.email"),
  },

  sampleBooking: {
    heading: t("sampleBooking.heading"),
    subtitle: t("sampleBooking.subtitle"),
    selectDate: t("sampleBooking.selectDate"),
    fullName: t("sampleBooking.fullName"),
    phone: t("sampleBooking.phone"),
    businessType: t("sampleBooking.businessType"),
    address: t("sampleBooking.address"),
    city: t("sampleBooking.city"),
    submit: t("sampleBooking.submit"),
    submitting: t("sampleBooking.submitting"),
    successTitle: t("sampleBooking.successTitle"),
    successMessage: t("sampleBooking.successMessage"),
    successWhatsapp: t("sampleBooking.successWhatsapp"),
    errorRequired: t("sampleBooking.errorRequired"),
    errorDate: t("sampleBooking.errorDate"),
    errorGeneric: t("sampleBooking.errorGeneric"),
    selectBusinessType: t("sampleBooking.selectBusinessType"),
    todayNote: t("sampleBooking.todayNote"),
    freeBadge: t("sampleBooking.freeBadge"),
    includes: t("sampleBooking.includes"),
  },
});
