-- ============================================================
-- TIPL Fantasy Cricket — Seed Data (IPL 2026)
-- ============================================================

-- ============================================================
-- 10 IPL TEAMS
-- ============================================================
INSERT INTO teams (id, name, short_name, color) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Chennai Super Kings',       'CSK',  '#FDB913'),
  ('a1000001-0000-0000-0000-000000000002', 'Delhi Capitals',            'DC',   '#004C93'),
  ('a1000001-0000-0000-0000-000000000003', 'Gujarat Titans',            'GT',   '#1C1C1C'),
  ('a1000001-0000-0000-0000-000000000004', 'Kolkata Knight Riders',     'KKR',  '#3A225D'),
  ('a1000001-0000-0000-0000-000000000005', 'Lucknow Super Giants',      'LSG',  '#A72056'),
  ('a1000001-0000-0000-0000-000000000006', 'Mumbai Indians',            'MI',   '#004BA0'),
  ('a1000001-0000-0000-0000-000000000007', 'Rajasthan Royals',          'RR',   '#EA1A85'),
  ('a1000001-0000-0000-0000-000000000008', 'Royal Challengers Bengaluru','RCB', '#EC1C24'),
  ('a1000001-0000-0000-0000-000000000009', 'Sunrisers Hyderabad',       'SRH',  '#FF822A'),
  ('a1000001-0000-0000-0000-000000000010', 'Punjab Kings',              'PBKS', '#ED1B24');

-- ============================================================
-- PLAYERS — IPL 2026 Squads (15-16 per team)
-- ============================================================

-- CSK — Chennai Super Kings
INSERT INTO players (name, team_id, role, is_active, credit_cost) VALUES
('Ruturaj Gaikwad',    'a1000001-0000-0000-0000-000000000001', 'BAT',  true,  9.5),
('MS Dhoni',           'a1000001-0000-0000-0000-000000000001', 'WK',   true,  9.0),
('Sanju Samson',       'a1000001-0000-0000-0000-000000000001', 'WK',   true,  9.5),
('Urvil Patel',        'a1000001-0000-0000-0000-000000000001', 'WK',   true,  7.5),
('Dewald Brevis',      'a1000001-0000-0000-0000-000000000001', 'BAT',  true,  8.0),
('Ayush Mhatre',       'a1000001-0000-0000-0000-000000000001', 'BAT',  true,  8.5),
('Shivam Dube',        'a1000001-0000-0000-0000-000000000001', 'AR',   true,  8.5),
('Jamie Overton',      'a1000001-0000-0000-0000-000000000001', 'AR',   true,  7.5),
('Anshul Kamboj',      'a1000001-0000-0000-0000-000000000001', 'AR',   true,  7.5),
('Khaleel Ahmed',      'a1000001-0000-0000-0000-000000000001', 'BOWL', true,  8.0),
('Noor Ahmed',         'a1000001-0000-0000-0000-000000000001', 'BOWL', true,  8.0),
('Nathan Ellis',       'a1000001-0000-0000-0000-000000000001', 'BOWL', true,  7.5),
('Rahul Chahar',       'a1000001-0000-0000-0000-000000000001', 'BOWL', true,  7.5),
('Shreyas Gopal',      'a1000001-0000-0000-0000-000000000001', 'BOWL', true,  7.0),
('Mukesh Choudhary',   'a1000001-0000-0000-0000-000000000001', 'BOWL', true,  7.0);

