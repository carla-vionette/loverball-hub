import { Helmet } from "react-helmet-async";

const SITE = "https://www.loverball.com";
const DEFAULT_IMAGE = `${SITE}/og-image.png`;
const SITE_NAME = "Loverball";

interface SeoProps {
  title: string;
  description: string;
  path: string; // e.g. "/feed"
  type?: "website" | "article" | "event" | "product";
  image?: string;
  imageAlt?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Per-route SEO: title, description, canonical, og:*, twitter:*, optional JSON-LD.
 * Drop one <Seo /> at the top of each page component.
 */
export const Seo = ({
  title,
  description,
  path,
  type = "website",
  image,
  imageAlt,
  jsonLd,
}: SeoProps) => {
  const url = `${SITE}${path}`;
  const resolvedImage = image
    ? (image.startsWith("http") ? image : `${SITE}${image.startsWith("/") ? "" : "/"}${image}`)
    : DEFAULT_IMAGE;
  // og:type only accepts a small set; map our custom types to valid OG values
  const ogType = type === "product" ? "website" : type;
  const blocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  const alt = imageAlt || title;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:image:secure_url" content={resolvedImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={alt} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@loverball" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />
      <meta name="twitter:image:alt" content={alt} />

      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(b)}</script>
      ))}
    </Helmet>
  );
};

export default Seo;
