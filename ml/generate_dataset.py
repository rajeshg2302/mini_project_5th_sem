"""
PhishGuard Dataset Generator
Generates a synthetic phishing/legitimate URL dataset for training.
Uses realistic URL patterns — no external API dependencies.
"""

import csv
import random
import string
import os
import sys

# Add the backend app to path so we can reuse the feature extractor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from app.services.feature_extractor import extract_features, FEATURE_NAMES


# ─── Legitimate URL Patterns ──────────────────────────────────────────

LEGIT_DOMAINS = [
    'google.com', 'youtube.com', 'facebook.com', 'amazon.com', 'wikipedia.org',
    'twitter.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'netflix.com',
    'microsoft.com', 'apple.com', 'github.com', 'stackoverflow.com', 'medium.com',
    'bbc.com', 'cnn.com', 'nytimes.com', 'theguardian.com', 'reuters.com',
    'spotify.com', 'twitch.tv', 'pinterest.com', 'tumblr.com', 'quora.com',
    'dropbox.com', 'salesforce.com', 'adobe.com', 'oracle.com', 'ibm.com',
    'zoom.us', 'slack.com', 'notion.so', 'figma.com', 'canva.com',
    'shopify.com', 'etsy.com', 'walmart.com', 'target.com', 'bestbuy.com',
    'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org', 'mit.edu',
    'harvard.edu', 'stanford.edu', 'yale.edu', 'oxford.ac.uk', 'cambridge.org',
    'who.int', 'un.org', 'nasa.gov', 'nih.gov', 'cdc.gov',
    'airbnb.com', 'booking.com', 'tripadvisor.com', 'expedia.com', 'kayak.com',
    'paypal.com', 'stripe.com', 'chase.com', 'bankofamerica.com', 'wellsfargo.com',
    'docker.com', 'kubernetes.io', 'gitlab.com', 'bitbucket.org', 'npm.org',
    'python.org', 'rust-lang.org', 'golang.org', 'nodejs.org', 'reactjs.org',
    'angular.io', 'vuejs.org', 'django-project.com', 'flask.palletsprojects.com',
    'aws.amazon.com', 'cloud.google.com', 'azure.microsoft.com',
    'heroku.com', 'digitalocean.com', 'vercel.com', 'netlify.com',
]

LEGIT_PATHS = [
    '', '/', '/about', '/contact', '/blog', '/news', '/products', '/services',
    '/help', '/support', '/faq', '/privacy', '/terms', '/careers',
    '/login', '/signup', '/dashboard', '/settings', '/profile',
    '/articles/technology', '/blog/2024/latest-news', '/products/electronics',
    '/docs/getting-started', '/api/v2/reference', '/community/forum',
    '/search?q=python+tutorial', '/category/science', '/store/checkout',
    '/events/conference-2024', '/resources/whitepaper', '/download',
]


# ─── Phishing URL Patterns ────────────────────────────────────────────

