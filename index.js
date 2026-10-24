import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Parse text formatting and swallow custom attributes cleanly
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

async function runCurator() {
  try {
    let combinedEmbeds = [];

    // --- 1. MOVIE CATEGORY (POLYGON ATOM DATA PATH) ---
    try {
      console.log('🔄 Fetching 🎬 DAILY MOVIES data from Polygon...');
      const movieRes = await axios.get('https://www.polygon.com/rss/index.xml', { timeout: 8000 });
      const movieJson = parser.parse(movieRes.data);
      
      // Fixed syntax link: Pulls the first element [0] from the entry array safely
      const movieEntries = movieJson?.feed?.entry;
      const movieEntry = Array.isArray(movieEntries) ? movieEntries[0] : movieEntries;

      if (movieEntry) {
        const title = movieEntry.title?.['#text'] || movieEntry.title || 'Movie Update';
        const link = movieEntry.link?.href || (Array.isArray(movieEntry.link) ? movieEntry.link[0]?.href : '#');
        const summary = movieEntry.content?.['#text'] || movieEntry.summary || title;
        const cleanText = summary.toString().replace(/<\/?[^>]+(>|$)/g, "").substring(0, 1000);

        console.log(`🤖 Processing Movie: "${title.substring(0, 50)}..."`);
        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Provide an ultra-punchy pop-culture summary for the category "🎬 DAILY MOVIES":
          - 1 bold main sentence takeaway.
          - 3 short, emoji-anchored bullet points explaining the core facts.
          Title: ${title}\nContext: ${cleanText}`,
        });

        combinedEmbeds.push({
          title: `🎬 DAILY MOVIES: ${title}`,
          url: link,
          description: aiResponse.text.trim(),
          color: 15105570,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.log(`⚠️ Movie workflow segment bypass: ${e.message}`);
    }

    // --- 2. VIDEO GAMES CATEGORY (IGN FEED STRUCTURE) ---
    try {
      console.log('🔄 Fetching 🎮 VIDEO GAMES data from IGN...');
      const gamesRes = await axios.get('https://feeds.feedburner.com/ign/all', { timeout: 8000 });
      const gamesJson = parser.parse(gamesRes.data);
      
      // Fixed syntax link: Pulls the first element [0] from the item array safely
      const gamesItems = gamesJson?.rss?.channel?.item;
      const gamesItem = Array.isArray(gamesItems) ? gamesItems[0] : gamesItems;

      if (gamesItem) {
        const title = gamesItem.title || 'Gaming Update';
        const link = gamesItem.link || '#';
        const summary = gamesItem.description || title;
        const cleanText = summary.toString().replace(/<\/?[^>]+(>|$)/g, "").substring(0, 1000);

        console.log(`🤖 Processing Video Game: "${title.substring(0, 50)}..."`);
        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Provide an ultra-punchy summary for the category "🎮 VIDEO GAMES":
          - 1 bold main sentence takeaway.
          - 3 short, emoji-anchored bullet points explaining the core facts.
          Title: ${title}\nContext: ${cleanText}`,
        });

        combinedEmbeds.push({
          title: `🎮 VIDEO GAMES: ${title}`,
          url: link,
          description: aiResponse.text.trim(),
          color: 3447003,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.log(`⚠️ Gaming workflow segment bypass: ${e.message}`);
    }

    // --- 3. WORLD NEWS CATEGORY (DEVELOPER RSS PATH) ---
    try {
      console.log('🔄 Fetching 🌍 CRAZY WORLD EVENTS data from open feed...');
      // Using an open developer global blog feed to bypass Google News XML scraping blockages
      const worldRes = await axios.get('https://metal.digital', { timeout: 8000 });
      const worldJson = parser.parse(worldRes.data);
      
      // Fixed syntax link: Pulls the first element [0] from the item array safely
      const worldItems = worldJson?.rss?.channel?.item;
      const worldItem = Array.isArray(worldItems) ? worldItems[0] : worldItems;

      if (worldItem) {
        const title = worldItem.title || 'World Event Update';
        const link = worldItem.link || '#';
        const summary = worldItem.description || title;
        const cleanText = summary.toString().replace(/<\/?[^>]+(>|$)/g, "").substring(0, 1000);

        console.log(`🤖 Processing World News: "${title.substring(0, 50)}..."`);
        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Provide an ultra-punchy summary for the category "🌍 CRAZY WORLD EVENTS":
          - 1 bold main sentence takeaway.
          - 3 short, emoji-anchored bullet points explaining the core facts.
          Title: ${title}\nContext: ${cleanText}`,
        });

        combinedEmbeds.push({
          title: `🌍 CRAZY WORLD EVENTS: ${title}`,
          url: link,
          description: aiResponse.text.trim(),
          color: 16711680,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.log(`⚠️ World news workflow segment bypass: ${e.message}`);
    }

    // --- WEBHOOK ENDPOINT TRANSFER LOOP ---
    if (combinedEmbeds.length > 0) {
      console.log(`🚀 Routing ${combinedEmbeds.length} successful items to Discord Endpoint...`);
      await axios.post(DISCORD_WEBHOOK_URL, {
        content: "🌅 **Your Multi-Topic Morning Dashboard Is Ready!**",
        embeds: combinedEmbeds
      });
      console.log('✅ Entire multi-workflow executed successfully!');
    } else {
      console.log('❌ Zero bundles parsed from destinations.');
    }

  } catch (error) {
    console.error('❌ Automation workflow broke:', error.message);
  }
}

runCurator();
