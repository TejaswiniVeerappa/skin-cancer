from app.utils.prediction_logic import classify_prediction


def test_malignant_threshold():
    result, confidence, risk_level = classify_prediction(0.3)
    assert result == "Malignant"
    assert confidence == 30.0
    assert risk_level == "Low Risk 🟢"


def test_benign_threshold():
    result, confidence, risk_level = classify_prediction(0.2)
    assert result == "Benign"
    assert confidence == 80.0
    assert risk_level == "High Risk 🔴"
