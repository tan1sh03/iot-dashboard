const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const natural = require('natural');
const fetch = require('node-fetch');
const tokenizer = new natural.WordTokenizer();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// HuggingFace API setup
const HUGGINGFACE_API_KEY = "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";
const MODEL_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";

// Device control patterns
const roomPatterns = {
  'living room': ['living room', 'livingroom', 'lounge', 'sitting room'],
  'bedroom': ['bedroom', 'bed room', 'master bedroom'],
  'kitchen': ['kitchen', 'cooking area'],
  'garage': ['garage', 'car park']
};

const devicePatterns = {
  'Smart Lights': ['light', 'lights', 'lighting', 'lamp'],
  'TV': ['tv', 'television', 'screen'],
  'Air Conditioner': ['ac', 'air conditioner', 'air conditioning', 'cooling'],
  'Air Purifier': ['purifier', 'air purifier', 'air filter'],
  'Smart Curtains': ['curtain', 'curtains', 'blinds', 'shades'],
  'Smart Oven': ['oven', 'microwave', 'stove'],
  'Coffee Maker': ['coffee', 'coffee maker', 'coffee machine'],
  'Refrigerator': ['fridge', 'refrigerator', 'cooler'],
  'Garage Door': ['garage door', 'car door'],
  'Security Camera': ['camera', 'security camera', 'cctv'],
  'EV Charger': ['charger', 'ev charger', 'car charger']
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Fallback responses
const fallbackResponses = {
  default: "I'm here to help! However, I'm having some temporary connectivity issues. I can still help you control your smart home devices.",
  greeting: "Hello! While I'm having some connectivity issues, I'm still here to help with your smart home!",
  how_are_you: "I'm functioning well, though currently operating in a limited capacity. How can I assist you with your smart home today?",
  help: "I can help you control various smart home devices. Try commands like 'turn on living room lights' or 'turn off bedroom AC'.",
};

// Helper Functions
function findBestMatch(text, patterns) {
  text = text.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  for (const [key, variations] of Object.entries(patterns)) {
    for (const variation of variations) {
      if (text.includes(variation)) {
        const score = variation.length;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = key;
        }
      }
    }
  }

  return bestMatch;
}

function isDeviceCommand(text) {
  const commandPatterns = ['turn on', 'turn off', 'switch on', 'switch off', 'enable', 'disable', 'open', 'close'];
  return commandPatterns.some(pattern => text.toLowerCase().includes(pattern));
}

function parseDeviceCommand(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const parsedCommand = {
    room: null,
    device: null,
    action: tokens.some(token => ['on', 'start', 'enable', 'activate', 'open'].includes(token)) ? 'on' : 'off'
  };

  parsedCommand.room = findBestMatch(text, roomPatterns);
  parsedCommand.device = findBestMatch(text, devicePatterns);

  return parsedCommand;
}

function isGreeting(text) {
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
  return greetings.some(greeting => text.toLowerCase().includes(greeting));
}

function isHowAreYou(text) {
  const patterns = ['how are you', 'how\'re you', 'how do you do', 'how are things'];
  return patterns.some(pattern => text.toLowerCase().includes(pattern));
}

// AI Response Function with retry logic
async function getAIResponse(input, retryCount = 0) {
  try {
    const response = await fetch(MODEL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: input,
        options: { wait_for_model: true }
      }),
    });

    if (response.status === 503 && retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return getAIResponse(input, retryCount + 1);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data[0]?.generated_text || fallbackResponses.default;
    }
    
    return data.generated_text || fallbackResponses.default;

  } catch (error) {
    console.error('Error calling HuggingFace API:', error);
    
    if (isGreeting(input)) {
      return fallbackResponses.greeting;
    } else if (isHowAreYou(input)) {
      return fallbackResponses.how_are_you;
    } else if (input.toLowerCase().includes('help')) {
      return fallbackResponses.help;
    }
    
    return fallbackResponses.default;
  }
}

// Main chatbot endpoint
app.post('/api/chatbot', async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({
      success: false,
      error: 'No command provided',
      response: null,
      isDeviceCommand: false
    });
  }

  try {
    // Check if it's a device control command first
    if (isDeviceCommand(command)) {
      const parsedCommand = parseDeviceCommand(command);
      
      if (parsedCommand.room && parsedCommand.device) {
        const response = `Turning ${parsedCommand.action} the ${parsedCommand.device} in the ${parsedCommand.room}.`;
        return res.json({
          success: true,
          response,
          parsedCommand,
          isDeviceCommand: true
        });
      }
    }

    // Handle regular chat with retry mechanism
    const aiResponse = await getAIResponse(command);
    
    // Add smart home context if relevant
    let enhancedResponse = aiResponse;
    if (command.toLowerCase().includes('smart home') || 
        command.toLowerCase().includes('device') || 
        command.toLowerCase().includes('automation')) {
      enhancedResponse += "\n\nYou can also control your smart home devices by saying things like 'Turn on the living room lights' or 'Turn off the bedroom AC'.";
    }

    res.json({
      success: true,
      response: enhancedResponse,
      parsedCommand: null,
      isDeviceCommand: false
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      response: fallbackResponses.default,
      isDeviceCommand: false
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server started with retry mechanism and fallback responses enabled');
});