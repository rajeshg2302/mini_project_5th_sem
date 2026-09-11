"""
PhishGuard SHAP Explainability Engine
Generates human-readable explanations for phishing predictions.
"""

import numpy as np
from typing import Dict, List
from .feature_extractor import FEATURE_NAMES, get_feature_descriptions
from .ml_predictor import predictor


# Human-readable impact templates for each feature
FEATURE_IMPACT_TEMPLATES = {
    'url_length': {
        'high': 'The URL is unusually long ({value} characters), which is common in phishing URLs that try to hide malicious paths',
        'low': 'The URL has a normal length ({value} characters), typical of legitimate websites',
    },
    'domain_length': {
        'high': 'The domain name is very long ({value} characters), which is suspicious',
        'low': 'The domain has a normal, concise length ({value} characters)',
    },
    'path_length': {
        'high': 'The URL path is unusually long ({value} characters), suggesting complex redirections',
        'low': 'The URL path is short and clean ({value} characters)',
    },
    'num_dots': {
        'high': 'The URL contains many dots ({value}), indicating excessive subdomains or obfuscation',
        'low': 'The URL has a normal number of dots ({value})',
    },
    'num_hyphens': {
        'high': 'The domain uses {value} hyphens, a common technique in phishing to mimic legitimate domains',
        'low': 'The domain uses minimal hyphens ({value})',
    },
    'num_underscores': {
        'high': 'The URL contains {value} underscores, which is unusual for legitimate websites',
        'low': 'Normal use of underscores ({value})',
    },
    'num_slashes': {
        'high': 'The URL has a deep path structure ({value} slashes), suggesting buried or hidden content',
        'low': 'Simple, clean path structure ({value} slashes)',
    },
    'num_query_params': {
        'high': 'The URL has {value} query parameters, which can be used for tracking or data exfiltration',
        'low': 'Minimal query parameters ({value})',
    },
    'num_fragments': {
        'high': 'URL contains fragment identifiers that can be used for redirection',
        'low': 'No suspicious URL fragments detected',
    },
    'num_at_symbols': {
        'high': 'The URL contains {value} @ symbol(s), which can redirect browsers to a different host',
        'low': 'No @ symbols detected in the URL',
    },
    'has_ip_address': {
        'high': 'The URL uses an IP address instead of a domain name, a strong phishing indicator',
        'low': 'The URL uses a proper domain name (not an IP address)',
    },
    'has_https': {
        'high': 'The URL uses HTTPS, indicating a secure connection',
        'low': 'The URL does not use HTTPS, lacking encryption',
    },
    'has_www': {
        'high': 'The URL includes the www prefix, common for established websites',
        'low': 'The URL does not include a www prefix',
    },
    'num_digits_in_domain': {
        'high': 'The domain contains {value} digits, which is suspicious and may indicate a randomly generated domain',
        'low': 'Minimal digits in the domain ({value})',
    },
    'digit_letter_ratio': {
        'high': 'High digit-to-letter ratio ({value:.2f}), suggesting URL obfuscation or encoding',
        'low': 'Normal digit-to-letter ratio ({value:.2f})',
    },
    'url_entropy': {
        'high': 'The URL has high character entropy ({value:.2f}), appearing random or machine-generated',
        'low': 'The URL has low entropy ({value:.2f}), appearing natural and readable',
    },
    'has_suspicious_tld': {
        'high': 'The domain uses a top-level domain commonly associated with abuse and phishing',
        'low': 'The domain uses a reputable top-level domain',
    },
    'num_subdomains': {
        'high': 'The URL has {value} subdomains, which is excessive and often used to disguise the real domain',
        'low': 'Normal subdomain count ({value})',
    },
    'has_shortener': {
        'high': 'The URL uses a URL shortening service, which masks the true destination',
        'low': 'No URL shortener detected — the destination is directly visible',
    },
    'special_char_ratio': {
        'high': 'High ratio of special characters ({value:.2f}), suggesting URL manipulation or encoding',
        'low': 'Normal special character ratio ({value:.2f})',
    },
    'path_entropy': {
        'high': 'The URL path has high randomness ({value:.2f}), suggesting auto-generated or obfuscated content',
        'low': 'The URL path appears natural and structured ({value:.2f})',
    },
    'has_suspicious_keywords': {
        'high': 'The URL contains suspicious keywords commonly used in phishing (e.g., login, verify, secure, account)',
        'low': 'No suspicious keywords detected in the URL',
    },
}

