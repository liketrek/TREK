"""Cache public OSRM road geometry. Does not send notes or private booking data."""
import json, subprocess, datetime
from pathlib import Path
routes = {
3:[(172.6365,-43.5309),(170.4771,-44.0047),(170.4829,-44.0033)],
4:[(170.4771,-44.0047),(170.1325,-44.1059),(170.0969,-43.7344),(170.0992,-44.2575),(169.1359,-44.6969)],
5:[(169.1177,-44.6982),(169.0035,-44.8796),(168.9385,-44.9831),(168.8356,-44.9387),(168.6626,-45.0312)],
6:[(168.6626,-45.0312),(168.3835,-44.8503),(168.6626,-45.0312),(168.6569,-45.027)],
9:[(168.6626,-45.0312),(169.1989,-45.0389),(169.9660,-44.4908),(170.4684,-44.7313),(170.9685,-45.1025),(170.9806,-45.1114)],
10:[(170.9685,-45.1025),(172.6203,-43.5302),(172.6365,-43.5309),(172.5322,-43.4894)]}
output = Path(__file__).resolve().parents[2] / 'client/src/nz/road-routes.json'
result = {}
for day, points in routes.items():
    url = 'https://router.project-osrm.org/route/v1/driving/' + ';'.join(f'{x},{y}' for x,y in points) + '?overview=simplified&geometries=geojson'
    raw = subprocess.check_output(['curl','-fsS','--connect-timeout','10','--max-time','35',url])
    data = json.loads(raw)
    if data['code'] != 'Ok': raise RuntimeError(f'Route D{day}: {data["code"]}')
    route = data['routes'][0]
    result[str(day)] = {'positions':[[round(y,5),round(x,5)] for x,y in route['geometry']['coordinates']], 'distanceKm':round(route['distance']/1000), 'provider':'OSRM / OpenStreetMap', 'retrievedAt':datetime.date.today().isoformat()}
    print(f'D{day}: {len(result[str(day)]["positions"])} road points',flush=True)
output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