-- DC — Delhi Capitals
INSERT INTO players (name, team_id, role, is_active, credit_cost) VALUES
('KL Rahul',           'a1000001-0000-0000-0000-000000000002', 'BAT',  true,  9.5),
('Abishek Porel',      'a1000001-0000-0000-0000-000000000002', 'WK',   true,  7.5),
('Tristan Stubbs',     'a1000001-0000-0000-0000-000000000002', 'BAT',  true,  8.0),
('Nitish Rana',        'a1000001-0000-0000-0000-000000000002', 'BAT',  true,  8.0),
('Pathum Nissanka',    'a1000001-0000-0000-0000-000000000002', 'BAT',  true,  8.0),
('Ben Duckett',        'a1000001-0000-0000-0000-000000000002', 'BAT',  true,  8.5),
('David Miller',       'a1000001-0000-0000-0000-000000000002', 'BAT',  true,  8.5),
('Ashutosh Sharma',    'a1000001-0000-0000-0000-000000000002', 'BAT',  true,  7.5),
('Axar Patel',         'a1000001-0000-0000-0000-000000000002', 'AR',   true,  9.5),
('Sameer Rizvi',       'a1000001-0000-0000-0000-000000000002', 'AR',   true,  8.0),
('Kyle Jamieson',      'a1000001-0000-0000-0000-000000000002', 'AR',   true,  8.0),
('Kuldeep Yadav',      'a1000001-0000-0000-0000-000000000002', 'BOWL', true,  9.0),
('Mitchell Starc',     'a1000001-0000-0000-0000-000000000002', 'BOWL', true,  9.0),
('T Natarajan',        'a1000001-0000-0000-0000-000000000002', 'BOWL', true,  8.0),
('Mukesh Kumar',       'a1000001-0000-0000-0000-000000000002', 'BOWL', true,  7.5);

-- GT — Gujarat Titans
INSERT INTO players (name, team_id, role, is_active, credit_cost) VALUES
('Shubman Gill',       'a1000001-0000-0000-0000-000000000003', 'BAT',  true, 10.0),
('Sai Sudharsan',      'a1000001-0000-0000-0000-000000000003', 'BAT',  true,  9.0),
('Jos Buttler',        'a1000001-0000-0000-0000-000000000003', 'BAT',  true,  9.5),
('Tom Banton',         'a1000001-0000-0000-0000-000000000003', 'BAT',  true,  7.5),
('Anuj Rawat',         'a1000001-0000-0000-0000-000000000003', 'WK',   true,  7.5),
('Kumar Kushagra',     'a1000001-0000-0000-0000-000000000003', 'WK',   true,  7.5),
('Rashid Khan',        'a1000001-0000-0000-0000-000000000003', 'AR',   true, 10.0),
('Washington Sundar',  'a1000001-0000-0000-0000-000000000003', 'AR',   true,  8.5),
('Rahul Tewatia',      'a1000001-0000-0000-0000-000000000003', 'AR',   true,  8.0),
('Shahrukh Khan',      'a1000001-0000-0000-0000-000000000003', 'AR',   true,  8.0),
('Jayant Yadav',       'a1000001-0000-0000-0000-000000000003', 'AR',   true,  7.5),
('Jason Holder',       'a1000001-0000-0000-0000-000000000003', 'AR',   true,  8.0),
('Kagiso Rabada',      'a1000001-0000-0000-0000-000000000003', 'BOWL', true,  9.5),
('Mohammed Siraj',     'a1000001-0000-0000-0000-000000000003', 'BOWL', true,  9.0),
('Prasidh Krishna',    'a1000001-0000-0000-0000-000000000003', 'BOWL', true,  8.5),
('R Sai Kishore',      'a1000001-0000-0000-0000-000000000003', 'BOWL', true,  7.5);

