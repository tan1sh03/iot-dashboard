const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
require('dotenv').config();
const awsIot = require('aws-iot-device-sdk');

// Initialize app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// AWS IoT setup
const device = awsIot.device({
  keyPath: 'C:\\Users\\tanis\\OneDrive\\Desktop\\PROJECTS\\IOT Automation\\iot-dashboard\\certificates\\private.key',
  certPath: 'C:\\Users\\tanis\\OneDrive\\Desktop\\PROJECTS\\IOT Automation\\iot-dashboard\\certificates\\certificate.pem.crt',
  caPath: 'C:\\Users\\tanis\\OneDrive\\Desktop\\PROJECTS\\IOT Automation\\iot-dashboard\\certificates\\AmazonRootCA1.pem',
  clientId: 'iot-dashboard',
  host: 'apqeqq2i93e7g-ats.iot.us-east-1.amazonaws.com',
});

device.on('connect', () => {
  console.log('Connected to AWS IoT Core');
  // Subscribe to status updates for all devices
  device.subscribe('iot/devices/+/status', (err, granted) => {
      if (err) {
          console.error('Subscription error:', err);
      } else {
          console.log('Subscribed to status topics:', granted);
      }
  });
});

// Handle incoming status messages
device.on('message', (topic, payload) => {
  const message = JSON.parse(payload.toString());
  const [ , , deviceId, type ] = topic.split('/');
  
  if (type === 'status') {
      console.log(`Received status from ${deviceId}:`, message);
      // Optionally store or forward status to frontend
  }
});

// Handle device control via API
app.post('/api/device/toggle', (req, res) => {
  const { deviceId, state } = req.body;
  
  // Publish control command to the device's control topic
  device.publish(`iot/devices/${deviceId}/control`, JSON.stringify({ state }), (err) => {
      if (err) {
          return res.status(500).send({ error: 'Failed to publish device state' });
      }
      res.send({ message: 'Device state updated successfully' });
  });
});



// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chatbot', async (req, res) => {
    const { command } = req.body;
    
    if (!command) {
        return res.status(400).json({ 
            error: 'Command is required',
            details: 'Please provide a command in the request body'
        });
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a smart home assistant. You help control devices like lights, TV, thermostat, etc. Keep responses brief and clear."
                },
                {
                    role: "user",
                    content: command
                }
            ],
            model: "gpt-3.5-turbo",
            max_tokens: 100,
            temperature: 0.7,
        });

        // Extract the response from the completion
        const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that command.";

        // Send the response back to the client
        res.json({ response });

    } catch (error) {
        console.error('Error processing command:', error);
        res.status(500).json({ 
            error: 'Failed to process command',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('Server running on port 3001');
});