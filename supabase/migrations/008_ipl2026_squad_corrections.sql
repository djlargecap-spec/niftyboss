-- ============================================================
-- IPL 2026 Squad Corrections & SportMonks ID Mapping
-- Source: All 74 IPL 2026 fixtures fetched from SportMonks API
--         (season_id=1795) + ESPN Cricinfo squad verification
--
-- Two operations per statement:
--   1. cricapi_id = SportMonks player ID (used for scorecard matching)
--   2. team_id corrected where seed data had wrong 2026 team
-- ============================================================

-- Helper: resolve team_id from short_name
-- CSK  = a1000001-0000-0000-0000-000000000001
-- DC   = a1000001-0000-0000-0000-000000000002
-- GT   = a1000001-0000-0000-0000-000000000003
-- KKR  = a1000001-0000-0000-0000-000000000004
-- LSG  = a1000001-0000-0000-0000-000000000005
-- MI   = a1000001-0000-0000-0000-000000000006
-- RR   = a1000001-0000-0000-0000-000000000007
-- RCB  = a1000001-0000-0000-0000-000000000008
-- SRH  = a1000001-0000-0000-0000-000000000009
-- PBKS = a1000001-0000-0000-0000-000000000010

-- ============================================================
-- CSK (SportMonks team_id = 2)
-- ============================================================
UPDATE players SET cricapi_id = '4856', team_id = 'a1000001-0000-0000-0000-000000000001' WHERE name = 'Ruturaj Gaikwad';
UPDATE players SET cricapi_id = '4940', team_id = 'a1000001-0000-0000-0000-000000000001' WHERE name = 'Shivam Dube';
UPDATE players SET cricapi_id = '3491', team_id = 'a1000001-0000-0000-0000-000000000001' WHERE name = 'Jamie Overton';
UPDATE players SET cricapi_id = '322',  team_id = 'a1000001-0000-0000-0000-000000000001' WHERE name = 'Khaleel Ahmed';
UPDATE players SET cricapi_id = '8490', team_id = 'a1000001-0000-0000-0000-000000000001' WHERE name = 'Noor Ahmad';
UPDATE players SET cricapi_id = '53078',team_id = 'a1000001-0000-0000-0000-000000000001' WHERE name = 'Anshul Kamboj';
UPDATE players SET cricapi_id = '31028',team_id = 'a1000001-0000-0000-0000-000000000001' WHERE name = 'Gurjapneet Singh';
-- Sanju Samson moved from RR → CSK for IPL 2026
UPDATE players SET cricapi_id = '2900', team_id = 'a1000001-0000-0000-0000-000000000001' WHERE name = 'Sanju Samson';
-- Rahul Chahar moved from SRH → CSK for IPL 2026
UPDATE players SET cricapi_id = '3296', team_id = 'a1000001-0000-0000-0000-000000000001' WHERE name = 'Rahul Chahar';
-- Matt Henry moved from LSG → CSK for IPL 2026
UPDATE players SET cricapi_id = '214',  team_id = 'a1000001-0000-0000-0000-000000000001' WHERE name = 'Matt Henry';
-- Akeal Hosein, Matthew Short, Sarfaraz Khan, Kartik Sharma, Prashant Veer, Ramakrishna Ghosh
-- are not in seed; skip (squad-only players added via admin if needed)

-- ============================================================
-- DC (SportMonks team_id = 3)
-- ============================================================
UPDATE players SET cricapi_id = '47',   team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'KL Rahul';
UPDATE players SET cricapi_id = '815',  team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'Axar Patel';
UPDATE players SET cricapi_id = '56',   team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'Kuldeep Yadav';
UPDATE players SET cricapi_id = '25797',team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'Tristan Stubbs';
UPDATE players SET cricapi_id = '2912', team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'Karun Nair';
UPDATE players SET cricapi_id = '53087',team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'Ashutosh Sharma';
UPDATE players SET cricapi_id = '23943',team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'Mukesh Kumar';
UPDATE players SET cricapi_id = '170',  team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'Dushmantha Chameera';
UPDATE players SET cricapi_id = '57614',team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'Vipraj Nigam';
UPDATE players SET cricapi_id = '53057',team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'Sameer Rizvi';
UPDATE players SET cricapi_id = '3218', team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'T Natarajan';
-- David Miller moved from LSG → DC for IPL 2026
UPDATE players SET cricapi_id = '79',   team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'David Miller';
-- Lungi Ngidi moved from RCB → DC for IPL 2026
UPDATE players SET cricapi_id = '68',   team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'Lungi Ngidi';
-- Nitish Rana moved from RR → DC for IPL 2026
UPDATE players SET cricapi_id = '2858', team_id = 'a1000001-0000-0000-0000-000000000002' WHERE name = 'Nitish Rana';

