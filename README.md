# Collaborative Whiteboard

A real-time collaborative whiteboard application that allows multiple users to draw, erase, and collaborate on the same canvas simultaneously.

![Collaborative Whiteboard](https://example.com/whiteboard-screenshot.png)

## Features

- **Real-time Collaboration**: Multiple users can work on the same whiteboard simultaneously
- **Drawing Tools**: Various colors and brush sizes
- **Eraser Tool**: Erase parts of your drawing with adjustable eraser size
- **Clear Board**: Reset the whiteboard with a single click
- **User Awareness**: See how many users are currently connected
- **Connection Status**: Visual indicators show connection status
- **Responsive Design**: Works on desktop and mobile devices
- **Whiteboard Sharing**: Easy sharing via whiteboard ID
- **Touch Support**: Works on touchscreen devices

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js and Express
- **Real-time Communication**: Socket.IO
- **Database**: MongoDB
- **Styling**: CSS with custom animations

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/aabishkar02/collaborative-whiteboard.git
cd collaborative-whiteboard
```

2. **Set up environment variables**

Create a `.env` file in the server directory with the following:

```
PORT=3001
MONGODB_URI=your_mongodb_connection_string
```

3. **Install dependencies**

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

4. **Build the client**

```bash
cd client
npm run build
```

5. **Start the server**

```bash
cd ../server
npm start
```

The application will be available at `http://localhost:3001`.

## Usage

### Creating a New Whiteboard

1. Navigate to the home page
2. Click "Create New Whiteboard"
3. A new whiteboard will be created and you'll be redirected to it

### Joining an Existing Whiteboard

1. Navigate to the home page
2. Enter the whiteboard ID in the input field
3. Click "Join"

### Using the Whiteboard

- **Drawing**: Select a color and brush size, then draw on the canvas
- **Erasing**: Click the eraser button (🧽) and draw over content to erase it
- **Clear Board**: Click the clear button (🧹) to erase the entire whiteboard
- **Changing Colors**: Click on any color in the toolbar
- **Changing Brush Size**: Select from small, medium, or large brush sizes
- **Sharing**: Copy the whiteboard ID by clicking the copy button

## Deployment

### Server Deployment

You can deploy the server to platforms like Heroku, AWS, or Digital Ocean.

1. Build the client
2. Set the environment variables on your hosting platform
3. Deploy the server code

### Client Deployment

The client is served by the Express server in production. No separate client deployment is needed.

## Development

### Running in Development Mode

1. **Start the server**

```bash
cd server
npm run dev
```

2. **Start the client (in a new terminal)**

```bash
cd client
npm run dev
```

The client will be available at `http://localhost:5173` and will proxy API requests to the server at `http://localhost:3001`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Learning Purpose only. Use if you want ok?

## Acknowledgements

- Socket.IO for the real-time communication library
- MongoDB for the database
- React for the frontend framework 
