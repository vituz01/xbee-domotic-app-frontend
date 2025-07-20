# xbee-domotic-app-frontend
This project concerns the development of a web control panel used to manage a local network composed by a coordinator micro-controller, 3 Xbee modules and a touch sensor that can perform various actions (turn on LEDs, open web pages, etc.) based on the selected mode.

Here’s an explanation of its main features:

## Main Features

### System Initialization

1. Loads the configuration from the server when the page starts
2. Automatically updates the system status every 30 seconds
3. Sets up all event listeners for the interface

### Mode Management

1. Allows selection between different operating modes (LED, web, Chromecast)
2. When a mode is clicked, it updates the visual interface and sends the new configuration to the server
3. Displays which mode is currently active

### Configuration

1. Manages a form to save settings such as web URL, Chromecast name, and YouTube video ID
2. Saves the configuration to the server via API calls

### Status Monitoring

1. Periodically checks if the system is online or offline
2. Shows a colored visual indicator (green = working, red = offline, yellow = connection error)
3. Displays the last update with a timestamp

### Notification System

1. Shows success or error messages via temporary alerts
2. Alerts appear in the top right and disappear after 5 seconds

### API Endpoints Used

The code communicates with these server endpoints:

* `/api/config` – to load and save the configuration
* `/api/status` – to check the system status

## Demo layout

<img width="782" height="878" alt="image" src="https://github.com/user-attachments/assets/ce077ca7-64da-4e40-9e06-1358c7dacadb" />