-- KKR — Kolkata Knight Riders
INSERT INTO players (name, team_id, role, is_active, credit_cost) VALUES
('Ajinkya Rahane',        'a1000001-0000-0000-0000-000000000004', 'BAT',  true,  8.5),
('Angkrish Raghuvanshi',  'a1000001-0000-0000-0000-000000000004', 'BAT',  true,  7.5),
('Fin Allen',             'a1000001-0000-0000-0000-000000000004', 'WK',   true,  8.0),
('Tim Seifert',           'a1000001-0000-0000-0000-000000000004', 'WK',   true,  7.0),
('Rinku Singh',           'a1000001-0000-0000-0000-000000000004', 'AR',   true,  9.0),
('Sunil Narine',          'a1000001-0000-0000-0000-000000000004', 'AR',   true,  9.5),
('Cameron Green',         'a1000001-0000-0000-0000-000000000004', 'AR',   true,  9.5),
('Rachin Ravindra',       'a1000001-0000-0000-0000-000000000004', 'AR',   true,  8.5),
('Ramandeep Singh',       'a1000001-0000-0000-0000-000000000004', 'AR',   true,  7.5),
('Varun Chakravarthy',    'a1000001-0000-0000-0000-000000000004', 'BOWL', true,  9.0),
('Harshit Rana',          'a1000001-0000-0000-0000-000000000004', 'BOWL', true,  8.5),
('Vaibhav Arora',         'a1000001-0000-0000-0000-000000000004', 'BOWL', true,  7.5),
('Matheesha Pathirana',   'a1000001-0000-0000-0000-000000000004', 'BOWL', true,  8.5),
('Mustafizur Rahman',     'a1000001-0000-0000-0000-000000000004', 'BOWL', true,  8.0),
('Akash Deep',            'a1000001-0000-0000-0000-000000000004', 'BOWL', true,  8.0);

-- LSG — Lucknow Super Giants
INSERT INTO players (name, team_id, role, is_active, credit_cost) VALUES
('Rishabh Pant',       'a1000001-0000-0000-0000-000000000005', 'WK',   true, 10.0),
('Nicholas Pooran',    'a1000001-0000-0000-0000-000000000005', 'WK',   true,  8.5),
('Aiden Markram',      'a1000001-0000-0000-0000-000000000005', 'BAT',  true,  8.5),
('Mitchell Marsh',     'a1000001-0000-0000-0000-000000000005', 'BAT',  true,  8.5),
('Ayush Badoni',       'a1000001-0000-0000-0000-000000000005', 'BAT',  true,  7.5),
('Abdul Samad',        'a1000001-0000-0000-0000-000000000005', 'AR',   true,  7.5),
('Wanindu Hasaranga',  'a1000001-0000-0000-0000-000000000005', 'AR',   true,  9.0),
('Shahbaz Ahmed',      'a1000001-0000-0000-0000-000000000005', 'AR',   true,  7.5),
('Krunal Pandya',      'a1000001-0000-0000-0000-000000000005', 'AR',   true,  8.0),
('Mohammed Shami',     'a1000001-0000-0000-0000-000000000005', 'BOWL', true,  9.5),
('Avesh Khan',         'a1000001-0000-0000-0000-000000000005', 'BOWL', true,  8.0),
('Mohsin Khan',        'a1000001-0000-0000-0000-000000000005', 'BOWL', true,  7.5),
('Mayank Yadav',       'a1000001-0000-0000-0000-000000000005', 'BOWL', true,  8.5),
('Digvesh Rathi',      'a1000001-0000-0000-0000-000000000005', 'BOWL', true,  7.0),
('Naveen ul Haq',      'a1000001-0000-0000-0000-000000000005', 'BOWL', true,  7.5);

-- MI — Mumbai Indians
INSERT INTO players (name, team_id, role, is_active, credit_cost) VALUES
('Rohit Sharma',       'a1000001-0000-0000-0000-000000000006', 'BAT',  true, 10.0),
('Suryakumar Yadav',   'a1000001-0000-0000-0000-000000000006', 'BAT',  true, 10.0),
('Tilak Varma',        'a1000001-0000-0000-0000-000000000006', 'BAT',  true,  9.5),
('Will Jacks',         'a1000001-0000-0000-0000-000000000006', 'BAT',  true,  8.5),
('Ryan Rickleton',     'a1000001-0000-0000-0000-000000000006', 'BAT',  true,  8.0),
('Naman Dhir',         'a1000001-0000-0000-0000-000000000006', 'BAT',  true,  7.5),
('Quinton de Kock',    'a1000001-0000-0000-0000-000000000006', 'WK',   true,  9.0),
('Robin Minz',         'a1000001-0000-0000-0000-000000000006', 'WK',   true,  7.0),
('Hardik Pandya',      'a1000001-0000-0000-0000-000000000006', 'AR',   true, 10.0),
('Mitchell Santner',   'a1000001-0000-0000-0000-000000000006', 'AR',   true,  8.0),
('Shardul Thakur',     'a1000001-0000-0000-0000-000000000006', 'AR',   true,  8.0),
('Corbin Bosch',       'a1000001-0000-0000-0000-000000000006', 'AR',   true,  7.5),
('Jasprit Bumrah',     'a1000001-0000-0000-0000-000000000006', 'BOWL', true, 10.0),
('Trent Boult',        'a1000001-0000-0000-0000-000000000006', 'BOWL', true,  9.0),
('Deepak Chahar',      'a1000001-0000-0000-0000-000000000006', 'BOWL', true,  8.0);