-- ============================================================
-- GT (SportMonks team_id = 1976)
-- ============================================================
UPDATE players SET cricapi_id = '3362', team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Shubman Gill';
UPDATE players SET cricapi_id = '306',  team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Rashid Khan';
UPDATE players SET cricapi_id = '28955',team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Sai Sudharsan';
UPDATE players SET cricapi_id = '143',  team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Jos Buttler';
UPDATE players SET cricapi_id = '70',   team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Kagiso Rabada';
UPDATE players SET cricapi_id = '59',   team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Mohammed Siraj';
UPDATE players SET cricapi_id = '3374', team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Prasidh Krishna';
UPDATE players SET cricapi_id = '2927', team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Rahul Tewatia';
UPDATE players SET cricapi_id = '1211', team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Washington Sundar';
UPDATE players SET cricapi_id = '7668', team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Shahrukh Khan';
UPDATE players SET cricapi_id = '2792', team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Jayant Yadav';
UPDATE players SET cricapi_id = '9456', team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Manav Suthar';
UPDATE players SET cricapi_id = '9450', team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Kumar Kushagra';
UPDATE players SET cricapi_id = '9921', team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Anuj Rawat';
UPDATE players SET cricapi_id = '216',  team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Glenn Phillips';
-- Ashok Sharma moved from RR → GT for IPL 2026
UPDATE players SET cricapi_id = '36479',team_id = 'a1000001-0000-0000-0000-000000000003' WHERE name = 'Ashok Sharma';

-- ============================================================
-- KKR (SportMonks team_id = 5)
-- ============================================================
UPDATE players SET cricapi_id = '3215', team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Rinku Singh';
UPDATE players SET cricapi_id = '758',  team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Sunil Narine';
UPDATE players SET cricapi_id = '4877', team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Varun Chakaravarthy';
UPDATE players SET cricapi_id = '35066',team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Angkrish Raghuvanshi';
UPDATE players SET cricapi_id = '24822',team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Ramandeep Singh';
UPDATE players SET cricapi_id = '3350', team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Anukul Roy';
UPDATE players SET cricapi_id = '276',  team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Manish Pandey';
UPDATE players SET cricapi_id = '51',   team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Ajinkya Rahane';
UPDATE players SET cricapi_id = '118',  team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Rovman Powell';
UPDATE players SET cricapi_id = '24882',team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Vaibhav Arora';
UPDATE players SET cricapi_id = '10623',team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Finn Allen';
-- Kartik Tyagi moved from GT → KKR for IPL 2026
UPDATE players SET cricapi_id = '9462', team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Kartik Tyagi';
-- Saurabh Dubey moved from SRH → KKR for IPL 2026
UPDATE players SET cricapi_id = '36512',team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Saurabh Dubey';
-- Venkatesh Iyer moved from KKR → RCB; remove from KKR (handled in RCB block)
-- Rachin Ravindra moved from CSK → KKR (ESPN, not yet in SM XI)
UPDATE players SET team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Rachin Ravindra';
-- Rahul Tripathi moved from CSK → KKR (ESPN)
UPDATE players SET team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Rahul Tripathi';
-- Akash Deep moved from LSG → KKR (ESPN)
UPDATE players SET team_id = 'a1000001-0000-0000-0000-000000000004' WHERE name = 'Akash Deep';
-- Quinton de Kock moved from KKR → MI (ESPN)
-- handled in MI block below

