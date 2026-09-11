"""
PhishGuard ML Pipeline — Main End-to-End Training CLI Runner

Reproducible, complete machine learning pipeline execution script:
1. Data loading & validation from raw CSV
2. Feature extraction for all dataset URLs
3. Stratified Train-Test split (80/20) & feature scaling
4. Multi-model training (Logistic Regression, Decision Tree, Random Forest, Gradient Boosting)
5. Metric evaluation & confusion matrix calculation
6. Artifact persistence (models, scaler, metrics, importances)
7. Verification scan test on sample URLs
"""

import os
import sys
import argparse
import numpy as np

from ml.config import RAW_DATA_DIR, PROCESSED_DATA_DIR, MODELS_DIR, RESULTS_DIR
from ml.preprocessing.preprocess import DataPreprocessor
from ml.models.trainer import ModelTrainer
from ml.evaluate import ModelEvaluator
from ml.predict import PhishGuardPredictor


def run_pipeline(data_path: str = None) -> dict:
    """
    Run the entire PhishGuard ML pipeline from data loading to model evaluation and testing.
    """
    print(f"\n{'=' * 70}")
    print("      PHISHGUARD ML PIPELINE — REPRODUCIBLE MODEL TRAINING")
    print(f"{'=' * 70}\n")
    print("[NOTICE] DATASET STATUS: Using synthetic sample dataset (sample_urls.csv).")
    print("         Metrics reflect validation on synthetic patterns and must NOT be")
    print("         reported as real-world performance statistics.\n")

    # Step 1: Preprocessing & Feature Extraction
    preprocessor = DataPreprocessor()
    X_train, X_test, y_train, y_test, X_tr_scaled, X_te_scaled, scaler = preprocessor.prepare_data(data_path)

    # Step 2: Model Training & Evaluation
    trainer = ModelTrainer(models_dir=MODELS_DIR, results_dir=RESULTS_DIR)
    eval_results = trainer.train_and_evaluate_all(
        X_train, y_train, X_test, y_test, X_tr_scaled, X_te_scaled, scaler
    )

    # Step 3: Markdown Comparison Report Generation
    evaluator = ModelEvaluator(results_dir=RESULTS_DIR)
    evaluator.print_comparison_table(eval_results)
    best_info = evaluator.get_best_model_info(eval_results)

    # Step 4: End-to-End Verification Test
    print(f"\n{'=' * 70}")
    print("VERIFICATION: RUNNING SAMPLE URL INFERENCE TEST")
    print(f"{'=' * 70}\n")

    predictor = PhishGuardPredictor(models_dir=MODELS_DIR)

    test_urls = [
        "https://www.google.com/search?q=phishguard",
        "http://192.168.1.1/login.php?verify=secure_account_update",
    ]

    for url in test_urls:
        res = predictor.predict_url(url)
        print(f"URL: {res['url']}")
        print(f"  Verdict:       {res['verdict']}")
        print(f"  Risk Score:    {res['risk_score']}/100")
        print(f"  Confidence:    {res['confidence']}")
        print(f"  Top Reason:    {res['explanation']['reasons'][0] if res['explanation']['reasons'] else 'N/A'}")
        print("-" * 50)

    print(f"\n[OK] ML PIPELINE EXECUTION SUCCESSFUL!")
    print(f"   Best Model: {best_info['best_model'].upper()} with F1-Score of {best_info['score']}")
    print(f"   Artifacts saved in: {MODELS_DIR}")
    print(f"   Results saved in:   {RESULTS_DIR}\n")

    return eval_results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run PhishGuard Machine Learning Pipeline")
    parser.add_argument("--data-path", type=str, default=None, help="Path to raw dataset CSV file")
    args = parser.parse_args()

    run_pipeline(data_path=args.data_path)
