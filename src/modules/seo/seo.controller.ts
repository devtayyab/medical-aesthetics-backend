import { Controller, Get, Headers, Query, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Treatment } from '../clinics/entities/treatment.entity';
import { TreatmentCategory } from '../clinics/entities/treatment-category.entity';
import { BlogPost } from '../clinics/entities/blog.entity';
import { ApiExcludeController } from '@nestjs/swagger';

const SITE_URL = (process.env.FRONTEND_URL || 'https://beautydoctors.gr').replace(/\/$/, '');
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_TITLE = 'BeautyDoctors | Ιατρική Αισθητική & Πλαστική Χειρουργική';
const DEFAULT_DESC =
  'Ανακαλύψτε πιστοποιημένους ιατρούς, κλινικές και θεραπείες αισθητικής ιατρικής, δερματολογίας και πλαστικής χειρουργικής σε Ελλάδα και Κύπρο. Κλείστε το ραντεβού σας εύκολα στο BeautyDoctors.';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtmlAndTruncate(input?: string | null, maxLen = 160): string {
  const clean = String(input || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return '';
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trimEnd()}…`;
}

function resolveAbsoluteImage(imageUrl?: string | null): string {
  const raw = String(imageUrl || '').trim();
  if (!raw || raw.includes('placehold')) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return `${SITE_URL}${raw}`;
  return `${SITE_URL}/${raw}`;
}

const STATIC_PAGE_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
  },
  '/treatments': {
    title: 'Θεραπείες Αισθητικής Ιατρικής | BeautyDoctors',
    description:
      'Εξερευνήστε όλες τις επεμβατικές και μη επεμβατικές θεραπείες προσώπου, σώματος, δερματολογίας, πλαστικής χειρουργικής και ευεξίας στο BeautyDoctors.',
  },
  '/search': {
    title: 'Αναζήτηση Θεραπειών | BeautyDoctors',
    description:
      'Αναζητήστε και συγκρίνετε θεραπείες αισθητικής ιατρικής, δερματολογίας και πλαστικής χειρουργικής από πιστοποιημένες κλινικές.',
  },
  '/blog': {
    title: 'Άρθρα & Ενημέρωση | BeautyDoctors',
    description:
      'Διαβάστε ιατρικά άρθρα, οδηγούς θεραπειών και συμβουλές αισθητικής ιατρικής από ειδικούς ιατρούς του BeautyDoctors.',
  },
  '/articles': {
    title: 'Άρθρα & Ενημέρωση | BeautyDoctors',
    description:
      'Διαβάστε ιατρικά άρθρα, οδηγούς θεραπειών και συμβουλές αισθητικής ιατρικής από ειδικούς ιατρούς του BeautyDoctors.',
  },
  '/about-us': {
    title: 'Σχετικά με εμάς | BeautyDoctors',
    description:
      'Μάθετε πώς το BeautyDoctors (Beautydoctors O.E.) συνδέει ασθενείς με πιστοποιημένους ιατρούς και κλινικές αισθητικής ιατρικής.',
  },
  '/about': {
    title: 'Σχετικά με εμάς | BeautyDoctors',
    description:
      'Μάθετε πώς το BeautyDoctors (Beautydoctors O.E.) συνδέει ασθενείς με πιστοποιημένους ιατρούς και κλινικές αισθητικής ιατρικής.',
  },
  '/contact': {
    title: 'Επικοινωνία | BeautyDoctors',
    description:
      'Επικοινωνήστε με την ομάδα υποστήριξης του BeautyDoctors για ερωτήσεις σχετικά με ραντεβού, λογαριασμούς ή συνεργασίες κλινικών.',
  },
  '/support': {
    title: 'Κέντρο Βοήθειας & Υποστήριξη | BeautyDoctors',
    description:
      'Απαντήσεις σε συχνές ερωτήσεις για κρατήσεις ραντεβού, ακυρώσεις και πληρωμές μέσω Viva και στην κλινική.',
  },
  '/for-clinics': {
    title: 'Για Ιατρικές Κλινικές & Ιατρούς | BeautyDoctors',
    description:
      'Ενταχθείτε στο πιστοποιημένο δίκτυο συνεργατών του BeautyDoctors και αναπτύξτε την ιατρική σας δραστηριότητα.',
  },
  '/partners': {
    title: 'Για Ιατρικές Κλινικές & Ιατρούς | BeautyDoctors',
    description:
      'Ενταχθείτε στο πιστοποιημένο δίκτυο συνεργατών του BeautyDoctors και αναπτύξτε την ιατρική σας δραστηριότητα.',
  },
  '/terms-of-use': {
    title: 'Όροι Χρήσης | BeautyDoctors',
    description: 'Διαβάστε τους Όρους Χρήσης της ψηφιακής πλατφόρμας BeautyDoctors.',
  },
  '/privacy-policy': {
    title: 'Πολιτική Απορρήτου | BeautyDoctors',
    description: 'Ενημερωθείτε για την Πολιτική Απορρήτου και την προστασία προσωπικών δεδομένων (GDPR) στο BeautyDoctors.',
  },
  '/medical-disclaimer': {
    title: 'Ιατρική Επισήμανση | BeautyDoctors',
    description: 'Σημαντική ιατρική επισήμανση σχετικά με την ανεξάρτητη ιατρική αξιολόγηση από τους θεράποντες ιατρούς.',
  },
  '/gift-card-terms': {
    title: 'Όροι Δωροκαρτών | BeautyDoctors',
    description: 'Όροι αγοράς, έκδοσης, εξαργύρωσης και ισχύος των Δωροκαρτών BeautyDoctors.',
  },
  '/cookie-policy': {
    title: 'Πολιτική Cookies | BeautyDoctors',
    description: 'Πληροφορίες σχετικά με τη χρήση cookies στην ιστοσελίδα BeautyDoctors.',
  },
};

@ApiExcludeController()
@Controller('seo')
export class SeoController {
  constructor(
    @InjectRepository(Treatment)
    private readonly treatmentsRepo: Repository<Treatment>,
    @InjectRepository(TreatmentCategory)
    private readonly categoriesRepo: Repository<TreatmentCategory>,
    @InjectRepository(BlogPost)
    private readonly blogRepo: Repository<BlogPost>,
  ) {}

  @Public()
  @Get('sitemap.xml')
  async getSitemap(@Res() res: Response) {
    const today = new Date().toISOString().split('T')[0];

    const [treatments, categories, posts] = await Promise.all([
      this.treatmentsRepo
        .createQueryBuilder('t')
        .select(['t.id', 't.updatedAt'])
        .where('t.isActive = :active', { active: true })
        .andWhere("LOWER(CAST(t.status AS text)) = 'approved'")
        .orderBy('t.name', 'ASC')
        .getMany(),
      this.categoriesRepo
        .createQueryBuilder('c')
        .select(['c.name', 'c.updatedAt'])
        .where('c.isActive = :active', { active: true })
        .andWhere("LOWER(CAST(c.status AS text)) = 'approved'")
        .orderBy('c.sortOrder', 'ASC')
        .addOrderBy('c.name', 'ASC')
        .getMany(),
      this.blogRepo
        .createQueryBuilder('p')
        .select(['p.slug', 'p.updatedAt', 'p.publishedAt'])
        .where('p.isPublished = :pub', { pub: true })
        .orderBy('p.publishedAt', 'DESC')
        .getMany()
        .catch(() => [] as BlogPost[]),
    ]);

    const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [
      { loc: `${SITE_URL}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
      { loc: `${SITE_URL}/treatments`, lastmod: today, changefreq: 'daily', priority: '0.9' },
      { loc: `${SITE_URL}/search`, lastmod: today, changefreq: 'daily', priority: '0.9' },
      { loc: `${SITE_URL}/blog`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
      { loc: `${SITE_URL}/about-us`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: `${SITE_URL}/for-clinics`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: `${SITE_URL}/contact`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: `${SITE_URL}/support`, lastmod: today, changefreq: 'monthly', priority: '0.6' },
      { loc: `${SITE_URL}/terms-of-use`, lastmod: today, changefreq: 'yearly', priority: '0.4' },
      { loc: `${SITE_URL}/privacy-policy`, lastmod: today, changefreq: 'yearly', priority: '0.4' },
      { loc: `${SITE_URL}/medical-disclaimer`, lastmod: today, changefreq: 'yearly', priority: '0.4' },
      { loc: `${SITE_URL}/gift-card-terms`, lastmod: today, changefreq: 'yearly', priority: '0.4' },
      { loc: `${SITE_URL}/cookie-policy`, lastmod: today, changefreq: 'yearly', priority: '0.4' },
    ];

    for (const c of categories) {
      if (!c.name) continue;
      const lastmod = c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : today;
      urls.push({
        loc: `${SITE_URL}/search?category=${encodeURIComponent(c.name)}`,
        lastmod,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    for (const t of treatments) {
      const lastmod = t.updatedAt ? new Date(t.updatedAt).toISOString().split('T')[0] : today;
      urls.push({
        loc: `${SITE_URL}/treatment/${encodeURIComponent(t.id)}`,
        lastmod,
        changefreq: 'weekly',
        priority: '0.85',
      });
    }

    for (const p of posts) {
      if (!p.slug) continue;
      const dt = p.updatedAt || p.publishedAt;
      const lastmod = dt ? new Date(dt).toISOString().split('T')[0] : today;
      urls.push({
        loc: `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`,
        lastmod,
        changefreq: 'monthly',
        priority: '0.75',
      });
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map(
        (u) =>
          `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
      ),
      '</urlset>',
    ].join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(xml);
  }

  /**
   * Serves lightweight server-rendered OpenGraph / Twitter / Meta HTML for link preview crawlers
   * (Facebook, Viber, WhatsApp, Twitter, LinkedIn, Telegram) that do not execute client JS.
   */
  @Public()
  @Get('og-preview')
  async getOgPreview(
    @Query('path') queryPath?: string,
    @Headers('x-original-uri') originalUri?: string,
    @Res() res?: Response,
  ) {
    const rawPath = queryPath || originalUri || '/';
    let pathname = '/';
    let searchParams = new URLSearchParams();

    try {
      const parsed = new URL(rawPath.startsWith('http') ? rawPath : `${SITE_URL}${rawPath.startsWith('/') ? rawPath : `/${rawPath}`}`);
      pathname = parsed.pathname.replace(/\/+$/, '') || '/';
      searchParams = parsed.searchParams;
    } catch {
      pathname = '/';
    }

    let title = DEFAULT_TITLE;
    let description = DEFAULT_DESC;
    let image = DEFAULT_OG_IMAGE;
    let ogType = 'website';
    const canonicalUrl = `${SITE_URL}${pathname === '/' ? '/' : pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    const treatmentMatch = pathname.match(/^\/treatment\/([^/]+)$/);
    const blogMatch = pathname.match(/^\/(?:blog|articles)\/([^/]+)$/);

    if (treatmentMatch && UUID_REGEX.test(treatmentMatch[1])) {
      const treatment = await this.treatmentsRepo.findOne({
        where: { id: treatmentMatch[1] },
        relations: ['categoryRef'],
      });
      if (treatment && treatment.isActive) {
        const cat = treatment.categoryRef?.name || treatment.category;
        title = `${treatment.name} | BeautyDoctors`;
        description =
          stripHtmlAndTruncate(treatment.shortDescription || treatment.fullDescription, 160) ||
          `Ανακαλύψτε τη θεραπεία ${treatment.name}${cat ? ` (${cat})` : ''} από πιστοποιημένους ιατρούς και κλινικές στο BeautyDoctors.`;
        image = resolveAbsoluteImage(treatment.imageUrl);
      }
    } else if (blogMatch) {
      const slug = decodeURIComponent(blogMatch[1]);
      const post = await this.blogRepo.findOne({ where: { slug, isPublished: true } }).catch(() => null);
      if (post) {
        title = `${post.title} | BeautyDoctors`;
        description = stripHtmlAndTruncate(post.content, 160) || DEFAULT_DESC;
        image = resolveAbsoluteImage(post.imageUrl);
        ogType = 'article';
      }
    } else if (pathname === '/search' && searchParams.get('category')) {
      const cat = searchParams.get('category')!.trim();
      title = `${cat} – Θεραπείες | BeautyDoctors`;
      description = `Ανακαλύψτε θεραπείες στην κατηγορία ${cat} από πιστοποιημένους ιατρούς και κλινικές στο BeautyDoctors.`;
    } else if (STATIC_PAGE_META[pathname]) {
      title = STATIC_PAGE_META[pathname].title;
      description = STATIC_PAGE_META[pathname].description;
    }

    const html = `<!doctype html>
<html lang="el">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="${escapeHtml(ogType)}" />
  <meta property="og:locale" content="el_GR" />
  <meta property="og:site_name" content="BeautyDoctors" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(html);
  }
}
