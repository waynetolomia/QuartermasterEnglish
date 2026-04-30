require('dotenv').config(); // Load environment variables from .env file
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const config = {
  // Your Gemini API Key is loaded securely from the .env file
  apiKey: process.env.GEMINI_API_KEY,
  
  // List of categories to generate images for
  categories: [
    "Navigation", "Deck Operations", "Deck Machinery", "Maneuvering", 
    "Ship Dynamics", "Stability", "Weather", "Directions", 
    "Communication", "Safety", "Engine Room", "Ship Structure", 
    "Cargo Operations", "Operations", "Ship Spaces", "Ship Types"
  ],
  
  // Number of unique images to generate for each category
  imagesPerCategory: 3,
  
  // The output directory for the generated images
  outputDir: path.join(__dirname, 'assets', 'images'),
  
  // The style of the prompt sent to Gemini
  promptStyle: "A highly detailed, colorful, cartoon-style illustration",
  
  // Delay in milliseconds between API calls to avoid rate-limiting
  apiDelayMs: 3000 
};

/**
 * Ensures that the specified output directory exists.
 */
function setupDirectory() {
  if (!fs.existsSync(config.outputDir)) {
    console.log(`📁 Creating output directory at: ${config.outputDir}`);
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
}

/**
 * Calls the Gemini Imagen API to generate an image from a prompt.
 * @param {string} prompt The text prompt for image generation.
 * @returns {Promise<string>} A promise that resolves with the Base64 encoded image string.
 */
async function generateImageFromPrompt(prompt) {
  // This script requires Node.js v18+ for native fetch
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${config.apiKey}`;
  
  const payload = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: "4:3", // Perfect ratio for your swipe cards
      outputOptions: { mimeType: "image/png" }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const prediction = data.predictions?.[0];

  if (prediction?.bytesBase64) {
    return prediction.bytesBase64;
  } else {
    throw new Error("API response did not contain valid image data.");
  }
}

/**
 * Main orchestration function.
 */
async function runImageGenerator() {
  console.log("🚢 Starting Maritime Image Generation Script...");

  // 1. Validate API Key
  if (!config.apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY is not set.");
    console.error("Please create a '.env' file in the project root and add: GEMINI_API_KEY=your_key_here");
    return;
  }
  console.log(`🔑 Using API Key from environment variables.`);

  // 2. Setup output directory
  setupDirectory();

  // 3. Process all categories
  for (const category of config.categories) {
    for (let i = 1; i <= config.imagesPerCategory; i++) {
      const filename = `${category.toLowerCase().replace(/\s+/g, '_')}_${i}.png`;
      const filepath = path.join(config.outputDir, filename);

      if (fs.existsSync(filepath)) {
        console.log(`⏭️  Skipping '${filename}' (file already exists).`);
        continue;
      }

      console.log(`🎨 Generating image for '${category}' (${i}/${config.imagesPerCategory})...`);
      const prompt = `${config.promptStyle} representing maritime ${category}. Merchant shipping context, vibrant, high quality, educational, well-lit.`;

      try {
        const base64Image = await generateImageFromPrompt(prompt);
        fs.writeFileSync(filepath, Buffer.from(base64Image, 'base64'));
        console.log(`✅ Successfully saved '${filename}'`);
        
        // Wait before the next request to respect API rate limits
        if (config.apiDelayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, config.apiDelayMs));
        }
      } catch (error) {
        console.error(`❌ Failed to generate '${filename}':`, error.message);
        // Optional: stop on first error, or continue with others
        // return; 
      }
    }
  }

  console.log("\n🎉 Image generation process complete!");
}

// Execute the script
runImageGenerator();