from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import random
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException
import json
import os
import csv



def check_and_go_back_if_login(driver):
    current_url = driver.current_url
    if "accounts.google.com" in current_url or "signin" in current_url:
        print("偵測到登入畫面，自動按返回")
        driver.back()
        time.sleep(3) 
        return True
    print("沒問題")
    return False

options = Options()
options.add_argument('--disable-gpu')
options.add_argument("--incognito")
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option("useAutomationExtension", False)
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
# options.add_argument("--headless")  # 若需無頭模式可啟用

driver = webdriver.Chrome(options=options)
driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
    "source": """
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
    });
    """
})

driver.get("https://www.google.com/maps/@23.8867444,115.7002064,6z/data=!4m3!11m2!2sgG_1LwZ8Se2fYnqCun_QKw!3e3?entry=ttu")


wait = WebDriverWait(driver, 20)

wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div.m6QErb.XiKgde")))
scroll_box = driver.find_element(By.XPATH, "//div[contains(@class,'m6QErb') and contains(@class,'kA9KIf')]")
for _ in range(10):
    driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", scroll_box)
    time.sleep(random.uniform(1.5, 2.5))

cards = driver.find_elements(By.CSS_SELECTOR, "button.SMP2wb.fHEb6e")
print(f"共找到 {len(cards)} 間店家")

visited_dict = dict()
visited_file = "visited.json"

if os.path.exists(visited_file):
    with open(visited_file, "r", encoding="utf-8") as f:
        visited_dict = json.load(f)
        print(f"載入已拜訪店家紀錄，共 {len(visited_dict)} 筆")
else:
    print("尚未有拜訪紀錄，從頭開始")


data_list = []
i = 0

# 初始滑動加載
wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div.m6QErb.XiKgde")))
scroll_box = driver.find_element(By.XPATH, "//div[contains(@class,'m6QErb') and contains(@class,'kA9KIf')]")
for _ in range(10):
    driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", scroll_box)
    time.sleep(random.uniform(1.5, 2.5))

time.sleep(8)
check_and_go_back_if_login(driver)

while True:
    if check_and_go_back_if_login(driver):
        continue

    try:
        scroll_box = driver.find_element(By.XPATH, "//div[contains(@class,'m6QErb') and contains(@class,'kA9KIf')]")
        cards = driver.find_elements(By.CSS_SELECTOR, "button.SMP2wb.fHEb6e")
    except Exception as e:
        print("重新取得元素失敗：", e)
        break

    if i >= len(cards):
        print("所有卡片處理完成")
        break

    try:
        card = cards[i]
        title = "unknown"
        try:
            title = card.find_element(By.CLASS_NAME, "fontHeadlineSmall").text.strip()
        except:
            pass

        if visited_dict.get(title, False):
            print(f"[已處理過] {i+1}. {title}")
            i += 1
            continue

        driver.execute_script("arguments[0].scrollIntoView(true);", card)
        time.sleep(1)

        original_url = driver.current_url
        card.click()
        time.sleep(3)

        if driver.current_url == original_url:
            print("頁面未跳轉，再點一次")
            try:
                card.click()
                time.sleep(3)
            except Exception as e:
                print("再次點擊失敗", e)

        # 收集資料
        current_url = driver.current_url
        latlng = ["N/A", "N/A"]
        if "@" in current_url:
            try:
                latlng = current_url.split('@')[1].split(',')[:2]
            except:
                pass

        name = driver.find_element(By.CLASS_NAME, "DUwDvf").text if driver.find_elements(By.CLASS_NAME, "DUwDvf") else "N/A"
        rating = driver.find_element(By.CLASS_NAME, "F7nice").text if driver.find_elements(By.CLASS_NAME, "F7nice") else "N/A"
        reviews = driver.find_element(By.CLASS_NAME, "UY7F9").text.strip("()") if driver.find_elements(By.CLASS_NAME, "UY7F9") else "N/A"
        try:
            img = driver.find_element(By.CLASS_NAME, "aoRNLd").find_element(By.TAG_NAME, "img").get_attribute("src")
        except:
            img = "N/A"

        print("==========")
        print("店家名稱：", name)
        print("評價：", rating, "（", reviews, "則）")
        print("圖片：", img)
        print("座標：", latlng)
        print("Google Maps 連結：", current_url)

        data_list.append({
            "name": name,
            "rating": rating,
            "reviews": reviews,
            "img": img,
            "lat": latlng[0],
            "lng": latlng[1],
            "map_link": current_url
        })
        visited_dict[title] = True

        with open(visited_file, "w", encoding="utf-8") as f:
           json.dump(visited_dict, f, ensure_ascii=False, indent=2)

        try:
            back_btn = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button.hYBOP.FeXq4d"))
            )
            back_btn.click()
            time.sleep(2)

            # 繼續滑動以加載更多
            for _ in range(3):
                scroll_box = driver.find_element(By.XPATH, "//div[contains(@class,'m6QErb') and contains(@class,'kA9KIf')]")
                driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", scroll_box)
                time.sleep(random.uniform(1.5, 2.5))
        except:
            print("找不到返回鍵，嘗試繼續")

        i += 1

    except Exception as e:
        print(f"跳過第 {i+1} 間店家，錯誤：{e}")
        i += 1
        continue

driver.quit()
with open(visited_file, "w", encoding="utf-8") as f:
    json.dump(visited_dict, f, ensure_ascii=False, indent=2)
print("已儲存 visited_dict 至 visited.json")


csv_file = "output.csv"
csv_fields = ["name", "rating", "reviews", "img", "lat", "lng", "map_link"]

with open(csv_file, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=csv_fields)
    writer.writeheader()
    writer.writerows(data_list)

print(f"已儲存 {len(data_list)} 筆資料至 {csv_file}")