-- RR — Rajasthan Royals
INSERT INTO players (name, team_id, role, is_active, credit_cost) VALUES
('Yashasvi Jaiswal',      'a1000001-0000-0000-0000-000000000007', 'BAT',  true, 10.0),
('Shimron Hetmyer',       'a1000001-0000-0000-0000-000000000007', 'BAT',  true,  8.5),
('Vaibhav Suryavanshi',   'a1000001-0000-0000-0000-000000000007', 'BAT',  true,  8.0),
('Shubham Dubey',         'a1000001-0000-0000-0000-000000000007', 'BAT',  true,  7.5),
('Dhruv Jurel',           'a1000001-0000-0000-0000-000000000007', 'WK',   true,  8.5),
('Aman Rao',              'a1000001-0000-0000-0000-000000000007', 'WK',   true,  7.0),
('Riyan Parag',           'a1000001-0000-0000-0000-000000000007', 'AR',   true,  9.0),
('Ravindra Jadeja',       'a1000001-0000-0000-0000-000000000007', 'AR',   true, 10.0),
('Sam Curran',            'a1000001-0000-0000-0000-000000000007', 'AR',   true,  9.0),
('Lhuan-Dre Pretorius',   'a1000001-0000-0000-0000-000000000007', 'AR',   true,  7.5),
('Jofra Archer',          'a1000001-0000-0000-0000-000000000007', 'BOWL', true, 10.0),
('Ravi Bishnoi',          'a1000001-0000-0000-0000-000000000007', 'BOWL', true,  8.5),
('Sandeep Sharma',        'a1000001-0000-0000-0000-000000000007', 'BOWL', true,  7.5),
('Tushar Deshpande',      'a1000001-0000-0000-0000-000000000007', 'BOWL', true,  7.5),
('Nandre Burger',         'a1000001-0000-0000-0000-000000000007', 'BOWL', true,  7.5);

-- RCB — Royal Challengers Bengaluru
INSERT INTO players (name, team_id, role, is_active, credit_cost) VALUES
('Virat Kohli',        'a1000001-0000-0000-0000-000000000008', 'BAT',  true, 10.0),
('Rajat Patidar',      'a1000001-0000-0000-0000-000000000008', 'BAT',  true,  9.0),
('Phil Salt',          'a1000001-0000-0000-0000-000000000008', 'BAT',  true,  8.5),
('Venkatesh Iyer',     'a1000001-0000-0000-0000-000000000008', 'BAT',  true,  9.0),
('Jitesh Sharma',      'a1000001-0000-0000-0000-000000000008', 'WK',   true,  8.5),
('Tim David',          'a1000001-0000-0000-0000-000000000008', 'AR',   true,  8.5),
('Romario Shepherd',   'a1000001-0000-0000-0000-000000000008', 'AR',   true,  8.0),
('Swapnil Singh',      'a1000001-0000-0000-0000-000000000008', 'AR',   true,  7.0),
('Luyanda Dlamini',    'a1000001-0000-0000-0000-000000000008', 'BOWL', true,  7.0),
('Bhuvneshwar Kumar',  'a1000001-0000-0000-0000-000000000008', 'BOWL', true,  8.5),
('Josh Hazlewood',     'a1000001-0000-0000-0000-000000000008', 'BOWL', true,  9.0),
('Yash Dayal',         'a1000001-0000-0000-0000-000000000008', 'BOWL', true,  8.0),
('Suyash Sharma',      'a1000001-0000-0000-0000-000000000008', 'BOWL', true,  7.5),
('Jacob Duffy',        'a1000001-0000-0000-0000-000000000008', 'BOWL', true,  7.5),
('Mangesh Yadav',      'a1000001-0000-0000-0000-000000000008', 'BOWL', true,  7.0);

