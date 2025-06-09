import urllib.parse
import requests

def geocode_by_arcgis(address: str):
    encoded = urllib.parse.quote(address)
    url = f"https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine={encoded}&f=json&outSR={{%22wkid%22:4326}}&outFields=Addr_type,Match_addr,StAddr,City&maxLocations=6"

    try:
        res = requests.get(url)
        res.raise_for_status()
        data = res.json()
        if data["candidates"]:
            loc = data["candidates"][0]["location"]
            return loc["y"], loc["x"]  # return (lat, lng)
        else:
            return None, None
    except Exception as e:
        print(f"Geocode error for address: {address}", e)
        return None, None

print(geocode_by_arcgis("600嘉義市東區興業東路138號"))