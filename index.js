import Parser from 'rss-parser';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';

const parser = new Parser();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const FEEDS = [
  { category: '🎬 DAILY MOVIES', url: 'https://polygon.com' },
  { category: '🎮 VIDEO GAMES', url: 'https://feedburner.com' },
  { category: '🌍 CRAZY WORLD EVENTS', url: 'https://google.com' }
];

async function runCurator() {
  try {
    let combinedEmbeds = [];

    for (const feedConfig of FEEDS) {
      console.log(`🔄 Fetching ${feedConfig.category} headline data...`);
      const feed = await parser.parseURL(feedConfig.url);
      const latestArticle = feed.items[0]; // Isolate the absolute newest item

      if (!latestArticle) continue;

      // Extract feed-provided content descriptions so we completely skip web-scraping
      const contentSnippet = latestArticle.contentSnippet || latestArticle.content || latestArticle.title;
      console.log(`🤖 Processing with Gemini: "${latestArticle.title}"`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an elite pop-culture, gaming, and world news summary bot.
        Analyze the following article title and short snippet for the category: "${feedConfig.category}".
        Provide an ultra-punchy summary layout containing:
        - 1 bold main sentence takeaway.
        - 3 short, emoji-anchored bullet points explaining the core facts.
        
        Title: ${latestArticle.title}
        Snippet: ${contentSnippet}`,
      });

      combinedEmbeds.push({
        title: `${feedConfig.category}: ${latestArticle.title}`,
        url: latestArticle.link,
        description: response.text.trim(),
        color: feedConfig.category.includes('MOVIES') ? 15105570 : feedConfig.category.includes('GAMES') ? 3447003 : 16711680,
        timestamp: new Date().toISOString()
      });
    }

    if (combinedEmbeds.length > 0) {
      console.log('🚀 Blasting consolidated digest bundle to Discord...');
      await axios.post(DISCORD_WEBHOOK_URL, {
        content: "🌅 **Your Multi-Topic Dashboard Is Ready!**",
        embeds: combinedEmbeds
      });
      console.log('✅ Entire multi-workflow executed successfully!');
    }

  } catch (error) {
    console.error('❌ Automation workflow broke:', error.message);
  }
}

runCurator();
