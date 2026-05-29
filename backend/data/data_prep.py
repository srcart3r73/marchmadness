import cbbd
import polars as pl
from datetime import datetime

# 1. Setup API Client
configuration = cbbd.Configuration(access_token='NLRzHQi5WZagyvnplIeHvmrevQPraFS1A2s8+sZJlq4qKXwGEP73+/6fu+PDCXxI')
api_client = cbbd.ApiClient(configuration)
games_api = cbbd.GamesApi(api_client)

seasons = [2019, 2021, 2022, 2023, 2024, 2025, 2026]
all_game_logs = []

print("Starting the Ultimate Mega-Pull. This will take a few minutes...")

# looping through every year in the seasons list: 2019-2026
for year in seasons:
    print(f"\n--- Pulling Season {year} ---")
    
    date_chunks = [
        {'start': f'{year-1}-11-01T00:00:00Z', 'end': f'{year-1}-11-30T23:59:59Z'},
        {'start': f'{year-1}-12-01T00:00:00Z', 'end': f'{year-1}-12-31T23:59:59Z'},
        {'start': f'{year}-01-01T00:00:00Z', 'end': f'{year}-01-31T23:59:59Z'},
        {'start': f'{year}-02-01T00:00:00Z', 'end': f'{year}-02-28T23:59:59Z'},
        {'start': f'{year}-03-01T00:00:00Z', 'end': f'{year}-04-15T23:59:59Z'}
    ]
    
    for chunk in date_chunks:
        print(f"  Fetching {chunk['start'][:10]} to {chunk['end'][:10]}...")
        
        # pulling box scores from get_game_teams for both the regular and postseason
        # (This single endpoint gives us stats, conferences, seeds, and neutral site data!)
        team_stats_reg = games_api.get_game_teams(season=year, season_type='regular', start_date_range=chunk['start'], end_date_range=chunk['end'])
        team_stats_post = games_api.get_game_teams(season=year, season_type='postseason', start_date_range=chunk['start'], end_date_range=chunk['end'])
        
        # looping through the get_games_teams
        # g = game
        for g in (team_stats_reg + team_stats_post):
            
            # assigning a variable for home and away stats
            # ts = team stat
            # os = opponent stat
            ts = g.team_stats
            os = g.opponent_stats
            
            # appending all of the simple variables (Now pulling directly from g!)
            all_game_logs.append({
                'game_id': g.game_id,
                'season': year,
                'start_date': g.start_date,
                'season_type': 'postseason' if g in team_stats_post else 'regular', # Tag postseason games!
                'tournament': g.tournament, # e.g., 'NCAA', 'NIT', or None
                'neutral_site': g.neutral_site,
                'conference_game': g.conference_game,
                'game_pace': g.pace,
                'team_points': ts.points.total if ts and ts.points else 0,
                'opponent_points': os.points.total if os and os.points else 0,
                
                # Team Info
                'team_id': g.team_id,
                'team_conference': g.conference,
                'team_seed': g.team_seed,
                'is_home': g.is_home,
                
                # Opponent Info
                'opponent_id': g.opponent_id,
                'opponent_conference': g.opponent_conference,
                'opponent_seed': g.opponent_seed,
                
                # appending all of the stats
                
                # --- OFFENSIVE STATS ---
                'off_rating': ts.rating if ts else 0.0,
                'off_net_rating': (ts.rating - os.rating) if (ts and os and ts.rating is not None and os.rating is not None) else 0.0,
                'off_true_shooting': ts.true_shooting if ts else 0.0,
                'off_game_score': ts.game_score if ts else 0.0,
                'off_possessions': ts.possessions if ts else 0.0,
                
                # Four Factors
                'off_efg': ts.four_factors.effective_field_goal_pct if ts and ts.four_factors else 0.0,
                'off_tov_pct': ts.four_factors.turnover_ratio if ts and ts.four_factors else 0.0,
                'off_orb_pct': ts.four_factors.offensive_rebound_pct if ts and ts.four_factors else 0.0,
                'off_ft_rate': ts.four_factors.free_throw_rate if ts and ts.four_factors else 0.0,
                
                # Shooting Percentages
                'off_fg_pct': ts.field_goals.pct if ts and ts.field_goals else 0.0,
                'off_2pt_pct': ts.two_point_field_goals.pct if ts and ts.two_point_field_goals else 0.0,
                'off_3pt_pct': ts.three_point_field_goals.pct if ts and ts.three_point_field_goals else 0.0,
                'off_ft_pct': ts.free_throws.pct if ts and ts.free_throws else 0.0,
                
                # Counting Stats
                'off_ast': ts.assists if ts else 0.0,
                'off_blk': ts.blocks if ts else 0.0,
                'off_stl': ts.steals if ts else 0.0,
                'off_reb_total': ts.rebounds.total if ts and ts.rebounds else 0,
                'off_fouls_total': ts.fouls.total if ts and ts.fouls else 0,
                'off_tov_total': ts.turnovers.total if ts and ts.turnovers else 0,

                # --- DEFENSIVE STATS (What they allowed the opponent to do) ---
                'def_rating': os.rating if os else 0.0,
                'def_true_shooting': os.true_shooting if os else 0.0,
                'def_game_score': os.game_score if os else 0.0,
                
                # Opponent Four Factors
                'def_efg': os.four_factors.effective_field_goal_pct if os and os.four_factors else 0.0,
                'def_tov_pct': os.four_factors.turnover_ratio if os and os.four_factors else 0.0,
                'def_orb_pct': os.four_factors.offensive_rebound_pct if os and os.four_factors else 0.0,
                'def_ft_rate': os.four_factors.free_throw_rate if os and os.four_factors else 0.0,
                
                # Opponent Shooting Percentages
                'def_fg_pct': os.field_goals.pct if os and os.field_goals else 0.0,
                'def_2pt_pct': os.two_point_field_goals.pct if os and os.two_point_field_goals else 0.0,
                'def_3pt_pct': os.three_point_field_goals.pct if os and os.three_point_field_goals else 0.0,
                'def_ft_pct': os.free_throws.pct if os and os.free_throws else 0.0,
                
                # Opponent Counting Stats
                'def_ast': os.assists if os else 0.0,
                'def_blk': os.blocks if os else 0.0,
                'def_stl': os.steals if os else 0.0,
                'def_reb_total': os.rebounds.total if os and os.rebounds else 0,
                'def_fouls_total': os.fouls.total if os and os.fouls else 0,
                'def_tov_total': os.turnovers.total if os and os.turnovers else 0,
            })


