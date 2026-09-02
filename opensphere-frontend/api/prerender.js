export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    res.status(400).send('Missing slug');
    return;
  }

  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://api.opensphere.sbs/api';
    const response = await fetch(`${apiUrl}/posts/${slug}`);
    const json = await response.json();

    if (!json.success || !json.data) {
      res.status(404).send('Post not found');
      return;
    }

    const post = json.data;

    const title = escapeHtml(post.title || 'OpenSphere');
    const description = escapeHtml(
      post.subtitle || post.shortDescription || 'A personal space to write, reflect, and hold onto what matters.'
    );
    const image = post.coverImage || 'https://opensphere.sbs/og-image.png';
    const url = `https://opensphere.sbs/post/${slug}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0; url=${url}" />
</head>
<body>
  <p>Redirecting to <a href="${url}">${title}</a>...</p>
</body>
</html>
    `.trim();

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    console.error('Prerender error:', err);
    res.status(500).send('Something went wrong');
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}