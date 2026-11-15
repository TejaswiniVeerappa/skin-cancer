import json
from app.database.db import engine
from sqlalchemy import text

def q(sql, params=None):
    with engine.connect() as conn:
        return conn.execute(text(sql), params or {}).fetchall()

out = {}
try:
    out['predictions_count'] = q('SELECT COUNT(*) FROM predictions')[0][0]
    out['appointments_count'] = q('SELECT COUNT(*) FROM appointments')[0][0]
    out['users_count'] = q('SELECT COUNT(*) FROM users')[0][0]
    out['recent_predictions'] = []
    rows = q('SELECT id, user_id, hospital_id, patient_name, prediction, confidence, predicted_at FROM predictions ORDER BY predicted_at DESC LIMIT 10')
    for r in rows:
        out['recent_predictions'].append({
            'id': r[0], 'user_id': r[1], 'hospital_id': r[2], 'patient_name': r[3], 'prediction': r[4], 'confidence': float(r[5]) if r[5] is not None else None, 'predicted_at': str(r[6])
        })
except Exception as e:
    out['error'] = str(e)

print(json.dumps(out, indent=2))