-- ============================================================
-- LSG (SportMonks team_id = 1979)
-- ============================================================
UPDATE players SET cricapi_id = '736',  team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Nicholas Pooran';
UPDATE players SET cricapi_id = '36515',team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Ayush Badoni';
UPDATE players SET cricapi_id = '66',   team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Aiden Markram';
UPDATE players SET cricapi_id = '31',   team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Mitchell Marsh';
UPDATE players SET cricapi_id = '3152', team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Avesh Khan';
UPDATE players SET cricapi_id = '9927', team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Abdul Samad';
UPDATE players SET cricapi_id = '9924', team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Shahbaz Ahmed';
UPDATE players SET cricapi_id = '57616',team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Digvesh Singh';  -- SM name: Digvesh Rathi
UPDATE players SET cricapi_id = '23691',team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Prince Yadav';
-- Rishabh Pant moved from DC → LSG for IPL 2026
UPDATE players SET cricapi_id = '53',   team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Rishabh Pant';
-- Mohammed Shami moved from SRH → LSG for IPL 2026
UPDATE players SET cricapi_id = '57',   team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Mohammed Shami';
-- Anrich Nortje moved from KKR → LSG for IPL 2026
UPDATE players SET cricapi_id = '636',  team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Anrich Nortje';
-- Wanindu Hasaranga moved from RR → LSG (ESPN)
UPDATE players SET team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Wanindu Hasaranga';
-- Arjun Tendulkar moved from MI → LSG (ESPN)
UPDATE players SET team_id = 'a1000001-0000-0000-0000-000000000005' WHERE name = 'Arjun Tendulkar';

-- ============================================================
-- MI (SportMonks team_id = 6)
-- ============================================================
UPDATE players SET cricapi_id = '278',  team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Rohit Sharma';
UPDATE players SET cricapi_id = '284',  team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Jasprit Bumrah';
UPDATE players SET cricapi_id = '2879', team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Suryakumar Yadav';
UPDATE players SET cricapi_id = '281',  team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Hardik Pandya';
UPDATE players SET cricapi_id = '8370', team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Tilak Varma';
UPDATE players SET cricapi_id = '221',  team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Trent Boult';
UPDATE players SET cricapi_id = '53075',team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Naman Dhir';
UPDATE players SET cricapi_id = '39047',team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Robin Minz';
UPDATE players SET cricapi_id = '662',  team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Ryan Rickelton';
UPDATE players SET cricapi_id = '35051',team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Raj Angad Bawa';
UPDATE players SET cricapi_id = '58342',team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Ashwani Kumar';
UPDATE players SET cricapi_id = '40997',team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Allah Ghazanfar';  -- SM name: AM Ghazanfar
UPDATE players SET cricapi_id = '227',  team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Mitchell Santner';
UPDATE players SET cricapi_id = '3347', team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Mayank Markande';
-- Deepak Chahar moved from CSK → MI for IPL 2026
UPDATE players SET cricapi_id = '279',  team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Deepak Chahar';
-- Quinton de Kock moved from KKR → MI (ESPN)
UPDATE players SET team_id = 'a1000001-0000-0000-0000-000000000006' WHERE name = 'Quinton de Kock';
-- Ishan Kishan moved from MI → SRH (handled in SRH block)

