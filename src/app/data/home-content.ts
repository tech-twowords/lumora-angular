// Port of src/data/mocks/home.ts
// Placeholder content for the home page. Swap these values per project — every
// section reads its copy from here (component convention: no hardcoded content).

export interface NavLink {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export interface Partner {
  name: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: "x" | "behance" | "dribbble";
}

export interface CreateWord {
  label: string;
  variant: "light" | "accent" | "dark" | "ghost";
  isArrow?: boolean;
}

export interface HeroCardItem {
  caption: string;
  title: string;
}

export interface PortfolioItem {
  id: string;
  name: string;
  category: string;
  year: string;
  description: string;
  tags: string[];
  href: string;
}

export interface ServiceItem {
  index: string;
  title: string;
  description: string;
  href: string;
}

export interface Stat {
  prefix?: string;
  value: number;
  suffix?: string;
  label: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export const homeContent = {
  brand: "Lumora",
  nav: [
    { label: "Home", href: "#home" },
    { label: "Work", href: "#works" },
    { label: "Services", href: "#services", hasDropdown: true },
    { label: "Studio", href: "#about" },
    { label: "Careers", href: "#careers" },
    { label: "Contact", href: "#contact" },
  ] as NavLink[],
  meta: {
    statusLabel: "Local time",
    time: "9:41am",
    date: "12 March, 2025",
  },
  hero: {
    eyebrow: "Independent Studio",
    brandWatermark: "LUMORA",
    headingLines: ["Bold ideas,", "shipped with", "quiet precision"],
    rating: 5,
    customers: "200+ brands shipped",
    primaryCta: { label: "Let's Talk", href: "#contact" },
    secondaryCta: { label: "View Work", href: "#works" },
    cards: [
      { caption: "Conversion design", title: "Crafted to convert." },
      { caption: "Engineering", title: "Built to scale." },
      { caption: "Brand systems", title: "Designed to last." },
    ],
    partnersLabel: "Trusted by",
    partners: [
      { name: "Kaido" },
      { name: "Northpeak" },
      { name: "Vellum" },
      { name: "Orbit" },
      { name: "Brightline" },
      { name: "Cobalt" },
      { name: "Mesa" },
    ] as Partner[],
    footer: {
      left: "Working since 2014",
      center: "Remote-first, worldwide",
      right: "Scroll to explore",
    },
  },
  about: {
    eyebrow: "The Studio",
    globeLabel: "A distributed team building across every time zone.",
    statement: {
      lead: "We partner with ambitious teams to ship ",
      muted: "digital products, brand systems, and the strategy that holds them together.",
    },
    socialLabel: "Find us online",
    socials: [
      { label: "X / Twitter", href: "#x", icon: "x" },
      { label: "Behance", href: "#behance", icon: "behance" },
      { label: "Dribbble", href: "#dribbble", icon: "dribbble" },
    ] as SocialLink[],
    cta: { label: "About Us", href: "#about" },
  },
  create: {
    words: [
      { label: "We", variant: "light" },
      { label: "Build", variant: "accent" },
      { label: "", variant: "dark", isArrow: true },
      { label: "Better", variant: "ghost" },
    ] as CreateWord[],
  },
  portfolio: {
    eyebrow: "Portfolio",
    heading: "Selected Work",
    items: [
      {
        id: "aster-labs",
        name: "Aster Labs",
        category: "Branding",
        year: "2025",
        description:
          "A complete identity and go-to-market system for a fast-moving research startup.",
        tags: ["Branding", "Strategy", "Design"],
        href: "#aster-labs",
      },
      {
        id: "nova-finance",
        name: "Nova Finance",
        category: "Product",
        year: "2024",
        description:
          "A finance platform reimagined — clear data, calm interfaces, and effortless flows.",
        tags: ["Product Design", "Web App", "QA"],
        href: "#nova-finance",
      },
      {
        id: "helio-studio",
        name: "Helio Studio",
        category: "Identity",
        year: "2023",
        description:
          "A bold visual identity and art direction system built to scale across every surface.",
        tags: ["Brand Identity", "Art Direction"],
        href: "#helio-studio",
      },
      {
        id: "pulse-health",
        name: "Pulse Health",
        category: "Mobile",
        year: "2023",
        description:
          "A wellness app grounded in research, shipped end to end from concept to release.",
        tags: ["Mobile App", "UX Research", "Development"],
        href: "#pulse-health",
      },
    ] as PortfolioItem[],
  },
  services: {
    eyebrow: "Services",
    heading: "What we do best",
    items: [
      {
        index: "01",
        title: "Software Development",
        description: "Scalable web & mobile products built to last.",
        href: "#development",
      },
      {
        index: "02",
        title: "Product Design",
        description: "Interfaces that feel effortless and look sharp.",
        href: "#design",
      },
      {
        index: "03",
        title: "Quality Assurance",
        description: "Rigorous testing for flawless, confident releases.",
        href: "#qa",
      },
      {
        index: "04",
        title: "Consulting",
        description: "Strategy and direction for ambitious teams.",
        href: "#consulting",
      },
    ] as ServiceItem[],
  },
  stats: {
    eyebrow: "By the numbers",
    heading: "Proof in the work, not the words.",
    items: [
      { value: 150, suffix: "+", label: "Projects delivered" },
      { value: 98, suffix: "%", label: "Client retention" },
      { value: 12, suffix: "", label: "Years of craft" },
      { value: 40, suffix: "+", label: "Team members" },
    ] as Stat[],
  },
  footer: {
    brandWatermark: "LUMORA",
    cta: {
      heading: "Have a project in mind? Let's get to work.",
      button: { label: "Start a project", href: "#contact" },
    },
    tagline:
      "An independent studio crafting brands, products, and the systems that connect them.",
    columns: [
      {
        title: "Company",
        links: [
          { label: "About", href: "#about" },
          { label: "Careers", href: "#careers" },
          { label: "Partners", href: "#partners" },
          { label: "Contact", href: "#contact" },
        ],
      },
      {
        title: "Services",
        links: [
          { label: "Development", href: "#development" },
          { label: "Design", href: "#design" },
          { label: "Quality Assurance", href: "#qa" },
          { label: "Consulting", href: "#consulting" },
        ],
      },
      {
        title: "Social",
        links: [
          { label: "X / Twitter", href: "#x" },
          { label: "Behance", href: "#behance" },
          { label: "Dribbble", href: "#dribbble" },
          { label: "LinkedIn", href: "#linkedin" },
        ],
      },
    ] as FooterColumn[],
    legal: {
      copyright: "© 2025 Lumora Studio. All rights reserved.",
      links: [
        { label: "Privacy", href: "#privacy" },
        { label: "Terms", href: "#terms" },
      ] as FooterLink[],
    },
  },
} as const;

export type HomeContent = typeof homeContent;
