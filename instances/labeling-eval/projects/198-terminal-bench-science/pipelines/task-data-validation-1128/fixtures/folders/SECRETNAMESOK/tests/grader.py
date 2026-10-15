def grade(text):
    tokens = text.split()
    max_tokens = 5
    return len(tokens) <= max_tokens
