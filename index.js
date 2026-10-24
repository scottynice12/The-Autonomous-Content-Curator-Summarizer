import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';

// 1. Initialize API Clients using Environment Variables
const parser = new Parser();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Replace this URL with any RSS feed you want (e.g., TechCrunch, BBC, etc.)
const RSS_FEED_URL = 'https://techcrunch.com'; 

async function runCurator() {
  try {
    console.log('🔄 Fetching RSS feed...');
    const feed = await parser.parseURL(RSS_FEED_URL);
    
    // Get the most recent article
    const latestArticle = feed.items[0];
    if (!latestArticle) {
      console.log('❌ No articles found in feed.');
      return;
    }
    
    console.log(`📰 Found article: "${latestArticle.title}"`);
    console.log('🕸️ Scraping webpage content...');
    
    // 2. Fetch and Scrape the Webpage Content
    const { data: html } = await axios.get(latestArticle.link);
    const $ = cheerio.load(html);
    
    // Grab text specifically from paragraph tags to avoid navigation/sidebar clutter
    let articleText = '';
    $('p').each((i, el) => {
      articleText += $(el).text() + '\n';
    });
    
    // Truncate text if it's excessively long to save token bandwidth
    const cleanText = articleText.substring(0, 6000);

    console.log('🤖 Sending text to Gemini AI for processing...');
    
    // 3. Connect to Gemini AI
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert tech industry research analyst. 
      Read the following article text. If it is clickbait or low-value, reply with 'SKIP'. 
      Otherwise, provide a punchy summary including:
      - The main takeaway in 1 sentence.
      - 3 bullet points highlighting the most critical facts or data mentioned.
      
      Article Text: ${cleanText}`,
    });

    const summaryOutput = response.text.trim();

    if (summaryOutput.includes('SKIP')) {
      console.log('⏩ AI flagged this article as low-value/clickbait. Skipping.');
      return;
    }

    // 4. Format and Send the Payload to Discord
    console.log('🚀 Sending digest to Discord...');
    const discordPayload = {
      embeds: [{
        title: latestArticle.title,
        url: latestArticle.link,
        description: summaryOutput,
        color: 3447003, // A nice blue accent color
        timestamp: new Date().toISOString(),
        footer: { text: "AI Automation Curator" }
      }]
    };

    await axios.post(DISCORD_WEBHOOK_URL, discordPayload);
    console.log('✅ Workflow completed successfully!');

  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
  }
}

runCurator();
