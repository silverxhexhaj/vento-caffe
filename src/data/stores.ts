export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  openingSoon: boolean;
  image: string;
  mapUrl: string;
}

export const stores: Store[] = [
  {
    id: "milano-centro",
    name: "Vento Centro",
    address: "Via Tortona 27",
    city: "20144 Milano",
    hours: "Mon-Fri 7:30-19:00, Sat-Sun 9:00-18:00",
    openingSoon: false,
    image: "/images/stores/centro.jpg",
    mapUrl: "https://www.google.com/maps/dir/?api=1&destination=Via+Tortona+27+Milano",
  },
  {
    id: "milano-navigli",
    name: "Vento Navigli",
    address: "Ripa di Porta Ticinese 55",
    city: "20143 Milano",
    hours: "Mon-Sun 8:00-22:00",
    openingSoon: false,
    image: "/images/stores/navigli.jpg",
    mapUrl: "https://www.google.com/maps/dir/?api=1&destination=Ripa+di+Porta+Ticinese+55+Milano",
  },
  {
    id: "milano-brera",
    name: "Vento Brera",
    address: "Via Fiori Chiari 8",
    city: "20121 Milano",
    hours: "Coming Soon",
    openingSoon: true,
    image: "/images/stores/brera.jpg",
    mapUrl: "https://www.google.com/maps/dir/?api=1&destination=Via+Fiori+Chiari+8+Milano",
  },
];

export function getOpenStores(): Store[] {
  return stores.filter((s) => !s.openingSoon);
}

export function getUpcomingStores(): Store[] {
  return stores.filter((s) => s.openingSoon);
}
