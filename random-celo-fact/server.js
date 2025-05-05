// server.js
const express = require('express');
const facts = require('./facts');
const app = express();

const getRandomFact = () =>
  facts[Math.floor(Math.random() * facts.length)];

app.get('/frame', (req, res) => {
  const fact = getRandomFact();
  res.set('Content-Type', 'text/html');
  res.send(`
    <html prefix="og: http://ogp.me/ns#">
      <head>
        <meta property="og:title" content="Random Celo Fact!" />
        <meta property="og:description" content="${fact}" />
        <meta property="og:image" content="https://via.placeholder.com/1200x630?text=Celo+Fun+Fact" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Show Another Fact" />
        <meta property="fc:frame:post_url" content="https://your-deployment-url.com/frame" />
      </head>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Frame running on http://localhost:${PORT}/frame`);
});
