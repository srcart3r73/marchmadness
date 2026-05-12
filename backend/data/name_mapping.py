import re
from thefuzz import process

# Direct overrides: Kaggle/CBB name → canonical CBBD team name
KAGGLE_TO_CBBD: dict[str, str] = {
    "IUPUI": "IU Indianapolis",
    "IL Chicago": "UIC",
    "SUNY Albany": "Albany",
    "Connecticut": "UConn",
    "American Univ": "American",
    "LIU Brooklyn": "LIU",
    "MTSU": "Middle Tennessee",
    "PFW": "Purdue Fort Wayne",
    "Dixie St": "Utah Tech",
    "Missouri KC": "Kansas City",
    "Col Charleston": "Charleston",
    "TAM C. Christi": "Texas A&M-Corpus Christi",
    "SF Austin": "Stephen F. Austin",
    "FL Atlantic": "Florida Atlantic",
    "FGCU": "Florida Gulf Coast",
    "UTRGV": "UT Rio Grande Valley",
    "ETSU": "East Tennessee State",
    "WI Green Bay": "Green Bay",
    "WI Milwaukee": "Milwaukee",
    "CS Sacramento": "Sacramento State",
    "MD E Shore": "Maryland Eastern Shore",
    "Ark Little Rock": "Little Rock",
    "Ark Pine Bluff": "Arkansas-Pine Bluff",
    "WKU": "Western Kentucky",
    "TX Southern": "Texas Southern",
    "Birmingham So": "Birmingham Southern",
    "Coastal Car": "Coastal Carolina",
    "ULM": "Louisiana Monroe",
    "SIUE": "SIU Edwardsville",
    "Saint Joseph's": "St. Joseph's",
    "FIU": "Florida International",
    "Miami": "Miami (FL)",
    "St. Thomas-Minnesota": "St. Thomas",
    "Loyola Chicago": "Loyola Chicago",
    "NC State": "North Carolina State",
}


def clean_team_name(name: str) -> str:
    """Pre-clean a raw team name before fuzzy matching."""
    if name in KAGGLE_TO_CBBD:
        return KAGGLE_TO_CBBD[name]

    name = re.sub(r"^C ", "Central ", name)
    name = re.sub(r"^Cent ", "Central ", name)
    name = re.sub(r"^E ", "Eastern ", name)
    name = re.sub(r"^W ", "Western ", name)

    if name.startswith("N Dakota") or name.startswith("N Carolina"):
        name = re.sub(r"^N ", "North ", name)
    else:
        name = re.sub(r"^N ", "Northern ", name)

    if name.startswith("S Dakota") or name.startswith("S Carolina"):
        name = re.sub(r"^S ", "South ", name)
    else:
        name = re.sub(r"^S ", "Southern ", name)

    name = re.sub(r"^CS ", "Cal State ", name)
    name = re.sub(r" St$", " State", name)

    return name


def fuzzy_match(name: str, candidates: list[str], threshold: int = 85) -> str:
    """Return the best fuzzy match from candidates, or the original name if below threshold."""
    result = process.extractOne(name, candidates)
    if result and result[1] >= threshold:
        return result[0]
    return name


def normalize_team_name(name: str, cbbd_teams: list[str]) -> str:
    """Full pipeline: direct override → clean → fuzzy match against known CBBD names."""
    cleaned = clean_team_name(name)
    return fuzzy_match(cleaned, cbbd_teams)
