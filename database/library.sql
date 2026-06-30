-- ============================================================
-- SKCET LIBRARY MANAGEMENT SYSTEM v4 — Full Schema
-- ============================================================
CREATE DATABASE IF NOT EXISTS library_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- USERS
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','librarian','student') NOT NULL DEFAULT 'student',
  roll_number VARCHAR(50) NULL,
  department VARCHAR(100) NULL,
  phone VARCHAR(15) NULL,
  profile_pic TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- BOOKS
CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(30) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  publisher VARCHAR(150) NULL,
  edition VARCHAR(50) NULL,
  year_published YEAR NULL,
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  shelf_location VARCHAR(50) NULL,
  description TEXT NULL,
  tags VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ISSUES
CREATE TABLE issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  issued_by INT NULL,
  returned_to INT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE NULL,
  fine_per_day DECIMAL(6,2) DEFAULT 2.00,
  fine_amount DECIMAL(10,2) DEFAULT 0.00,
  fine_paid BOOLEAN DEFAULT FALSE,
  status ENUM('issued','returned','overdue','lost') DEFAULT 'issued',
  remarks TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (returned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- RESERVATIONS
CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  status ENUM('pending','fulfilled','cancelled','expired') DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','warning','success','danger') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- INDEXES
CREATE INDEX idx_books_dept ON books(department);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_issues_user ON issues(user_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_due ON issues(due_date);

-- ============================================================
-- SEED USERS  (password = "password" for all)
-- ============================================================
INSERT INTO users (name,email,password,role,roll_number,department,phone) VALUES
('Admin User','admin@skcet.ac.in','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin',NULL,'Administration','9876543210'),
('Meena Librarian','librarian@skcet.ac.in','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','librarian',NULL,'Library','9876543211'),
('Bharathi A','bharathi@student.skcet.ac.in','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','student','21ECE001','Electronics and Communication Engineering','9876543212'),
('Arun K','arun@student.skcet.ac.in','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','student','21CSE002','Computer Science and Engineering','9876543213'),
('Priya S','priya@student.skcet.ac.in','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','student','21IT003','Information Technology','9876543214');

-- ============================================================
-- SEED BOOKS — 10 depts × 15 books = 150 books
-- ============================================================

-- CSE
INSERT INTO books (title,author,isbn,category,department,publisher,edition,year_published,total_copies,available_copies,shelf_location) VALUES
('Introduction to Algorithms','Thomas Cormen','978-0-262-03384-8','Core','Computer Science and Engineering','MIT Press','4th',2022,5,5,'CSE-A01'),
('Database System Concepts','Silberschatz','978-0-07-352332-3','Core','Computer Science and Engineering','McGraw Hill','7th',2019,4,4,'CSE-A02'),
('Computer Networks','Andrew Tanenbaum','978-0-13-212695-3','Core','Computer Science and Engineering','Pearson','5th',2020,4,4,'CSE-A03'),
('Operating System Concepts','Silberschatz','978-1-118-06333-0','Core','Computer Science and Engineering','Wiley','10th',2018,4,4,'CSE-A04'),
('Artificial Intelligence','Stuart Russell','978-0-13-604259-4','AI/ML','Computer Science and Engineering','Pearson','4th',2020,4,4,'CSE-A05'),
('Clean Code','Robert C. Martin','978-0-13-235088-4','Programming','Computer Science and Engineering','Prentice Hall','1st',2008,4,4,'CSE-A06'),
('Design Patterns','Gang of Four','978-0-201-63361-0','Programming','Computer Science and Engineering','Addison-Wesley','1st',1994,3,3,'CSE-A07'),
('Computer Organization','William Stallings','978-0-13-293633-0','Core','Computer Science and Engineering','Pearson','11th',2019,4,4,'CSE-A08'),
('Compiler Design','Alfred Aho','978-0-321-48681-3','Core','Computer Science and Engineering','Pearson','2nd',2006,3,3,'CSE-A09'),
('Software Engineering','Ian Sommerville','978-0-13-394424-5','Core','Computer Science and Engineering','Pearson','10th',2015,4,4,'CSE-A10'),
('Python Crash Course','Eric Matthes','978-1-59327-928-8','Programming','Computer Science and Engineering','No Starch Press','3rd',2023,4,4,'CSE-A11'),
('Java: The Complete Reference','Herbert Schildt','978-1-26-044208-5','Programming','Computer Science and Engineering','McGraw Hill','12th',2021,4,4,'CSE-A12'),
('Data Structures Using C','Reema Thareja','978-0-19-809930-7','Core','Computer Science and Engineering','Oxford','2nd',2014,5,5,'CSE-A13'),
('Machine Learning','Tom Mitchell','978-0-07-042807-2','AI/ML','Computer Science and Engineering','McGraw Hill','1st',1997,3,3,'CSE-A14'),
('The Pragmatic Programmer','Andrew Hunt','978-0-13-595705-9','Programming','Computer Science and Engineering','Addison-Wesley','2nd',2019,3,3,'CSE-A15');

-- CSD
INSERT INTO books (title,author,isbn,category,department,publisher,edition,year_published,total_copies,available_copies,shelf_location) VALUES
('User Interface Design','Jeff Johnson','978-0-12-375030-3','Design','Computer Science and Design','Morgan Kaufmann','3rd',2014,4,4,'CSD-B01'),
('The Design of Everyday Things','Don Norman','978-0-465-06710-7','Design','Computer Science and Design','Basic Books','Rev',2013,4,4,'CSD-B02'),
('Designing with Data','Rochelle King','978-1-449-37186-8','Design','Computer Science and Design','O Reilly','1st',2017,3,3,'CSD-B03'),
('CSS: The Definitive Guide','Eric Meyer','978-1-449-39319-9','Web','Computer Science and Design','O Reilly','4th',2017,4,4,'CSD-B04'),
('Learning JavaScript Design Patterns','Adnan Osmani','978-1-449-33181-8','Web','Computer Science and Design','O Reilly','2nd',2023,3,3,'CSD-B05'),
('Responsive Web Design','Ethan Marcotte','978-0-9844425-7-7','Web','Computer Science and Design','A Book Apart','2nd',2014,3,3,'CSD-B06'),
('Interaction Design','Sharp Rogers','978-1-119-54725-9','Design','Computer Science and Design','Wiley','5th',2019,3,3,'CSD-B07'),
('Don t Make Me Think','Steve Krug','978-0-321-96551-6','Design','Computer Science and Design','New Riders','3rd',2014,4,4,'CSD-B08'),
('The Elements of User Experience','Jesse Garrett','978-0-321-68368-7','Design','Computer Science and Design','New Riders','2nd',2010,3,3,'CSD-B09'),
('HTML and CSS','Jon Duckett','978-1-118-00818-8','Web','Computer Science and Design','Wiley','1st',2011,4,4,'CSD-B10'),
('Figma for UX Design','Peteris Krumins','978-1-80107-021-4','Design','Computer Science and Design','Packt','1st',2021,3,3,'CSD-B11'),
('Color Theory','Itten Johannes','978-0-442-24038-8','Design','Computer Science and Design','Van Nostrand','1st',1973,2,2,'CSD-B12'),
('Typography Essentials','Ina Saltz','978-1-59253-523-3','Design','Computer Science and Design','Rockport','1st',2009,3,3,'CSD-B13'),
('Lean UX','Jeff Gothelf','978-1-449-33149-8','Design','Computer Science and Design','O Reilly','3rd',2021,3,3,'CSD-B14'),
('About Face','Alan Cooper','978-1-118-76657-6','Design','Computer Science and Design','Wiley','4th',2014,3,3,'CSD-B15');

-- ECE
INSERT INTO books (title,author,isbn,category,department,publisher,edition,year_published,total_copies,available_copies,shelf_location) VALUES
('Digital Electronics','Morris Mano','978-81-317-0244-7','Core','Electronics and Communication Engineering','Pearson','5th',2018,5,5,'ECE-C01'),
('Signals and Systems','Alan Oppenheim','978-0-13-814757-0','Core','Electronics and Communication Engineering','Pearson','2nd',2015,4,4,'ECE-C02'),
('Communication Systems','Simon Haykin','978-0-471-17869-9','Core','Electronics and Communication Engineering','Wiley','4th',2014,4,4,'ECE-C03'),
('Electronic Devices','Robert Boylestad','978-0-13-262226-4','Core','Electronics and Communication Engineering','Pearson','11th',2016,5,5,'ECE-C04'),
('VLSI Design','Neil Weste','978-0-321-54774-3','VLSI','Electronics and Communication Engineering','Pearson','4th',2011,3,3,'ECE-C05'),
('Microprocessors 8085','Ramesh Gaonkar','978-81-7758-438-9','Microprocessors','Electronics and Communication Engineering','Penram','5th',2013,4,4,'ECE-C06'),
('Digital Signal Processing','John Proakis','978-0-13-187374-2','DSP','Electronics and Communication Engineering','Pearson','4th',2014,3,3,'ECE-C07'),
('Antenna Theory','Constantine Balanis','978-0-470-58197-9','Antennas','Electronics and Communication Engineering','Wiley','4th',2016,3,3,'ECE-C08'),
('Control Systems Engineering','Norman Nise','978-0-470-91769-3','Control','Electronics and Communication Engineering','Wiley','6th',2015,4,4,'ECE-C09'),
('Optical Fiber Communications','John Senior','978-0-13-032681-2','Optical','Electronics and Communication Engineering','Pearson','3rd',2009,3,3,'ECE-C10'),
('Embedded Systems','Rajkamal','978-0-07-014589-4','Embedded','Electronics and Communication Engineering','McGraw Hill','3rd',2017,4,4,'ECE-C11'),
('Wireless Communications','Andrea Goldsmith','978-0-521-83716-3','Wireless','Electronics and Communication Engineering','Cambridge','1st',2005,2,2,'ECE-C12'),
('RF Circuit Design','Chris Bowick','978-0-7506-8518-4','RF','Electronics and Communication Engineering','Newnes','2nd',2008,3,3,'ECE-C13'),
('Network Analysis','Van Valkenburg','978-81-203-0054-8','Networks','Electronics and Communication Engineering','PHI','3rd',2014,3,3,'ECE-C14'),
('Electromagnetic Fields','Sadiku','978-0-07-338038-6','EM','Electronics and Communication Engineering','McGraw Hill','6th',2014,4,4,'ECE-C15');

-- EEE
INSERT INTO books (title,author,isbn,category,department,publisher,edition,year_published,total_copies,available_copies,shelf_location) VALUES
('Electrical Machines','A.K. Sawhney','978-81-7409-071-7','Machines','Electrical and Electronics Engineering','Dhanpat Rai','9th',2019,5,5,'EEE-D01'),
('Power Systems Analysis','Grainger Stevenson','978-0-07-061293-9','Power','Electrical and Electronics Engineering','McGraw Hill','1st',2003,4,4,'EEE-D02'),
('Power Electronics','M.H. Rashid','978-0-13-338067-4','Power','Electrical and Electronics Engineering','Pearson','4th',2013,4,4,'EEE-D03'),
('Control Systems','M. Gopal','978-0-07-048901-1','Control','Electrical and Electronics Engineering','McGraw Hill','4th',2012,4,4,'EEE-D04'),
('Electric Circuits','James Nilsson','978-0-13-452430-4','Circuits','Electrical and Electronics Engineering','Pearson','11th',2018,4,4,'EEE-D05'),
('Electrical Technology','B.L. Theraja','978-81-219-2440-2','Core','Electrical and Electronics Engineering','S Chand','24th',2020,5,5,'EEE-D06'),
('High Voltage Engineering','M.S. Naidu','978-0-07-463773-4','HV','Electrical and Electronics Engineering','McGraw Hill','3rd',2009,3,3,'EEE-D07'),
('Renewable Energy Systems','Bent Sorensen','978-0-12-375025-9','Renewable','Electrical and Electronics Engineering','Academic Press','4th',2010,3,3,'EEE-D08'),
('Electric Motor Drives','R. Krishnan','978-0-13-091014-0','Drives','Electrical and Electronics Engineering','Pearson','1st',2001,3,3,'EEE-D09'),
('Electromagnetic Fields Theory','Sadiku','978-0-07-338038-6','EM','Electrical and Electronics Engineering','McGraw Hill','6th',2014,4,4,'EEE-D10'),
('Industrial Automation','S.K. Singh','978-81-203-4023-0','Automation','Electrical and Electronics Engineering','PHI','2nd',2017,3,3,'EEE-D11'),
('Smart Grid Technology','Stuart Borlase','978-1-4398-2019-4','Smart Grid','Electrical and Electronics Engineering','CRC Press','1st',2012,2,2,'EEE-D12'),
('Microelectronics','Sedra Smith','978-0-19-933913-6','Microelectronics','Electrical and Electronics Engineering','Oxford','8th',2020,3,3,'EEE-D13'),
('Switchgear and Protection','Badri Ram','978-0-07-460177-2','Protection','Electrical and Electronics Engineering','McGraw Hill','2nd',2011,3,3,'EEE-D14'),
('Digital Logic Design','Brian Holdsworth','978-0-7506-4588-7','Digital','Electrical and Electronics Engineering','Newnes','4th',2002,3,3,'EEE-D15');

-- CIVIL
INSERT INTO books (title,author,isbn,category,department,publisher,edition,year_published,total_copies,available_copies,shelf_location) VALUES
('Structural Analysis','R.C. Hibbeler','978-0-13-291010-1','Structures','Civil Engineering','Pearson','9th',2017,5,5,'CVL-E01'),
('Soil Mechanics','B.C. Punmia','978-81-7008-483-3','Geotechnical','Civil Engineering','Laxmi','16th',2017,4,4,'CVL-E02'),
('Concrete Technology','M.S. Shetty','978-81-219-0003-1','Materials','Civil Engineering','S Chand','1st',2005,4,4,'CVL-E03'),
('Transportation Engineering','Justo Khanna','978-81-8428-013-4','Transportation','Civil Engineering','Nem Chand','8th',2013,4,4,'CVL-E04'),
('Environmental Engineering','B.C. Punmia','978-81-7008-540-3','Environmental','Civil Engineering','Laxmi','5th',2016,4,4,'CVL-E05'),
('Fluid Mechanics','Modi Seth','978-81-219-2666-6','Fluid','Civil Engineering','S Chand','19th',2019,4,4,'CVL-E06'),
('Surveying Vol 1','B.C. Punmia','978-81-7008-485-7','Surveying','Civil Engineering','Laxmi','16th',2016,4,4,'CVL-E07'),
('Steel Structure Design','S.K. Duggal','978-0-07-014463-7','Structures','Civil Engineering','McGraw Hill','4th',2014,3,3,'CVL-E08'),
('Highway Engineering','S.K. Khanna','978-81-85240-14-7','Transportation','Civil Engineering','Nem Chand','8th',2009,3,3,'CVL-E09'),
('Foundation Engineering','Arora K.R.','978-81-203-1223-7','Geotechnical','Civil Engineering','PHI','1st',2008,3,3,'CVL-E10'),
('Water Supply Engineering','B.C. Punmia','978-81-7008-541-0','Environmental','Civil Engineering','Laxmi','5th',2016,3,3,'CVL-E11'),
('Construction Management','Chitkara K.K.','978-0-07-014552-8','Management','Civil Engineering','McGraw Hill','2nd',2005,3,3,'CVL-E12'),
('Geotechnical Engineering','V.N.S. Murthy','978-0-8247-5755-0','Geotechnical','Civil Engineering','CRC Press','1st',2002,3,3,'CVL-E13'),
('Irrigation Engineering','B.C. Punmia','978-81-7008-543-4','Irrigation','Civil Engineering','Laxmi','4th',2009,3,3,'CVL-E14'),
('Advanced Structural Analysis','Bhavikatti','978-81-224-2121-4','Structures','Civil Engineering','New Age','2nd',2009,3,3,'CVL-E15');

-- MECHANICAL
INSERT INTO books (title,author,isbn,category,department,publisher,edition,year_published,total_copies,available_copies,shelf_location) VALUES
('Engineering Mechanics','R.C. Hibbeler','978-0-13-463897-6','Mechanics','Mechanical Engineering','Pearson','14th',2016,5,5,'MEC-F01'),
('Thermodynamics','P.K. Nag','978-0-07-014115-5','Thermal','Mechanical Engineering','McGraw Hill','5th',2013,4,4,'MEC-F02'),
('Fluid Mechanics','Frank White','978-0-07-339827-3','Fluid','Mechanical Engineering','McGraw Hill','8th',2015,4,4,'MEC-F03'),
('Machine Design','V.B. Bhandari','978-0-07-068179-8','Design','Mechanical Engineering','McGraw Hill','4th',2017,4,4,'MEC-F04'),
('Manufacturing Engineering','Kalpakjian','978-0-13-312874-1','Manufacturing','Mechanical Engineering','Pearson','7th',2014,4,4,'MEC-F05'),
('Heat Transfer','J.P. Holman','978-0-07-352936-3','Thermal','Mechanical Engineering','McGraw Hill','10th',2010,4,4,'MEC-F06'),
('Strength of Materials','R.K. Bansal','978-81-318-0300-5','Mechanics','Mechanical Engineering','Laxmi','5th',2018,5,5,'MEC-F07'),
('Theory of Machines','S.S. Rattan','978-0-07-014111-7','Machines','Mechanical Engineering','McGraw Hill','3rd',2009,4,4,'MEC-F08'),
('Refrigeration and AC','C.P. Arora','978-0-07-014353-1','Thermal','Mechanical Engineering','McGraw Hill','3rd',2009,3,3,'MEC-F09'),
('Automobile Engineering','Kirpal Singh','978-81-7409-057-1','Automobile','Mechanical Engineering','Standard','12th',2018,3,3,'MEC-F10'),
('CAD CAM','P. Radhakrishnan','978-81-224-2277-8','CAD','Mechanical Engineering','New Age','3rd',2008,3,3,'MEC-F11'),
('Finite Element Analysis','P. Seshu','978-81-203-2315-8','FEA','Mechanical Engineering','PHI','1st',2004,3,3,'MEC-F12'),
('Industrial Engineering','O.P. Khanna','978-81-8014-010-4','Industrial','Mechanical Engineering','Dhanpat Rai','1st',2019,3,3,'MEC-F13'),
('Engineering Metallurgy','R.A. Higgins','978-0-340-56830-3','Materials','Mechanical Engineering','Hodder','7th',1993,3,3,'MEC-F14'),
('Robotics Technology','K.S. Fu','978-0-07-022625-9','Robotics','Mechanical Engineering','McGraw Hill','1st',1987,2,2,'MEC-F15');

-- MECHATRONICS
INSERT INTO books (title,author,isbn,category,department,publisher,edition,year_published,total_copies,available_copies,shelf_location) VALUES
('Mechatronics','Kevin Craig','978-0-13-601666-3','Core','Mechatronics','Pearson','1st',2012,4,4,'MCT-G01'),
('Introduction to Mechatronics','Alciatore','978-0-07-338351-6','Core','Mechatronics','McGraw Hill','4th',2012,4,4,'MCT-G02'),
('Sensors and Actuators','Clarence de Silva','978-0-8493-9053-4','Sensors','Mechatronics','CRC Press','1st',2007,3,3,'MCT-G03'),
('Programmable Logic Controllers','Frank Petruzella','978-0-07-337724-9','PLC','Mechatronics','McGraw Hill','5th',2017,4,4,'MCT-G04'),
('Industrial Robotics','Mikell Groover','978-0-07-024989-0','Robotics','Mechatronics','McGraw Hill','1st',1986,3,3,'MCT-G05'),
('Control Engineering','W. Bolton','978-1-138-83610-7','Control','Mechatronics','Routledge','6th',2015,3,3,'MCT-G06'),
('Hydraulics and Pneumatics','Andrew Parr','978-0-7506-4419-4','Hydraulics','Mechatronics','Newnes','2nd',1998,3,3,'MCT-G07'),
('Microcontroller Theory','Daniel Malik','978-0-13-510929-3','Microcontrollers','Mechatronics','Pearson','1st',2009,3,3,'MCT-G08'),
('CNC Technology','Peter Smid','978-0-8311-3391-6','CNC','Mechatronics','Industrial Press','3rd',2008,3,3,'MCT-G09'),
('Automation Production Systems','Groover','978-0-13-349827-5','Automation','Mechatronics','Pearson','3rd',2015,3,3,'MCT-G10'),
('Robot Modeling and Control','Spong','978-0-471-64990-8','Robotics','Mechatronics','Wiley','1st',2005,3,3,'MCT-G11'),
('3D Printing and AM','Ian Gibson','978-3-319-24112-1','Additive','Mechatronics','Springer','4th',2021,2,2,'MCT-G12'),
('Engineering Design','George Dieter','978-0-07-339877-8','Design','Mechatronics','McGraw Hill','5th',2012,3,3,'MCT-G13'),
('Digital Control Systems','Benjamin Kuo','978-0-19-511873-3','Control','Mechatronics','Oxford','2nd',1992,2,2,'MCT-G14'),
('MEMS and Microsystems','Tai-Ran Hsu','978-0-07-293373-5','MEMS','Mechatronics','McGraw Hill','2nd',2008,2,2,'MCT-G15');

-- IT
INSERT INTO books (title,author,isbn,category,department,publisher,edition,year_published,total_copies,available_copies,shelf_location) VALUES
('Web Technologies','Uma Maheswari','978-81-7800-239-8','Web','Information Technology','Anuradha','3rd',2018,4,4,'IT-H01'),
('Cloud Computing','Rajkumar Buyya','978-0-470-88799-8','Cloud','Information Technology','Wiley','1st',2013,3,3,'IT-H02'),
('Network Security','William Stallings','978-0-13-452733-6','Security','Information Technology','Pearson','6th',2017,3,3,'IT-H03'),
('Database Management','Ramakrishnan','978-0-07-246563-1','Database','Information Technology','McGraw Hill','3rd',2002,4,4,'IT-H04'),
('JavaScript Complete','Flanagan David','978-1-491-95202-3','Programming','Information Technology','O Reilly','7th',2020,3,3,'IT-H05'),
('Node.js Design Patterns','Mario Casciaro','978-1-83921-411-0','Programming','Information Technology','Packt','3rd',2020,3,3,'IT-H06'),
('React Up and Running','Stoyan Stefanov','978-1-491-93160-5','Web','Information Technology','O Reilly','2nd',2021,3,3,'IT-H07'),
('Linux Command Line','William Shotts','978-1-59327-917-2','Linux','Information Technology','No Starch','2nd',2019,3,3,'IT-H08'),
('Docker Deep Dive','Nigel Poulton','978-1-521-82254-2','DevOps','Information Technology','Independently','1st',2020,2,2,'IT-H09'),
('Big Data Analytics','David Loshin','978-0-12-417319-4','Data','Information Technology','Morgan Kaufmann','1st',2013,2,2,'IT-H10'),
('Internet of Things','Arshdeep Bahga','978-0-9960480-1-9','IoT','Information Technology','VPT','1st',2014,3,3,'IT-H11'),
('Data Mining Concepts','Han Kamber','978-0-12-381479-1','Data','Information Technology','Morgan Kaufmann','3rd',2011,3,3,'IT-H12'),
('Full Stack Development','Chris Northwood','978-1-4920-8404-5','Web','Information Technology','O Reilly','1st',2018,3,3,'IT-H13'),
('Kubernetes in Action','Marko Luksa','978-1-617-29372-6','DevOps','Information Technology','Manning','1st',2017,2,2,'IT-H14'),
('MongoDB in Action','Kyle Banker','978-1-617-29144-9','Database','Information Technology','Manning','2nd',2016,3,3,'IT-H15');

-- CYBER SECURITY
INSERT INTO books (title,author,isbn,category,department,publisher,edition,year_published,total_copies,available_copies,shelf_location) VALUES
('Web Application Hacker Handbook','Stuttard Pinto','978-1-118-02647-2','Web Security','Cyber Security','Wiley','2nd',2011,4,4,'CYB-I01'),
('Hacking: Art of Exploitation','Jon Erickson','978-1-59327-144-2','Hacking','Cyber Security','No Starch','2nd',2008,4,4,'CYB-I02'),
('Network Security Fundamentals','Greg Tomsho','978-1-28-576355-5','Network','Cyber Security','Cengage','5th',2021,4,4,'CYB-I03'),
('Penetration Testing','Georgia Weidman','978-1-59327-564-8','PenTest','Cyber Security','No Starch','1st',2014,3,3,'CYB-I04'),
('Cryptography Network Security','Stallings','978-0-13-476163-9','Crypto','Cyber Security','Pearson','8th',2019,4,4,'CYB-I05'),
('Metasploit Testers Guide','Kennedy','978-1-59327-288-3','PenTest','Cyber Security','No Starch','1st',2011,3,3,'CYB-I06'),
('Practical Malware Analysis','Sikorski','978-1-59327-290-6','Malware','Cyber Security','No Starch','1st',2012,3,3,'CYB-I07'),
('Social Engineering','Christopher Hadnagy','978-0-470-63953-5','Social','Cyber Security','Wiley','1st',2010,3,3,'CYB-I08'),
('Blue Team Handbook','Don Murdoch','978-1-50-032153-0','Defense','Cyber Security','CreateSpace','2nd',2014,3,3,'CYB-I09'),
('Ethical Hacking','EC-Council','978-1-28-406346-2','Hacking','Cyber Security','Cengage','1st',2021,4,4,'CYB-I10'),
('Digital Forensics','John Sammons','978-1-59749-742-8','Forensics','Cyber Security','Syngress','2nd',2014,3,3,'CYB-I11'),
('Zero Trust Networks','Gilman Barth','978-1-49-196401-7','Architecture','Cyber Security','O Reilly','1st',2017,2,2,'CYB-I12'),
('Cybersecurity and Cyberwar','Singer Friedman','978-0-19-991811-9','Policy','Cyber Security','Oxford','1st',2014,3,3,'CYB-I13'),
('The Art of Intrusion','Kevin Mitnick','978-0-7645-6959-3','Hacking','Cyber Security','Wiley','1st',2005,3,3,'CYB-I14'),
('Incident Response','Scott Roberts','978-1-49-195299-1','IR','Cyber Security','O Reilly','1st',2014,3,3,'CYB-I15');

-- GENERAL
INSERT INTO books (title,author,isbn,category,department,publisher,edition,year_published,total_copies,available_copies,shelf_location) VALUES
('Engineering Mathematics Vol 1','B.S. Grewal','978-81-203-4105-3','Mathematics','General','Khanna','44th',2020,8,8,'GEN-Z01'),
('Engineering Mathematics Vol 2','B.S. Grewal','978-81-203-4106-0','Mathematics','General','Khanna','44th',2020,8,8,'GEN-Z02'),
('Applied Physics','P.K. Palanisamy','978-81-8371-993-7','Physics','General','Scitech','3rd',2014,5,5,'GEN-Z03'),
('Engineering Chemistry','P.C. Jain','978-81-219-2456-3','Chemistry','General','S Chand','15th',2018,5,5,'GEN-Z04'),
('Technical English','Krishnaswamy','978-81-250-3547-7','English','General','Macmillan','2nd',2010,6,6,'GEN-Z05'),
('Professional Ethics','R. Subramanian','978-0-19-568523-5','Ethics','General','Oxford','2nd',2018,5,5,'GEN-Z06'),
('Numerical Methods','S.S. Sastry','978-81-203-2637-1','Mathematics','General','PHI','4th',2005,4,4,'GEN-Z07'),
('Probability and Statistics','S.C. Gupta','978-81-7014-791-5','Mathematics','General','Sultan Chand','10th',2019,5,5,'GEN-Z08'),
('Environmental Science','Erach Bharucha','978-81-203-3679-4','Science','General','UGC','1st',2005,4,4,'GEN-Z09'),
('Quantitative Aptitude','R.S. Aggarwal','978-93-5253-020-3','Aptitude','General','S Chand','Rev',2020,6,6,'GEN-Z10');

-- NOTIFICATIONS for demo users
INSERT INTO notifications (user_id,title,message,type) VALUES
(3,'Welcome to SKCET Library!','Your library account is active. You can now borrow up to 3 books.','success'),
(3,'Library Hours','Library is open Mon-Sat 8AM to 8PM. Sunday 10AM to 4PM.','info'),
(4,'Welcome to SKCET Library!','Your library account is active. You can now borrow up to 3 books.','success'),
(5,'Welcome to SKCET Library!','Your library account is active. You can now borrow up to 3 books.','success');

SELECT CONCAT('✅ Setup complete! Books: ', (SELECT COUNT(*) FROM books), ' across ', (SELECT COUNT(DISTINCT department) FROM books), ' departments. Users: ', (SELECT COUNT(*) FROM users)) AS status;
