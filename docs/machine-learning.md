# PhishGuard — Machine Learning Pipeline & Model Evaluation

## 1. Dataset & Preprocessing

The machine learning core operates on structured feature matrices generated from URL string datasets.

- **Synthetic Development Dataset:** 1,200 rows (`600` Legitimate, `600` Phishing).
- **Feature Scaling:** Logistic Regression requires feature scaling due to its distance-sensitive linear formulation. Scaling is performed using `StandardScaler`, fitted strictly on `X_train` to prevent data leakage:

$$z = \frac{x - \mu}{\sigma}$$

Tree-based algorithms (Decision Tree, Random Forest, Gradient Boosting) operate directly on unscaled feature vectors.

---

## 2. 22-Feature Representation

All models consume an ordered 22-element floating-point feature vector $\mathbf{x} \in \mathbb{R}^{22}$:

$$\mathbf{x} = \left[ x_1, x_2, \dots, x_{22} \right]^T$$

Where each $x_i$ corresponds to one of the 22 canonical features defined in `ml/config.py` and `backend/app/services/feature_extractor.py`.

---

## 3. Train-Test Split & Stratification

To ensure fair evaluation and prevent label distribution skew:
- **Split Ratio:** 80% Training ($N=960$), 20% Holdout Test ($N=240$).
- **Random Seed:** `random_state=42`.
- **Stratification:** Stratified splitting (`stratify=y`) guarantees exact 50% class distribution in both training and test sets.

---

## 4. 5-Fold Stratified Cross-Validation

In addition to holdout testing, models undergo 5-fold Stratified Cross-Validation (`StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`):

$$\text{CV F1 Mean} = \frac{1}{5} \sum_{k=1}^{5} \text{F1}_k$$

$$\text{CV F1 Std} = \sqrt{\frac{1}{5} \sum_{k=1}^{5} (\text{F1}_k - \text{CV F1 Mean})^2}$$

---

## 5. Verified ML Algorithms

### A. Logistic Regression
- **Implementation:** `sklearn.linear_model.LogisticRegression`
- **Hyperparameters:** `solver='lbfgs'`, `max_iter=1000`, `C=1.0`, `random_state=42`.
- **Input:** Scaled feature vector $\mathbf{x}_{\text{scaled}}$.

### B. Decision Tree Classifier
- **Implementation:** `sklearn.tree.DecisionTreeClassifier`
- **Hyperparameters:** `max_depth=10`, `min_samples_split=5`, `min_samples_leaf=2`, `random_state=42`.
- **Input:** Raw feature vector $\mathbf{x}$.

### C. Random Forest Classifier
- **Implementation:** `sklearn.ensemble.RandomForestClassifier`
- **Hyperparameters:** `n_estimators=100`, `max_depth=15`, `min_samples_split=5`, `min_samples_leaf=2`, `n_jobs=-1`, `random_state=42`.
- **Input:** Raw feature vector $\mathbf{x}$.

### D. Gradient Boosting Classifier
- **Implementation:** `sklearn.ensemble.GradientBoostingClassifier`
- **Hyperparameters:** `n_estimators=100`, `max_depth=5`, `learning_rate=0.1`, `min_samples_split=5`, `min_samples_leaf=2`, `random_state=42`.
- **Input:** Raw feature vector $\mathbf{x}$.

---

## 6. Model Evaluation Metrics & Formulations

- **Accuracy:** $\frac{TP + TN}{TP + TN + FP + FN}$
- **Precision:** $\frac{TP}{TP + FP}$
- **Recall (Sensitivity):** $\frac{TP}{TP + FN}$
- **F1-Score:** $2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$
- **AUC-ROC:** Area under the Receiver Operating Characteristic curve plotting True Positive Rate vs False Positive Rate across decision thresholds.

---

## 7. Model Persistence & Inference Engine

Models are serialized using `joblib` into the `models/` directory:
- `models/logistic_regression.joblib`
- `models/decision_tree.joblib`
- `models/random_forest.joblib`
- `models/gradient_boosting.joblib`
- `models/best_model.joblib`
- `models/scaler.joblib`
- `models/metadata.json`

During inference (`predict.py` / `ml_predictor.py`), models are loaded as thread-safe singleton instances, enabling `~12 ms` prediction latency per URL.
