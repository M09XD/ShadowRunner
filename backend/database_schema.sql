-- Shadow Runner Database Schema
-- Database: ShadowRunner
-- Owner: SRpostgres

CREATE TABLE IF NOT EXISTS level_layouts (
    id SERIAL PRIMARY KEY,
    level_number INTEGER NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    platforms TEXT NOT NULL,
    traps TEXT NOT NULL,
    exit_position TEXT NOT NULL,
    spawn_position TEXT NOT NULL,
    description TEXT,
    difficulty DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    level_number INTEGER NOT NULL,
    completion_time_ms BIGINT NOT NULL,
    ranking INTEGER NOT NULL,
    skin_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_level ON leaderboard(level_number);
CREATE INDEX idx_leaderboard_player ON leaderboard(player_name);
CREATE INDEX idx_leaderboard_time ON leaderboard(completion_time_ms);

CREATE TABLE IF NOT EXISTS ai_training (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    pokemon_id INTEGER NOT NULL,
    pokemon_name VARCHAR(255) NOT NULL,
    move_used VARCHAR(255) NOT NULL,
    move_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    move_history TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_training_player ON ai_training(player_name);
CREATE INDEX idx_ai_training_pokemon ON ai_training(pokemon_id);

CREATE TABLE IF NOT EXISTS battle_logs (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    level_number INTEGER NOT NULL,
    player_pokemon_id INTEGER NOT NULL,
    player_pokemon_name VARCHAR(255) NOT NULL,
    shadow_pokemon_id INTEGER NOT NULL,
    shadow_pokemon_name VARCHAR(255) NOT NULL,
    battle_result VARCHAR(50) NOT NULL CHECK (battle_result IN ('WIN', 'LOSS')),
    battle_log TEXT,
    battle_duration_ms BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_battle_logs_player ON battle_logs(player_name);
CREATE INDEX idx_battle_logs_level ON battle_logs(level_number);
CREATE INDEX idx_battle_logs_result ON battle_logs(battle_result);

CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    player_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_stats (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL UNIQUE,
    current_level INTEGER DEFAULT 1,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    selected_skin_id INTEGER DEFAULT 0,
    total_play_time_ms BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CRITICAL FIX #5: Add comprehensive indexing for performance (removed duplicates)
-- Note: Some indexes already created above, only add missing ones
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_accounts_player_name ON accounts(player_name);
CREATE INDEX IF NOT EXISTS idx_player_stats_name ON player_stats(player_name);
CREATE INDEX IF NOT EXISTS idx_player_stats_account_id ON player_stats(account_id);
CREATE INDEX IF NOT EXISTS idx_level_layouts_number ON level_layouts(level_number);
-- Note: idx_battle_logs_player already created above (line 65), only add composite index
CREATE INDEX IF NOT EXISTS idx_battle_logs_player_level ON battle_logs(player_name, level_number);
-- Note: idx_ai_training_player_pokemon already created above (line 99)
-- Note: idx_ai_training_pokemon already created above (line 100)
CREATE INDEX IF NOT EXISTS idx_leaderboard_ranking ON leaderboard(ranking);
-- Note: idx_leaderboard_player already created above (line 102)

-- Initial Level Data (6 Levels)
INSERT INTO level_layouts (level_number, name, width, height, platforms, traps, exit_position, spawn_position, description, difficulty)
VALUES 
(1, 'Shadow''s Entrance', 3200, 1600, '[{"x":0,"y":1500,"w":200,"h":100},{"x":300,"y":1300,"w":150,"h":100},{"x":600,"y":1100,"w":200,"h":100},{"x":900,"y":900,"w":150,"h":100},{"x":1200,"y":700,"w":200,"h":100},{"x":1500,"y":900,"w":150,"h":100},{"x":1800,"y":1100,"w":200,"h":100},{"x":2100,"y":1300,"w":150,"h":100},{"x":2400,"y":1500,"w":200,"h":100},{"x":2700,"y":1300,"w":200,"h":100},{"x":3000,"y":1500,"w":200,"h":100}]', '[{"x":450,"y":1250,"type":"spike","w":50},{"x":750,"y":1050,"type":"fake_floor","w":100},{"x":1050,"y":850,"type":"moving_spike","range":150},{"x":1350,"y":650,"type":"surprise_spike"},{"x":1650,"y":850,"type":"moving_spike","range":150},{"x":1950,"y":1050,"type":"spike","w":50},{"x":2250,"y":1250,"type":"fake_floor","w":100},{"x":2550,"y":1250,"type":"moving_exit","range":200}]', '{"x":3100,"y":1400}', '{"x":50,"y":1450}', 'The beginning of your journey through the Shadow realm', 1.0),
(2, 'Mirror Halls', 3600, 1800, '[{"x":0,"y":1700,"w":200,"h":100},{"x":300,"y":1500,"w":150,"h":100},{"x":600,"y":1300,"w":200,"h":100},{"x":900,"y":1100,"w":150,"h":100},{"x":1200,"y":900,"w":200,"h":100},{"x":1500,"y":1100,"w":150,"h":100},{"x":1800,"y":1300,"w":200,"h":100},{"x":2100,"y":1500,"w":150,"h":100},{"x":2400,"y":1700,"w":200,"h":100},{"x":2700,"y":1500,"w":200,"h":100},{"x":3000,"y":1300,"w":200,"h":100},{"x":3300,"y":1500,"w":150,"h":100}]', '[{"x":450,"y":1450,"type":"spike","w":50},{"x":750,"y":1250,"type":"fake_floor","w":100},{"x":1050,"y":1050,"type":"moving_spike","range":150},{"x":1350,"y":850,"type":"surprise_spike"},{"x":1650,"y":1050,"type":"moving_spike","range":150},{"x":1950,"y":1250,"type":"spike","w":50},{"x":2250,"y":1450,"type":"fake_floor","w":100},{"x":2550,"y":1450,"type":"moving_spike","range":200},{"x":2850,"y":1250,"type":"surprise_spike"},{"x":3150,"y":1450,"type":"moving_exit","range":250}]', '{"x":3400,"y":1400}', '{"x":50,"y":1650}', 'Reflecting pools hide deadly traps', 2.0),
(3, 'Void Canyon', 4000, 2000, '[{"x":0,"y":1900,"w":200,"h":100},{"x":300,"y":1700,"w":150,"h":100},{"x":600,"y":1500,"w":200,"h":100},{"x":900,"y":1300,"w":150,"h":100},{"x":1200,"y":1100,"w":200,"h":100},{"x":1500,"y":900,"w":150,"h":100},{"x":1800,"y":1100,"w":200,"h":100},{"x":2100,"y":1300,"w":150,"h":100},{"x":2400,"y":1500,"w":200,"h":100},{"x":2700,"y":1700,"w":150,"h":100},{"x":3000,"y":1500,"w":200,"h":100},{"x":3300,"y":1700,"w":150,"h":100},{"x":3600,"y":1900,"w":200,"h":100}]', '[{"x":450,"y":1650,"type":"spike","w":50},{"x":750,"y":1450,"type":"fake_floor","w":100},{"x":1050,"y":1250,"type":"moving_spike","range":150},{"x":1350,"y":1050,"type":"surprise_spike"},{"x":1650,"y":850,"type":"moving_spike","range":150},{"x":1950,"y":1050,"type":"spike","w":50},{"x":2250,"y":1250,"type":"fake_floor","w":100},{"x":2550,"y":1450,"type":"moving_spike","range":200},{"x":2850,"y":1650,"type":"surprise_spike"},{"x":3150,"y":1450,"type":"spike","w":50},{"x":3450,"y":1650,"type":"moving_exit","range":250}]', '{"x":3700,"y":1800}', '{"x":50,"y":1850}', 'A vast canyon with unpredictable hazards', 2.5),
(4, 'Crimson Depths', 4400, 2200, '[{"x":0,"y":2100,"w":200,"h":100},{"x":300,"y":1900,"w":150,"h":100},{"x":600,"y":1700,"w":200,"h":100},{"x":900,"y":1500,"w":150,"h":100},{"x":1200,"y":1300,"w":200,"h":100},{"x":1500,"y":1100,"w":150,"h":100},{"x":1800,"y":900,"w":200,"h":100},{"x":2100,"y":1100,"w":150,"h":100},{"x":2400,"y":1300,"w":200,"h":100},{"x":2700,"y":1500,"w":150,"h":100},{"x":3000,"y":1700,"w":200,"h":100},{"x":3300,"y":1900,"w":150,"h":100},{"x":3600,"y":2000,"w":200,"h":100},{"x":3900,"y":2100,"w":150,"h":100}]', '[{"x":450,"y":1850,"type":"spike","w":50},{"x":750,"y":1650,"type":"fake_floor","w":100},{"x":1050,"y":1450,"type":"moving_spike","range":150},{"x":1350,"y":1250,"type":"surprise_spike"},{"x":1650,"y":1050,"type":"moving_spike","range":150},{"x":1950,"y":850,"type":"spike","w":50},{"x":2250,"y":1050,"type":"fake_floor","w":100},{"x":2550,"y":1250,"type":"moving_spike","range":200},{"x":2850,"y":1450,"type":"surprise_spike"},{"x":3150,"y":1650,"type":"spike","w":50},{"x":3450,"y":1850,"type":"fake_floor","w":100},{"x":3750,"y":1950,"type":"moving_exit","range":250}]', '{"x":4000,"y":2000}', '{"x":50,"y":2050}', 'Deep crimson darkness holds ancient secrets', 3.0),
(5, 'Obsidian Tower', 4800, 2400, '[{"x":0,"y":2300,"w":200,"h":100},{"x":300,"y":2100,"w":150,"h":100},{"x":600,"y":1900,"w":200,"h":100},{"x":900,"y":1700,"w":150,"h":100},{"x":1200,"y":1500,"w":200,"h":100},{"x":1500,"y":1300,"w":150,"h":100},{"x":1800,"y":1100,"w":200,"h":100},{"x":2100,"y":900,"w":150,"h":100},{"x":2400,"y":1100,"w":200,"h":100},{"x":2700,"y":1300,"w":150,"h":100},{"x":3000,"y":1500,"w":200,"h":100},{"x":3300,"y":1700,"w":150,"h":100},{"x":3600,"y":1900,"w":200,"h":100},{"x":3900,"y":2100,"w":150,"h":100},{"x":4200,"y":2200,"w":200,"h":100}]', '[{"x":450,"y":2050,"type":"spike","w":50},{"x":750,"y":1850,"type":"fake_floor","w":100},{"x":1050,"y":1650,"type":"moving_spike","range":150},{"x":1350,"y":1450,"type":"surprise_spike"},{"x":1650,"y":1250,"type":"moving_spike","range":150},{"x":1950,"y":1050,"type":"spike","w":50},{"x":2250,"y":850,"type":"fake_floor","w":100},{"x":2550,"y":1050,"type":"moving_spike","range":200},{"x":2850,"y":1250,"type":"surprise_spike"},{"x":3150,"y":1450,"type":"spike","w":50},{"x":3450,"y":1650,"type":"fake_floor","w":100},{"x":3750,"y":1850,"type":"moving_spike","range":200},{"x":4050,"y":2050,"type":"surprise_spike"},{"x":4350,"y":2150,"type":"moving_exit","range":250}]', '{"x":4500,"y":2200}', '{"x":50,"y":2250}', 'A towering structure with escalating danger', 3.5),
(6, 'Shadow Lair', 5200, 2600, '[{"x":0,"y":2500,"w":200,"h":100},{"x":300,"y":2300,"w":150,"h":100},{"x":600,"y":2100,"w":200,"h":100},{"x":900,"y":1900,"w":150,"h":100},{"x":1200,"y":1700,"w":200,"h":100},{"x":1500,"y":1500,"w":150,"h":100},{"x":1800,"y":1300,"w":200,"h":100},{"x":2100,"y":1100,"w":150,"h":100},{"x":2400,"y":900,"w":200,"h":100},{"x":2700,"y":1100,"w":150,"h":100},{"x":3000,"y":1300,"w":200,"h":100},{"x":3300,"y":1500,"w":150,"h":100},{"x":3600,"y":1700,"w":200,"h":100},{"x":3900,"y":1900,"w":150,"h":100},{"x":4200,"y":2100,"w":200,"h":100},{"x":4500,"y":2300,"w":150,"h":100}]', '[{"x":450,"y":2250,"type":"spike","w":50},{"x":750,"y":2050,"type":"fake_floor","w":100},{"x":1050,"y":1850,"type":"moving_spike","range":150},{"x":1350,"y":1650,"type":"surprise_spike"},{"x":1650,"y":1450,"type":"moving_spike","range":150},{"x":1950,"y":1250,"type":"spike","w":50},{"x":2250,"y":1050,"type":"fake_floor","w":100},{"x":2550,"y":850,"type":"moving_spike","range":200},{"x":2850,"y":1050,"type":"surprise_spike"},{"x":3150,"y":1250,"type":"spike","w":50},{"x":3450,"y":1450,"type":"fake_floor","w":100},{"x":3750,"y":1650,"type":"moving_spike","range":200},{"x":4050,"y":1850,"type":"surprise_spike"},{"x":4350,"y":2050,"type":"spike","w":50},{"x":4650,"y":2250,"type":"moving_exit","range":250}]', '{"x":5000,"y":2400}', '{"x":50,"y":2450}', 'The final confrontation awaits in the Shadow''s domain', 4.0),

-- LEVEL 7: Ascending Terror (Introduces moving platforms and vertical danger)
(7,'Ascending Terror',5600,2800,
'[{"x":0,"y":2600,"w":200,"h":100},{"x":250,"y":2450,"w":150,"h":100},{"x":500,"y":2300,"w":150,"h":100},{"x":800,"y":2150,"w":200,"h":100},{"x":1150,"y":1950,"w":150,"h":100,"type":"moving_spike","range":300},{"x":1600,"y":1750,"w":200,"h":100},{"x":2000,"y":1550,"w":150,"h":100,"type":"moving_spike","range":200},{"x":2400,"y":1350,"w":200,"h":100},{"x":2800,"y":1150,"w":150,"h":100},{"x":3200,"y":950,"w":200,"h":100},{"x":3700,"y":750,"w":250,"h":100},{"x":4200,"y":950,"w":200,"h":100},{"x":4700,"y":1150,"w":150,"h":100},{"x":5100,"y":1350,"w":200,"h":100}]',
'[{"x":400,"y":2400,"type":"spike","w":60},{"x":650,"y":2250,"type":"fake_floor","w":120},{"x":950,"y":2100,"type":"surprise_spike"},{"x":1250,"y":1900,"type":"spike_moving","range":180,"moveSpeed":4},{"x":1700,"y":1700,"type":"moving_wall","range":150,"moveSpeed":3,"h":200},{"x":2150,"y":1500,"type":"invisible_trigger","delay":300},{"x":2600,"y":1300,"type":"spike","w":60},{"x":2950,"y":1100,"type":"fake_floor","w":120},{"x":3350,"y":900,"type":"surprise_spike"},{"x":3800,"y":700,"type":"spike_moving","range":200,"moveSpeed":5},{"x":4300,"y":900,"type":"moving_wall","range":200,"moveSpeed":4,"h":200},{"x":4800,"y":1100,"type":"invisible_trigger","delay":500},{"x":5250,"y":1300,"type":"moving_exit","range":250}]',
'{"x":5300,"y":1250}','{"x":50,"y":2550}',
'The path upward is alive with motion and malice.',4.5),

-- LEVEL 8: The Gauntlet Run (Focus on speed and relentless, timed traps)
(8,'The Gauntlet Run',6000,3000,
'[{"x":0,"y":2800,"w":200,"h":100},{"x":300,"y":2650,"w":100,"h":50},{"x":500,"y":2500,"w":150,"h":100},{"x":800,"y":2350,"w":150,"h":100},{"x":1100,"y":2200,"w":200,"h":100},{"x":1500,"y":2050,"w":150,"h":100},{"x":1900,"y":1900,"w":200,"h":100},{"x":2400,"y":1750,"w":150,"h":100},{"x":2800,"y":1600,"w":200,"h":100},{"x":3300,"y":1450,"w":150,"h":100},{"x":3700,"y":1300,"w":200,"h":100},{"x":4200,"y":1150,"w":150,"h":100},{"x":4600,"y":1000,"w":250,"h":100}]',
'[{"x":350,"y":2600,"type":"timed_spike","interval":1000,"activeTime":500},{"x":600,"y":2450,"type":"timed_spike","interval":800,"activeTime":600},{"x":900,"y":2300,"type":"spike_wave","count":5,"spacing":40},{"x":1200,"y":2150,"type":"timed_fake_floor","interval":1200,"collapseTime":400},{"x":1600,"y":2000,"type":"spike_wave","count":4,"spacing":50},{"x":2000,"y":1850,"type":"surprise_spike"},{"x":2500,"y":1700,"type":"timed_spike","interval":700,"activeTime":300},{"x":2900,"y":1550,"type":"moving_spike","range":150,"moveSpeed":6},{"x":3400,"y":1400,"type":"spike_wave","count":6,"spacing":35},{"x":3800,"y":1250,"type":"timed_fake_floor","interval":1000,"collapseTime":200},{"x":4300,"y":1100,"type":"surprise_spike"},{"x":4700,"y":950,"type":"moving_exit","range":200}]',
'{"x":4850,"y":950}','{"x":50,"y":2750}',
'Hesitation is death. Traps activate in relentless waves.',5.0),

-- LEVEL 9: Labyrinth of Deceit (Maze-like with teleport hazards and switch logic)
(9, 'Labyrinth of Deceit', 6400, 3200,
'[{"x":0,"y":3000,"w":200,"h":100},{"x":200,"y":2850,"w":150,"h":100},{"x":400,"y":2700,"w":150,"h":100},{"x":700,"y":2850,"w":150,"h":100},{"x":900,"y":2700,"w":150,"h":100},{"x":1200,"y":2550,"w":200,"h":100},{"x":1500,"y":2400,"w":150,"h":100},{"x":1800,"y":2250,"w":150,"h":100},{"x":2200,"y":2100,"w":200,"h":100},{"x":2600,"y":1950,"w":150,"h":100},{"x":3000,"y":1800,"w":200,"h":100},{"x":3400,"y":1650,"w":150,"h":100},{"x":3800,"y":1500,"w":200,"h":100},{"x":4300,"y":1350,"w":150,"h":100},{"x":4700,"y":1200,"w":200,"h":100},{"x":5200,"y":1050,"w":250,"h":100}]',
'[{"x":250,"y":2800,"type":"teleport_hazard","teleportTarget":{"x":650,"y":2800}},{"x":450,"y":2650,"type":"spike","w":50},{"x":800,"y":2800,"type":"fake_floor","w":100},{"x":1000,"y":2650,"type":"switch_trap","switchId":"gate1"},{"x":1300,"y":2500,"type":"spike","linkedTraps":["gate1"],"active":false},{"x":1600,"y":2350,"type":"moving_wall","range":100,"moveSpeed":2},{"x":1900,"y":2200,"type":"teleport_hazard","teleportTarget":{"x":100,"y":2950}},{"x":2300,"y":2050,"type":"surprise_spike"},{"x":2700,"y":1900,"type":"switch_trap","switchId":"gate2"},{"x":3100,"y":1750,"type":"spike_moving","range":200,"linkedTraps":["gate2"],"active":false},{"x":3500,"y":1600,"type":"fake_floor","w":120},{"x":3900,"y":1450,"type":"invisible_trigger","delay":400},{"x":4400,"y":1300,"type":"compound_trap","compoundTraps":[{"type":"spike","x":4400,"y":1300},{"type":"moving_spike","x":4450,"y":1250,"range":150}]},{"x":4800,"y":1150,"type":"surprise_spike"},{"x":5300,"y":1000,"type":"moving_exit","range":300}]',
'{"x":5450,"y":950}', '{"x":50,"y":2950}',
'Paths twist and turn. Some doors require sacrifice to open.', 5.5),

-- LEVEL 10: Gravity's Grasp (Introduces reverse gravity zones and floating hazards)
(10, 'Gravity''s Grasp', 6800, 3400,
'[{"x":0,"y":3200,"w":200,"h":100},{"x":300,"y":3050,"w":150,"h":100},{"x":600,"y":2900,"w":150,"h":100},{"x":950,"y":2750,"w":200,"h":100,"gravity":"reverse"},{"x":1350,"y":2600,"w":150,"h":100},{"x":1700,"y":2450,"w":150,"h":100},{"x":2100,"y":2300,"w":200,"h":100,"gravity":"reverse"},{"x":2500,"y":2150,"w":150,"h":100},{"x":2900,"y":2000,"w":150,"h":100},{"x":3300,"y":1850,"w":200,"h":100},{"x":3800,"y":1700,"w":150,"h":100,"gravity":"reverse"},{"x":4200,"y":1550,"w":150,"h":100},{"x":4600,"y":1400,"w":200,"h":100},{"x":5100,"y":1250,"w":250,"h":100}]',
'[{"x":350,"y":3000,"type":"spike","w":60},{"x":650,"y":2850,"type":"falling_ceiling","h":150,"triggerRange":50},{"x":1000,"y":2700,"type":"spike_moving","range":180,"movePattern":"circular"},{"x":1400,"y":2550,"type":"fake_floor","w":100},{"x":1750,"y":2400,"type":"surprise_spike"},{"x":2200,"y":2250,"type":"falling_ceiling","h":200,"triggerRange":80},{"x":2600,"y":2100,"type":"spike","w":60},{"x":3000,"y":1950,"type":"moving_wall","range":120,"moveSpeed":5},{"x":3400,"y":1800,"type":"invisible_trigger","delay":600},{"x":3850,"y":1650,"type":"spike_wave","count":7,"spacing":30},{"x":4300,"y":1500,"type":"fake_floor","w":120},{"x":4700,"y":1350,"type":"surprise_spike"},{"x":5200,"y":1200,"type":"moving_exit","range":350}]',
'{"x":5350,"y":1150}', '{"x":50,"y":3150}',
'Up and down lose meaning. The very air seeks to crush you.', 6.0),

-- LEVEL 11: Precarious Perch (Extremely narrow platforms with environmental chaos)
(11, 'Precarious Perch', 7200, 3600,
'[{"x":0,"y":3400,"w":80,"h":50},{"x":200,"y":3250,"w":80,"h":50},{"x":400,"y":3100,"w":80,"h":50},{"x":650,"y":2950,"w":100,"h":50},{"x":900,"y":2800,"w":80,"h":50},{"x":1150,"y":2650,"w":100,"h":50},{"x":1450,"y":2500,"w":80,"h":50},{"x":1750,"y":2350,"w":100,"h":50},{"x":2100,"y":2200,"w":80,"h":50},{"x":2450,"y":2050,"w":100,"h":50},{"x":2850,"y":1900,"w":80,"h":50},{"x":3200,"y":1750,"w":120,"h":50},{"x":3600,"y":1600,"w":80,"h":50},{"x":4000,"y":1450,"w":100,"h":50},{"x":4400,"y":1300,"w":150,"h":100}]',
'[{"x":100,"y":3390,"type":"wind_current","strength":3,"direction":"left"},{"x":250,"y":3240,"type":"spike","w":40},{"x":420,"y":3090,"type":"point_trigger","triggerPoint":{"x":440,"y":3070}},{"x":700,"y":2940,"type":"fake_floor","w":80},{"x":950,"y":2790,"type":"wind_current","strength":4,"direction":"right"},{"x":1200,"y":2640,"type":"surprise_spike"},{"x":1500,"y":2490,"type":"delayed_collapse","delay":200},{"x":1800,"y":2340,"type":"spike_moving","range":100,"moveSpeed":7},{"x":2150,"y":2190,"type":"wind_current","strength":5,"direction":"up"},{"x":2500,"y":2040,"type":"invisible_trigger","delay":100},{"x":2900,"y":1890,"type":"fake_floor","w":60},{"x":3250,"y":1740,"type":"compound_trap","compoundTraps":[{"type":"spike","x":3250,"y":1740},{"type":"wind_current","x":3250,"y":1700,"strength":2,"direction":"down"}]},{"x":3650,"y":1590,"type":"surprise_spike"},{"x":4050,"y":1440,"type":"spike_wave","count":8,"spacing":25},{"x":4450,"y":1250,"type":"moving_exit","range":200}]',
'{"x":4550,"y":1200}', '{"x":50,"y":3350}',
'One misstep on the narrow path spells doom. The wind howls.', 6.5),

-- LEVEL 12: The Clockwork Core (Mechanical, timed, and linked trap symphony)
(12, 'The Clockwork Core', 7600, 3800,
'[{"x":0,"y":3600,"w":200,"h":100},{"x":300,"y":3450,"w":150,"h":100},{"x":600,"y":3300,"w":150,"h":100},{"x":950,"y":3150,"w":200,"h":100},{"x":1350,"y":3000,"w":150,"h":100},{"x":1750,"y":2850,"w":200,"h":100},{"x":2200,"y":2700,"w":150,"h":100},{"x":2600,"y":2550,"w":200,"h":100},{"x":3100,"y":2400,"w":150,"h":100},{"x":3550,"y":2250,"w":200,"h":100},{"x":4050,"y":2100,"w":150,"h":100},{"x":4500,"y":1950,"w":200,"h":100},{"x":5000,"y":1800,"w":250,"h":100}]',
'[{"x":400,"y":3400,"type":"timed_spike","interval":1500,"activeTime":700,"linkedTraps":["master_clock"]},{"x":700,"y":3250,"type":"moving_wall","range":180,"moveSpeed":4,"linkedTraps":["master_clock"]},{"x":1000,"y":3100,"type":"surprise_spike"},{"x":1400,"y":2950,"type":"fake_floor","w":100,"linkedTraps":["master_clock"]},{"x":1800,"y":2800,"type":"spike_moving","range":220,"moveSpeed":5},{"x":2250,"y":2650,"type":"invisible_trigger","delay":0,"linkedTraps":["master_clock"]},{"x":2650,"y":2500,"type":"timed_spike","interval":1200,"activeTime":400},{"x":3150,"y":2350,"type":"compound_trap","compoundTraps":[{"type":"spike","x":3150,"y":2350},{"type":"moving_spike","x":3200,"y":2300,"range":150}],"linkedTraps":["master_clock"]},{"x":3600,"y":2200,"type":"fake_floor","w":120},{"x":4100,"y":2050,"type":"surprise_spike","linkedTraps":["master_clock"]},{"x":4550,"y":1900,"type":"spike_wave","count":10,"spacing":20},{"x":5050,"y":1750,"type":"moving_exit","range":400}]',
'{"x":5250,"y":1700}', '{"x":50,"y":3550}',
'A vast machine of death, every gear timed to a lethal rhythm.', 7.0),

-- LEVEL 13: Descent into Madness (Vertical descent with rising threats)
(13, 'Descent into Madness', 8000, 4000,
'[{"x":0,"y":3800,"w":200,"h":100},{"x":200,"y":3650,"w":150,"h":100},{"x":500,"y":3500,"w":200,"h":100},{"x":850,"y":3350,"w":150,"h":100},{"x":1200,"y":3200,"w":200,"h":100},{"x":1600,"y":3050,"w":150,"h":100},{"x":2000,"y":2900,"w":200,"h":100},{"x":2450,"y":2750,"w":150,"h":100},{"x":2900,"y":2600,"w":200,"h":100},{"x":3400,"y":2450,"w":150,"h":100},{"x":3900,"y":2300,"w":200,"h":100},{"x":4450,"y":2150,"w":150,"h":100},{"x":5000,"y":2000,"w":250,"h":100}]',
'[{"x":300,"y":3600,"type":"rising_lava","startY":3700,"riseSpeed":0.5,"resetOnDeath":true},{"x":550,"y":3450,"type":"spike","w":70},{"x":900,"y":3300,"type":"fake_floor","w":110},{"x":1250,"y":3150,"type":"falling_ceiling","h":300,"triggerRange":100},{"x":1650,"y":3000,"type":"surprise_spike"},{"x":2050,"y":2850,"type":"moving_wall","range":250,"moveSpeed":6},{"x":2500,"y":2700,"type":"invisible_trigger","delay":800},{"x":2950,"y":2550,"type":"spike_moving","range":200,"movePattern":"zigzag","moveSpeed":8},{"x":3450,"y":2400,"type":"fake_floor","w":130},{"x":3950,"y":2250,"type":"compound_trap","compoundTraps":[{"type":"timed_spike","x":3950,"y":2250,"interval":900},{"type":"wind_current","x":4000,"y":2200,"strength":4,"direction":"down"}]},{"x":4500,"y":2100,"type":"surprise_spike"},{"x":5050,"y":1950,"type":"moving_exit","range":450}]',
'{"x":5250,"y":1900}', '{"x":50,"y":3750}',
'The only way out is down, chased by an inexorable tide of doom.', 7.5),

-- LEVEL 14: The Shadow''s Mimic (Platforms and traps shift/mirror player movement)
(14, 'The Shadow''s Mimic', 8400, 4200,
'[{"x":0,"y":4000,"w":200,"h":100},{"x":300,"y":3850,"w":150,"h":100},{"x":650,"y":3700,"w":200,"h":100,"behavior":"mirror_x"},{"x":1050,"y":3550,"w":150,"h":100},{"x":1450,"y":3400,"w":200,"h":100,"behavior":"mirror_y"},{"x":1950,"y":3250,"w":150,"h":100},{"x":2400,"y":3100,"w":200,"h":100},{"x":2900,"y":2950,"w":150,"h":100,"behavior":"delay_mirror"},{"x":3350,"y":2800,"w":200,"h":100},{"x":3850,"y":2650,"w":150,"h":100},{"x":4350,"y":2500,"w":200,"h":100,"behavior":"opposite"},{"x":4900,"y":2350,"w":150,"h":100},{"x":5400,"y":2200,"w":250,"h":100}]',
'[{"x":400,"y":3800,"type":"mimic_spike","triggerDistance":100,"mirrorAxis":"x"},{"x":750,"y":3650,"type":"fake_floor","w":120},{"x":1100,"y":3500,"type":"mimic_wall","triggerDistance":150,"mirrorAxis":"y"},{"x":1500,"y":3350,"type":"surprise_spike"},{"x":2000,"y":3200,"type":"spike_moving","range":180,"moveSpeed":5},{"x":2450,"y":3050,"type":"invisible_trigger","delay":500},{"x":2950,"y":2900,"type":"mimic_spike","triggerDistance":80,"mirrorAxis":"xy","delay":300},{"x":3400,"y":2750,"type":"fake_floor","w":100},{"x":3900,"y":2600,"type":"compound_trap","compoundTraps":[{"type":"spike","x":3900,"y":2600},{"type":"mimic_wall","x":3950,"y":2550,"triggerDistance":120,"mirrorAxis":"x"}]},{"x":4400,"y":2450,"type":"surprise_spike"},{"x":4950,"y":2300,"type":"spike_wave","count":12,"spacing":15},{"x":5450,"y":2150,"type":"moving_exit","range":500}]',
'{"x":5650,"y":2100}', '{"x":50,"y":3950}',
'Your own shadow is your greatest enemy, mirroring your every move with lethal intent.', 8.0),

-- LEVEL 15: THE SHADOW Arena (Final Boss: A multi-phase arena with the boss as the level)
(15,'THE SHADOW Arena',5000,3000,
'[{"x":0,"y":2900,"w":500,"h":100},{"x":600,"y":2750,"w":150,"h":100},{"x":900,"y":2600,"w":150,"h":100},{"x":1250,"y":2450,"w":200,"h":100},{"x":1700,"y":2300,"w":150,"h":100},{"x":2100,"y":2150,"w":200,"h":100},{"x":2600,"y":2000,"w":150,"h":100},{"x":3000,"y":1850,"w":200,"h":100},{"x":3500,"y":1700,"w":150,"h":100},{"x":3900,"y":1550,"w":200,"h":100},{"x":4400,"y":1400,"w":250,"h":100}]',
'[{"x":650,"y":2700,"type":"boss_phase1","health":100,"attackPattern":"slam","weakPoint":{"x":650,"y":2650}},{"x":1300,"y":2400,"type":"boss_phase2","health":150,"attackPattern":"projectile","weakPoint":{"x":1350,"y":2350}},{"x":2150,"y":2100,"type":"boss_phase3","health":200,"attackPattern":"arena_hazard","weakPoint":{"x":2200,"y":2050}},{"x":3050,"y":1800,"type":"boss_phase4","health":250,"attackPattern":"final_stand","weakPoint":{"x":3100,"y":1750}}]',
'{"x":4550,"y":1350}','{"x":50,"y":2850}',
'The source of all darkness. Not a test, but a war. Survive its evolving forms.',10.0),

-- LEVEL 16: THEE SHADOW (Boss Arena)
(16, 'THEE SHADOW', 5000, 3000,
'[{"x":0,"y":2900,"w":500,"h":100},
  {"x":600,"y":2750,"w":150,"h":100},
  {"x":900,"y":2600,"w":150,"h":100},
  {"x":1250,"y":2450,"w":200,"h":100},
  {"x":1700,"y":2300,"w":150,"h":100},
  {"x":2100,"y":2150,"w":200,"h":100},
  {"x":2600,"y":2000,"w":150,"h":100},
  {"x":3000,"y":1850,"w":200,"h":100},
  {"x":3500,"y":1700,"w":150,"h":100},
  {"x":3900,"y":1550,"w":200,"h":100},
  {"x":4400,"y":1400,"w":250,"h":100}]',

'[{
   "type":"boss",
   "name":"THE SHADOW",
   "x":650,
   "y":2700,
   "currentPhase":1,
   "phases":[
     {
       "phase":1,
       "health":100,
       "attackPattern":"slam",
       "weakPoint":{"x":650,"y":2650}
     },
     {
       "phase":2,
       "health":150,
       "attackPattern":"projectile",
       "weakPoint":{"x":1350,"y":2350}
     },
     {
       "phase":3,
       "health":200,
       "attackPattern":"arena_hazard",
       "weakPoint":{"x":2200,"y":2050}
     },
     {
       "phase":4,
       "health":250,
       "attackPattern":"final_stand",
       "weakPoint":{"x":3100,"y":1750}
     }
   ]
}]',

'{"x":4550,"y":1350}',
'{"x":50,"y":2850}',
'The source of all darkness. Not a test, but a war. Survive its evolving forms.',
10.0)
ON CONFLICT (level_number) DO NOTHING;