# Thresholds for "high" vs "low" classification
FEATURE_THRESHOLDS = {
    'url_length': 50,
    'domain_length': 20,
    'path_length': 30,
    'num_dots': 3,
    'num_hyphens': 1,
    'num_underscores': 1,
    'num_slashes': 3,
    'num_query_params': 2,
    'num_fragments': 0.5,
    'num_at_symbols': 0.5,
    'has_ip_address': 0.5,
    'has_https': 0.5,  # Reversed: high=good
    'has_www': 0.5,    # Reversed: high=good
    'num_digits_in_domain': 2,
    'digit_letter_ratio': 0.3,
    'url_entropy': 3.5,
    'has_suspicious_tld': 0.5,
    'num_subdomains': 2,
    'has_shortener': 0.5,
    'special_char_ratio': 0.15,
    'path_entropy': 3.0,
    'has_suspicious_keywords': 0.5,
}


def generate_explanations(
    features: Dict[str, float],
    prediction_result: Dict,
) -> List[Dict]:
    """
    Generate SHAP-like explanations for a phishing prediction.
    
    Uses feature importance from trained models combined with feature values
    to produce human-readable explanations ranked by impact.
    
    Args:
        features: Dict of extracted feature values
        prediction_result: Dict from MLPredictor.predict()
    
    Returns:
        List of explanation dicts sorted by absolute impact
    """
    explanations = []
    feature_descriptions = get_feature_descriptions()
    
    # Get feature importances from the primary model (Random Forest)
    importances = predictor.get_feature_importances()
    rf_importances = importances.get('random_forest', {})
    
    # Calculate a pseudo-SHAP value for each feature:
    # shap_value ≈ feature_importance × normalized_feature_deviation
    risk_score = prediction_result['risk_score']
    is_risky = risk_score > 50

    for feature_name in FEATURE_NAMES:
        value = features.get(feature_name, 0)
        importance = rf_importances.get(feature_name, 0.01)
        threshold = FEATURE_THRESHOLDS.get(feature_name, 0)
        
        # Determine if feature value is "high" (above threshold)
        is_high = value > threshold
        
        # Special cases: has_https and has_www are protective (inverse)
        if feature_name in ('has_https', 'has_www'):
            is_high = value < threshold  # Not having HTTPS/www is risky
        
        # Calculate pseudo-SHAP value
        # Positive = increases phishing risk, negative = decreases risk
        deviation = abs(value - threshold) / max(threshold, 1)
        shap_value = importance * deviation
        if not is_high:
            shap_value = -shap_value
        
        # Get human-readable explanation
        templates = FEATURE_IMPACT_TEMPLATES.get(feature_name, {})
        level = 'high' if is_high else 'low'
        template = templates.get(level, f'{feature_name}: {value}')
        
        try:
            description = template.format(value=value)
        except (KeyError, ValueError):
            description = f"{feature_descriptions.get(feature_name, feature_name)}: {value}"
        
        impact = 'increases_risk' if shap_value > 0 else 'decreases_risk'
        
        explanations.append({
            'feature': feature_name,
            'value': round(float(value), 4),
            'shap_value': round(float(shap_value), 4),
            'description': description,
            'impact': impact,
        })
    
    # Sort by absolute SHAP value (most impactful first)
    explanations.sort(key=lambda x: abs(x['shap_value']), reverse=True)
    
    return explanations


def generate_top_reasons(
    explanations: List[Dict],
    verdict: str,
    risk_score: int,
    top_n: int = 5
) -> List[str]:
    """
    Generate top N human-readable reason strings from explanations.
    
    Args:
        explanations: Sorted list from generate_explanations()
        verdict: "Safe", "Suspicious", or "Phishing"
        risk_score: 0-100
        top_n: Number of top reasons to return
    
    Returns:
        List of reason strings
    """
    reasons = []
    
    if verdict == 'Safe':
        # Focus on protective factors
        safe_factors = [e for e in explanations if e['impact'] == 'decreases_risk']
        risk_factors = [e for e in explanations if e['impact'] == 'increases_risk']
        
        for exp in safe_factors[:3]:
            reasons.append(f"✅ {exp['description']}")
        for exp in risk_factors[:2]:
            reasons.append(f"⚠️ Minor concern: {exp['description']}")
    
    elif verdict == 'Suspicious':
        risk_factors = [e for e in explanations if e['impact'] == 'increases_risk']
        safe_factors = [e for e in explanations if e['impact'] == 'decreases_risk']
        
        for exp in risk_factors[:3]:
            reasons.append(f"⚠️ {exp['description']}")
        for exp in safe_factors[:2]:
            reasons.append(f"✅ Positive: {exp['description']}")
    
    else:  # Phishing
        risk_factors = [e for e in explanations if e['impact'] == 'increases_risk']
        
        for exp in risk_factors[:top_n]:
            reasons.append(f"🚨 {exp['description']}")
    
    return reasons[:top_n]
