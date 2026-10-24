### Automated AI Multi-Topic Content Curator

A 100% free, serverless AI automation workflow built with Node.js and GitHub Actions. This project automatically scrapes the latest headlines across multiple categories (Movies, Video Games, and World Events) every morning, passes them to Google Gemini AI for processing, and delivers a sleek, curated dashboard straight to a private Discord channel. 

### 🚀 How It Works

This project functions as a digital assembly line operating on a daily schedule: 

1. **The Trigger:** GitHub Actions wakes up automatically every morning at 8:00 AM UTC (or via manual "Play" button trigger).
2. **The Source:** The Node.js engine fetches data streams from open web development news endpoints.
3. **The Brain:** Google's Gemini AI reads the raw content data, filters out clutter, and distills the main takeaways into punchy, emoji-anchored bullet points.
4. **The Endpoint:** The finalized package is dispatched directly into your private Discord Server via an incoming Webhook.

### 📁 Repository Structure & Required Files

To set this project up from scratch, your GitHub repository must contain these exact files: 

### 1. package.json (The Dependencies)

Controls your project configuration and downloads the necessary developer libraries (@google/genai, axios, and fast-xml-parser). 

### 2. index.js (The Code Engine)

The main JavaScript automation script that handles downloading the data feeds, parsing the layout structure dynamically, communicating with Gemini AI, and handling the network transfer loop out to Discord. 

### 3. .github/workflows/main.yml (The Automation Runner)

**Crucial Step:** You must create a folder structure named .github/workflows/ and place a file named main.yml inside it. This configuration file defines the cron schedule calendar timer and instructs GitHub's cloud servers on how to run your JavaScript engine automatically. 

### 🔑 External API Credentials Needed

To power the workflow, you must gather two secret validation keys: 

* **Gemini API Key:** Generated for free from Google AI Studio. This gives your workflow access to the language model brain.
* **Discord Webhook URL:** Copied from your Discord Server channel settings (Edit Channel ⚙️ -> Integrations -> Webhooks). This functions as your explicit data landing point.

### 🔒 Safe Deployment via GitHub Secrets

Do not paste your keys directly into your code! To deploy this safely and securely: 

1. Go to your repository page on **GitHub.com** and click the **Settings** gear icon tab.
2. In the left sidebar, navigate to **Secrets and variables** -> **Actions**.
3. Click the green **New repository secret** button.
4. Add your keys exactly like this (No spaces, all caps): 

  * Name: GEMINI_API_KEY | Value: *[Your copied Google Studio Token]*
  * Name: DISCORD_WEBHOOK_URL | Value: *[Your full copied Discord Webhook Link]*

### ⏱️ Running on Demand

While the script runs on autopilot every single morning, you can trigger an instant update whenever you want. Simply head to the **Actions** tab at the top of your GitHub repository, select the **Run Daily AI Content Curator** workflow from the sidebar, click the **Run workflow** dropdown on the right side, and press the green button!