-- SRH — Sunrisers Hyderabad
INSERT INTO players (name, team_id, role, is_active, credit_cost) VALUES
('Travis Head',           'a1000001-0000-0000-0000-000000000009', 'BAT',  true, 10.0),
('Abhishek Sharma',       'a1000001-0000-0000-0000-000000000009', 'BAT',  true,  9.0),
('Ishan Kishan',          'a1000001-0000-0000-0000-000000000009', 'WK',   true,  9.5),
('Heinrich Klaasen',      'a1000001-0000-0000-0000-000000000009', 'WK',   true,  9.5),
('Pat Cummins',           'a1000001-0000-0000-0000-000000000009', 'AR',   true, 10.0),
('Nitish Kumar Reddy',    'a1000001-0000-0000-0000-000000000009', 'AR',   true,  9.0),
('Kamindu Mendis',        'a1000001-0000-0000-0000-000000000009', 'AR',   true,  8.5),
('Liam Livingstone',      'a1000001-0000-0000-0000-000000000009', 'AR',   true,  8.5),
('Zeeshan Ansari',        'a1000001-0000-0000-0000-000000000009', 'AR',   true,  7.0),
('R Smaran',              'a1000001-0000-0000-0000-000000000009', 'BAT',  true,  7.0),
('Aniket Verma',          'a1000001-0000-0000-0000-000000000009', 'BAT',  true,  7.0),
('Harshal Patel',         'a1000001-0000-0000-0000-000000000009', 'BOWL', true,  8.5),
('Brydon Carse',          'a1000001-0000-0000-0000-000000000009', 'BOWL', true,  8.0),
('Jaydev Unadkat',        'a1000001-0000-0000-0000-000000000009', 'BOWL', true,  7.5),
('Eshan Malinga',         'a1000001-0000-0000-0000-000000000009', 'BOWL', true,  7.0);

-- PBKS — Punjab Kings
INSERT INTO players (name, team_id, role, is_active, credit_cost) VALUES
('Shreyas Iyer',         'a1000001-0000-0000-0000-000000000010', 'BAT',  true,  9.5),
('Nehal Wadhera',        'a1000001-0000-0000-0000-000000000010', 'BAT',  true,  8.0),
('Shashank Singh',       'a1000001-0000-0000-0000-000000000010', 'BAT',  true,  8.0),
('Priyansh Arya',        'a1000001-0000-0000-0000-000000000010', 'BAT',  true,  8.0),
('Prabhsimran Singh',    'a1000001-0000-0000-0000-000000000010', 'WK',   true,  8.0),
('Marcus Stoinis',       'a1000001-0000-0000-0000-000000000010', 'AR',   true,  8.5),
('Marco Jansen',         'a1000001-0000-0000-0000-000000000010', 'AR',   true,  8.5),
('Azmatullah Omarzai',   'a1000001-0000-0000-0000-000000000010', 'AR',   true,  8.0),
('Musheer Khan',         'a1000001-0000-0000-0000-000000000010', 'AR',   true,  7.5),
('Harpreet Brar',        'a1000001-0000-0000-0000-000000000010', 'AR',   true,  7.5),
('Arshdeep Singh',       'a1000001-0000-0000-0000-000000000010', 'BOWL', true,  9.5),
('Yuzvendra Chahal',     'a1000001-0000-0000-0000-000000000010', 'BOWL', true,  9.0),
('Vyshak Vijaykumar',    'a1000001-0000-0000-0000-000000000010', 'BOWL', true,  8.0),
('Lockie Ferguson',      'a1000001-0000-0000-0000-000000000010', 'BOWL', true,  8.0),
('Xavier Bartlett',      'a1000001-0000-0000-0000-000000000010', 'BOWL', true,  7.5);