-- ============================================================
-- RR (SportMonks team_id = 7)
-- ============================================================
UPDATE players SET cricapi_id = '6820', team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Yashasvi Jaiswal';
UPDATE players SET cricapi_id = '108',  team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Shimron Hetmyer';
UPDATE players SET cricapi_id = '8391', team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Dhruv Jurel';
UPDATE players SET cricapi_id = '2966', team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Sandeep Sharma';
UPDATE players SET cricapi_id = '424',  team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Jofra Archer';
UPDATE players SET cricapi_id = '4922', team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Riyan Parag';
UPDATE players SET cricapi_id = '4346', team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Nandre Burger';
UPDATE players SET cricapi_id = '34355',team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Shubham Dubey';
UPDATE players SET cricapi_id = '57622',team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Vaibhav Suryavanshi';
-- Ravindra Jadeja moved from CSK → RR for IPL 2026
UPDATE players SET cricapi_id = '55',   team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Ravindra Jadeja';
-- Tushar Deshpande moved from CSK → RR for IPL 2026
UPDATE players SET cricapi_id = '6697', team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Tushar Deshpande';
-- Ravi Bishnoi moved from LSG → RR for IPL 2026
UPDATE players SET cricapi_id = '9459', team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Ravi Bishnoi';
-- Donovan Ferreira moved from DC → RR for IPL 2026
UPDATE players SET cricapi_id = '6472', team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Donovan Ferreira';
-- Sam Curran moved from CSK → RR (ESPN)
UPDATE players SET team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Sam Curran';
-- Vignesh Puthur moved from MI → RR (ESPN)
UPDATE players SET team_id = 'a1000001-0000-0000-0000-000000000007' WHERE name = 'Vignesh Puthur';

-- ============================================================
-- RCB (SportMonks team_id = 8)
-- ============================================================
UPDATE players SET cricapi_id = '46',   team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Virat Kohli';
UPDATE players SET cricapi_id = '3431', team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Phil Salt';
UPDATE players SET cricapi_id = '2687', team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Krunal Pandya';
UPDATE players SET cricapi_id = '280',  team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Bhuvneshwar Kumar';
UPDATE players SET cricapi_id = '3092', team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Jitesh Sharma';
UPDATE players SET cricapi_id = '4898', team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Rasikh Salam';
UPDATE players SET cricapi_id = '5222', team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Romario Shepherd';
UPDATE players SET cricapi_id = '26819',team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Jacob Bethell';
UPDATE players SET cricapi_id = '44513',team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Suyash Sharma';
-- Tim David moved from MI → RCB for IPL 2026
UPDATE players SET cricapi_id = '617',  team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Tim David';
-- Venkatesh Iyer moved from KKR → RCB for IPL 2026
UPDATE players SET cricapi_id = '26042',team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Venkatesh Iyer';
-- Rajat Patidar moved from LSG → RCB for IPL 2026
UPDATE players SET cricapi_id = '26027',team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Rajat Patidar';
-- Devdutt Padikkal moved from LSG → RCB for IPL 2026
UPDATE players SET cricapi_id = '4931', team_id = 'a1000001-0000-0000-0000-000000000008' WHERE name = 'Devdutt Padikkal';

-- ============================================================
-- SRH (SportMonks team_id = 9)
-- ============================================================
UPDATE players SET cricapi_id = '65',   team_id = 'a1000001-0000-0000-0000-000000000009' WHERE name = 'Heinrich Klaasen';
UPDATE players SET cricapi_id = '26',   team_id = 'a1000001-0000-0000-0000-000000000009' WHERE name = 'Travis Head';
UPDATE players SET cricapi_id = '3338', team_id = 'a1000001-0000-0000-0000-000000000009' WHERE name = 'Abhishek Sharma';
UPDATE players SET cricapi_id = '22134',team_id = 'a1000001-0000-0000-0000-000000000009' WHERE name = 'Nitish Kumar Reddy';
UPDATE players SET cricapi_id = '2744', team_id = 'a1000001-0000-0000-0000-000000000009' WHERE name = 'Harshal Patel';
UPDATE players SET cricapi_id = '2795', team_id = 'a1000001-0000-0000-0000-000000000009' WHERE name = 'Jaydev Unadkat';
UPDATE players SET cricapi_id = '57680',team_id = 'a1000001-0000-0000-0000-000000000009' WHERE name = 'Zeeshan Ansari';
-- Ishan Kishan moved from MI → SRH for IPL 2026
UPDATE players SET cricapi_id = '3122', team_id = 'a1000001-0000-0000-0000-000000000009' WHERE name = 'Ishan Kishan';
-- Liam Livingstone moved from RCB → SRH for IPL 2026
UPDATE players SET cricapi_id = '780',  team_id = 'a1000001-0000-0000-0000-000000000009' WHERE name = 'Liam Livingstone';
-- Aniket Verma moved from RCB → SRH for IPL 2026
UPDATE players SET cricapi_id = '57681',team_id = 'a1000001-0000-0000-0000-000000000009' WHERE name = 'Aniket Verma';
-- Eshan Malinga moved from RR → SRH for IPL 2026
UPDATE players SET cricapi_id = '48866',team_id = 'a1000001-0000-0000-0000-000000000009' WHERE name = 'Eshan Malinga';
-- Shreyas Gopal moved from SRH → CSK (ESPN CSK squad)
UPDATE players SET team_id = 'a1000001-0000-0000-0000-000000000001' WHERE name = 'Shreyas Gopal';
-- Shivam Mavi not in seed; skip

