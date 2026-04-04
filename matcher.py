import json

def calculate_vibe_match_score(user1_artists: list[str], user2_artists: list[str]):
    set1, set2 = set(user1_artists), set(user2_artists)
    shared = list(set1.intersection(set2))
    if not set1 and not set2:
        return 0.0
    score = (len(shared) / len(set1.union(set2))) * 100
    return round(score, 2)

def get_most_compatible(target_user_name: str, target_user_artists: list[str], other_users: list[dict]):
    """
    Implements a Hinge-style "Most Compatible" pairing.
    Uses the Stable Matching logic where mutual top choices are paired.
    """
    if not other_users:
        return None

    # Load artists for all users
    all_users = {target_user_name: target_user_artists}
    for u in other_users:
        if isinstance(u['top_artists'], str):
            all_users[u['name']] = json.loads(u['top_artists'])
        else:
            all_users[u['name']] = u['top_artists']
    
    preferences = {}
    
    for u1, artists1 in all_users.items():
        scores = []
        for u2, artists2 in all_users.items():
            if u1 == u2:
                continue
            score = calculate_vibe_match_score(artists1, artists2)
            scores.append((score, u2))
            
        # Sort by score descending
        scores.sort(key=lambda x: x[0], reverse=True)
        preferences[u1] = [x[1] for x in scores if x[0] > 0]
    
    if not preferences.get(target_user_name):
        return None

    # 1. Check for mutually preferred top choice (Stable Match)
    for preferred_person in preferences[target_user_name]:
        their_prefs = preferences.get(preferred_person, [])
        if their_prefs and their_prefs[0] == target_user_name:
            return preferred_person
            
    # 2. Relax constraint: mutual top-3 choice
    for preferred_person in preferences[target_user_name][:3]:
        their_prefs = preferences.get(preferred_person, [])
        if target_user_name in their_prefs[:3]:
            return preferred_person

    # 3. Fallback: highest compatibility
    return preferences[target_user_name][0]