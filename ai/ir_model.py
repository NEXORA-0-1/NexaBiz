from fuzzywuzzy import fuzz, process


vocabulary = ["green", "leaves", "demand", "forecast"]

def fix_spelling(query, words):
    best_match = process.extractOne(query, words)
    if best_match[1] > 80:
        return best_match[0]
    return query

def get_suggestions(query, words):
    matches = process.extract(query, words, limit=5)
    return [m[0] for m in matches if m[1] > 70]

# Test code
print(fix_spelling("leavs", vocabulary))
print(get_suggestions("leavs", vocabulary))