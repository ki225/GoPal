from databases import Database
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_USERNAME=os.getenv("DATABASE_USERNAME")
DATABASE_SECRET=os.getenv("DATABASE_SECRET")
DATABASE_NAME=os.getenv("DATABASE_NAME")

DATABASE_URL = f"mysql+mysqlconnector://{DATABASE_USERNAME}:{DATABASE_SECRET}@localhost:3306/{DATABASE_NAME}"
database = Database(DATABASE_URL)