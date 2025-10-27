-- Capifit platform database bootstrap script
-- Target: MySQL 8.x (Ubuntu 24.04 LTS default)
-- This script is idempotent: it can be executed multiple times without data loss.

-- Create database if needed (replace with desired database name before running)
CREATE DATABASE IF NOT EXISTS capifit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE capifit;

-- Ensure timezone storage consistency
SET time_zone = '+00:00';

-- Users table stores administrators, trainers and students (shared auth)
CREATE TABLE IF NOT EXISTS users (
    id            CHAR(36)     NOT NULL,
    email         VARCHAR(190) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    role          ENUM('ADMIN','TRAINER','STUDENT') NOT NULL DEFAULT 'STUDENT',
    status        ENUM('ACTIVE','INACTIVE','PENDING') NOT NULL DEFAULT 'ACTIVE',
    avatar_url    VARCHAR(255) DEFAULT NULL,
    phone_number  VARCHAR(30)  DEFAULT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'pt-BR';

-- Trainers specific profile data
CREATE TABLE IF NOT EXISTS trainers (
    user_id        CHAR(36)     NOT NULL,
    cref_number    VARCHAR(45)  DEFAULT NULL,
    bio            TEXT,
    specialties    TEXT,
    hourly_rate    DECIMAL(10,2) DEFAULT NULL,
    experience_years INT DEFAULT NULL,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_trainers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE trainers
    ADD COLUMN IF NOT EXISTS social_links JSON NULL;

-- Students extra information
CREATE TABLE IF NOT EXISTS students (
    user_id            CHAR(36)    NOT NULL,
    trainer_id         CHAR(36)    DEFAULT NULL,
    birth_date         DATE        DEFAULT NULL,
    height_cm          DECIMAL(5,2) DEFAULT NULL,
    subscription_tier  ENUM('MONTHLY','QUARTERLY','ANNUAL') DEFAULT NULL,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_students_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS goal TEXT NULL;

-- Workouts definitions
CREATE TABLE IF NOT EXISTS workouts (
    id            CHAR(36)     NOT NULL,
    trainer_id    CHAR(36)     NOT NULL,
    title         VARCHAR(150) NOT NULL,
    description   TEXT,
    difficulty    ENUM('BEGINNER','INTERMEDIATE','ADVANCED') DEFAULT 'BEGINNER',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_workouts_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE workouts
    ADD COLUMN IF NOT EXISTS estimated_duration_minutes INT DEFAULT NULL;

-- Workout exercises (JSON for flexibility)
CREATE TABLE IF NOT EXISTS workout_blocks (
    id           CHAR(36) NOT NULL,
    workout_id   CHAR(36) NOT NULL,
    sort_order   INT      NOT NULL DEFAULT 1,
    content      JSON     NOT NULL,
    PRIMARY KEY (id),
    KEY idx_workout_blocks_workout (workout_id),
    CONSTRAINT fk_workout_blocks_workout FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Diet plans
CREATE TABLE IF NOT EXISTS diets (
    id            CHAR(36)     NOT NULL,
    trainer_id    CHAR(36)     NOT NULL,
    student_id    CHAR(36)     NOT NULL,
    title         VARCHAR(150) NOT NULL,
    notes         TEXT,
    start_date    DATE         DEFAULT NULL,
    end_date      DATE         DEFAULT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_diets_student (student_id),
    CONSTRAINT fk_diets_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_diets_student FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE diets
    ADD COLUMN IF NOT EXISTS total_calories INT DEFAULT NULL;

-- Diet meals stored as JSON for flexibility
CREATE TABLE IF NOT EXISTS diet_meals (
    id        CHAR(36) NOT NULL,
    diet_id   CHAR(36) NOT NULL,
    sort_order INT     NOT NULL DEFAULT 1,
    content   JSON     NOT NULL,
    PRIMARY KEY (id),
    KEY idx_diet_meals_diet (diet_id),
    CONSTRAINT fk_diet_meals_diet FOREIGN KEY (diet_id) REFERENCES diets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Physical assessments
CREATE TABLE IF NOT EXISTS assessments (
    id            CHAR(36)     NOT NULL,
    student_id    CHAR(36)     NOT NULL,
    trainer_id    CHAR(36)     NOT NULL,
    assessment_at DATE         NOT NULL,
    weight_kg     DECIMAL(5,2) DEFAULT NULL,
    body_fat_pct  DECIMAL(5,2) DEFAULT NULL,
    muscle_mass_kg DECIMAL(5,2) DEFAULT NULL,
    notes         TEXT,
    attachments   JSON,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_assessments_student (student_id),
    CONSTRAINT fk_assessments_student FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_assessments_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE assessments
    ADD COLUMN IF NOT EXISTS waist_cm DECIMAL(5,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS hip_cm DECIMAL(5,2) DEFAULT NULL;

-- Communications (chat messages)
CREATE TABLE IF NOT EXISTS communications (
    id          CHAR(36)     NOT NULL,
    thread_id   CHAR(36)     NOT NULL,
    sender_id   CHAR(36)     NOT NULL,
    receiver_id CHAR(36)     NOT NULL,
    message     TEXT         NOT NULL,
    attachments JSON         DEFAULT NULL,
    sent_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at     TIMESTAMP    NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_communications_thread (thread_id),
    CONSTRAINT fk_communications_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_communications_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE communications
    ADD COLUMN IF NOT EXISTS message_type ENUM('TEXT','IMAGE','AUDIO') DEFAULT 'TEXT';

-- Subscriptions / billing
CREATE TABLE IF NOT EXISTS subscriptions (
    id             CHAR(36)     NOT NULL,
    student_id     CHAR(36)     NOT NULL,
    trainer_id     CHAR(36)     NOT NULL,
    plan_type      ENUM('MONTHLY','QUARTERLY','ANNUAL') NOT NULL,
    price_cents    INT          NOT NULL,
    currency       CHAR(3)      NOT NULL DEFAULT 'BRL',
    status         ENUM('ACTIVE','EXPIRED','CANCELED','PENDING') NOT NULL,
    started_at     DATE         NOT NULL,
    expires_at     DATE         NOT NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_subscriptions_student (student_id),
    CONSTRAINT fk_subscriptions_student FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS external_reference VARCHAR(100) DEFAULT NULL;

-- Dashboard metrics snapshots
CREATE TABLE IF NOT EXISTS metrics_snapshots (
    id           CHAR(36)  NOT NULL,
    trainer_id   CHAR(36)  NOT NULL,
    snapshot_at  DATE      NOT NULL,
    data         JSON      NOT NULL,
    PRIMARY KEY (id),
    KEY idx_metrics_trainer (trainer_id),
    CONSTRAINT fk_metrics_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Seed demo data (safe to re-run)
INSERT INTO users (id, email, password_hash, full_name, role, status)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@capifit.app.br', '$2b$10$examplehashadmin', 'Admin Capifit', 'ADMIN', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000002', 'trainer@capifit.app.br', '$2b$10$examplehashtrainer', 'Treinador Exemplo', 'TRAINER', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000003', 'aluno@capifit.app.br', '$2b$10$examplehashstudent', 'Aluno Demonstração', 'STUDENT', 'ACTIVE')
ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    status = VALUES(status);

INSERT INTO trainers (user_id, cref_number, bio, specialties, hourly_rate, experience_years)
VALUES
    ('00000000-0000-0000-0000-000000000002', 'CREF-123456', 'Especialista em hipertrofia e condicionamento.', JSON_ARRAY('Hipertrofia','Condicionamento'), 150.00, 8)
ON DUPLICATE KEY UPDATE
    cref_number = VALUES(cref_number),
    bio = VALUES(bio),
    specialties = VALUES(specialties);

INSERT INTO students (user_id, trainer_id, birth_date, height_cm, subscription_tier, goal)
VALUES
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '1995-04-10', 175.00, 'MONTHLY', 'Ganhar massa muscular')
ON DUPLICATE KEY UPDATE
    trainer_id = VALUES(trainer_id),
    subscription_tier = VALUES(subscription_tier),
    goal = VALUES(goal);

INSERT INTO workouts (id, trainer_id, title, description, difficulty, estimated_duration_minutes)
VALUES
    ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', 'Treino A - Superiores', 'Rotina focada em peito, ombro e tríceps.', 'INTERMEDIATE', 55)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    estimated_duration_minutes = VALUES(estimated_duration_minutes);

INSERT INTO workout_blocks (id, workout_id, sort_order, content)
VALUES
    ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 1, JSON_OBJECT(
        'exercise', 'Supino reto',
        'series', 4,
        'reps', '8-10',
        'rest', '90s',
        'load', '70% 1RM'
    ))
ON DUPLICATE KEY UPDATE
    content = VALUES(content);

INSERT INTO diets (id, trainer_id, student_id, title, notes, total_calories)
VALUES
    ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Plano Cutting', 'Plano hipocalórico com foco em alta proteína.', 2200)
ON DUPLICATE KEY UPDATE
    notes = VALUES(notes),
    total_calories = VALUES(total_calories);

INSERT INTO diet_meals (id, diet_id, sort_order, content)
VALUES
    ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', 1, JSON_OBJECT(
        'time', '07:30',
        'meal', 'Café da manhã',
        'items', JSON_ARRAY(
            JSON_OBJECT('food', 'Ovos mexidos', 'quantity', '3 unidades'),
            JSON_OBJECT('food', 'Aveia', 'quantity', '60g'),
            JSON_OBJECT('food', 'Banana', 'quantity', '1 unidade')
        ),
        'macros', JSON_OBJECT('protein', 35, 'carbs', 45, 'fat', 15)
    ))
ON DUPLICATE KEY UPDATE
    content = VALUES(content);

INSERT INTO assessments (id, student_id, trainer_id, assessment_at, weight_kg, body_fat_pct, waist_cm, hip_cm)
VALUES
    ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '2024-05-01', 82.5, 18.2, 84.0, 100.0)
ON DUPLICATE KEY UPDATE
    weight_kg = VALUES(weight_kg),
    body_fat_pct = VALUES(body_fat_pct),
    waist_cm = VALUES(waist_cm),
    hip_cm = VALUES(hip_cm);

INSERT INTO communications (id, thread_id, sender_id, receiver_id, message, message_type)
VALUES
    ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-00000000A001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Professor, terminei o treino de hoje!', 'TEXT')
ON DUPLICATE KEY UPDATE
    message = VALUES(message);

INSERT INTO subscriptions (id, student_id, trainer_id, plan_type, price_cents, status, started_at, expires_at, external_reference)
VALUES
    ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'MONTHLY', 19900, 'ACTIVE', '2024-05-01', '2024-05-31', 'PAYMENT-12345')
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    expires_at = VALUES(expires_at),
    external_reference = VALUES(external_reference);

INSERT INTO metrics_snapshots (id, trainer_id, snapshot_at, data)
VALUES
    ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000002', '2024-05-01', JSON_OBJECT('activeStudents', 12, 'avgAttendance', 87))
ON DUPLICATE KEY UPDATE
    data = VALUES(data);