PHISHING_PATTERNS = {
    'ip_based': [
        'http://192.168.1.{rand_ip}/login/verify-account.html',
        'http://10.0.0.{rand_ip}/secure/update-billing.php',
        'http://172.16.{rand_ip}.{rand_ip}/account/confirm-identity',
        'http://203.0.113.{rand_ip}/banking/verify-payment.html',
        'http://198.51.100.{rand_ip}/webmail/login.php',
        'http://192.0.2.{rand_ip}/portal/authenticate.asp',
        'http://45.33.{rand_ip}.{rand_ip}/signin/validate-user',
        'http://185.{rand_ip}.{rand_ip}.{rand_ip}/account-verify/login.html',
    ],
    'subdomain_abuse': [
        'http://login.{brand}.security-update.{sus_tld}',
        'http://www.{brand}.account-verify.{sus_tld}',
        'http://secure.{brand}.com.{rand_domain}.{sus_tld}',
        'http://{brand}.login.confirm.{rand_domain}.{sus_tld}',
        'http://mail.{brand}.secure-access.{rand_domain}.{sus_tld}',
        'http://update.{brand}.billing-portal.{sus_tld}',
        'http://verify.account.{brand}.{rand_domain}.{sus_tld}',
        'http://alert.{brand}.confirm-identity.{sus_tld}',
    ],
    'keyword_stuffing': [
        'http://{rand_domain}.{sus_tld}/login-verify-account-secure-update',
        'http://{rand_domain}.{sus_tld}/confirm-password-reset-billing-alert',
        'http://{rand_domain}.{sus_tld}/secure-signin-validate-credential-update',
        'http://{rand_domain}.{sus_tld}/account-suspended-reactivate-now',
        'http://{rand_domain}.{sus_tld}/urgent-payment-confirm-invoice',
        'http://{rand_domain}.{sus_tld}/wallet-transfer-authenticate-secure',
        'http://{rand_domain}.{sus_tld}/verify-identity-unlock-account-now',
        'http://{rand_domain}.{sus_tld}/password-expire-reset-credential',
    ],
    'typosquatting': [
        'http://g00gle.{sus_tld}/login',
        'http://faceb00k-login.{sus_tld}/verify',
        'http://arnazon.{sus_tld}/signin',
        'http://paypa1-secure.{sus_tld}/account',
        'http://rnicrosoft.{sus_tld}/login/verify',
        'http://netfliix.{sus_tld}/account/update',
        'http://lnstagram.{sus_tld}/verify-account',
        'http://twltter-support.{sus_tld}/help',
        'http://arnazon-prime.{sus_tld}/billing',
        'http://app1e-support.{sus_tld}/id',
        'http://gooogle-security.{sus_tld}/alert',
        'http://chasse-banking.{sus_tld}/login',
    ],
    'long_random_paths': [
        'http://{rand_domain}.{sus_tld}/{rand_path}/{rand_path}/{rand_path}/login.php',
        'http://{rand_domain}.{sus_tld}/{rand_path}/{rand_path}/verify.html?token={rand_hex}',
        'http://{rand_domain}.{sus_tld}/{rand_path}/{rand_path}/secure/{rand_path}/index.php',
        'http://{rand_domain}.{sus_tld}/{rand_path}/account/{rand_path}/{rand_path}/{rand_path}',
        'http://{rand_domain}.{sus_tld}/{rand_path}/{rand_path}/{rand_path}/{rand_path}/signin',
    ],
    'at_symbol': [
        'http://legitimate.com@{rand_domain}.{sus_tld}/login',
        'http://paypal.com@{rand_domain}.{sus_tld}/verify',
        'http://google.com@{rand_domain}.{sus_tld}/secure',
        'http://amazon.com@{rand_domain}.{sus_tld}/account',
        'http://microsoft.com@{rand_domain}.{sus_tld}/signin',
    ],
    'shortener_redirect': [
        'https://bit.ly/{rand_short}',
        'https://tinyurl.com/{rand_short}',
        'https://t.co/{rand_short}',
        'https://is.gd/{rand_short}',
        'https://cutt.ly/{rand_short}',
        'https://rb.gy/{rand_short}',
        'http://ow.ly/{rand_short}',
        'https://v.gd/{rand_short}',
    ],
    'suspicious_tld': [
        'http://{rand_domain}.tk/secure-login',
        'http://{rand_domain}.ml/account-verify',
        'http://{rand_domain}.ga/payment-update',
        'http://{rand_domain}.cf/signin-confirm',
        'http://{rand_domain}.gq/billing-portal',
        'http://{rand_domain}.xyz/secure-banking',
        'http://{rand_domain}.top/verify-identity',
        'http://{rand_domain}.click/update-payment',
        'http://{rand_domain}.buzz/confirm-account',
        'http://{rand_domain}.pw/login-secure',
    ],
}

