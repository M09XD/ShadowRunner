-- Create level_layouts table
CREATE TABLE IF NOT EXISTS level_layouts (
    id BIGSERIAL PRIMARY KEY,
    level_number INTEGER NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    platforms TEXT NOT NULL,
    traps TEXT NOT NULL,
    exit_position TEXT NOT NULL,
    spawn_position TEXT NOT NULL,
    description TEXT,
    difficulty FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_level_number ON level_layouts(level_number);

-- Create player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
    id BIGSERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL UNIQUE,
    current_level INTEGER DEFAULT 1,
    selected_skin_id INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    total_play_time_ms BIGINT DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_player_name ON player_stats(player_name);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
    id BIGSERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    level_number INTEGER NOT NULL,
    completion_time_ms BIGINT NOT NULL,
    ranking INTEGER DEFAULT 0,
    skin_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_level ON leaderboard(level_number);
CREATE INDEX idx_leaderboard_player ON leaderboard(player_name);
CREATE INDEX idx_leaderboard_time ON leaderboard(completion_time_ms);

-- Create ai_training table
CREATE TABLE IF NOT EXISTS ai_training (
    id BIGSERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    pokemon_id INTEGER NOT NULL,
    pokemon_name VARCHAR(255) NOT NULL,
    move_used VARCHAR(255) NOT NULL,
    move_count INTEGER DEFAULT 1,
    success_rate FLOAT DEFAULT 0,
    move_history TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_training_player ON ai_training(player_name);
CREATE INDEX idx_ai_training_pokemon ON ai_training(pokemon_id);

-- Create battle_logs table
CREATE TABLE IF NOT EXISTS battle_logs (
    id BIGSERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    level_number INTEGER NOT NULL,
    player_pokemon_id INTEGER NOT NULL,
    player_pokemon_name VARCHAR(255) NOT NULL,
    shadow_pokemon_id INTEGER NOT NULL,
    shadow_pokemon_name VARCHAR(255) NOT NULL,
    battle_result VARCHAR(50) NOT NULL,
    battle_log TEXT,
    battle_duration_ms BIGINT,
    damage_dealt INTEGER DEFAULT 0,
    damage_received INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_battle_player ON battle_logs(player_name);
CREATE INDEX idx_battle_level ON battle_logs(level_number);

-- Insert level data
INSERT INTO level_layouts (level_number, name, width, height, platforms, traps, exit_position, spawn_position, description, difficulty)
VALUES 
(1, 'Beginner Court', 3200, 1600, '[{"x":100,"y":1400,"w":200,"h":20},{"x":400,"y":1250,"w":200,"h":20},{"x":700,"y":1100,"w":200,"h":20}]', '[{"type":"spike","x":900,"y":1050},{"type":"spike","x":1200,"y":900}]', '{"x":3000,"y":100}', '{"x":50,"y":1500}', 'Start your journey here', 1.0),
(2, 'Treacherous Trail', 4000, 2000, '[{"x":100,"y":1800,"w":200,"h":20},{"x":500,"y":1600,"w":200,"h":20},{"x":900,"y":1400,"w":200,"h":20}]', '[{"type":"spike","x":1200,"y":1350},{"type":"fake_floor","x":1400,"y":1600}]', '{"x":3800,"y":200}', '{"x":50,"y":1900}', 'Watch your footing', 1.5),
(3, 'Shadowed Cavern', 4500, 2200, '[{"x":100,"y":2000,"w":200,"h":20},{"x":600,"y":1800,"w":200,"h":20},{"x":1200,"y":1600,"w":200,"h":20}]', '[{"type":"moving_spike","x":1500,"y":1550,"speed":2},{"type":"spike","x":1800,"y":1600}]', '{"x":4200,"y":300}', '{"x":50,"y":2100}', 'Darkness closes in', 2.0),
(4, 'Perilous Peaks', 5000, 2500, '[{"x":100,"y":2300,"w":200,"h":20},{"x":800,"y":2000,"w":200,"h":20},{"x":1600,"y":1700,"w":200,"h":20}]', '[{"type":"spike","x":2000,"y":1650},{"type":"moving_spike","x":2200,"y":1700,"speed":3}]', '{"x":4700,"y":400}', '{"x":50,"y":2400}', 'The mountain awaits', 2.5),
(5, 'Cursed Chasm', 5500, 2800, '[{"x":100,"y":2600,"w":200,"h":20},{"x":900,"y":2300,"w":200,"h":20},{"x":1800,"y":2000,"w":200,"h":20}]', '[{"type":"surprise_spike","x":2200,"y":1950},{"type":"moving_spike","x":2500,"y":2000,"speed":4}]', '{"x":5200,"y":500}', '{"x":50,"y":2700}', 'Evil lurks below', 3.0),
(6, 'Final Fortress', 6000, 3000, '[{"x":100,"y":2800,"w":200,"h":20},{"x":1000,"y":2500,"w":200,"h":20},{"x":2000,"y":2200,"w":200,"h":20}]', '[{"type":"spike","x":2500,"y":2150},{"type":"moving_spike","x":2800,"y":2200,"speed":5},{"type":"surprise_spike","x":3100,"y":2150}]', '{"x":5700,"y":600}', '{"x":50,"y":2900}', 'Face your shadow', 4.0);