-- ============================================================
-- PBKS (SportMonks team_id = 4)
-- ============================================================
UPDATE players SET cricapi_id = '2813', team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Shreyas Iyer';
UPDATE players SET cricapi_id = '199',  team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Marcus Stoinis';
UPDATE players SET cricapi_id = '6496', team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Prabhsimran Singh';
UPDATE players SET cricapi_id = '6478', team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Marco Jansen';
UPDATE players SET cricapi_id = '4868', team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Harpreet Brar';
UPDATE players SET cricapi_id = '3167', team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Shashank Singh';
UPDATE players SET cricapi_id = '8373', team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Nehal Wadhera';
UPDATE players SET cricapi_id = '947',  team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Xavier Bartlett';
UPDATE players SET cricapi_id = '6670', team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Suryansh Shedge';
UPDATE players SET cricapi_id = '3053', team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Pravin Dubey';
-- Arshdeep Singh moved from LSG → PBKS for IPL 2026
UPDATE players SET cricapi_id = '4880', team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Arshdeep Singh';
-- Priyansh Arya moved from DC → PBKS for IPL 2026
UPDATE players SET cricapi_id = '57620',team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Priyansh Arya';
-- Vijaykumar Vyshak moved from KKR → PBKS for IPL 2026
UPDATE players SET cricapi_id = '46736',team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Vijaykumar Vyshak';
-- Vishnu Vinod moved from LSG → PBKS for IPL 2026
UPDATE players SET cricapi_id = '3146', team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Vishnu Vinod';
-- Yuzvendra Chahal moved from RR → PBKS for IPL 2026
UPDATE players SET cricapi_id = '273',  team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Yuzvendra Chahal';
-- Yash Thakur moved from LSG → PBKS (ESPN)
UPDATE players SET team_id = 'a1000001-0000-0000-0000-000000000010' WHERE name = 'Yash Thakur';

-- ============================================================
-- Deactivate players NOT in IPL 2026 (confirmed absent from
-- all 74 SportMonks fixtures + ESPN squads)
-- ============================================================
UPDATE players SET is_active = false WHERE name IN (
  'Devon Conway',       -- not retained for IPL 2026
  'Maheesh Theekshana', -- not in IPL 2026
  'Matheesha Pathirana',-- not in IPL 2026
  'Ravichandran Ashwin',-- retired from IPL
  'Andre Russell',      -- not in IPL 2026
  'Moeen Ali',          -- not in IPL 2026
  'Spencer Johnson',    -- not in IPL 2026
  'Rahmanullah Gurbaz', -- not in IPL 2026
  'Gerald Coetzee',     -- not in IPL 2026
  'Matthew Wade',       -- retired
  'Harry Brook',        -- not in IPL 2026
  'Faf du Plessis',     -- not in IPL 2026
  'Jake Fraser-McGurk', -- not in IPL 2026
  'Kamlesh Nagarkoti',  -- not in IPL 2026
  'Vijay Shankar',      -- not in IPL 2026
  'Deepak Hooda',       -- not in IPL 2026
  'Naveen ul Haq',      -- not in IPL 2026
  'David Willey',       -- not in IPL 2026
  'Rilee Rossouw',      -- not in IPL 2026
  'Jonny Bairstow',     -- not in IPL 2026
  'Adam Zampa',         -- not in IPL 2026
  'Fazalhaq Farooqi'    -- not in IPL 2026
);
