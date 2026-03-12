import * as cheerio from 'cheerio';

const SEARCH_BASE = 'https://www.performancebike.com/search';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/120.0.0.0 Safari/537.36';
const MAX_RESULTS = 3;

/**
 * Search Performance Bicycle for a part and return up to 3 pricing results.
 *
 * @param {string} searchQuery - The part name to search for.
 * @returns {Promise<Array<{title: string, price: string, availability: string, url: string}>>}
 */
export async function scrapePartPricing(searchQuery) {
  try {
    const url = new URL(SEARCH_BASE);
    url.searchParams.set('query', searchQuery);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[scrapePartPricing] non-200 response: ${response.status} ${response.statusText}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];

    // Performance Bicycle product card selectors (typical Magento/custom storefront structure)
    $('[data-product-id], .product-item, .product-tile, .product-card').each((i, el) => {
      if (results.length >= MAX_RESULTS) return false;

      const $el = $(el);

      const title =
        $el.find('.product-name, .product-title, [class*="product-name"], h2, h3').first().text().trim() ||
        $el.find('a[title]').first().attr('title')?.trim() ||
        '';

      const price =
        $el.find('.price, .product-price, [class*="price"], .regular-price').first().text().trim() || '';

      const availability =
        $el.find('.availability, .stock, [class*="availability"], [class*="stock"]').first().text().trim() ||
        'Unknown';

      const href = $el.find('a[href]').first().attr('href') || '';
      const url = href.startsWith('http') ? href : href ? `https://www.performancebike.com${href}` : '';

      if (title) {
        results.push({ title, price, availability, url });
      }
    });

    return results;
  } catch (err) {
    console.error('[scrapePartPricing] error:', err.message);
    return [];
  }
}
