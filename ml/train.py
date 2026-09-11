"""
PhishGuard ML Training Pipeline
Trains Random Forest, XGBoost, and Logistic Regression models.
Saves trained models, scaler, feature names, and evaluation metrics.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
import joblib

# Add backend to path for feature names
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from app.services.feature_extractor import FEATURE_NAMES


def load_dataset(data_path: str = None) -> pd.DataFrame:
    """Load the phishing dataset CSV."""
    if data_path is None:
        data_path = os.path.join(os.path.dirname(__file__), 'data', 'phishing_dataset.csv')
    
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}")
        print("Run generate_dataset.py first to create the training data.")
        sys.exit(1)
    
    df = pd.read_csv(data_path)
    print(f"Loaded dataset: {len(df)} samples")
    print(f"  Legitimate: {len(df[df['label'] == 0])}")
    print(f"  Phishing: {len(df[df['label'] == 1])}")
    return df


def train_models(df: pd.DataFrame, models_dir: str = None):
    """Train all models and save them."""
    if models_dir is None:
        models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)

    # Prepare features and labels
    X = df[FEATURE_NAMES].values
    y = df['label'].values

    # Train/test split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\nTrain set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ─── Define Models ──────────────────────────────────────────
    models = {
        'random_forest': RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        ),
        'xgboost': GradientBoostingClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        ),
        'logistic_regression': LogisticRegression(
            max_iter=1000,
            random_state=42,
            C=1.0
        ),
    }

    # ─── Train & Evaluate ───────────────────────────────────────
    results = {}
    
    for name, model in models.items():
        print(f"\n{'='*60}")
        print(f"Training: {name}")
        print('='*60)

        # Logistic regression uses scaled features; tree models use raw
        if name == 'logistic_regression':
            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)
            y_proba = model.predict_proba(X_test_scaled)[:, 1]
        else:
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            y_proba = model.predict_proba(X_test)[:, 1]

        # Calculate metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        auc = roc_auc_score(y_test, y_proba)
        cm = confusion_matrix(y_test, y_pred)

        results[name] = {
            'accuracy': round(acc, 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1_score': round(f1, 4),
            'auc_roc': round(auc, 4),
            'confusion_matrix': cm.tolist(),
        }

        print(f"  Accuracy:  {acc:.4f}")
        print(f"  Precision: {prec:.4f}")
        print(f"  Recall:    {rec:.4f}")
        print(f"  F1 Score:  {f1:.4f}")
        print(f"  AUC-ROC:   {auc:.4f}")
        print(f"  Confusion Matrix:")
        print(f"    TN={cm[0][0]}  FP={cm[0][1]}")
        print(f"    FN={cm[1][0]}  TP={cm[1][1]}")
        print(f"\n{classification_report(y_test, y_pred, target_names=['Legitimate', 'Phishing'])}")

        # Save model
        model_path = os.path.join(models_dir, f'{name}.joblib')
        joblib.dump(model, model_path)
        print(f"  Model saved: {model_path}")

    # ─── Save Scaler & Metadata ────────────────────────────────
    scaler_path = os.path.join(models_dir, 'scaler.joblib')
    joblib.dump(scaler, scaler_path)
    print(f"\nScaler saved: {scaler_path}")

    # Save feature names
    feature_names_path = os.path.join(models_dir, 'feature_names.json')
    with open(feature_names_path, 'w') as f:
        json.dump(FEATURE_NAMES, f, indent=2)
    print(f"Feature names saved: {feature_names_path}")

    # Save evaluation results
    results_path = os.path.join(models_dir, 'evaluation_results.json')
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Evaluation results saved: {results_path}")

    # ─── Feature Importances (for tree models) ─────────────────
    importances = {}
    for name in ['random_forest', 'xgboost']:
        model = models[name]
        imp = model.feature_importances_
        feature_imp = {
            FEATURE_NAMES[i]: round(float(imp[i]), 4)
            for i in range(len(FEATURE_NAMES))
        }
        # Sort by importance
        feature_imp = dict(sorted(feature_imp.items(), key=lambda x: x[1], reverse=True))
        importances[name] = feature_imp
    
    # Logistic regression coefficients
    lr_model = models['logistic_regression']
    coefs = lr_model.coef_[0]
    feature_imp = {
        FEATURE_NAMES[i]: round(float(abs(coefs[i])), 4)
        for i in range(len(FEATURE_NAMES))
    }
    feature_imp = dict(sorted(feature_imp.items(), key=lambda x: x[1], reverse=True))
    importances['logistic_regression'] = feature_imp

    imp_path = os.path.join(models_dir, 'feature_importances.json')
    with open(imp_path, 'w') as f:
        json.dump(importances, f, indent=2)
    print(f"Feature importances saved: {imp_path}")

    # ─── Summary ────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print("TRAINING SUMMARY")
    print('='*60)
    print(f"{'Model':<25} {'Accuracy':<10} {'F1':<10} {'AUC-ROC':<10}")
    print('-'*55)
    for name, res in results.items():
        print(f"{name:<25} {res['accuracy']:<10} {res['f1_score']:<10} {res['auc_roc']:<10}")
    print('='*60)

    return results


if __name__ == '__main__':
    df = load_dataset()
    train_models(df)
