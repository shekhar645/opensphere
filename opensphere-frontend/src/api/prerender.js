// api/prerender.js
export default async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';

  // Common social media / link-preview bots
  const botPattern = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Discordbot|Pinterest|Googlebot/i;
  const isBot = botPattern.test(userAgent);

  // Extract slug from the URL: /post/some-slug
  const slug = req.query.slug || req.url.split('/post/')[1]?.split('?')[0];

  if (!isBot || !slug) {
    // Not a bot (a real visitor) — just serve the normal React app
    try {
      const appUrl = `https://${req.headers.host}/index.html`;
      const response = await fetch(appUrl);
      const html = await response.text();
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (err) {
      return res.status(500).send('Error loading app');
    }
  }

  // It's a bot — fetch the real post data from your Render backend
  try {
    const BACKEND_URL = process.env.BACKEND_URL; // e.g. https://your-backend.onrender.com/api
    const response = await fetch(`${BACKEND_URL}/posts/${slug}`);
    const data = await response.json();
    const post = data.data;

    if (!post) {
      return res.status(404).send('Post not found');
    }

    const title = escapeHtml(post.title || 'Untitled Post');
    const description = escapeHtml(post.subtitle || post.shortDescription || 'Read this post');
    const image = post.coverImage || `https://${req.headers.host}/default-og-image.png`;
    const url = `https://${req.headers.host}/post/${slug}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="Your Site Name" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Prerender error:', err);
    return res.status(500).send('Error generating preview');
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}