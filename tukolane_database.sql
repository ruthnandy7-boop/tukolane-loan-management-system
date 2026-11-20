-- =====================================================
-- TUKOLANE LOAN MANAGEMENT SYSTEM DATABASE
-- Database name: tukolane_loan_system
-- MySQL / phpMyAdmin / MySQL Workbench compatible
-- =====================================================

CREATE DATABASE IF NOT EXISTS tukolane_loan_system;
USE tukolane_loan_system;

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL
);

INSERT INTO users (username, password, role) VALUES
('admin', 'admin123', 'Administrator'),
('manager', 'manager123', 'Manager'),
('accountant', 'account123', 'Accountant'),
('loanofficer', 'loan123', 'Loan Officer');

-- =====================================================
-- 2. BRANCHES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS branches (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    location VARCHAR(100)
);

INSERT INTO branches (branch_name, location) VALUES
('Head Office', 'Kampala');

-- =====================================================
-- 3. STAFF TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    branch_id INT,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);

INSERT INTO staff (full_name, role, phone, branch_id) VALUES
('Sarah Nabbosa', 'Loan Officer', '0770000001', 1),
('David Mukasa', 'Credit Officer', '0770000002', 1),
('Grace Auma', 'Accountant', '0770000003', 1);

-- =====================================================
-- 4. CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    national_id VARCHAR(30) UNIQUE,
    business_type VARCHAR(50),
    address VARCHAR(150),
    monthly_income DECIMAL(12,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO customers (full_name, phone, national_id, business_type, address, monthly_income) VALUES
('Aisha Nabirye', '0771234567', 'CM901234', 'Market vendor', 'Kalerwe', 800000.00),
('Joseph Okello', '0772345678', 'CM902345', 'Shop owner', 'Bwaise', 1200000.00);

-- =====================================================
-- 5. LOAN APPLICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS loan_applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    loan_officer_id INT,
    application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    requested_amount DECIMAL(12,2) NOT NULL,
    loan_purpose VARCHAR(100),
    repayment_months INT NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    assessment_notes TEXT,
    decision_date DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (loan_officer_id) REFERENCES staff(staff_id)
);