import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

// Using highly stable feeds that don't throw broken attribute errors
const FEEDS = [
  { category: '🎬 DAILY MOVIES', url: 'https://gamespot.com' }, // Great mixed movie/gaming news
  { category: '🎮 VIDEO GAMES', url: 'https://gameinformer.com' },   // Alternate premium gaming news feed
  { category: '🌍 CRAZY WORLD EVENTS', url: 'https://google.com' }
];

async function runCurator() {
  try {
    let combinedEmbeds = [];

    for (const feedConfig of FEEDS) {
      console.log(`🔄 Fetching ${feedConfig.category} headline data...`);
      const { data: xmlData } = await axios.get(feedConfig.url, { timeout: 6000 });
      
      const jsonObj = parser.parse(xmlData);
      const items = jsonObj?.rss?.channel?.item || jsonObj?.feed?.entry;
      
      if (!items || items.length === 0) continue;
      
      // Grab the absolute newest individual item from the feed list
      const latestArticle = Array.isArray(items) ? items[0] : items;
      const title = latestArticle.title || 'Untitled Update';
      const link = latestArticle.link?.href || latestArticle.link || '#';
      const description = latestArticle.description || latestArticle.summary || title;

      console.log(`🤖 Processing with Gemini: "${title}"`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an elite pop-culture, gaming, and world news summary bot.
        Analyze the following article title and summary for the category: "${feedConfig.category}".
        Provide an ultra-punchy summary layout containing:
        - 1 bold main sentence takeaway.
        - 3 short, emoji-anchored bullet points explaining the core facts.
        
        Title: ${title}
        Content: ${description}`,
      });

      combinedEmbeds.push({
        title: `${feedConfig.category}: ${title}`,
        url: link,
        description: response.text.trim(),
        color: feedConfig.category.includes('MOVIES') ? 15105570 : feedConfig.category.includes('GAMES') ? 3447003 : 16711680,
        timestamp: new Date().toISOString()
      });
    }

    if (combinedEmbeds.length > 0) {
      console.log('🚀 Blasting consolidated digest bundle to Discord...');
      await axios.post(DISCORD_WEBHOOK_URL, {
        content: "🌅 **Your Clean Multi-Topic Dashboard Is Ready!**",
        embeds: combinedEmbeds
      });
      console.log('✅ Entire multi-workflow executed successfully!');
    }

  } catch (error) {
    console.error('❌ Automation workflow broke:', error.message);
  }
}

runCurator();
  
