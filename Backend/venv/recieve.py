from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('dashboard.jsx')

@socketio.on('connect', namespace='/notifications')
def handle_connect():
    print('Client connected to notifications')

@socketio.on('new_application', namespace='/notifications')
def handle_new_application(data):
    user_id = data.get('user_id')
    print(f'New application received: {user_id}')
    # Handle the new application notification on the dashboard side

if __name__ == '__main__':
    socketio.run(app, debug=True)
