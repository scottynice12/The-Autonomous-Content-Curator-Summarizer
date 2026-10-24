import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Force attributes parsing so we can read complex XML tags safely
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

async function runCurator() {
  try {
    let combinedEmbeds = [];

    // --- 1. MOVIE CATEGORY (POLYGON ATOM STRUCTURE) ---
    console.log('🔄 Fetching 🎬 DAILY MOVIES data from Polygon...');
    const movieRes = await axios.get('https://polygon.com', { timeout: 8000 });
    const movieJson = parser.parse(movieRes.data);
    const movieEntry = movieJson?.feed?.entry?.[0]; // Grab the first article in the entry array

    if (movieEntry) {
      const title = movieEntry.title?.['#text'] || movieEntry.title || 'Movie Update';
      const link = movieEntry.link?.href || '#';
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

    // --- 2. VIDEO GAMES CATEGORY (IGN RSS STRUCTURE) ---
    console.log('🔄 Fetching 🎮 VIDEO GAMES data from IGN...');
    const gamesRes = await axios.get('https://feedburner.com', { timeout: 8000 });
    const gamesJson = parser.parse(gamesRes.data);
    const gamesItem = gamesJson?.rss?.channel?.item?.[0]; // Grab the first item in the RSS channel array

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

    // --- 3. CRAZY WORLD EVENTS CATEGORY (GOOGLE NEWS STRUCTURE) ---
    console.log('🔄 Fetching 🌍 CRAZY WORLD EVENTS data from Google News...');
    const worldRes = await axios.get('https://google.com', { timeout: 8000 });
    const worldJson = parser.parse(worldRes.data);
    const worldItem = worldJson?.rss?.channel?.item?.[0]; // Grab the first item in the RSS channel array

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

    // --- DISPATCH DESTINATION ENDPOINT ---
    if (combinedEmbeds.length > 0) {
      console.log(`🚀 Dispatching custom curated payload layout bundle to Discord...`);
      await axios.post(DISCORD_WEBHOOK_URL, {
        content: "🌅 **Your Multi-Topic Dashboard Is Ready!**",
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
