// backend/server.js - Node.js backend for AWS IoT & ChatGPT integration
const express = require('express');
const awsIot = require('aws-iot-device-sdk');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
require('dotenv').config();

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

// OpenAI (ChatGPT) integration

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // This can be omitted if you're using default env variable
  });

app.post('/api/chatbot', async (req, res) => {
  const { command } = req.body;
  try {
    const completion = await openai.createCompletion({
      model: 'gpt-4',
      prompt: `Control the devices: ${command}`,
      max_tokens: 100,
    });

    const action = parseCommand(completion.data.choices[0].text);
    device.publish(`iot/devices/${action.deviceId}/control`, JSON.stringify({ state: action.state }));
    res.send({ response: completion.data.choices[0].text });
  } catch (error) {
    console.error('ChatGPT error:', error);
    res.status(500).send({ error: 'ChatGPT failed to process the command.' });
  }
});

// Parse ChatGPT response to control devices
const parseCommand = (response) => {
  if (response.includes('Turn on')) return { deviceId: 'light', state: 'on' };
  if (response.includes('Turn off')) return { deviceId: 'light', state: 'off' };
  return { deviceId: 'unknown', state: 'off' };
};

// Start server
app.listen(3001, () => {
  console.log('Server running on port 3001');
});