-- ============================================================
-- HOWSTAT IDs (for player stats sync)
-- Matched by player name — players not found on howstat are left NULL
-- ============================================================

-- CSK
UPDATE players SET howstat_id = 4931 WHERE name = 'Ruturaj Gaikwad' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3243 WHERE name = 'MS Dhoni' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4099 WHERE name = 'Sanju Samson' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6517 WHERE name = 'Dewald Brevis' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4945 WHERE name = 'Shivam Dube' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6665 WHERE name = 'Jamie Overton' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7760 WHERE name = 'Anshul Kamboj' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4539 WHERE name = 'Khaleel Ahmed' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6536 WHERE name = 'Noor Ahmed' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6082 WHERE name = 'Nathan Ellis' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4670 WHERE name = 'Rahul Chahar' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4378 WHERE name = 'Shreyas Gopal' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6507 WHERE name = 'Mukesh Choudhary' AND howstat_id IS NULL;

-- DC
UPDATE players SET howstat_id = 4137 WHERE name = 'KL Rahul' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7230 WHERE name = 'Abishek Porel' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6607 WHERE name = 'Tristan Stubbs' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4400 WHERE name = 'Nitish Rana' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3783 WHERE name = 'David Miller' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7764 WHERE name = 'Ashutosh Sharma' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4310 WHERE name = 'Axar Patel' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7749 WHERE name = 'Sameer Rizvi' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5774 WHERE name = 'Kyle Jamieson' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4652 WHERE name = 'Kuldeep Yadav' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3830 WHERE name = 'Mitchell Starc' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4664 WHERE name = 'T Natarajan' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7228 WHERE name = 'Mukesh Kumar' AND howstat_id IS NULL;

-- GT
UPDATE players SET howstat_id = 4769 WHERE name = 'Shubman Gill' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6535 WHERE name = 'Sai Sudharsan' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3888 WHERE name = 'Jos Buttler' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5660 WHERE name = 'Tom Banton' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5858 WHERE name = 'Anuj Rawat' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7752 WHERE name = 'Kumar Kushagra' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4484 WHERE name = 'Rashid Khan' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4684 WHERE name = 'Washington Sundar' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4379 WHERE name = 'Rahul Tewatia' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5976 WHERE name = 'Shahrukh Khan' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4390 WHERE name = 'Jayant Yadav' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3998 WHERE name = 'Jason Holder' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4339 WHERE name = 'Kagiso Rabada' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4675 WHERE name = 'Mohammed Siraj' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4930 WHERE name = 'Prasidh Krishna' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5846 WHERE name = 'R Sai Kishore' AND howstat_id IS NULL;

-- KKR
UPDATE players SET howstat_id = 3889 WHERE name = 'Ajinkya Rahane' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7757 WHERE name = 'Angkrish Raghuvanshi' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4826 WHERE name = 'Fin Allen' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4665 WHERE name = 'Rinku Singh' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3922 WHERE name = 'Sunil Narine' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5926 WHERE name = 'Cameron Green' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6150 WHERE name = 'Rachin Ravindra' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6523 WHERE name = 'Ramandeep Singh' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4738 WHERE name = 'Varun Chakravarthy' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6570 WHERE name = 'Harshit Rana' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5970 WHERE name = 'Vaibhav Arora' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6613 WHERE name = 'Matheesha Pathirana' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4414 WHERE name = 'Mustafizur Rahman' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6533 WHERE name = 'Akash Deep' AND howstat_id IS NULL;

-- LSG
UPDATE players SET howstat_id = 4542 WHERE name = 'Rishabh Pant' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4587 WHERE name = 'Nicholas Pooran' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4701 WHERE name = 'Aiden Markram' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3912 WHERE name = 'Mitchell Marsh' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6538 WHERE name = 'Ayush Badoni' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5863 WHERE name = 'Abdul Samad' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4696 WHERE name = 'Wanindu Hasaranga' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5861 WHERE name = 'Shahbaz Ahmed' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4552 WHERE name = 'Krunal Pandya' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3993 WHERE name = 'Mohammed Shami' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4673 WHERE name = 'Avesh Khan' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4773 WHERE name = 'Mohsin Khan' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4590 WHERE name = 'Naveen ul Haq' AND howstat_id IS NULL;

