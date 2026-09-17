"""Read the supplied NZ workbooks without modifying them; rebuild source-data.json."""
import json
from pathlib import Path
import openpyxl
root = Path(__file__).resolve().parents[3]
out = Path(__file__).resolve().parents[2] / 'client/src/nz/source-data.json'
def rows(name):
    return list(openpyxl.load_workbook(root / name, data_only=True).active.values)[1:]
data = {
    'itinerary': [dict(day=r[0], date=r[1], route=r[2], summary=r[3], schedule=r[4]) for r in rows('202611新西兰南岛-自驾详细行程.xlsx') if r[0]],
    'stays': [dict(day=r[0], date=r[1], city=r[2], candidates=r[3] or '') for r in rows('202611新西兰南岛-住宿详情.xlsx') if r[0]],
    'sources': ['202611新西兰南岛-自驾详细行程.xlsx', '202611新西兰南岛-住宿详情.xlsx', '202611新西兰南岛-行程篇.docx', '202611新西兰信息汇总.docx', '路程.csv']
}
out.write_text(json.dumps(data, ensure_ascii=False, indent=2))
print(out)
