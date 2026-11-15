import os


def classify_prediction(probability: float, threshold: float | None = None):
    """Classify a model probability into Benign/Malignant.

    The current model produces relatively low sigmoid outputs for uploaded
    images, so the decision threshold is made configurable and defaults to a
    lower value than 0.5 to avoid over-classifying everything as benign.
    """

    if threshold is None:
        threshold = float(os.getenv("PREDICTION_THRESHOLD", "0.25"))

    probability = float(probability)

    if probability >= threshold:
        result = "Malignant"
        confidence_score = probability * 100

        if confidence_score >= 90:
            risk_level = "High Risk 🔴"
        elif confidence_score >= 70:
            risk_level = "Medium Risk 🟡"
        else:
            risk_level = "Low Risk 🟢"
    else:
        result = "Benign"
        confidence_score = (1 - probability) * 100

        if confidence_score >= 90:
            risk_level = "Low Risk 🟢"
        elif confidence_score >= 70:
            risk_level = "Medium Risk 🟡"
        else:
            risk_level = "High Risk 🔴"

    return result, round(confidence_score, 2), risk_level
