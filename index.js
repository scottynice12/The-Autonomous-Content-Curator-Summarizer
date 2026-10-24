import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

// Using Google News search feeds because they are 100% stable and never block scripts
const FEEDS = [
  { category: '🎬 DAILY MOVIES', url: 'https://google.com' },
  { category: '🎮 VIDEO GAMES', url: 'https://google.com' },
  { category: '🌍 CRAZY WORLD EVENTS', url: 'https://google.com' }
];

async function runCurator() {
  try {
    let combinedEmbeds = [];

    for (const feedConfig of FEEDS) {
      console.log(`🔄 Fetching ${feedConfig.category} data...`);
      
      // Adding standard User-Agent headers to masquerade as a normal Chrome Browser
      const { data: xmlData } = await axios.get(feedConfig.url, { 
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      const jsonObj = parser.parse(xmlData);
      const items = jsonObj?.rss?.channel?.item;
      
      if (!items || items.length === 0) {
        console.log(`⚠️ No news found for ${feedConfig.category}`);
        continue;
      }
      
      // Grab the single newest article safely
      const latestArticle = Array.isArray(items) ? items[0] : items;
      
      const title = latestArticle.title || 'Untitled Update';
      const link = latestArticle.link || '#';
      const description = latestArticle.description || title;

      console.log(`🤖 Processing with Gemini: "${title}"`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an elite pop-culture, gaming, and world news summary bot.
        Analyze the following breaking news headline and summary context for the category: "${feedConfig.category}".
        Provide an ultra-punchy summary layout containing:
        - 1 bold main sentence takeaway.
        - 3 short, emoji-anchored bullet points explaining the core facts.
        
        Headline: ${title}
        Context: ${description}`,
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
      console.log(`🚀 Sending ${combinedEmbeds.length} summaries to Discord...`);
      await axios.post(DISCORD_WEBHOOK_URL, {
        content: "🌅 **Your Multi-Topic Dashboard Is Ready!**",
        embeds: combinedEmbeds
      });
      console.log('✅ Entire multi-workflow executed successfully!');
    } else {
      console.log('❌ No embeds were created from any feeds today.');
    }

  } catch (error) {
    console.error('❌ Automation workflow broke:', error.message);
  }
}

runCurator();
