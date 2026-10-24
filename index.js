import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';

const parser = new Parser();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Defining a dynamic array of target categories and their RSS endpoints
const FEEDS = [
  { category: '🎬 DAILY MOVIES', url: 'https://www.polygon.com/rss/index.xml' },
  { category: '🎮 VIDEO GAMES', url: 'https://feeds.feedburner.com/ign/all' },
  { category: '🌍 CRAZY WORLD EVENTS', url: 'https://google.com' }
];

async function scrapeArticleText(url) {
  try {
    const { data: html } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(html);
    let articleText = '';
    $('p').each((i, el) => { articleText += $(el).text() + '\n'; });
    return articleText.substring(0, 4000); // Keeping token sizes safe
  } catch {
    return ''; // Fallback if a specific page blocks basic scraping scraping
  }
}

async function runCurator() {
  try {
    let combinedEmbeds = [];

    for (const feedConfig of FEEDS) {
      console.log(`🔄 Fetching ${feedConfig.category} feed...`);
      const feed = await parser.parseURL(feedConfig.url);
      const latestArticle = feed.items[0]; // Isolate the absolute newest item

      if (!latestArticle) continue;

      console.log(`🕸️ Processing: "${latestArticle.title}"`);
      const rawBody = await scrapeArticleText(latestArticle.link);
      
      // Fallback text context to ensure Gemini always has baseline material
      const analysisContext = rawBody.length > 200 ? rawBody : latestArticle.content || latestArticle.title;

      console.log(`🤖 Sending to Gemini...`);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an elite pop-culture, gaming, and world news summary bot.
        Analyze this text item for the category: "${feedConfig.category}".
        Provide a ultra-punchy summary layout containing:
        - 1 bold main sentence takeaway.
        - 3 short, emoji-anchored bullet points explaining the core facts.
        
        Content Source Material: ${analysisContext}`,
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
        content: "🌅 **Your Multi-Topic Morning Dashboard Blueprint Is Ready!**",
        embeds: combinedEmbeds
      });
      console.log('✅ Entire multi-workflow executed successfully!');
    }

  } catch (error) {
    console.error('❌ Automation workflow broke:', error.message);
  }
}

runCurator();
