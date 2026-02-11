CREATE DATABASE IF NOT EXISTS aptimaster;
USE aptimaster;

CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    category VARCHAR(255),
    options JSON NOT NULL,
    correctAnswer INT DEFAULT 0,
    difficulty ENUM('Easy', 'Hard', 'Difficult') DEFAULT 'Easy',
    timeLimitMinutes INT DEFAULT 1,
    explanation TEXT
);

CREATE TABLE IF NOT EXISTS submissions (
    id VARCHAR(50) PRIMARY KEY,
    studentId VARCHAR(50) NOT NULL,
    studentName VARCHAR(100),
    questionId INT,
    answer INT,
    isCorrect BOOLEAN,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    noteId VARCHAR(50),
    FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_submissions (
    id VARCHAR(50) PRIMARY KEY,
    studentId VARCHAR(50) NOT NULL,
    studentName VARCHAR(100),
    fileName VARCHAR(255),
    fileType VARCHAR(100),
    fileData LONGTEXT, -- Base64 encoded
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);