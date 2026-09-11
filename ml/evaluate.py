"""
PhishGuard ML Pipeline — Model Evaluation & Comparison Module

Computes detailed metrics and generates evaluation summaries:
- Accuracy, Precision, Recall, F1-Score, ROC-AUC
- Confusion Matrix (TN, FP, FN, TP)
- Formatted markdown & text comparison tables
- Model selection based on validation performance
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any

from ml.config import RESULTS_DIR, PRIMARY_METRIC


class ModelEvaluator:
    """
    Evaluates ML models, formats comparative metrics tables, and saves reports.
    """

    def __init__(self, results_dir: str = RESULTS_DIR):
        self.results_dir = results_dir
        os.makedirs(self.results_dir, exist_ok=True)

    def print_comparison_table(self, evaluation_results: Dict[str, Dict[str, Any]]) -> str:
        """Format and print a markdown comparison table of model performance."""
        header = f"| {'Model Name':<22} | {'Accuracy':<10} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'AUC-ROC':<10} |"
        divider = f"|{'-' * 24}|{'-' * 12}|{'-' * 12}|{'-' * 12}|{'-' * 12}|{'-' * 12}|"

        lines = ["\n### PhishGuard ML Pipeline — Model Performance Comparison", "", header, divider]

        for name, metrics in evaluation_results.items():
            model_title = name.replace("_", " ").title()
            line = (
                f"| {model_title:<22} "
                f"| {metrics['accuracy']:<10.4f} "
                f"| {metrics['precision']:<10.4f} "
                f"| {metrics['recall']:<10.4f} "
                f"| {metrics['f1_score']:<10.4f} "
                f"| {metrics['auc_roc']:<10.4f} |"
            )
            lines.append(line)

        table_str = "\n".join(lines)
        print(table_str)

        # Save to report markdown
        report_path = os.path.join(self.results_dir, "model_comparison_report.md")
        with open(report_path, "w") as f:
            f.write(table_str + "\n\n")

        print(f"\nSaved evaluation comparison report: {report_path}")
        return table_str

    def get_best_model_info(self, evaluation_results: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Identify best model according to PRIMARY_METRIC."""
        best_name = max(
            evaluation_results,
            key=lambda k: evaluation_results[k].get(PRIMARY_METRIC, 0)
        )
        return {
            "best_model": best_name,
            "metric_used": PRIMARY_METRIC,
            "score": evaluation_results[best_name][PRIMARY_METRIC],
            "all_metrics": evaluation_results[best_name]
        }
