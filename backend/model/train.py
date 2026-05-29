from pathlib import Path
import pandas as pd
import numpy as np
import cbbd
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import accuracy_score, log_loss
import xgboost as xgb
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import accuracy_score
import polars as pl
import json
import random
from collections import defaultdict

configuration = cbbd.Configuration(host = "https://api.collegebasketballdata.com")
configuration = cbbd.Configuration(access_token='NLRzHQi5WZagyvnplIeHvmrevQPraFS1A2s8+sZJlq4qKXwGEP73+/6fu+PDCXxI')
api_client = cbbd.ApiClient(configuration)
teams_api = cbbd.TeamsApi(api_client)
    
df = pl.scan_parquet(Path(__file__).parent.parent / "data" / "ncaa_master_data.parquet").collect().to_pandas()


# 1. Isolate the Historical Data (Lock away the 2026 Holdout!)
df_historical = df[~((df['season'] == 2026) & (df['tournament'] == 'NCAA'))].copy()

# Train on Regular Season & Conference Tourneys
train_df = df_historical[df_historical['tournament'] != 'NCAA']
# Test on Historical March Madness (2019-2025)
test_df = df_historical[df_historical['tournament'] == 'NCAA']

# Clean Features (Dropping identifiers and the 'seed' trap)
cols_to_drop = [
    'game_id', 'start_date', 'season_type', 'tournament', 
    'home_conference', 'away_conference', 'home_team_id', 'away_team_id', 'home_win',
    'home_seed', 'away_seed', 'neutral_site', "conference_game"
]

X_train_full = train_df.drop(columns=cols_to_drop, errors='ignore')
y_train = train_df['home_win']

X_test_full = test_df.drop(columns=cols_to_drop, errors='ignore')
y_test = test_df['home_win']

print("\n--- STAGE 1: FEATURE PRUNING ---")
# Train a base model just to see what stats actually matter
scout_model = xgb.XGBClassifier(random_state=42, eval_metric='logloss')
scout_model.fit(X_train_full, y_train)

# Extract and rank the features
importances = pd.Series(scout_model.feature_importances_, index=X_train_full.columns)
top_10_features = importances.sort_values(ascending=False).head(10).index.tolist()

print("\nTop 10 Most Important Stats:")
for i, stat in enumerate(top_10_features, 1):
    print(f"{i}. {stat} ({importances[stat]:.4f})")

# Prune the datasets to ONLY include the Top 10 stats
X_train_pruned = X_train_full[top_10_features]
X_test_pruned = X_test_full[top_10_features]

# Scale the pruned data
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_pruned)
X_test_scaled = scaler.transform(X_test_pruned)

print("\n--- STAGE 2: HYPERPARAMETER TUNING ---")
print("Testing dozens of dial combinations. This may take a minute or two...")

# Define the "Grid" of dials we want to test for XGBoost
xgb_param_grid = {
    'max_depth': [3, 4, 5],            # How deep the decision trees can grow
    'learning_rate': [0.01, 0.05, 0.1], # How aggressively the model corrects errors
    'n_estimators': [100, 200, 300]     # Total number of trees in the forest
}

# Run the Grid Search (cv=3 means it cross-validates 3 times to prevent overfitting)
xgb_grid = GridSearchCV(
    estimator=xgb.XGBClassifier(random_state=42, eval_metric='logloss'),
    param_grid=xgb_param_grid,
    scoring='accuracy',
    cv=3,
    n_jobs=-1 # Uses all available CPU cores to run faster!
)

xgb_grid.fit(X_train_scaled, y_train)

# Grab the absolute best version of the model
best_xgb = xgb_grid.best_estimator_

# Test the optimized model on the historical March Madness games
y_pred_xgb = best_xgb.predict(X_test_scaled)
final_accuracy = accuracy_score(y_test, y_pred_xgb)

print("\n========================================")
print("        FINAL OPTIMIZED RESULTS         ")
print("========================================")
print(f"Best Dials Found: {xgb_grid.best_params_}")
print(f"New XGBoost Accuracy: {final_accuracy * 100:.2f}%")
print("========================================")


# 1. Lock away the 2026 NCAA Tournament (Our Ultimate Presentation Data)
df_historical = df[~((df['season'] == 2026) & (df['tournament'] == 'NCAA'))].copy()

# 2. Define Train vs. Test
# Train on Regular Season & Conference Tourneys
train_df = df_historical[df_historical['tournament'] != 'NCAA']
# Test on Historical March Madness (2019-2025)
test_df = df_historical[df_historical['tournament'] == 'NCAA']

print(f"Training on {len(train_df)} historical games...")
print(f"Testing on {len(test_df)} historical March Madness games...\n")

# 3. Clean Features
# Drop identifiers, strings, target variable, AND the postseason-only flags
cols_to_drop = [
    'game_id', 'start_date', 'season_type', 'tournament', 
    'home_conference', 'away_conference', 'home_team_id', 'away_team_id', 'home_win',
    'home_seed', 'away_seed', 'neutral_site'
]

X_train = train_df.drop(columns=cols_to_drop, errors='ignore')
y_train = train_df['home_win']

X_test = test_df.drop(columns=cols_to_drop, errors='ignore')
y_test = test_df['home_win']

# 4. Scale the Data (Crucial for Logistic Regression!)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 5. Define the Models
log_clf = LogisticRegression(max_iter=2000, random_state=42)
rf_clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
xgb_clf = xgb.XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.05, random_state=42, eval_metric='logloss')

