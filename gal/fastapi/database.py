import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
secret_file = os.path.join(BASE_DIR, 'secret.json')

with open(secret_file) as f:
    secrets = json.load(f)

def get_secret(setting, secrets_dict=secrets):
    try:
        return secrets_dict[setting]
    except KeyError:
        raise EnvironmentError(f"Set the {setting} environment variable in secret.json.")

HOSTNAME = get_secret("Mysql_Hostname")
PORT = get_secret("Mysql_Port")
USERNAME = get_secret("Mysql_Username")
PASSWORD = get_secret("Mysql_Password")
DBNAME = get_secret("Mysql_DBname")

DB_URL = f'mysql+pymysql://{USERNAME}:{PASSWORD}@{HOSTNAME}:{PORT}/{DBNAME}'

engine = create_engine(DB_URL, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()