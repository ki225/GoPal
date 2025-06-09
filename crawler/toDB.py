import csv
import pymysql
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_USERNAME=os.getenv("DATABASE_USERNAME")
DATABASE_SECRET=os.getenv("DATABASE_SECRET")
DATABASE_NAME=os.getenv("DATABASE_NAME")

# connection
conn = pymysql.connect(
    host='localhost',
    user=DATABASE_USERNAME,
    password=DATABASE_SECRET,
    database=DATABASE_NAME,
    charset='utf8mb4'
)
cursor = conn.cursor()

# read CSV and write into table
with open('./cafes.csv', newline='', encoding='utf-8-sig') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        if row['lat'] == 'N/A' or row['lng'] == 'N/A':
            continue
        print(row['name'])
        cursor.execute("""
            INSERT INTO cafes (name, rating, reviews, img, lat, lng, map_link)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            row['name'],
            row['rating'],
            int(row['reviews'].replace(",", "").strip()) if row['reviews'].strip() not in ["", "N/A"] else 0,
            row['img'],
            float(row['lat']),
            float(row['lng']),
            row['map_link']
        ))

conn.commit()
conn.close()