# The "3-Part System" (Soft voting means it averages their probability percentages, not just their final answer)
voting_clf = VotingClassifier(
    estimators=[('lr', log_clf), ('rf', rf_clf), ('xgb', xgb_clf)],
    voting='soft'
)

models = {
    "Logistic Regression": log_clf,
    "Random Forest": rf_clf,
    "XGBoost": xgb_clf,
    "Ensemble (3-Part System)": voting_clf
}

# 6. The Bake-Off
results = []

print("========================================")
print("        MODEL BAKE-OFF RESULTS          ")
print("========================================\n")

for name, model in models.items():
    # Train
    model.fit(X_train_scaled, y_train)
    
    # Predict
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    results.append({'Model': name, 'Accuracy': acc})
    
    print(f"{name}: {acc * 100:.2f}% Accuracy on March Madness")

print("\n========================================")

# 1. Feature Engineering: Create the Seed Differential
df['seed_diff'] = df['home_seed'] - df['away_seed']

# Lock away the 2026 Holdout Set!
df_historical = df[~((df['season'] == 2026) & (df['tournament'] == 'NCAA'))].copy()

# Split the data into Regular Season (Coach A) and Tournament (Coach B)
# Note: We use games where seeds are 0 for Coach A, and games with actual seeds for Coach B
train_reg_season = df_historical[df_historical['tournament'] != 'NCAA'].copy()
train_tournament = df_historical[df_historical['tournament'] == 'NCAA'].copy()

# The Top 10 Pure Stats we found in the pruning stage
top_10_features = [
    'diff_rolling_off_net_rating', 'diff_rolling_def_3pt_pct', 'diff_rolling_def_ast',
    'diff_rolling_def_efg', 'diff_rolling_def_ft_pct', 'diff_rolling_def_tov_pct',
    'diff_rolling_def_true_shooting', 'diff_rolling_off_blk', 'diff_rolling_def_fg_pct',
    'diff_rolling_off_ast'
]

print(f"Coach A training on {len(train_reg_season)} regular season games...")
print(f"Coach B training on {len(train_tournament)} tournament games...\n")

# ==========================================
# STAGE 1: COACH A (The Basketball Purist)
# ==========================================
X_reg = train_reg_season[top_10_features]
y_reg = train_reg_season['home_win']

# Scale the stats
scaler = StandardScaler()
X_reg_scaled = scaler.fit_transform(X_reg)

# Train Coach A (XGBoost tuned to our best dials)
coach_a = xgb.XGBClassifier(learning_rate=0.05, max_depth=3, n_estimators=100, random_state=42, eval_metric='logloss')
coach_a.fit(X_reg_scaled, y_reg)

# ==========================================
# STAGE 2: THE DEBATE PREP
# ==========================================
# Have Coach A predict the *probability* of the home team winning for all historical tournament games
X_tourney_stats = train_tournament[top_10_features]
X_tourney_scaled = scaler.transform(X_tourney_stats)

# This adds Coach A's opinion as a brand new column!
train_tournament['coach_a_prob'] = coach_a.predict_proba(X_tourney_scaled)[:, 1]

# ==========================================
# STAGE 3: COACH B (The Tournament Specialist)
# ==========================================
# Coach B only looks at three things: Coach A's opinion, the Seed Difference, and the Net Rating Difference
meta_features = ['coach_a_prob', 'seed_diff']

X_meta = train_tournament[meta_features]
y_meta = train_tournament['home_win']

# We use Logistic Regression for Coach B (just like the Kaggle script blend) because it is perfect for weighing 3 simple inputs
coach_b = LogisticRegression(C=1.0, solver='lbfgs', random_state=42)

# We use Cross-Validation to test Coach B so it doesn't just memorize the 289 games
from sklearn.model_selection import cross_val_score
meta_accuracy = cross_val_score(coach_b, X_meta, y_meta, cv=5, scoring='accuracy').mean()

print("========================================")
print("     THE DEBATE MODEL RESULTS           ")
print("========================================")
print(f"Stacked Model Accuracy: {meta_accuracy * 100:.2f}%")
print("========================================")

coach_b.fit(X_meta, y_meta)
print("\n========================================")
print("     COACH B: UNDER THE HOOD            ")
print("========================================")
for feature, weight in zip(meta_features, coach_b.coef_[0]):
    print(f"{feature}: {weight:.4f}")
print("========================================\n")
# ---------------------------------------

# 1. Isolate the 2026 Holdout Set
tourney_2026 = df[(df['season'] == 2026) & (df['tournament'] == 'NCAA')].copy()

if len(tourney_2026) == 0:
    print("Error: No 2026 tournament games found. Check your API pull!")
