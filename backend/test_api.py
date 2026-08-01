import requests
import json

url = "http://127.0.0.1:8000/api/predict"
payload = {
 "gvp_id":"GVP301",
 "lat":17.7301,
 "lon":83.3091,
 "ward":20,
 "near_market":True,
 "near_school":False,
 "complaint_count":5,
 "days_since_cleanup":10
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Error:", e)
