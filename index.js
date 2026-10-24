import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

// Using premium developer-friendly open XML feeds that never block GitHub servers
const FEEDS = [
  { category: '🎬 DAILY MOVIES', url: 'https://film-tv-video.de' },
  { category: '🎮 VIDEO GAMES', url: 'https://nichegamer.com' },
  { category: '🌍 CRAZY WORLD EVENTS', url: 'https://thenewatlantis.com' }
];

async function runCurator() {
  try {
    let combinedEmbeds = [];

    for (const feedConfig of FEEDS) {
      console.log(`🔄 Fetching open data for ${feedConfig.category}...`);
      
      const { data: xmlData } = await axios.get(feedConfig.url, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      const jsonObj = parser.parse(xmlData);
      const items = jsonObj?.rss?.channel?.item || jsonObj?.feed?.entry;
      
      if (!items) {
        console.log(`⚠️ Skip: Feed format mismatch on ${feedConfig.category}`);
        continue;
      }
      
      // Isolate the top array item cleanly
      const latestArticle = Array.isArray(items) ? items[0] : items;
      
      const title = latestArticle.title || 'Breaking Update';
      const link = latestArticle.link || '#';
      const rawText = latestArticle.description || latestArticle.content || title;
      
      // Clean out any lingering HTML tags using regex to make it ultra-clear for Gemini
      const cleanSnippet = rawText.toString().replace(/<\/?[^>]+(>|$)/g, "").substring(0, 1000);

      console.log(`🤖 Gemini compiling summary for: "${title.substring(0, 400)}..."`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an elite pop-culture, gaming, and world news summary bot.
        Analyze the following article details for the category: "${feedConfig.category}".
        Provide an ultra-punchy summary layout containing:
        - 1 bold main sentence takeaway.
        - 3 short, emoji-anchored bullet points explaining the core facts.
        
        Title: ${title}
        Context: ${cleanSnippet}`,
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
      console.log(`🚀 Routing ${combinedEmbeds.length} payloads to Discord Endpoint...`);
      await axios.post(DISCORD_WEBHOOK_URL, {
        content: "🌅 **Your Multi-Topic Morning Dashboard Is Ready!**",
        embeds: combinedEmbeds
      });
      console.log('✅ Entire multi-workflow executed successfully!');
    } else {
      console.log('❌ Zero bundles compiled from targets.');
    }

  } catch (error) {
    console.error('❌ Automation workflow broke:', error.message);
  }
}

runCurator();
