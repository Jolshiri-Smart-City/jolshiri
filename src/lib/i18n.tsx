import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "bn";

type Dict = Record<string, { en: string; bn: string }>;

const DICT = {
  brand: { en: "Jolshiri Smart City", bn: "জলশিরি স্মার্ট সিটি" },
  tagline: {
    en: "Find your home in Purbachal's largest planned smart city.",
    bn: "পূর্বাচলের বৃহত্তম পরিকল্পিত স্মার্ট সিটিতে আপনার বাড়ি খুঁজুন।",
  },
  heroSub: {
    en: "Compare verified flats across developers, sectors and budgets — in under a minute.",
    bn: "বিভিন্ন ডেভেলপার, সেক্টর ও বাজেটের যাচাইকৃত ফ্ল্যাট মিনিটে তুলনা করুন।",
  },
  browse: { en: "Browse properties", bn: "প্রপার্টি দেখুন" },
  properties: { en: "Properties", bn: "প্রপার্টি" },
  favorites: { en: "Favorites", bn: "প্রিয়" },
  admin: { en: "Admin", bn: "অ্যাডমিন" },
  signIn: { en: "Sign in", bn: "সাইন ইন" },
  signOut: { en: "Sign out", bn: "সাইন আউট" },
  signUp: { en: "Sign up", bn: "নিবন্ধন" },
  searchTitle: { en: "Search properties", bn: "প্রপার্টি অনুসন্ধান" },
  filters: { en: "Filters", bn: "ফিল্টার" },
  reset: { en: "Reset", bn: "রিসেট" },
  priceRange: { en: "Price (BDT)", bn: "মূল্য (টাকা)" },
  sizeRange: { en: "Size (sq ft)", bn: "আকার (বর্গফুট)" },
  bedrooms: { en: "Bedrooms", bn: "বেডরুম" },
  bathrooms: { en: "Bathrooms", bn: "বাথরুম" },
  sector: { en: "Sector", bn: "সেক্টর" },
  any: { en: "Any", bn: "যেকোনো" },
  status: { en: "Status", bn: "অবস্থা" },
  available: { en: "Available", bn: "উপলব্ধ" },
  booked: { en: "Booked", bn: "বুকড" },
  sold: { en: "Sold", bn: "বিক্রিত" },
  facing: { en: "Facing", bn: "ফেসিং" },
  possessionBy: { en: "Possession by", bn: "হস্তান্তর সময়" },
  amenities: { en: "Amenities", bn: "সুযোগ-সুবিধা" },
  sortBy: { en: "Sort by", bn: "সাজান" },
  priceLow: { en: "Price: Low to High", bn: "মূল্য: কম থেকে বেশি" },
  priceHigh: { en: "Price: High to Low", bn: "মূল্য: বেশি থেকে কম" },
  newest: { en: "Newest", bn: "নতুন" },
  sizeSort: { en: "Size", bn: "আকার" },
  possessionSort: { en: "Possession date", bn: "হস্তান্তর তারিখ" },
  resultsCount: { en: "results", bn: "ফলাফল" },
  noResults: {
    en: "No exact matches. Try widening your filters — closest matches below.",
    bn: "সঠিক মিল নেই। ফিল্টার শিথিল করুন — নিকটতম মিল নিচে।",
  },
  closestMatches: { en: "Closest matches", bn: "নিকটতম মিল" },
  requestCallback: { en: "Request callback", bn: "কলব্যাকের অনুরোধ" },
  bookSiteVisit: { en: "Book site visit", bn: "সাইট ভিজিট বুক করুন" },
  whatsapp: { en: "WhatsApp", bn: "হোয়াটসঅ্যাপ" },
  yourName: { en: "Your name", bn: "আপনার নাম" },
  phone: { en: "Phone", bn: "ফোন" },
  email: { en: "Email", bn: "ইমেইল" },
  message: { en: "Message (optional)", bn: "বার্তা (ঐচ্ছিক)" },
  send: { en: "Send", bn: "পাঠান" },
  thanks: { en: "Thanks! Our team will reach out shortly.", bn: "ধন্যবাদ! আমাদের টিম শীঘ্রই যোগাযোগ করবে।" },
  unit: { en: "Unit", bn: "ইউনিট" },
  floor: { en: "Floor", bn: "তলা" },
  beds: { en: "beds", bn: "বেড" },
  baths: { en: "baths", bn: "বাথ" },
  sqft: { en: "sq ft", bn: "বর্গফুট" },
  pricePerSqft: { en: "Price / sq ft", bn: "প্রতি বর্গফুট" },
  bookingMoney: { en: "Booking money", bn: "বুকিং মানি" },
  totalPrice: { en: "Total price", bn: "মোট মূল্য" },
  paymentPlan: { en: "Payment plan", bn: "পেমেন্ট প্ল্যান" },
  description: { en: "Description", bn: "বিবরণ" },
  floorPlan: { en: "Floor plan", bn: "ফ্লোর প্ল্যান" },
  gallery: { en: "Gallery", bn: "গ্যালারি" },
  project: { en: "Project", bn: "প্রকল্প" },
  developer: { en: "Developer", bn: "ডেভেলপার" },
  saveFavorite: { en: "Save to favorites", bn: "প্রিয়তে সংরক্ষণ" },
  removeFavorite: { en: "Remove from favorites", bn: "প্রিয় থেকে সরান" },
  loading: { en: "Loading…", bn: "লোড হচ্ছে…" },
  featured: { en: "Featured listings", bn: "ফিচার্ড লিস্টিং" },
  viewAll: { en: "View all", bn: "সব দেখুন" },
  whyUs: { en: "Why Jolshiri", bn: "কেন জলশিরি" },
  why1Title: { en: "Verified inventory", bn: "যাচাইকৃত ইনভেন্টরি" },
  why1Body: { en: "Real-time status — never waste a trip on a booked flat.", bn: "রিয়েল-টাইম স্ট্যাটাস — বুকড ফ্ল্যাটে সময় নষ্ট নয়।" },
  why2Title: { en: "Apples-to-apples", bn: "তুলনাযোগ্য" },
  why2Body: { en: "Filter by price, size, possession and amenities across every project.", bn: "প্রতিটি প্রকল্পে দাম, আকার, হস্তান্তর ও সুবিধা ফিল্টার করুন।" },
  why3Title: { en: "Bangla + English", bn: "বাংলা + ইংরেজি" },
  why3Body: { en: "Built for Bangladeshi buyers, NRBs and investors alike.", bn: "বাংলাদেশি ক্রেতা, এনআরবি ও বিনিয়োগকারীদের জন্য।" },
  language: { en: "Language", bn: "ভাষা" },
  inquire: { en: "Inquire", bn: "যোগাযোগ" },
  viewDetails: { en: "View details", bn: "বিস্তারিত" },
  inquireAbout: { en: "Inquire about", bn: "জিজ্ঞাসা" },
  requestType: { en: "Request type", bn: "অনুরোধের ধরন" },
  callback: { en: "Callback", bn: "কলব্যাক" },
  siteVisit: { en: "Site visit", bn: "সাইট ভিজিট" },
  booking: { en: "Booking", bn: "বুকিং" },
  home: { en: "Home", bn: "হোম" },
  about: { en: "About Us", bn: "আমাদের সম্পর্কে" },
  contact: { en: "Contact Us", bn: "যোগাযোগ" },
  compare: { en: "Compare", bn: "তুলনা" },
};

type Key = keyof typeof DICT;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => DICT[k].en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  // English-only site (Bangla translation removed).
  const lang: Lang = "en";
  const setLang = (_l: Lang) => {};
  const t = (k: Key) => DICT[k].en;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

export function formatBDT(n: number, lang: Lang = "en"): string {
  if (n >= 10000000) {
    const v = (n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 2);
    return lang === "bn" ? `৳${v} কোটি` : `৳${v} Cr`;
  }
  if (n >= 100000) {
    const v = (n / 100000).toFixed(n % 100000 === 0 ? 0 : 2);
    return lang === "bn" ? `৳${v} লাখ` : `৳${v} L`;
  }
  return `৳${n.toLocaleString()}`;
}
