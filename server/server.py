import smtplib
import email.utils
import ssl
from email.message import EmailMessage
from flask import Flask, request, jsonify
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from flask_cors import CORS  # Import Flask-CORS
import openai


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize OpenAI API Key
OPENAI_API_KEY = ''

# Set OpenAI API key
openai.api_key = OPENAI_API_KEY

# -----------------------------
# Configuration values
# -----------------------------
# Approved sender email and sender name.
SENDER = 'noreply@volunteen.co'
SENDERNAME = 'Volunteen.co Notification Email'

# Oracle Cloud Infrastructure Email Delivery SMTP username.
USERNAME_SMTP = ''

# The file containing the Email Delivery SMTP password.
PASSWORD_SMTP_FILE = 'sendemail.config'

# Oracle Email Delivery SMTP host and port.
HOST = ""
PORT = 587

# Read the SMTP password from file.
try:
    with open(PASSWORD_SMTP_FILE) as f:
        password_smtp = f.readline().strip()
except Exception as e:
    raise RuntimeError(f"Could not read SMTP password file: {e}")

# -----------------------------
# Initialize APScheduler
# -----------------------------
scheduler = BackgroundScheduler()
scheduler.start()

# -----------------------------
# Helper function to send an email message.
# -----------------------------
def send_email_message(recipient, subject, body_text):
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = email.utils.formataddr((SENDERNAME, SENDER))
    msg['To'] = recipient
    # Set the plain text content of the email.
    msg.set_content(body_text)
    try:
        server = smtplib.SMTP(HOST, PORT)
        server.ehlo()
        server.starttls(context=ssl.create_default_context(purpose=ssl.Purpose.SERVER_AUTH))
        server.ehlo()
        server.login(USERNAME_SMTP, password_smtp)
        server.sendmail(SENDER, recipient, msg.as_string())
        server.quit()
    except Exception as e:
        raise Exception(f"SMTP error: {e}")

# -----------------------------
# API Endpoint for sending email
# -----------------------------
@app.route('/send-email', methods=['POST'])
def send_email():
    # Expecting JSON data containing recipient, subject, body_text, and optional reminder info.
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON data."}), 400

    recipient = data.get('recipient')
    subject = data.get('subject')
    body_text = data.get('body_text')
    reminder_info = data.get('reminder')
    if not recipient or not subject or not body_text:
        return jsonify({"error": "Missing required fields. Must include 'recipient', 'subject', and 'body_text'."}), 400

    # Try sending the immediate email.
    try:
        send_email_message(recipient, subject, body_text)
        print('email sent on server')
    except Exception as e:
        return jsonify({"error": f"Failed to send email: {e}"}), 500

    # If reminder info is provided, schedule a reminder email.
    if reminder_info:
        if reminder_info.get("send") and reminder_info.get("reminderDate"):
            try:
                # Parse reminderDate (expected format "YYYY-MM-DD") and schedule at 09:00 AM.
                reminder_date_str = reminder_info.get("reminderDate")
                reminder_datetime = datetime.strptime(reminder_date_str, "%Y-%m-%d")
                # Set the scheduled time (e.g., 9 AM)
                reminder_datetime = reminder_datetime.replace(hour=9, minute=0, second=0)
                # Build a reminder subject and body.
                event_title = subject.split(": ", 1)[-1] if ": " in subject else subject
                reminder_subject = "Event Reminder: " + event_title
                reminder_body = ("Hello,\n\nThis is a reminder for the upcoming event:\n\n" +
                                 body_text + "\n\nThank you for volunteering!")
                # Schedule the reminder email.
                scheduler.add_job(send_email_message,
                                  'date',
                                  run_date=reminder_datetime,
                                  args=[recipient, reminder_subject, reminder_body])
            except Exception as e:
                # Log error but do not fail the endpoint.
                print("Failed to schedule reminder email:", e)

    # Return a JSON success message.
    return jsonify({"message": "Email sent successfully!"}), 200
# -----------------------------
# API Endpoint for firebase credentials
# -----------------------------

@app.route('/get-firebase-credentials', methods=['GET'])
def get_firebase_credentials():
    try:
        # You could return the Firebase credentials securely, 
        # for example, via environment variables or a secure vault
        firebase_credentials = {
            "apiKey": "",
            "authDomain":"",
            "projectId": "",
            "storageBucket": "",
            "messagingSenderId": "",
            "appId": "",
            "measurementId":  ""
        }
        return jsonify(firebase_credentials), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve Firebase credentials: {str(e)}"}), 500

# -----------------------------
# API Endpoint for Chatbot Response
# -----------------------------

@app.route('/generate-chatbot-response', methods=['POST'])
def generate_chatbot_response():
    data = request.get_json()
    user_text = data.get('userText')
    system_message = data.get('systemMessage')

    if not user_text:
        return jsonify({"error": "No user text provided."}), 400
    if not system_message:
        return jsonify({"error": "No system message provided."}), 400

    try:
        # Call the OpenAI Chat API with the provided system and user messages.
        response = openai.ChatCompletion.create(
            model="",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_text}
            ],
            max_tokens=4096,
            temperature=0.7
        )
        
        assistant_message = response['choices'][0]['message']['content']
        return jsonify({"response": assistant_message})
    except Exception as e:
        return jsonify({"error": f"Error calling OpenAI API: {str(e)}"}), 500

# -----------------------------
# Start the local server.
# -----------------------------
if __name__ == '__main__':
    # The server will run on all interfaces (0.0.0.0) and port 5000.
    app.run(host='0.0.0.0', port=5000, debug=True)
