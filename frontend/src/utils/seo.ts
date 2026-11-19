import { getPreferredLanguage } from "./language";

const SITE_ORIGIN = "https://beautydoctors.gr";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.jpg`;

export interface PageMetaInput {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function resolveAbsoluteSeoImage(imageUrl?: string | null): string {
  const raw = String(imageUrl || "").trim();
  if (!raw || raw.includes("placehold")) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(raw)) return raw;
  const origin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : SITE_ORIGIN;
  if (raw.startsWith("/")) return `${origin}${raw}`;
  return `${origin}/${raw}`;
}

export function stripHtmlForMeta(input?: string | null, maxLen = 160): string {
  const clean = String(input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "";
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trimEnd()}…`;
}

export function setPageMeta(input: PageMetaInput) {
  if (typeof document === "undefined") return;
  const isEl = getPreferredLanguage() === "el";
  const defaultDesc = isEl
    ? "Ανακαλύψτε πιστοποιημένους ιατρούς, κλινικές και θεραπείες αισθητικής ιατρικής, δερματολογίας και πλαστικής χειρουργικής στο BeautyDoctors."
    : "Discover verified doctors, clinics, and medical aesthetic, dermatology, and plastic surgery treatments on BeautyDoctors.";

  const title = input.title || "BeautyDoctors";
  const description = input.description?.trim() || defaultDesc;
  const image = resolveAbsoluteSeoImage(input.image);
  const url =
    input.url ||
    (typeof window !== "undefined"
      ? `${SITE_ORIGIN}${window.location.pathname}${window.location.search}`
      : `${SITE_ORIGIN}/`);
  const type = input.type || "website";

  document.title = title;
  upsertMeta("name", "description", description);
  upsertCanonical(url);

  upsertMeta("property", "og:type", type);
  upsertMeta("property", "og:site_name", "BeautyDoctors");
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:image", image);
  upsertMeta("property", "og:url", url);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", image);
}

