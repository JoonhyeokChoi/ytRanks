from flask import Flask
from flask_cors import CORS
from views import views

app = Flask(__name__)
app.register_blueprint(views, url_prefix="/")
CORS(app)

if __name__ == "__main__":
    app.run(debug=True)