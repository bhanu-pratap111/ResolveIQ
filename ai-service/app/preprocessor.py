import re
import string

STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'has', 'have',
    'had', 'be', 'been', 'being', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'i', 'me', 'my',
    'we', 'our', 'you', 'your', 'they', 'their', 'it', 'its', 'this',
    'that', 'these', 'those', 'his', 'her',
}


def preprocess_text(text: str) -> str:
    """Lowercase, remove punctuation, remove stopwords, normalize whitespace."""
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', ' url ', text)
    text = re.sub(r'\d+', ' num ', text)
    text = text.translate(str.maketrans(string.punctuation, ' ' * len(string.punctuation)))
    tokens = text.split()
    tokens = [t for t in tokens if t not in STOPWORDS and len(t) > 2]
    return ' '.join(tokens)