else:
    print(f"Found {len(tourney_2026)} games in the 2026 NCAA Tournament bracket.")

    # 2. Calculate Seed Difference for 2026
    tourney_2026['seed_diff'] = tourney_2026['home_seed'] - tourney_2026['away_seed']

    # 3. Coach A evaluates the pure basketball stats
    X_2026_pure = tourney_2026[top_10_features]
    X_2026_scaled = scaler.transform(X_2026_pure)
    
    # Coach A's probability
    tourney_2026['coach_a_prob'] = coach_a.predict_proba(X_2026_scaled)[:, 1]

    # 4. Coach B makes the final tournament prediction
    X_2026_meta = tourney_2026[meta_features]
    
    tourney_2026['predicted_win'] = coach_b.predict(X_2026_meta)
    tourney_2026['predicted_win_prob'] = coach_b.predict_proba(X_2026_meta)[:, 1]

    # 5. Grade the final presentation results!
    final_accuracy = accuracy_score(tourney_2026['home_win'], tourney_2026['predicted_win'])
    
    print("\n========================================")
    print("     OFFICIAL 2026 BRACKET SCORE        ")
    print("========================================")
    print(f"Final Accuracy: {final_accuracy * 100:.2f}%\n")
    
    # Let's peek at the first few predictions to see the model's confidence

    print("2026 Predictions (Home vs Away):")
    tourney_predictions_view = tourney_2026[['start_date', 'home_team_id', 'away_team_id', 'home_seed', 'away_seed', 'predicted_win_prob', 'predicted_win', 'home_win']]
    print(tourney_predictions_view.to_string(index=False))

    print("Fetching team names from API...")
    # 2. Call the API
    teams_info = teams_api.get_teams()

    # 2. Extract the IDs and Names into a clean dictionary list
    team_data = []
    for team in teams_info:
        # We will use 'school' or 'display_name' based on your schema
        team_data.append({
            'team_id': team.id,
            'team_name': team.display_name, # You can change this to team.school if you prefer!
            'mascot': team.mascot
        })

    # 3. Convert to a Pandas DataFrame
    teams_df = pd.DataFrame(team_data)

    # 4. Merge the Team Names into your 2026 predictions
    # First, map the Home Teams
    readable_2026 = tourney_2026.merge(
        teams_df, 
        left_on='home_team_id', 
        right_on='team_id', 
        how='left'
    ).rename(columns={'team_name': 'Home_Team', 'mascot': 'Home_Mascot'})

    # Second, map the Away Teams
    readable_2026 = readable_2026.merge(
        teams_df, 
        left_on='away_team_id', 
        right_on='team_id', 
        how='left'
    ).rename(columns={'team_name': 'Away_Team', 'mascot': 'Away_Mascot'})

    # 5. Create a clean, readable presentation table
    def get_predicted_winner(row):
        return row['Home_Team'] if row['predicted_win'] == 1 else row['Away_Team']

    def get_actual_winner(row):
        return row['Home_Team'] if row['home_win'] == 1 else row['Away_Team']

    readable_2026['Model_Pick'] = readable_2026.apply(get_predicted_winner, axis=1)
    readable_2026['Actual_Winner'] = readable_2026.apply(get_actual_winner, axis=1)

    # Format the probability to look like a percentage
    readable_2026['Confidence'] = (readable_2026['predicted_win_prob'] * 100).round(1).astype(str) + '%'

    # 6. Print the beautiful final bracket!
    final_display = readable_2026[[
        'home_seed', 'Home_Team', 
        'away_seed', 'Away_Team', 
        'Confidence', 'Model_Pick', 'Actual_Winner'
    ]]

    print("\n=========================================================================")
    print("             THE OFFICIAL 2026 MARCH MADNESS TRANSLATION                 ")
    print("=========================================================================\n")
    print(final_display.to_string(index=False))

    # print("\n=========================================================================")
    # print("             🤖 INITIATING TRUE XGBOOST MONTE CARLO (10,000 RUNS)       ")
    # print("=========================================================================\n")

    # # 1. Load your hardcoded frontend teams as the master checklist
    # with open('frontend/src/react_teams.json', 'r') as f:
    #     react_teams_list = json.load(f)

    # # 2. Map frontend names to your true Coach B pre-calculated probabilities
    # # This bypasses the X - X = 0 feature flattening bug entirely
    # name_to_prob = {}
    # for index, row in readable_2026.iterrows():
    #     h_name = str(row['Home_Team']).lower().strip()
    #     a_name = str(row['Away_Team']).lower().strip()
    #     prob = float(row['predicted_win_prob'])
        
    #     # Store directional probabilities for both home and away outcomes
    #     name_to_prob[(h_name, a_name)] = prob
    #     name_to_prob[(a_name, h_name)] = 1.0 - prob

    # # 3. Build the starting bracket using your model's real table values
    # starting_bracket = []
    # matched_count = 0

    # regions_data = defaultdict(list)
    # for team in react_teams_list:
    #     regions_data[team['region']].append(team)

    # TOPOLOGY = [
    #     [1, 16], [8, 9], [5, 12], [4, 13], 
    #     [6, 11], [3, 14], [7, 10], [2, 15]
    # ]

    # for region, teams_in_region in regions_data.items():
    #     for seed1, seed2 in TOPOLOGY:
    #         team1 = next(t for t in teams_in_region if t['seed'] == seed1)
    #         team2 = next(t for t in teams_in_region if t['seed'] == seed2)
            
    #         n1 = team1['name'].lower().strip()
    #         n2 = team2['name'].lower().strip()
            
    #         # Extract Coach B's exact, non-zero prediction from your printed dataframe
    #         t1_prob = name_to_prob.get((n1, n2))
            
    #         if t1_prob is None:
    #             # Safe backup baseline calculation if name typography differs slightly
    #             t1_power = 2000 - (team1['seed'] * 30)
    #             t2_power = 2000 - (team2['seed'] * 30)
    #             t1_prob = 1 / (1 + 10 ** ((t2_power - t1_power) / 400))
    #         else:
    #             matched_count += 1
                
    #         starting_bracket.append({"id": team1['id'], "seed": team1['seed'], "r1_prob": t1_prob})
    #         starting_bracket.append({"id": team2['id'], "seed": team2['seed'], "r1_prob": 1.0 - t1_prob})

    # print(f"🎯 Successfully linked {matched_count} teams directly to your 74.6% accurate Coach B predictions!")

    # # 4. The Matchup Engine
    # def simulate_matchup(team1, team2, is_round_1):
    #     if is_round_1:
    #         # Uses your model's true head-to-head prediction
    #         return team1 if random.random() < team1['r1_prob'] else team2
    #     else:
    #         # Subsequent rounds use standard structural seed logic to determine advancement
    #         t1_power = 2000 - (team1['seed'] * 30)
    #         t2_power = 2000 - (team2['seed'] * 30)
    #         prob_t1_wins = 1 / (1 + 10 ** ((t2_power - t1_power) / 400))
    #         return team1 if random.random() < prob_t1_wins else team2

    # # 5. Run the 10,000 Simulations
    # NUM_SIMULATIONS = 10000
    # results_tracker = defaultdict(lambda: {'r32': 0, 's16': 0, 'e8': 0, 'f4': 0, 'f2': 0, 'champ': 0})
    # rounds = ['r32', 's16', 'e8', 'f4', 'f2', 'champ']

    # for sim in range(NUM_SIMULATIONS):
    #     current_round_teams = starting_bracket.copy()
        
    #     for round_name in rounds:
    #         next_round_teams = []
    #         is_r1 = (round_name == 'r32')
            
    #         for i in range(0, len(current_round_teams), 2):
    #             team1 = current_round_teams[i]
    #             team2 = current_round_teams[i+1]
                
    #             winner = simulate_matchup(team1, team2, is_round_1=is_r1)
    #             next_round_teams.append(winner)
    #             results_tracker[winner['id']][round_name] += 1
                
    #         current_round_teams = next_round_teams

    # # 6. Export clean probabilities to JSON
    # team_probs_json = {}
    # for team in react_teams_list:
    #     team_id = team['id']
    #     advances = results_tracker[team_id]
    #     r64_direct_prob = next(t['r1_prob'] for t in starting_bracket if t['id'] == team_id)
        
    #     team_probs_json[team_id] = {
    #         "r64": r64_direct_prob, 
    #         "r32": advances['r32'] / NUM_SIMULATIONS,
    #         "s16": advances['s16'] / NUM_SIMULATIONS,
    #         "e8": advances['e8'] / NUM_SIMULATIONS,
    #         "f4": advances['f4'] / NUM_SIMULATIONS,
    #         "f2": advances['f2'] / NUM_SIMULATIONS,
    #         "champ": advances['champ'] / NUM_SIMULATIONS,
    #     }

    # with open('react_team_probs.json', 'w') as f:
    #     json.dump(team_probs_json, f, indent=4)

    # print("🎉 ALL TRUE MATHEMATICAL ODDS GENERATED SUCCESSFULLY! Refresh your React app.")


    # ─────────────────────────────────────────────────────────────────────────────
    # Build team stat lookup from raw rolling averages (pre-differencing)
    # Pull each team's rolling stats as of their LAST game before the 2026 tournament
    # This is the 12-game rolling average your model was already computing
    # ─────────────────────────────────────────────────────────────────────────────

    # These are the underlying per-team stat columns (before the diff_ prefix was added)
    # e.g. diff_rolling_off_net_rating came from rolling_off_net_rating home - away
    # raw_stat_cols = [
    #     'rolling_off_net_rating', 'rolling_def_3pt_pct', 'rolling_def_ast',
    #     'rolling_def_efg', 'rolling_def_ft_pct', 'rolling_def_tov_pct',
    #     'rolling_def_true_shooting', 'rolling_off_blk', 'rolling_def_fg_pct',
    #     'rolling_off_ast'
    # ]
    # Maps to your top_10_features:
    # diff_rolling_X  <-->  rolling_X (home) - rolling_X (away)

    rolling_stats_2026 = pl.read_parquet(
        Path(__file__).parent.parent / "data" / "team_rolling_stats_2026.parquet"
    ).to_pandas()

    # THE FIX: Force the team_id column to be strict integers to prevent float/numpy mismatches
    rolling_stats_2026['team_id'] = rolling_stats_2026['team_id'].fillna(0).astype(int)

    raw_stat_cols = [col for col in rolling_stats_2026.columns if col.startswith("rolling_")]

    # Seed lookup from actual 2026 tournament data (Forced strict integers)
    seed_lookup = {}
    for _, row in tourney_2026.iterrows():
        seed_lookup[int(row['home_team_id'])] = int(row['home_seed'])
        seed_lookup[int(row['away_team_id'])] = int(row['away_seed'])

    # Only keep teams that actually made the 2026 tournament
    tournament_team_ids = set(seed_lookup.keys())
    rolling_stats_2026 = rolling_stats_2026[
        rolling_stats_2026['team_id'].isin(tournament_team_ids)
    ]

    # Build the lookup dict with STRICT INTEGER CASTING
    team_stat_lookup = {}
    for _, row in rolling_stats_2026.iterrows():
        tid = int(row['team_id'])
        
        # Safely extract volatility (if a team played too few games to have a std dev, default to 12.0)
        raw_volatility = row.get('rolling_std_off_net_rating', 12.0)
        team_volatility = float(raw_volatility) if not pd.isna(raw_volatility) else 12.0

        team_stat_lookup[tid] = {
            'seed': seed_lookup.get(tid, 8),
            'volatility': team_volatility, # <--- STORE THE TEAM'S EXACT VARIANCE
            'stats': {col: float(row[col]) for col in raw_stat_cols if col != 'rolling_std_off_net_rating'}
        }

    print(f"✅ Built stat lookup for {len(team_stat_lookup)} / {len(tournament_team_ids)} tournament teams")

    missing = tournament_team_ids - set(team_stat_lookup.keys())
    if missing:
        print(f"⚠️  {len(missing)} teams missing pre-tournament rolling stats: {missing}")

    # rolling_stats_2026 = pl.read_parquet(
    # Path(__file__).parent.parent / "data" / "team_rolling_stats_2026.parquet"
    # ).to_pandas()

    # # The raw per-team column names (strip the rolling_ prefix mapping)
    # # rolling_off_net_rating → used to build diff_rolling_off_net_rating
    # raw_stat_cols = [col for col in rolling_stats_2026.columns if col.startswith("rolling_")]

    # # Seed lookup from actual 2026 tournament data
    # seed_lookup = {}
    # for _, row in tourney_2026.iterrows():
    #     seed_lookup[row['home_team_id']] = int(row['home_seed'])
    #     seed_lookup[row['away_team_id']] = int(row['away_seed'])

    # # Only keep teams that actually made the 2026 tournament
    # tournament_team_ids = set(seed_lookup.keys())
    # rolling_stats_2026 = rolling_stats_2026[
    #     rolling_stats_2026['team_id'].isin(tournament_team_ids)
    # ]

    # # Build the lookup dict: team_id → {seed, raw rolling stats}
    # team_stat_lookup = {}
    # for _, row in rolling_stats_2026.iterrows():
    #     tid = row['team_id']
    #     team_stat_lookup[tid] = {
    #         'seed': seed_lookup.get(tid, 8),
    #         'stats': {col: row[col] for col in raw_stat_cols}
    #     }

    # print(f"✅ Built stat lookup for {len(team_stat_lookup)} / {len(tournament_team_ids)} tournament teams")

    # missing = tournament_team_ids - set(team_stat_lookup.keys())
    # if missing:
    #     print(f"⚠️  {len(missing)} teams missing pre-tournament rolling stats: {missing}")
        
    # name_to_int = {}
    # for _, row in readable_2026.iterrows():
    #     name_to_int[row['Home_Team'].lower().replace(".", "").replace("'", "").strip()] = row['home_team_id']
    #     name_to_int[row['Away_Team'].lower().replace(".", "").replace("'", "").strip()] = row['away_team_id']

    # with open('frontend/src/react_teams.json', 'r') as f:
    #     react_teams_list = json.load(f)

    # # ── STEP 2: Real model matchup function (BULLETPROOF EDITION) ────────────
    # import difflib

    # # 1. Use the massive `teams_df` (which has all Division 1 teams) instead of the smaller dataframe
    # master_api_dict = {}
    # for _, row in teams_df.iterrows():
    #     clean_name = str(row['team_name']).lower().strip().replace(" ", "_")
    #     master_api_dict[clean_name] = int(row['team_id']) # Force strict Python integer

    # # 2. Map the React string IDs with AI Fuzzy Matching to guarantee a link
    # react_id_to_int = {}
    # for team in react_teams_list:
    #     react_str = team['id']
        
    #     # Try exact match first
    #     if react_str in master_api_dict:
    #         react_id_to_int[react_str] = master_api_dict[react_str]
    #     else:
    #         # Fuzzy Fallback: If punctuation is slightly off, find the closest spelling!
    #         matches = difflib.get_close_matches(react_str, master_api_dict.keys(), n=1, cutoff=0.6)
    #         if matches:
    #             react_id_to_int[react_str] = master_api_dict[matches[0]]
    #         else:
    #             print(f"❌ CRITICAL: Absolutely no match found for '{react_str}' in API.")

    # def predict_win_prob(t1_int, t2_int):
    #     """Runs the full Coach A → Coach B pipeline for any hypothetical matchup using Int IDs."""
    #     t1 = team_stat_lookup[t1_int]
    #     t2 = team_stat_lookup[t2_int]

    #     # Reconstruct diff features exactly as your training data was built, forcing floats for safety
    #     diff_row = {
    #         f"diff_{col}": float(t1['stats'][col]) - float(t2['stats'][col])
    #         for col in raw_stat_cols
    #     }

    #     seed_diff = t1['seed'] - t2['seed']

    #     # Coach A: pure basketball stats
    #     X_pure = pd.DataFrame([diff_row])[top_10_features]
    #     X_pure_scaled = scaler.transform(X_pure)
    #     coach_a_prob = coach_a.predict_proba(X_pure_scaled)[0, 1]

    #     # Coach B: meta features
    #     meta_row = pd.DataFrame([{
    #         'coach_a_prob': coach_a_prob,
    #         'seed_diff': seed_diff,
    #         'diff_rolling_off_net_rating': diff_row['diff_rolling_off_net_rating']
    #     }])
    #     return float(coach_b.predict_proba(meta_row)[0, 1])

    # def seed_based_prob(seed1, seed2):
    #     p1 = 2000 - (seed1 * 30)
    #     p2 = 2000 - (seed2 * 30)
    #     return 1 / (1 + 10 ** ((p2 - p1) / 400))

    # def get_win_prob(react_id1, react_id2):
    #     int1 = react_id_to_int.get(react_id1)
    #     int2 = react_id_to_int.get(react_id2)
        
    #     # Diagnostic 1: Did the string translation fail?
    #     if not int1 or not int2:
    #         print(f"⚠️ Mismatch [String Translation Failed]: '{react_id1}'({int1}) vs '{react_id2}'({int2})")
    #         s1 = seed_lookup.get(int1, 8) if int1 else 8
    #         s2 = seed_lookup.get(int2, 8) if int2 else 8
    #         return seed_based_prob(s1, s2)
            
    #     # Force strict integer casting to prevent numpy.int64 hashing clashes
    #     int1 = int(int1)
    #     int2 = int(int2)
            
    #     # Diagnostic 2: Did the Parquet file drop their rolling stats?
    #     if int1 not in team_stat_lookup or int2 not in team_stat_lookup:
    #         print(f"⚠️ Mismatch [Stats Missing from Parquet]: ID {int1} or {int2} lacks rolling data.")
    #         return seed_based_prob(seed_lookup.get(int1, 8), seed_lookup.get(int2, 8))

    #     # If both pass, run the true machine learning model!
    #     return predict_win_prob(int1, int2)
    # # ── STEP 2: Build Functions + Use TeamID Lookup ───────────────────────
    # # THE FIX: Perfect 1:1 mapping by mimicking the exact React IDs (spaces to underscores)
    # react_id_to_int = {}
    # for _, row in readable_2026.iterrows():
    #     # Formats "Duke Blue Devils" into "duke_blue_devils"
    #     h_id_string = str(row['Home_Team']).lower().strip().replace(" ", "_")
    #     react_id_to_int[h_id_string] = row['home_team_id']
        
    #     # Formats "St. John's Red Storm" into "st._john's_red_storm"
    #     a_id_string = str(row['Away_Team']).lower().strip().replace(" ", "_")
    #     react_id_to_int[a_id_string] = row['away_team_id']

    # def predict_win_prob(t1_int, t2_int):
    #     """Runs the full Coach A → Coach B pipeline for any hypothetical matchup using Int IDs."""
    #     t1 = team_stat_lookup[t1_int]
    #     t2 = team_stat_lookup[t2_int]

    #     # Reconstruct diff features exactly as your training data was built
    #     diff_row = {
    #         f"diff_{col}": t1['stats'][col] - t2['stats'][col]
    #         for col in raw_stat_cols
    #     }

    #     seed_diff = t1['seed'] - t2['seed']

    #     # Coach A: pure basketball stats
    #     X_pure = pd.DataFrame([diff_row])[top_10_features]
    #     X_pure_scaled = scaler.transform(X_pure)
    #     coach_a_prob = coach_a.predict_proba(X_pure_scaled)[0, 1]

    #     # Coach B: meta features
    #     meta_row = pd.DataFrame([{
    #         'coach_a_prob': coach_a_prob,
    #         'seed_diff': seed_diff,
    #         'diff_rolling_off_net_rating': diff_row['diff_rolling_off_net_rating']
    #     }])
    #     return float(coach_b.predict_proba(meta_row)[0, 1])

    # def seed_based_prob(seed1, seed2):
    #     p1 = 2000 - (seed1 * 30)
    #     p2 = 2000 - (seed2 * 30)
    #     return 1 / (1 + 10 ** ((p2 - p1) / 400))

    # def get_win_prob(react_id1, react_id2):
    #     # Translate React strings to Database integers
    #     int1 = react_id_to_int.get(react_id1)
    #     int2 = react_id_to_int.get(react_id2)
        
    #     if int1 and int2 and int1 in team_stat_lookup and int2 in team_stat_lookup:
    #         return predict_win_prob(int1, int2)
    #     else:
    #         # This should now remain completely silent!
    #         print(f"⚠️ Warning: ID Mismatch Fallback triggered for {react_id1} vs {react_id2}")
    #         s1 = seed_lookup.get(int1, 8) if int1 else 8
    #         s2 = seed_lookup.get(int2, 8) if int2 else 8
    #         return seed_based_prob(s1, s2)

    # ─────────────────────────────────────────────────────────────────────────────
    # Build team stat lookup from raw rolling averages (pre-differencing)
    # ─────────────────────────────────────────────────────────────────────────────

    teams_info = teams_api.get_teams()


    print("\nLoading Parquet Stats for Monte Carlo...")
    
    # 1. Load the Parquet file
    rolling_stats_2026 = pl.read_parquet(
        Path(__file__).parent.parent / "data" / "team_rolling_stats_2026.parquet"
    ).to_pandas()

    # Force the team_id column to be strict integers to prevent crashes
    rolling_stats_2026['team_id'] = rolling_stats_2026['team_id'].fillna(0).astype(int)

    # Grab the pure stat columns (ignoring the new standard deviation column for the raw stats math)
    raw_stat_cols = [
        col for col in rolling_stats_2026.columns 
        if col.startswith("rolling_") and col != "rolling_std_off_net_rating"
    ]

    # 2. Build Seed Lookup from the 2026 tournament bracket
    seed_lookup = {}
    for _, row in tourney_2026.iterrows():
        seed_lookup[int(row['home_team_id'])] = int(row['home_seed'])
        seed_lookup[int(row['away_team_id'])] = int(row['away_seed'])

    tournament_team_ids = set(seed_lookup.keys())
    
    # Filter down to just the 68 tournament teams
    rolling_stats_2026 = rolling_stats_2026[
        rolling_stats_2026['team_id'].isin(tournament_team_ids)
    ]

    # 3. Build the Team Stat Lookup Dictionary!
    team_stat_lookup = {}
    for _, row in rolling_stats_2026.iterrows():
        tid = int(row['team_id'])
        
        # Safely extract true volatility (default to 12.0 if missing/NaN)
        raw_volatility = row.get('rolling_std_off_net_rating', 12.0)
        team_volatility = float(raw_volatility) if pd.notna(raw_volatility) else 12.0

        team_stat_lookup[tid] = {
            'seed': seed_lookup.get(tid, 8),
            'volatility': team_volatility, # <--- WE STORE THE VOLATILITY HERE
            'stats': {col: float(row[col]) for col in raw_stat_cols}
        }

    print(f"✅ Built stat lookup for {len(team_stat_lookup)} / {len(tournament_team_ids)} tournament teams")

    print(f"✅ Built stat lookup for {len(team_stat_lookup)} / {len(tournament_team_ids)} tournament teams")


    # ── STEP 2: Use the API's `TeamInfo` to map the React Strings ───────────────
    import difflib
    
    with open('frontend/src/react_teams.json', 'r') as f:
        react_teams_list = json.load(f)

    # Use the `teams_info` (List[TeamInfo]) you fetched from the API earlier!
    master_api_dict = {}
    for team in teams_info:
        t_id = int(team.id)
        
        # We add multiple variations of the name to guarantee a match
        if team.school:
            master_api_dict[str(team.school).lower().replace(" ", "_").replace(".", "").replace("'", "")] = t_id
        if team.display_name:
            master_api_dict[str(team.display_name).lower().replace(" ", "_").replace(".", "").replace("'", "")] = t_id
        if team.school and team.mascot:
            master_api_dict[f"{team.school} {team.mascot}".lower().replace(" ", "_").replace(".", "").replace("'", "")] = t_id
        if team.display_name and team.mascot:
            master_api_dict[f"{team.display_name} {team.mascot}".lower().replace(" ", "_").replace(".", "").replace("'", "")] = t_id

    react_id_to_int = {}
    for team in react_teams_list:
        # Clean the React ID to match our dictionary keys
        clean_react = team['id'].lower().replace(".", "").replace("'", "")
        
        if clean_react in master_api_dict:
            react_id_to_int[team['id']] = master_api_dict[clean_react]
        else:
            # Fuzzy match safety net just in case
            matches = difflib.get_close_matches(clean_react, master_api_dict.keys(), n=1, cutoff=0.6)
            if matches:
                react_id_to_int[team['id']] = master_api_dict[matches[0]]
            else:
                print(f"❌ CRITICAL: Could not find API mapping for '{team['id']}'")

    # import sys

    # print("\n========================================================")
    # print("             🕵️ PARQUET FILE AUTOPSY                    ")
    # print("========================================================\n")

    # raw_pq = pl.read_parquet(Path(__file__).parent.parent / "data" / "team_rolling_stats_2026.parquet").to_pandas()
    # print(f"Total rows in Parquet file: {len(raw_pq)}")

    # if len(raw_pq) > 0:
    #     print("\n1. Sample of the IDs INSIDE the Parquet file (What the database has):")
    #     print(raw_pq['team_id'].head(20).tolist())
        
    #     print("\n2. Sample of the IDs the Tournament is LOOKING FOR (What the API has):")
    #     print(list(tournament_team_ids)[:20])
    # else:
    #     print("\n🚨 CRITICAL: The Parquet file is completely EMPTY!")

    # print("\n========================================================\n")
    # sys.exit()

    def predict_win_prob(t1_int, t2_int):
        """Runs the full Coach A → Coach B pipeline for any hypothetical matchup using Int IDs."""
        t1 = team_stat_lookup[t1_int]
        t2 = team_stat_lookup[t2_int]

        diff_row = {
            f"diff_{col}": float(t1['stats'][col]) - float(t2['stats'][col])
            for col in raw_stat_cols
        }

        seed_diff = t1['seed'] - t2['seed']

        X_pure = pd.DataFrame([diff_row])[top_10_features]
        X_pure_scaled = scaler.transform(X_pure)
        coach_a_prob = coach_a.predict_proba(X_pure_scaled)[0, 1]

        meta_row = pd.DataFrame([{
            'coach_a_prob': coach_a_prob,
            'seed_diff': seed_diff
        }])
        # ,'diff_rolling_off_net_rating': diff_row['diff_rolling_off_net_rating']
        return float(coach_b.predict_proba(meta_row)[0, 1])

    def seed_based_prob(seed1, seed2):
        p1 = 2000 - (seed1 * 30)
        p2 = 2000 - (seed2 * 30)
        return 1 / (1 + 10 ** ((p2 - p1) / 400))

    def get_win_prob(react_id1, react_id2):
        int1 = react_id_to_int.get(react_id1)
        int2 = react_id_to_int.get(react_id2)
        
        if not int1 or not int2:
            print(f"⚠️ Mismatch [String Translation Failed]: '{react_id1}' vs '{react_id2}'")
            return seed_based_prob(seed_lookup.get(int1, 8) if int1 else 8, seed_lookup.get(int2, 8) if int2 else 8)
            
        int1, int2 = int(int1), int(int2)
            
        if int1 not in team_stat_lookup or int2 not in team_stat_lookup:
            print(f"⚠️ Mismatch [Stats Missing from Parquet]: ID {int1} or {int2} lacks rolling data.")
            return seed_based_prob(seed_lookup.get(int1, 8), seed_lookup.get(int2, 8))

        return predict_win_prob(int1, int2)

    # ── STEP 3: Build bracket + pre-cache all probabilities ───────────────────────
    TOPOLOGY = [
        [1, 16], [8, 9], [5, 12], [4, 13],
        [6, 11], [3, 14], [7, 10], [2, 15]
    ]

    regions_data = defaultdict(list)
    for team in react_teams_list:
        regions_data[team['region']].append(team)

    round_1_pairs = []       
    bracket_order = []       

    for region, teams_in_region in regions_data.items():
        for seed1, seed2 in TOPOLOGY:
            t1 = next(t for t in teams_in_region if t['seed'] == seed1)
            t2 = next(t for t in teams_in_region if t['seed'] == seed2)
            round_1_pairs.append((t1['id'], t2['id']))
            bracket_order.extend([t1['id'], t2['id']])

    # Pre-cache — every unique matchup is only evaluated by the model once
    print("⚡ Pre-caching matchup probabilities...")
    prob_cache = {}

    def get_prob_cached(t1_id, t2_id):
        if (t1_id, t2_id) not in prob_cache:
            p = get_win_prob(t1_id, t2_id)
            prob_cache[(t1_id, t2_id)] = p
            prob_cache[(t2_id, t1_id)] = 1.0 - p
        return prob_cache[(t1_id, t2_id)]

    # Warm the cache with all Round 1 matchups
    for t1_id, t2_id in round_1_pairs:
        get_prob_cached(t1_id, t2_id)

    print(f"✅ Round 1 cached. Later rounds will cache on first encounter.")

    # ── STEP 4: Run MONTE CARLO simulations ────────────────────────────────────────────
    NUM_SIMULATIONS = 10000
    results_tracker = defaultdict(lambda: {'r32': 0, 's16': 0, 'e8': 0, 'f4': 0, 'f2': 0, 'champ': 0})
    rounds = ['r32', 's16', 'e8', 'f4', 'f2', 'champ']

    print(f"\n🏀 Running {NUM_SIMULATIONS:,} simulations with TEAM-SPECIFIC variance...")

    for sim in range(NUM_SIMULATIONS):
        current = bracket_order.copy()
        for round_name in rounds:
            next_round = []
            for i in range(0, len(current), 2):
                t1_id = current[i] # This is the React String ('duke_blue_devils')
                t2_id = current[i + 1]
                
                # 1. Grab the true baseline probability
                base_prob = get_prob_cached(t1_id, t2_id)
                
                # 2. TRANSLATE string to int using our dictionary
                t1_int = react_id_to_int.get(t1_id)
                t2_int = react_id_to_int.get(t2_id)
                
                # 3. Safely grab both teams' exact historical volatility (default to 12.0 if missing)
                t1_vol = team_stat_lookup[t1_int]['volatility'] if t1_int and t1_int in team_stat_lookup else 12.0
                t2_vol = team_stat_lookup[t2_int]['volatility'] if t2_int and t2_int in team_stat_lookup else 12.0
                
                # 4. Scale their point volatility down into a probability shift
                game_chaos_factor = ((t1_vol + t2_vol) / 2) * 0.006 
                game_chaos_factor = np.clip(game_chaos_factor, 0.04, 0.15)
                
                # 5. INJECT TRUE DYNAMIC CHAOS
                chaos_prob = np.clip(np.random.normal(base_prob, game_chaos_factor), 0.01, 0.99)
                
                # 6. Run the simulation
                winner = t1_id if random.random() < chaos_prob else t2_id
                next_round.append(winner)
                results_tracker[winner][round_name] += 1
                
            current = next_round

    print("✅ Simulations complete!")

    # ── STEP 5: Export to JSON ─────────────────────────────────────────────────────
    team_probs_json = {}
    for team in react_teams_list:
        tid = team['id']
        adv = results_tracker[tid]

        partner_id = next(
            (t2 for t1, t2 in round_1_pairs if t1 == tid),
            next((t1 for t1, t2 in round_1_pairs if t2 == tid), None)
        )
        r64 = get_prob_cached(tid, partner_id) if partner_id else 0.5

        team_probs_json[tid] = {
            "r64":   round(r64, 4),
            "r32":   round(adv['r32']   / NUM_SIMULATIONS, 4),
            "s16":   round(adv['s16']   / NUM_SIMULATIONS, 4),
            "e8":    round(adv['e8']    / NUM_SIMULATIONS, 4),
            "f4":    round(adv['f4']    / NUM_SIMULATIONS, 4),
            "f2":    round(adv['f2']    / NUM_SIMULATIONS, 4),
            "champ": round(adv['champ'] / NUM_SIMULATIONS, 4),
        }

    with open('react_team_probs.json', 'w') as f:
        json.dump(team_probs_json, f, indent=4)

    print("🎉 react_team_probs.json written — refresh your React app!")