BRAND_NAMES = [
    'paypal', 'amazon', 'google', 'apple', 'microsoft', 'netflix',
    'facebook', 'instagram', 'chase', 'wellsfargo', 'bankofamerica',
    'linkedin', 'dropbox', 'adobe', 'spotify', 'twitter',
]

SUSPICIOUS_TLDS_LIST = ['tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'click',
                        'link', 'buzz', 'online', 'site', 'club', 'pw', 'cc']


def rand_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

def rand_hex(length=16):
    return ''.join(random.choices(string.hexdigits[:16], k=length))

def rand_short():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(5, 8)))

def rand_ip():
    return str(random.randint(1, 254))

def fill_template(template: str) -> str:
    """Fill URL template with random values."""
    result = template
    while '{rand_domain}' in result:
        result = result.replace('{rand_domain}', rand_string(random.randint(6, 14)), 1)
    while '{rand_path}' in result:
        result = result.replace('{rand_path}', rand_string(random.randint(4, 12)), 1)
    while '{rand_hex}' in result:
        result = result.replace('{rand_hex}', rand_hex(random.randint(16, 32)), 1)
    while '{rand_short}' in result:
        result = result.replace('{rand_short}', rand_short(), 1)
    while '{rand_ip}' in result:
        result = result.replace('{rand_ip}', rand_ip(), 1)
    while '{sus_tld}' in result:
        result = result.replace('{sus_tld}', random.choice(SUSPICIOUS_TLDS_LIST), 1)
    while '{brand}' in result:
        result = result.replace('{brand}', random.choice(BRAND_NAMES), 1)
    return result


def generate_legitimate_urls(count: int) -> list:
    """Generate realistic legitimate URLs."""
    urls = []
    for _ in range(count):
        domain = random.choice(LEGIT_DOMAINS)
        path = random.choice(LEGIT_PATHS)
        scheme = random.choice(['https://', 'https://', 'https://', 'http://'])  # 75% HTTPS
        www = random.choice(['www.', '', '', ''])  # 25% www
        url = f"{scheme}{www}{domain}{path}"
        urls.append(url)
    return urls


def generate_phishing_urls(count: int) -> list:
    """Generate realistic phishing URLs using templates."""
    urls = []
    categories = list(PHISHING_PATTERNS.keys())
    per_category = count // len(categories)
    remainder = count % len(categories)

    for i, category in enumerate(categories):
        templates = PHISHING_PATTERNS[category]
        n = per_category + (1 if i < remainder else 0)
        for _ in range(n):
            template = random.choice(templates)
            url = fill_template(template)
            urls.append(url)
    return urls


def generate_dataset(legit_count: int = 600, phishing_count: int = 600, output_path: str = None):
    """Generate the full dataset CSV with extracted features."""
    if output_path is None:
        output_path = os.path.join(os.path.dirname(__file__), 'data', 'phishing_dataset.csv')

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    print(f"Generating {legit_count} legitimate URLs...")
    legit_urls = generate_legitimate_urls(legit_count)

    print(f"Generating {phishing_count} phishing URLs...")
    phishing_urls = generate_phishing_urls(phishing_count)

    # Extract features and build dataset
    rows = []

    for url in legit_urls:
        features = extract_features(url)
        features['url'] = url
        features['label'] = 0  # Legitimate
        rows.append(features)

    for url in phishing_urls:
        features = extract_features(url)
        features['url'] = url
        features['label'] = 1  # Phishing
        rows.append(features)

    # Shuffle the dataset
    random.shuffle(rows)

    # Write CSV
    fieldnames = ['url'] + FEATURE_NAMES + ['label']
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nDataset generated successfully!")
    print(f"  Total samples: {len(rows)}")
    print(f"  Legitimate: {legit_count}")
    print(f"  Phishing: {phishing_count}")
    print(f"  Features: {len(FEATURE_NAMES)}")
    print(f"  Saved to: {output_path}")

    return output_path


if __name__ == '__main__':
    generate_dataset()
