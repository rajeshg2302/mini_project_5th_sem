import joblib
import os

models_dir = r"d:\mini project 5th sem\phishguard\models"
names = ['random_forest', 'xgboost', 'logistic_regression', 'decision_tree', 'gradient_boosting', 'best_model']

for name in names:
    path = os.path.join(models_dir, f"{name}.joblib")
    if os.path.exists(path):
        m = joblib.load(path)
        print(f"{name}: {type(m).__name__}")
    else:
        print(f"{name}: NOT FOUND")