-- MI
UPDATE players SET howstat_id = 3474 WHERE name = 'Rohit Sharma' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4073 WHERE name = 'Suryakumar Yadav' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6522 WHERE name = 'Tilak Varma' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6922 WHERE name = 'Will Jacks' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7761 WHERE name = 'Naman Dhir' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3988 WHERE name = 'Quinton de Kock' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7754 WHERE name = 'Robin Minz' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4399 WHERE name = 'Hardik Pandya' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4429 WHERE name = 'Mitchell Santner' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4393 WHERE name = 'Shardul Thakur' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 8222 WHERE name = 'Corbin Bosch' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4062 WHERE name = 'Jasprit Bumrah' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3924 WHERE name = 'Trent Boult' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4557 WHERE name = 'Deepak Chahar' AND howstat_id IS NULL;

-- RR
UPDATE players SET howstat_id = 5857 WHERE name = 'Yashasvi Jaiswal' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4681 WHERE name = 'Shimron Hetmyer' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7757 WHERE name = 'Vaibhav Suryavanshi' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7767 WHERE name = 'Shubham Dubey' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6541 WHERE name = 'Dhruv Jurel' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4943 WHERE name = 'Riyan Parag' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3644 WHERE name = 'Ravindra Jadeja' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4787 WHERE name = 'Sam Curran' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4777 WHERE name = 'Jofra Archer' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5851 WHERE name = 'Ravi Bishnoi' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4048 WHERE name = 'Sandeep Sharma' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5849 WHERE name = 'Tushar Deshpande' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7644 WHERE name = 'Nandre Burger' AND howstat_id IS NULL;

-- RCB
UPDATE players SET howstat_id = 3600 WHERE name = 'Virat Kohli' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5980 WHERE name = 'Rajat Patidar' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6038 WHERE name = 'Phil Salt' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5971 WHERE name = 'Venkatesh Iyer' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5332 WHERE name = 'Tim David' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5662 WHERE name = 'Romario Shepherd' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4549 WHERE name = 'Swapnil Singh' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3991 WHERE name = 'Bhuvneshwar Kumar' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3799 WHERE name = 'Josh Hazlewood' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 6537 WHERE name = 'Yash Dayal' AND howstat_id IS NULL;

-- SRH
UPDATE players SET howstat_id = 4386 WHERE name = 'Travis Head' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4756 WHERE name = 'Abhishek Sharma' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4544 WHERE name = 'Ishan Kishan' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4731 WHERE name = 'Heinrich Klaasen' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3909 WHERE name = 'Pat Cummins' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7209 WHERE name = 'Nitish Kumar Reddy' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4827 WHERE name = 'Kamindu Mendis' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4692 WHERE name = 'Liam Livingstone' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4125 WHERE name = 'Harshal Patel' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 3838 WHERE name = 'Jaydev Unadkat' AND howstat_id IS NULL;

-- PBKS
UPDATE players SET howstat_id = 4387 WHERE name = 'Shreyas Iyer' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7224 WHERE name = 'Nehal Wadhera' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4657 WHERE name = 'Shashank Singh' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 8307 WHERE name = 'Priyansh Arya' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4937 WHERE name = 'Prabhsimran Singh' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4389 WHERE name = 'Marcus Stoinis' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5974 WHERE name = 'Marco Jansen' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 5936 WHERE name = 'Azmatullah Omarzai' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4935 WHERE name = 'Harpreet Brar' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4933 WHERE name = 'Arshdeep Singh' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4063 WHERE name = 'Yuzvendra Chahal' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7237 WHERE name = 'Vyshak Vijaykumar' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 4609 WHERE name = 'Lockie Ferguson' AND howstat_id IS NULL;
UPDATE players SET howstat_id = 7663 WHERE name = 'Xavier Bartlett' AND howstat_id IS NULL;
