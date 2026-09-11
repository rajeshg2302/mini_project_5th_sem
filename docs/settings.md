# PhishGuard Nexus — Settings & System Control Center

## Overview
The PhishGuard Nexus Control Center (`/settings`) provides a centralized management console for configuring UI customization, operational modes, scanner behavior, risk presentation, model evaluation controls, history options, privacy settings, notification alerts, and security preferences.

## Control Sections

1. **Appearance & Themes**:
   - Themes: `Nexus Dark`, `Midnight`, `Carbon`, `High Contrast`.
   - Accents: `Cyan`, `Blue`, `Purple`, `Green`, `Amber`.
   - Density: `Compact`, `Comfortable`, `Spacious`.
   - Font Scaling: `Small`, `Default`, `Large`, `Extra Large`.
   - Futuristic Effects: Animated Interface, Grid Background, Scan Animations, Glow Effects, Data Stream, Particle Effects.

2. **Dashboard Layout & Operational Modes**:
   - Operational Modes: `SOC MODE` (max telemetry), `ANALYST MODE` (case-focused), `MINIMAL MODE` (scan-focused).
   - Widget Enable / Disable Toggles & Reordering controls.

3. **Scanner Preferences**:
   - Auto-save scan results, Show 22 extracted features snapshot, Show threat profile radar, Show recommendations, Show education panel, Show security timeline, Auto-open case after scan.

4. **Risk Display Preferences**:
   - Format: `Score + Level`, `Level Only`, `Score Only`.
   - Risk color indicators and Threat factor details (Expanded / Collapsed).

5. **Model Evaluation Control (Academic Read-Only)**:
   - Read-Only Verified Dataset Metrics (Accuracy, Precision, Recall, F1-score, ROC-AUC) for Random Forest (95.8%), Gradient Boosting (96.1%), Decision Tree (94.2%), and Logistic Regression (92.5%).
   - Prominent Academic Notice: *"Model evaluation metrics are read-only and represent the verified experimental results of the selected dataset."*
   - Model Display Mode: `BEST MODEL`, `ALL MODELS`, `SELECTED MODEL`.
   - Threat Simulator Decision Threshold tuning labeled **SIMULATION ONLY**.

6. **History Management**:
   - Default sort (`Newest`, `Oldest`, `Highest Risk`, `Lowest Risk`), Default verdict filter, Delete confirmation toggle, Clear All Scan History.

7. **Privacy & Data Storage**:
   - Store URL scan history toggle, Store analyst notes toggle, Store investigation cases toggle.

8. **Notifications**:
   - Toast notification controls for Scan completed, High-risk detection, Critical-risk detection, Case status changed, Report generated.

9. **Immutable Security Architecture**:
   - Display immutable security controls: URL validation (ENABLED), Dangerous scheme blocking (ENABLED), Private IP rejection (ENABLED), Remote webpage fetching (DISABLED), External threat intel (DISABLED), Subprocess execution (DISABLED).
   - Security Mode: `STANDARD`, `ANALYST`, `STRICT`.

10. **Keyboard Shortcuts**:
    - `Ctrl + K` (Command Palette), `Ctrl + Enter` (Scan), `Esc` (Close Modal).

11. **Audit Log & Backup**:
    - Embedded Security Audit Log Viewer, Export Settings JSON, Import Settings JSON file/text, Reset Settings confirmation modal.