export function applyRouteMeta(pathname: string, search: string) {
  const isEl = getPreferredLanguage() === "el";
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(search);

  if (cleanPath === "/search") {
    const category = params.get("category")?.trim();
    const q = (params.get("q") || params.get("query"))?.trim();
    if (category) {
      setPageMeta({
        title: isEl ? `${category} – Θεραπείες | BeautyDoctors` : `${category} – Treatments | BeautyDoctors`,
        description: isEl
          ? `Εξερευνήστε θεραπείες στην κατηγορία ${category} από πιστοποιημένους ιατρούς και κλινικές στο BeautyDoctors.`
          : `Explore ${category} treatments offered by verified doctors and clinics on BeautyDoctors.`,
      });
      return;
    }
    if (q) {
      setPageMeta({
        title: isEl ? `Αναζήτηση: ${q} | BeautyDoctors` : `Search: ${q} | BeautyDoctors`,
        description: isEl
          ? `Αποτελέσματα αναζήτησης για «${q}» σε θεραπείες αισθητικής ιατρικής στο BeautyDoctors.`
          : `Search results for "${q}" across medical aesthetics treatments on BeautyDoctors.`,
      });
      return;
    }
    setPageMeta({
      title: isEl ? "Αναζήτηση Θεραπειών | BeautyDoctors" : "Search Treatments | BeautyDoctors",
      description: isEl
        ? "Αναζητήστε και συγκρίνετε θεραπείες αισθητικής ιατρικής, δερματολογίας και πλαστικής χειρουργικής από πιστοποιημένες κλινικές."
        : "Search and compare medical aesthetics, dermatology, and plastic surgery treatments across verified clinics.",
    });
    return;
  }

  // Dynamic detail routes set their own title once the entity loads; set a clean interim title
  if (cleanPath.startsWith("/treatment/")) {
    setPageMeta({
      title: isEl ? "Θεραπεία | BeautyDoctors" : "Treatment | BeautyDoctors",
    });
    return;
  }
  if (cleanPath.startsWith("/clinic/")) {
    setPageMeta({
      title: isEl ? "Κλινική | BeautyDoctors" : "Clinic | BeautyDoctors",
    });
    return;
  }
  if (cleanPath.startsWith("/blog/") || cleanPath.startsWith("/articles/")) {
    setPageMeta({
      title: isEl ? "Άρθρο | BeautyDoctors" : "Article | BeautyDoctors",
      type: "article",
    });
    return;
  }

  const routes: Record<string, { el: { title: string; desc: string }; en: { title: string; desc: string } }> = {
    "/": {
      el: {
        title: "BeautyDoctors | Ιατρική Αισθητική & Πλαστική Χειρουργική",
        desc: "Ανακαλύψτε πιστοποιημένους ιατρούς, κλινικές και θεραπείες αισθητικής ιατρικής, δερματολογίας και πλαστικής χειρουργικής σε Ελλάδα και Κύπρο.",
      },
      en: {
        title: "BeautyDoctors | Medical Aesthetics & Plastic Surgery",
        desc: "Discover verified doctors, clinics, and medical aesthetic, dermatology, and plastic surgery treatments in Greece and Cyprus.",
      },
    },
    "/treatments": {
      el: {
        title: "Θεραπείες Αισθητικής Ιατρικής | BeautyDoctors",
        desc: "Περιηγηθείτε σε όλες τις επεμβατικές και μη επεμβατικές θεραπείες προσώπου, σώματος, δερματολογίας και πλαστικής χειρουργικής.",
      },
      en: {
        title: "Aesthetic Medicine Treatments | BeautyDoctors",
        desc: "Browse invasive and non-invasive facial, body, dermatology, and plastic surgery treatments.",
      },
    },
    "/blog": {
      el: {
        title: "Άρθρα & Ενημέρωση | BeautyDoctors",
        desc: "Ιατρικά άρθρα, οδηγοί θεραπειών και συμβουλές αισθητικής ιατρικής από ειδικούς ιατρούς.",
      },
      en: {
        title: "Articles & Insights | BeautyDoctors",
        desc: "Clinical articles, treatment guides, and medical aesthetics insights from specialist doctors.",
      },
    },
    "/articles": {
      el: {
        title: "Άρθρα & Ενημέρωση | BeautyDoctors",
        desc: "Ιατρικά άρθρα, οδηγοί θεραπειών και συμβουλές αισθητικής ιατρικής από ειδικούς ιατρούς.",
      },
      en: {
        title: "Articles & Insights | BeautyDoctors",
        desc: "Clinical articles, treatment guides, and medical aesthetics insights from specialist doctors.",
      },
    },
    "/about-us": {
      el: {
        title: "Σχετικά με εμάς | BeautyDoctors",
        desc: "Μάθετε πώς το BeautyDoctors (Beautydoctors O.E.) συνδέει ασθενείς με πιστοποιημένους ιατρούς και κλινικές.",
      },
      en: {
        title: "About Us | BeautyDoctors",
        desc: "Learn how BeautyDoctors (Beautydoctors O.E.) connects patients with verified doctors and clinics.",
      },
    },
    "/about": {
      el: {
        title: "Σχετικά με εμάς | BeautyDoctors",
        desc: "Μάθετε πώς το BeautyDoctors (Beautydoctors O.E.) συνδέει ασθενείς με πιστοποιημένους ιατρούς και κλινικές.",
      },
      en: {
        title: "About Us | BeautyDoctors",
        desc: "Learn how BeautyDoctors (Beautydoctors O.E.) connects patients with verified doctors and clinics.",
      },
    },
    "/contact": {
      el: {
        title: "Επικοινωνία | BeautyDoctors",
        desc: "Επικοινωνήστε με την ομάδα υποστήριξης του BeautyDoctors για ραντεβού, λογαριασμούς ή συνεργασίες κλινικών.",
      },
      en: {
        title: "Contact Us | BeautyDoctors",
        desc: "Contact BeautyDoctors Support for questions about appointments, accounts, or clinic partnerships.",
      },
    },
    "/support": {
      el: {
        title: "Κέντρο Βοήθειας & Υποστήριξη | BeautyDoctors",
        desc: "Απαντήσεις σε συχνές ερωτήσεις για κρατήσεις ραντεβού, ακυρώσεις και πληρωμές.",
      },
      en: {
        title: "Help Center & Support | BeautyDoctors",
        desc: "Answers to common questions about booking appointments, cancellations, and payments.",
      },
    },
    "/for-clinics": {
      el: {
        title: "Για Ιατρικές Κλινικές & Ιατρούς | BeautyDoctors",
        desc: "Συνεργαστείτε με το BeautyDoctors και συνδεθείτε με ασθενείς που αναζητούν πιστοποιημένες θεραπείες αισθητικής ιατρικής.",
      },
      en: {
        title: "For Medical Clinics & Doctors | BeautyDoctors",
        desc: "Partner with BeautyDoctors and connect with patients seeking verified medical aesthetic treatments.",
      },
    },
    "/partners": {
      el: {
        title: "Για Ιατρικές Κλινικές & Ιατρούς | BeautyDoctors",
        desc: "Συνεργαστείτε με το BeautyDoctors και συνδεθείτε με ασθενείς που αναζητούν πιστοποιημένες θεραπείες αισθητικής ιατρικής.",
      },
      en: {
        title: "For Medical Clinics & Doctors | BeautyDoctors",
        desc: "Partner with BeautyDoctors and connect with patients seeking verified medical aesthetic treatments.",
      },
    },
    "/terms-of-use": {
      el: { title: "Όροι Χρήσης | BeautyDoctors", desc: "Όροι Χρήσης της πλατφόρμας BeautyDoctors." },
      en: { title: "Terms of Use | BeautyDoctors", desc: "BeautyDoctors Platform Terms of Use." },
    },
    "/privacy-policy": {
      el: { title: "Πολιτική Απορρήτου | BeautyDoctors", desc: "Πολιτική Απορρήτου και προστασία προσωπικών δεδομένων (GDPR) στο BeautyDoctors." },
      en: { title: "Privacy Policy | BeautyDoctors", desc: "BeautyDoctors Privacy Policy and GDPR data protection notice." },
    },
    "/medical-disclaimer": {
      el: { title: "Ιατρική Επισήμανση | BeautyDoctors", desc: "Ιατρική επισήμανση σχετικά με την ανεξάρτητη ιατρική αξιολόγηση." },
      en: { title: "Medical Disclaimer | BeautyDoctors", desc: "Important medical disclaimer regarding independent clinical assessment." },
    },
    "/gift-card-terms": {
      el: { title: "Όροι Δωροκαρτών | BeautyDoctors", desc: "Όροι αγοράς, έκδοσης και εξαργύρωσης Δωροκαρτών BeautyDoctors." },
      en: { title: "Gift Card Terms | BeautyDoctors", desc: "Terms governing purchase, issuance, and redemption of BeautyDoctors Gift Cards." },
    },
    "/cookie-policy": {
      el: { title: "Πολιτική Cookies | BeautyDoctors", desc: "Πολιτική Cookies της ιστοσελίδας BeautyDoctors." },
      en: { title: "Cookie Policy | BeautyDoctors", desc: "BeautyDoctors Cookie Policy." },
    },
    "/provider-terms": {
      el: { title: "Όροι Παρόχων | BeautyDoctors", desc: "Όροι συνεργασίας για ιατρούς και κλινικές στο BeautyDoctors." },
      en: { title: "Provider Terms | BeautyDoctors", desc: "Partnership terms for doctors and clinics on BeautyDoctors." },
    },
    "/login": {
      el: { title: "Σύνδεση | BeautyDoctors", desc: "Συνδεθείτε στον λογαριασμό σας στο BeautyDoctors." },
      en: { title: "Login | BeautyDoctors", desc: "Log in to your BeautyDoctors account." },
    },
    "/register": {
      el: { title: "Εγγραφή | BeautyDoctors", desc: "Δημιουργήστε λογαριασμό στο BeautyDoctors για να δείτε τιμές και να κλείσετε ραντεβού." },
      en: { title: "Register | BeautyDoctors", desc: "Create a BeautyDoctors account to view prices and book appointments." },
    },
    "/appointments": {
      el: { title: "Τα Ραντεβού μου | BeautyDoctors", desc: "Διαχειριστείτε τα ραντεβού σας στο BeautyDoctors." },
      en: { title: "My Appointments | BeautyDoctors", desc: "Manage your BeautyDoctors appointments." },
    },
    "/my-account": {
      el: { title: "Ο Λογαριασμός μου | BeautyDoctors", desc: "Διαχειριστείτε τον λογαριασμό και το προφίλ σας στο BeautyDoctors." },
      en: { title: "My Account | BeautyDoctors", desc: "Manage your BeautyDoctors account and profile." },
    },
  };

  const match = routes[cleanPath];
  if (match) {
    const localized = isEl ? match.el : match.en;
    setPageMeta({ title: localized.title, description: localized.desc });
    return;
  }

  setPageMeta({
    title: isEl ? "BeautyDoctors | Ιατρική Αισθητική & Πλαστική Χειρουργική" : "BeautyDoctors | Medical Aesthetics & Plastic Surgery",
  });
}