# --- POLARS PIPELINE ---
# creating a df out of the combined game logs
# infer_schema_length=len(all_game_logs) forces Polars to check every single row before making assumptions
logs_df = pl.DataFrame(all_game_logs, infer_schema_length=len(all_game_logs)).sort(["team_id", "start_date"])

# creating a list of the columns that are stats so that they can be made into rolling averages
stat_columns = [col for col in logs_df.columns if col.startswith('off_') or col.startswith('def_')]
window_size = 12

# Calculate Rolling Averages
rolling_exprs = [
    pl.col(col).rolling_mean(window_size).shift(1).over(["team_id", "season"]).alias(f"rolling_{col}")
    for col in stat_columns
]

volatility_expr = pl.col("off_net_rating").rolling_std(window_size).shift(1).over(["team_id", "season"]).alias("rolling_std_off_net_rating")

# Add both the averages and the volatility to our dataframe
rolling_df = logs_df.with_columns(rolling_exprs + [volatility_expr]).select(
    ["game_id", "team_id", "rolling_std_off_net_rating"] + [f"rolling_{col}" for col in stat_columns]
)

# Isolate Schedule & Context Variables
schedule_df = logs_df.select([
    "game_id", "season", "season_type", "tournament", "neutral_site", "conference_game", "start_date",
    "team_id", "team_conference", "team_seed",
    "opponent_id", "opponent_conference", "opponent_seed",
    "team_points", "opponent_points", "is_home"
]).rename({
    "team_id": "home_team_id", 
    "opponent_id": "away_team_id",
    "team_conference": "home_conference",
    "opponent_conference": "away_conference",
    "team_seed": "home_seed",
    "opponent_seed": "away_seed",
    "team_points": "home_score",      # <--- RENAMED SO THE DOWNSTREAM MATH WORKS
    "opponent_points": "away_score"   # <--- RENAMED SO THE DOWNSTREAM MATH WORKS
})

# Filter to one row per game (home team perspective) and add target variable
schedule_df = schedule_df.filter(pl.col("is_home") == True).with_columns(
    (pl.col("home_score") > pl.col("away_score")).cast(pl.Int32).alias("home_win")
)

# Merge Math
rolling_stat_cols = [col for col in rolling_df.columns if col.startswith("rolling_")]
master_df = schedule_df.join(rolling_df, left_on=["game_id", "home_team_id"], right_on=["game_id", "team_id"], how="inner").rename({col: f"home_{col}" for col in rolling_stat_cols})
master_df = master_df.join(rolling_df, left_on=["game_id", "away_team_id"], right_on=["game_id", "team_id"], how="inner").rename({col: f"away_{col}" for col in rolling_stat_cols})

# Calculate Differentials
master_df = master_df.with_columns([
    (pl.col(f"home_{col}") - pl.col(f"away_{col}")).alias(f"diff_{col}")
    for col in rolling_stat_cols
])

# Cleanup & Export
columns_to_drop = (
    [f"home_{col}" for col in rolling_stat_cols] + 
    [f"away_{col}" for col in rolling_stat_cols] + 
    ["diff_rolling_off_rating", "diff_rolling_off_orb_pct", "diff_rolling_def_reb_total", "diff_rolling_def_orb_pct", "diff_rolling_def_stl", "home_score", "away_score", "conference_game"]
)

# FIX: Fill the non-math nulls with placeholders before dropping!
master_df = master_df.with_columns([
    pl.col("tournament").fill_null("None"),
    pl.col("home_seed").fill_null(0),
    pl.col("away_seed").fill_null(0)
])

tournament_team_game_ids = (
    schedule_df
    .filter(
        (pl.col("season") == 2026) & 
        (pl.col("tournament") != "NCAA") &
        (pl.col("tournament") != "None")
    )
    .select(["home_team_id", "away_team_id"])
)

# Use strict=False so if a column doesn't exist it skips over it instead of crashing
master_df = master_df.drop_nulls().drop(columns_to_drop, strict=False).sort("start_date")
master_df.write_parquet("ncaa_master_data.parquet")

# Flatten to a set of all 2026 tournament-bound team IDs
# (We'll filter down to just tournament teams later in train.py once we know who qualified)
# For now, save ALL 2026 team rolling stats — train.py will filter to just the 68

pre_tourney_rolling = (
    rolling_df
    .join(
        logs_df.select(["game_id", "team_id", "season", "start_date", "tournament"]),
        on=["game_id", "team_id"]
    )
    .with_columns(pl.col("tournament").fill_null("None"))  # <--- THE MAGIC FIX
    .filter(
        (pl.col("season") == 2026) &
        (pl.col("tournament") != "NCAA")
    )
    .sort("start_date")
    .group_by("team_id")
    .agg([pl.last(col).alias(col) for col in rolling_stat_cols])
)

pre_tourney_rolling.write_parquet("team_rolling_stats_2026.parquet")
print("✅ team_rolling_stats_2026.parquet successfully generated with ALL teams!")