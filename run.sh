# Start the Python backend in the background
python app.py &

# Wait for the server to start
sleep 5

# Start ngrok to expose port 8000 and extract the public URL
ngrok http 8000 > /dev/null &
sleep 3

# Fetch the ngrok URL and open it
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url')
xdg-open "$NGROK_URL" &

