/**
 * ResolveIQ Seed Script
 * Creates all demo data for hackathon demonstration.
 * Run: node seeds/seed.js
 * 
 * NOTE: All data is fictional and for demonstration only.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME || 'resolveiq_db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

async function seed() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('✅ Connected to MySQL');

  try {
    await conn.beginTransaction();
    console.log('🗑️  Clearing existing demo data...');

    // Clear in reverse dependency order
    const tables = [
      'audit_logs','notifications','escalation_records','resolution_records',
      'related_complaints','complaint_messages','complaint_internal_notes',
      'complaint_evidence','complaint_status_history','complaint_assignments',
      'complaints','student_profiles','officer_assignments','category_bureau_rules',
      'complaint_categories','institution_aliases','institutions','cells',
      'bureaus','password_reset_tokens','refresh_tokens','users','system_settings','roles'
    ];
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of tables) {
      await conn.execute(`TRUNCATE TABLE ${t}`);
    }
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Tables cleared');

    // ===== ROLES =====
    await conn.execute(`INSERT INTO roles (name, description) VALUES 
      ('super_admin', 'System administrator with full access'),
      ('officer', 'Bureau or cell officer for complaint processing'),
      ('student', 'Student complainant'),
      ('institution_rep', 'Authorized institution representative')`);
    console.log('✅ Roles inserted');

    // ===== BUREAUS =====
    await conn.execute(`INSERT INTO bureaus (name, description, email) VALUES
      ('Academic Affairs Bureau', 'Handles complaints related to academic matters, faculty, and curriculum', 'academic@resolveiq.demo'),
      ('Infrastructure Bureau', 'Handles infrastructure, hostel, lab, and facility complaints', 'infra@resolveiq.demo'),
      ('Fee & Finance Bureau', 'Handles fee irregularities, refunds, and financial disputes', 'finance@resolveiq.demo'),
      ('Examination Bureau', 'Handles examination malpractice and evaluation complaints', 'exam@resolveiq.demo'),
      ('Student Welfare Bureau', 'Handles harassment, ragging, and student welfare complaints', 'welfare@resolveiq.demo')`);
    console.log('✅ Bureaus inserted');

    // ===== CELLS =====
    await conn.execute(`INSERT INTO cells (bureau_id, name, description) VALUES
      (1, 'Faculty Grievance Cell', 'Faculty misconduct and absence complaints'),
      (1, 'Curriculum Review Cell', 'Syllabus and academic irregularity complaints'),
      (2, 'Hostel Cell', 'Hostel and accommodation complaints'),
      (2, 'Lab & Library Cell', 'Laboratory and library facility complaints'),
      (3, 'Fee Refund Cell', 'Fee refund and overcharging complaints'),
      (3, 'Scholarship Cell', 'Scholarship and stipend disputes'),
      (4, 'Examination Conduct Cell', 'Examination irregularity complaints'),
      (4, 'Result & Revaluation Cell', 'Result disputes and revaluation requests'),
      (5, 'Anti-Ragging Cell', 'Ragging and bullying complaints'),
      (5, 'Equal Opportunity Cell', 'Discrimination and harassment complaints')`);
    console.log('✅ Cells inserted');

    // ===== CATEGORIES =====
    await conn.execute(`INSERT INTO complaint_categories (name, description, keywords, default_deadline_days) VALUES
      ('Academic Issues', 'Problems with academic processes, results, attendance', 'result,marks,grade,semester,attendance,professor,teaching,syllabus,curriculum,backlog,revaluation', 30),
      ('Fee Irregularities', 'Issues with fee collection, refunds, and financial matters', 'fee,fees,tuition,refund,receipt,payment,scholarship,overcharged,capitation,donation', 21),
      ('Infrastructure Problems', 'Hostel, classroom, lab, canteen, and facility issues', 'hostel,classroom,lab,library,toilet,canteen,food,electricity,water,wifi,internet,transport', 45),
      ('Examination Malpractice', 'Cheating, irregularities, and unfair examination practices', 'cheating,malpractice,copying,unfair,paper leak,evaluation,invigilator,irregularity', 15),
      ('Harassment', 'Ragging, bullying, discrimination, and mental harassment', 'harassment,ragging,bully,threaten,abuse,sexual,pressure,discrimination,caste,gender', 7),
      ('Faculty Misconduct', 'Irregular, absent, or biased faculty behavior', 'faculty,teacher,absent,irregular,biased,favouritism,unprofessional,misconduct', 21),
      ('Administrative Issues', 'Problems with admissions, documents, and administrative processes', 'admission,document,certificate,migration,noc,registration,administration,principal', 30),
      ('Other', 'Complaints not fitting other categories', '', 45)`);
    console.log('✅ Categories inserted');

    // ===== CATEGORY-BUREAU RULES =====
    await conn.execute(`INSERT INTO category_bureau_rules (category_id, bureau_id, priority) VALUES
      (1, 1, 1), (2, 3, 1), (3, 2, 1), (4, 4, 1),
      (5, 5, 1), (6, 1, 1), (7, 1, 1), (8, 1, 1)`);
    console.log('✅ Category-bureau rules inserted');

    // ===== INSTITUTIONS (fictional, demo) =====
    await conn.execute(`INSERT INTO institutions (name, code, type, state, city, is_demo) VALUES
      ('Delhi Technical Institute of Engineering', 'DTIE-001', 'institute', 'Delhi', 'New Delhi', 1),
      ('Mumbai College of Science and Technology', 'MCST-002', 'college', 'Maharashtra', 'Mumbai', 1),
      ('Bangalore University of Applied Sciences', 'BUAS-003', 'university', 'Karnataka', 'Bangalore', 1),
      ('Hyderabad Polytechnic College', 'HPC-004', 'polytechnic', 'Telangana', 'Hyderabad', 1),
      ('Chennai Institute of Management', 'CIM-005', 'institute', 'Tamil Nadu', 'Chennai', 1)`);
    console.log('✅ Institutions inserted (demo/fictional)');

    // ===== USERS =====
    const SALT = 12;
    const adminHash = await bcrypt.hash('Admin@123456', SALT);
    const officerHash = await bcrypt.hash('Officer@123', SALT);
    const studentHash = await bcrypt.hash('Student@123', SALT);

    // Super Admin
    await conn.execute(`INSERT INTO users (role_id, name, email, password_hash, phone, is_active, email_verified) VALUES
      (1, 'Super Administrator', 'super_admin@resolveiq.demo', ?, '+91-9000000001', 1, 1)`,
      [adminHash]);

    // Officers
    await conn.execute(`INSERT INTO users (role_id, name, email, password_hash, phone, is_active, email_verified) VALUES
      (2, 'Dr. Priya Sharma', 'officer1@resolveiq.demo', ?, '+91-9000000002', 1, 1),
      (2, 'Mr. Rakesh Gupta', 'officer2@resolveiq.demo', ?, '+91-9000000003', 1, 1),
      (2, 'Ms. Anjali Singh', 'officer3@resolveiq.demo', ?, '+91-9000000004', 1, 1),
      (2, 'Dr. Venkat Rao', 'officer4@resolveiq.demo', ?, '+91-9000000005', 1, 1),
      (2, 'Mrs. Meena Patel', 'officer5@resolveiq.demo', ?, '+91-9000000006', 1, 1)`,
      [officerHash, officerHash, officerHash, officerHash, officerHash]);

    // Students
    await conn.execute(`INSERT INTO users (role_id, name, email, password_hash, phone, is_active, email_verified) VALUES
      (3, 'Arjun Mehta', 'student1@resolveiq.demo', ?, '+91-9100000001', 1, 1),
      (3, 'Priya Nair', 'student2@resolveiq.demo', ?, '+91-9100000002', 1, 1),
      (3, 'Ravi Kumar', 'student3@resolveiq.demo', ?, '+91-9100000003', 1, 1),
      (3, 'Sneha Kapoor', 'student4@resolveiq.demo', ?, '+91-9100000004', 1, 1),
      (3, 'Aditya Shah', 'student5@resolveiq.demo', ?, '+91-9100000005', 1, 1)`,
      [studentHash, studentHash, studentHash, studentHash, studentHash]);

    console.log('✅ Users inserted');

    // Get user IDs
    const [users] = await conn.execute(`SELECT id, email FROM users`);
    const uid = {};
    users.forEach(u => { uid[u.email] = u.id; });

    // ===== STUDENT PROFILES =====
    await conn.execute(`INSERT INTO student_profiles (user_id, institution_id, student_id, program) VALUES
      (?, 1, 'DTIE/2021/CS/001', 'B.Tech Computer Science'),
      (?, 2, 'MCST/2022/EC/045', 'B.Tech Electronics'),
      (?, 3, 'BUAS/2021/ME/032', 'B.Tech Mechanical'),
      (?, 4, 'HPC/2022/CE/018', 'Diploma Civil Engineering'),
      (?, 5, 'CIM/2023/MBA/009', 'MBA')`,
      [
        uid['student1@resolveiq.demo'],
        uid['student2@resolveiq.demo'],
        uid['student3@resolveiq.demo'],
        uid['student4@resolveiq.demo'],
        uid['student5@resolveiq.demo'],
      ]
    );

    // ===== OFFICER ASSIGNMENTS =====
    await conn.execute(`INSERT INTO officer_assignments (user_id, bureau_id, cell_id, assigned_by) VALUES
      (?, 1, 1, ?),
      (?, 3, 5, ?),
      (?, 4, 7, ?),
      (?, 5, 9, ?),
      (?, 2, 3, ?)`,
      [
        uid['officer1@resolveiq.demo'], uid['super_admin@resolveiq.demo'],
        uid['officer2@resolveiq.demo'], uid['super_admin@resolveiq.demo'],
        uid['officer3@resolveiq.demo'], uid['super_admin@resolveiq.demo'],
        uid['officer4@resolveiq.demo'], uid['super_admin@resolveiq.demo'],
        uid['officer5@resolveiq.demo'], uid['super_admin@resolveiq.demo'],
      ]
    );
    console.log('✅ Officer assignments inserted');

    // ===== SYSTEM SETTINGS =====
    await conn.execute(`INSERT INTO system_settings (setting_key, setting_value, description) VALUES
      ('default_deadline_days', '30', 'Default number of days to resolve a complaint'),
      ('max_file_size_mb', '10', 'Maximum file upload size in MB'),
      ('ai_service_url', 'http://localhost:8000', 'URL of the local AI service'),
      ('resolution_rate_formula', 'resolved_and_closed / total_excluding_rejected', 'Formula used to calculate resolution rate'),
      ('enable_ai_classification', 'true', 'Enable AI-based complaint classification'),
      ('enable_related_case_detection', 'true', 'Enable AI-based related case detection')`);
    console.log('✅ System settings inserted');

    // ===== COMPLAINTS =====
    // Helper to get date X days ago
    const daysAgo = (d) => {
      const dt = new Date();
      dt.setDate(dt.getDate() - d);
      return dt.toISOString().split('T')[0];
    };
    const deadline = (daysFromNow) => {
      const dt = new Date();
      dt.setDate(dt.getDate() + daysFromNow);
      return dt.toISOString().split('T')[0];
    };

    // Complaint 1: RESOLVED - Academic, Bureau 1, student1, institution 1
    await conn.execute(`INSERT INTO complaints 
      (reference_number, student_id, institution_id, category_id, title, description, 
       status, priority, current_bureau_id, current_cell_id, current_officer_id,
       ai_suggested_category_id, ai_suggested_bureau_id, ai_confidence, ai_suggestion_accepted,
       deadline_date, incident_date, privacy_acknowledged, declaration_acknowledged, created_at)
      VALUES (?, ?, 1, 1, 
      'Wrong marks recorded in semester examination result',
      'I appeared in the 5th semester examination for Computer Science. When the results were declared on the university portal, my marks in the Data Structures subject were recorded as 35 out of 100, whereas I had clearly answered all questions and expected to score at least 65-70. I have my rough work and question paper copy. This appears to be an evaluation error that needs immediate correction before the mark sheets are printed.',
      'RESOLVED', 'HIGH', 1, 1, ?, 1, 1, 0.72, 1, ?, ?, 1, 1, DATE_SUB(NOW(), INTERVAL 45 DAY))`,
      ['CMP-2024-DEMO001', uid['student1@resolveiq.demo'], uid['officer1@resolveiq.demo'], daysAgo(-5), daysAgo(60)]);

    // Complaint 2: UNDER_ACTION - Fee, Bureau 3, student2, institution 2
    await conn.execute(`INSERT INTO complaints 
      (reference_number, student_id, institution_id, category_id, title, description, 
       status, priority, current_bureau_id, current_cell_id, current_officer_id,
       ai_suggested_category_id, ai_suggested_bureau_id, ai_confidence,
       deadline_date, incident_date, is_overdue, privacy_acknowledged, declaration_acknowledged, created_at)
      VALUES (?, ?, 2, 2, 
      'Excess fee collected without proper justification',
      'The college has collected an additional fee of Rs 15,000 from all second-year students in the name of development charges. This was not mentioned in the original admission fee structure or prospectus. When I inquired at the accounts office, they said this is a new management decision and provided no official notice or breakdown. Several students including me have paid this under duress. We request a refund or proper justification with approval from higher authorities.',
      'UNDER_ACTION', 'HIGH', 3, 5, ?, 2, 3, 0.85,
      ?, ?, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 25 DAY))`,
      ['CMP-2024-DEMO002', uid['student2@resolveiq.demo'], uid['officer2@resolveiq.demo'], daysAgo(5), daysAgo(30)]);

    // Complaint 3: UNDER_REVIEW - Harassment, Bureau 5, student3, institution 1
    await conn.execute(`INSERT INTO complaints 
      (reference_number, student_id, institution_id, category_id, title, description, 
       status, priority, current_bureau_id, current_cell_id, current_officer_id,
       deadline_date, incident_date, privacy_acknowledged, declaration_acknowledged, created_at)
      VALUES (?, ?, 1, 5, 
      'Ragging by senior students in hostel',
      'I am a first-year student living in Block C of the hostel. Since the past two weeks, a group of senior students (3rd year) have been subjecting me and three other freshers to various forms of ragging including verbal abuse and sleep deprivation. When reported to the hostel warden on 15th of this month, no action was taken. I fear for my safety and well-being. Specific names and dates can be provided upon request.',
      'UNDER_REVIEW', 'URGENT', 5, 9, ?,
      ?, ?, 1, 1, DATE_SUB(NOW(), INTERVAL 10 DAY))`,
      ['CMP-2024-DEMO003', uid['student3@resolveiq.demo'], uid['officer4@resolveiq.demo'], deadline(7), daysAgo(12)]);

    // Complaint 4: AWAITING_RESPONSE - Infrastructure, Bureau 2, student1, institution 1
    await conn.execute(`INSERT INTO complaints 
      (reference_number, student_id, institution_id, category_id, title, description, 
       status, priority, current_bureau_id, current_cell_id, current_officer_id,
       deadline_date, privacy_acknowledged, declaration_acknowledged, created_at)
      VALUES (?, ?, 1, 3, 
      'Non-functional computers in programming lab',
      'The programming laboratory allocated to 3rd year Computer Science students has 15 computers out of 30 that are non-functional. This has been the case for the past 2 months. Lab sessions are compromised as students have to share computers. The lab instructor has raised this with the department but no action has been taken. We need immediate repair or replacement of the faulty systems as we have practical examinations coming up next month.',
      'AWAITING_RESPONSE', 'MEDIUM', 2, 4, ?,
      ?, 1, 1, DATE_SUB(NOW(), INTERVAL 15 DAY))`,
      ['CMP-2024-DEMO004', uid['student1@resolveiq.demo'], uid['officer5@resolveiq.demo'], deadline(30)]);

    // Complaint 5: REGISTERED - Exam, Bureau 4, student2, institution 2
    await conn.execute(`INSERT INTO complaints 
      (reference_number, student_id, institution_id, category_id, title, description, 
       status, priority, current_bureau_id,
       deadline_date, privacy_acknowledged, declaration_acknowledged, created_at)
      VALUES (?, ?, 2, 4, 
      'Question paper leaked before examination',
      'During the mid-semester examinations held last week, the question paper for the Advanced Mathematics paper was allegedly leaked 2 hours before the exam. Many students had access to the questions beforehand. This was reported to the examination controller but no action was taken and the exam was conducted as scheduled. This creates an unfair advantage and the integrity of the examination is compromised. The exam should be declared null and void and reconduceted.',
      'REGISTERED', 'HIGH', 4,
      ?, 1, 1, DATE_SUB(NOW(), INTERVAL 3 DAY))`,
      ['CMP-2024-DEMO005', uid['student2@resolveiq.demo'], deadline(15)]);

    // Complaint 6: RESOLVED - Fee similar to Complaint 2 (for AI matching demo) - different bureau path
    await conn.execute(`INSERT INTO complaints 
      (reference_number, student_id, institution_id, category_id, title, description, 
       status, priority, current_bureau_id, current_officer_id,
       ai_suggested_category_id, ai_suggested_bureau_id, ai_confidence,
       deadline_date, incident_date, privacy_acknowledged, declaration_acknowledged, created_at)
      VALUES (?, ?, 2, 2, 
      'Unauthorized collection of development fees from students',
      'Our college administration has imposed an additional development fee of Rs 12,000 per student for the current academic year. This fee was not part of the original fee structure when we took admission. The college is pressuring students to pay this amount without providing any official documentation or receipt. Multiple students have complained to the principal but we are being told it is approved by management. This appears to be an illegal collection and violates AICTE fee norms.',
      'RESOLVED', 'HIGH', 3, ?,
      2, 3, 0.91,
      ?, ?, 1, 1, DATE_SUB(NOW(), INTERVAL 60 DAY))`,
      ['CMP-2024-DEMO006', uid['student3@resolveiq.demo'], uid['officer2@resolveiq.demo'], daysAgo(-10), daysAgo(65)]);

    // Complaint 7: CLOSED - Academic, student4, institution 3
    await conn.execute(`INSERT INTO complaints 
      (reference_number, student_id, institution_id, category_id, title, description, 
       status, priority, current_bureau_id, current_officer_id,
       deadline_date, privacy_acknowledged, declaration_acknowledged, created_at)
      VALUES (?, ?, 3, 1, 
      'Faculty regularly absent from classes',
      'The professor teaching Thermodynamics has been absent for 8 out of the last 15 scheduled classes. No substitute faculty has been arranged and the syllabus is severely behind schedule. Students are worried about coverage before the semester examinations. Multiple written complaints to the HOD have not resulted in any action.',
      'CLOSED', 'MEDIUM', 1, ?,
      ?, 1, 1, DATE_SUB(NOW(), INTERVAL 90 DAY))`,
      ['CMP-2024-DEMO007', uid['student4@resolveiq.demo'], uid['officer1@resolveiq.demo'], daysAgo(-20)]);

    // Complaint 8: REJECTED - Other, student5, institution 5
    await conn.execute(`INSERT INTO complaints 
      (reference_number, student_id, institution_id, category_id, title, description, 
       status, priority, current_bureau_id, current_officer_id,
       deadline_date, privacy_acknowledged, declaration_acknowledged, created_at)
      VALUES (?, ?, 5, 8, 
      'Canteen food quality and hygiene concerns',
      'The canteen food quality has deteriorated significantly. The food is often served cold, sometimes appears stale, and hygiene standards are poor. This is a serious health concern for students.',
      'REJECTED', 'LOW', 2, ?,
      ?, 1, 1, DATE_SUB(NOW(), INTERVAL 30 DAY))`,
      ['CMP-2024-DEMO008', uid['student5@resolveiq.demo'], uid['officer5@resolveiq.demo'], daysAgo(-5)]);

    // Complaint 9: UNDER_REVIEW - Harassment similar to Complaint 3 (different institution, same type - for AI matching)
    await conn.execute(`INSERT INTO complaints 
      (reference_number, student_id, institution_id, category_id, title, description, 
       status, priority, current_bureau_id, current_officer_id,
       deadline_date, incident_date, privacy_acknowledged, declaration_acknowledged, created_at)
      VALUES (?, ?, 2, 5, 
      'Senior students harassing freshers in college premises',
      'I am a fresher student and have been subjected to ragging and harassment by senior students in the college campus. The seniors are verbally abusing us, forcing us to do errands, and using threatening language. This has been happening for three weeks. I reported to the college anti-ragging committee but received no response. The harassment has caused significant mental distress and I am afraid to attend college.',
      'UNDER_REVIEW', 'URGENT', 5, ?,
      ?, ?, 1, 1, DATE_SUB(NOW(), INTERVAL 5 DAY))`,
      ['CMP-2024-DEMO009', uid['student4@resolveiq.demo'], uid['officer4@resolveiq.demo'], deadline(7), daysAgo(6)]);

    // Complaint 10: REGISTERED - overdue
    const overdueDeadline = daysAgo(5); // 5 days PAST deadline
    await conn.execute(`INSERT INTO complaints 
      (reference_number, student_id, institution_id, category_id, title, description, 
       status, priority, current_bureau_id, current_officer_id, is_overdue,
       deadline_date, privacy_acknowledged, declaration_acknowledged, created_at)
      VALUES (?, ?, 3, 6, 
      'Professor giving failing grades due to personal bias',
      'The professor teaching Software Engineering has been systematically giving lower grades to a group of students who raised concerns about his teaching method in a student feedback form. Students who submitted critical feedback have received grades 15-20 marks lower than those who gave positive feedback, despite similar quality of work. This appears to be deliberate retaliation.',
      'UNDER_ACTION', 'HIGH', 1, ?, 1,
      ?, 1, 1, DATE_SUB(NOW(), INTERVAL 40 DAY))`,
      ['CMP-2024-DEMO010', uid['student5@resolveiq.demo'], uid['officer1@resolveiq.demo'], overdueDeadline]);

    console.log('✅ Complaints inserted');

    // Get complaint IDs
    const [comps] = await conn.execute(`SELECT id, reference_number FROM complaints ORDER BY id`);
    const cid = {};
    comps.forEach(c => { cid[c.reference_number] = c.id; });

    // ===== COMPLAINT ASSIGNMENTS =====
    const assignParams = [
      [cid['CMP-2024-DEMO001'], 1, 1, uid['officer1@resolveiq.demo'], uid['super_admin@resolveiq.demo'], null],
      [cid['CMP-2024-DEMO002'], 3, 5, uid['officer2@resolveiq.demo'], uid['super_admin@resolveiq.demo'], null],
      [cid['CMP-2024-DEMO003'], 5, 9, uid['officer4@resolveiq.demo'], uid['super_admin@resolveiq.demo'], null],
      [cid['CMP-2024-DEMO004'], 2, 4, uid['officer5@resolveiq.demo'], uid['super_admin@resolveiq.demo'], null],
      [cid['CMP-2024-DEMO005'], 4, null, null, uid['super_admin@resolveiq.demo'], null],
      [cid['CMP-2024-DEMO006'], 3, 5, uid['officer2@resolveiq.demo'], uid['super_admin@resolveiq.demo'], null],
      [cid['CMP-2024-DEMO007'], 1, 1, uid['officer1@resolveiq.demo'], uid['super_admin@resolveiq.demo'], null],
      [cid['CMP-2024-DEMO008'], 2, 3, uid['officer5@resolveiq.demo'], uid['super_admin@resolveiq.demo'], null],
      [cid['CMP-2024-DEMO009'], 5, 9, uid['officer4@resolveiq.demo'], uid['super_admin@resolveiq.demo'], null],
      [cid['CMP-2024-DEMO010'], 1, 1, uid['officer1@resolveiq.demo'], uid['super_admin@resolveiq.demo'], 'Escalated due to overdue status'],
    ];
    for (const a of assignParams) {
      await conn.execute(
        `INSERT INTO complaint_assignments (complaint_id, bureau_id, cell_id, officer_id, assigned_by, transfer_reason) VALUES (?, ?, ?, ?, ?, ?)`,
        a
      );
    }
    console.log('✅ Complaint assignments inserted');

    // ===== STATUS HISTORY =====
    const sAdmin = uid['super_admin@resolveiq.demo'];
    const o1 = uid['officer1@resolveiq.demo'];
    const o2 = uid['officer2@resolveiq.demo'];
    const o4 = uid['officer4@resolveiq.demo'];
    const s1 = uid['student1@resolveiq.demo'];
    const s2 = uid['student2@resolveiq.demo'];
    const s3 = uid['student3@resolveiq.demo'];

    const statusHistories = [
      // Complaint 1 - full resolved journey
      [cid['CMP-2024-DEMO001'], null, 'REGISTERED', s1, 'Complaint submitted', 45],
      [cid['CMP-2024-DEMO001'], 'REGISTERED', 'UNDER_REVIEW', sAdmin, 'Assigned to Academic Affairs Bureau', 43],
      [cid['CMP-2024-DEMO001'], 'UNDER_REVIEW', 'UNDER_ACTION', o1, 'Evidence reviewed, investigation started', 40],
      [cid['CMP-2024-DEMO001'], 'UNDER_ACTION', 'AWAITING_RESPONSE', o1, 'Awaiting revaluation report from department', 35],
      [cid['CMP-2024-DEMO001'], 'AWAITING_RESPONSE', 'UNDER_ACTION', s1, 'Student provided additional documents', 30],
      [cid['CMP-2024-DEMO001'], 'UNDER_ACTION', 'RESOLVED', o1, 'Revaluation completed, marks corrected', 5],
      // Complaint 2
      [cid['CMP-2024-DEMO002'], null, 'REGISTERED', s2, 'Complaint submitted', 25],
      [cid['CMP-2024-DEMO002'], 'REGISTERED', 'UNDER_REVIEW', sAdmin, 'Assigned to Fee Bureau', 23],
      [cid['CMP-2024-DEMO002'], 'UNDER_REVIEW', 'UNDER_ACTION', o2, 'Fee records being verified', 20],
      // Complaint 3
      [cid['CMP-2024-DEMO003'], null, 'REGISTERED', s3, 'Complaint submitted', 10],
      [cid['CMP-2024-DEMO003'], 'REGISTERED', 'UNDER_REVIEW', sAdmin, 'Assigned to Student Welfare Bureau — urgent', 9],
      // Complaint 6 - resolved
      [cid['CMP-2024-DEMO006'], null, 'REGISTERED', s3, 'Complaint submitted', 60],
      [cid['CMP-2024-DEMO006'], 'REGISTERED', 'UNDER_REVIEW', sAdmin, 'Assigned to Fee Bureau', 58],
      [cid['CMP-2024-DEMO006'], 'UNDER_REVIEW', 'UNDER_ACTION', o2, 'Fee structure document requested from college', 50],
      [cid['CMP-2024-DEMO006'], 'UNDER_ACTION', 'RESOLVED', o2, 'College directed to refund unauthorized charges', 10],
      // Complaint 7 - closed
      [cid['CMP-2024-DEMO007'], null, 'REGISTERED', uid['student4@resolveiq.demo'], 'Complaint submitted', 90],
      [cid['CMP-2024-DEMO007'], 'REGISTERED', 'UNDER_REVIEW', sAdmin, 'Assigned to Academic Bureau', 88],
      [cid['CMP-2024-DEMO007'], 'UNDER_REVIEW', 'RESOLVED', o1, 'Faculty attendance regularized by HOD', 60],
      [cid['CMP-2024-DEMO007'], 'RESOLVED', 'CLOSED', sAdmin, 'Student confirmed resolution, closing', 20],
      // Complaint 8 - rejected
      [cid['CMP-2024-DEMO008'], null, 'REGISTERED', uid['student5@resolveiq.demo'], 'Complaint submitted', 30],
      [cid['CMP-2024-DEMO008'], 'REGISTERED', 'REJECTED', o2, 'Canteen quality not under AICTE jurisdiction; directed to institution grievance cell', 28],
    ];

    for (const [cmpId, prev, next, actorId, reason, daysAgoNum] of statusHistories) {
      await conn.execute(
        `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, reason, created_at)
         VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [cmpId, prev, next, actorId, reason, daysAgoNum]
      );
    }
    console.log('✅ Status history inserted');

    // ===== RESOLUTION RECORDS =====
    await conn.execute(`INSERT INTO resolution_records 
      (complaint_id, resolved_by, outcome, findings, decision, action_taken, resolved_at) VALUES
      (?, ?, 'RESOLVED_IN_FAVOR', 
       'Revaluation of the answer sheet confirmed that marks were incorrectly entered due to a data entry error.',
       'The student''s marks in Data Structures have been corrected from 35 to 68. The official mark sheet will be updated within 7 working days.',
       'Marks corrected in university system. Notification sent to student and institution.',
       DATE_SUB(NOW(), INTERVAL 5 DAY)),
      (?, ?, 'RESOLVED_IN_FAVOR',
       'College fee structure review confirmed that the development charge of Rs 12,000 was not approved by AICTE or the state regulatory authority.',
       'Institution directed to refund Rs 12,000 collected as unauthorized development fee to all affected students within 30 days.',
       'Show-cause notice issued to institution. Refund timeline monitored.',
       DATE_SUB(NOW(), INTERVAL 10 DAY)),
      (?, ?, 'NO_FURTHER_ACTION',
       'Complaint regarding canteen quality is under the purview of the institution''s internal grievance mechanism and not AICTE jurisdiction.',
       'Complaint rejected. Student advised to approach the institutional student grievance committee for canteen-related issues.',
       'Rejection communicated to student with alternative contact information.',
       DATE_SUB(NOW(), INTERVAL 28 DAY))`,
      [
        cid['CMP-2024-DEMO001'], o1,
        cid['CMP-2024-DEMO006'], o2,
        cid['CMP-2024-DEMO008'], uid['officer5@resolveiq.demo'],
      ]
    );
    console.log('✅ Resolution records inserted');

    // ===== COMPLAINT MESSAGES =====
    await conn.execute(`INSERT INTO complaint_messages (complaint_id, sender_id, message, message_type, is_visible_to_student, created_at) VALUES
      (?, ?, 'Please provide a copy of your exam admission form and any rough work from the examination.', 'INFORMATION_REQUEST', 1, DATE_SUB(NOW(), INTERVAL 35 DAY)),
      (?, ?, 'I have attached my exam admit card and the rough notes I kept during the exam. Please find them in the evidence section.', 'STUDENT_RESPONSE', 1, DATE_SUB(NOW(), INTERVAL 32 DAY)),
      (?, ?, 'Your complaint has been successfully resolved. Your marks have been corrected from 35 to 68. The updated mark sheet will be sent to you within 7 working days.', 'OFFICIAL_COMMUNICATION', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
      (?, ?, 'Please provide a copy of your original fee receipt and the fee structure document you received at the time of admission.', 'INFORMATION_REQUEST', 1, DATE_SUB(NOW(), INTERVAL 20 DAY)),
      (?, ?, 'We need the names and contact details of the hostel warden you reported to. Please respond within 5 working days.', 'INFORMATION_REQUEST', 1, DATE_SUB(NOW(), INTERVAL 8 DAY))`,
      [
        cid['CMP-2024-DEMO001'], o1,
        cid['CMP-2024-DEMO001'], s1,
        cid['CMP-2024-DEMO001'], o1,
        cid['CMP-2024-DEMO002'], o2,
        cid['CMP-2024-DEMO003'], o4,
      ]
    );

    // ===== INTERNAL NOTES =====
    await conn.execute(`INSERT INTO complaint_internal_notes (complaint_id, author_id, note, created_at) VALUES
      (?, ?, 'Called the department head. They confirmed there was a data entry error during marks tabulation. Revaluation process initiated.', DATE_SUB(NOW(), INTERVAL 38 DAY)),
      (?, ?, 'Verified with university exam controller: answer sheet located and revaluation completed. Marks definitively corrected.', DATE_SUB(NOW(), INTERVAL 7 DAY)),
      (?, ?, 'Contacted college accounts department. They confirmed fee was collected but claim it was approved internally. Need to verify with state authority.', DATE_SUB(NOW(), INTERVAL 18 DAY)),
      (?, ?, 'Urgent case. Need to verify with hostel warden immediately. If ragging confirmed, strict action warranted.', DATE_SUB(NOW(), INTERVAL 9 DAY))`,
      [
        cid['CMP-2024-DEMO001'], o1,
        cid['CMP-2024-DEMO001'], o1,
        cid['CMP-2024-DEMO002'], o2,
        cid['CMP-2024-DEMO003'], o4,
      ]
    );
    console.log('✅ Messages and notes inserted');

    // ===== RELATED COMPLAINTS (Harassment: Demo003 and Demo009) =====
    const [rc1, rc2] = [Math.min(cid['CMP-2024-DEMO003'], cid['CMP-2024-DEMO009']), Math.max(cid['CMP-2024-DEMO003'], cid['CMP-2024-DEMO009'])];
    await conn.execute(`INSERT INTO related_complaints 
      (complaint_id_1, complaint_id_2, relationship_type, similarity_score, match_reasons, ai_model_version, confirmed_by, confirmed_at, confirmation_notes)
      VALUES (?, ?, 'CONFIRMED_RELATED', 0.7834, ?, 'tfidf-ngram-v1.0', ?, NOW(), 'Both complaints describe ragging by seniors. Different institutions but similar pattern suggesting coordinated behavior. Flagged for cross-bureau coordination.')`,
      [rc1, rc2, JSON.stringify(['Very similar complaint description', 'Same complaint category', 'Pattern suggests coordinated ragging across institutions']), o4]
    );

    // Fee complaints: Demo002 and Demo006 - potentially related
    const [fc1, fc2] = [Math.min(cid['CMP-2024-DEMO002'], cid['CMP-2024-DEMO006']), Math.max(cid['CMP-2024-DEMO002'], cid['CMP-2024-DEMO006'])];
    await conn.execute(`INSERT INTO related_complaints 
      (complaint_id_1, complaint_id_2, relationship_type, similarity_score, match_reasons, ai_model_version)
      VALUES (?, ?, 'POTENTIALLY_RELATED', 0.8921, ?, 'tfidf-ngram-v1.0')`,
      [fc1, fc2, JSON.stringify(['Very similar complaint description', 'Same complaint category', 'Same institution - possibly systemic fee irregularity'])]
    );
    console.log('✅ Related complaints inserted');

    // ===== NOTIFICATIONS =====
    const notifData = [
      [s1, cid['CMP-2024-DEMO001'], 'Complaint Submitted', 'Your complaint CMP-2024-DEMO001 has been registered successfully.', 'COMPLAINT_SUBMITTED', 45, 1],
      [s1, cid['CMP-2024-DEMO001'], 'Complaint Resolved', 'Your complaint CMP-2024-DEMO001 has been resolved. Please log in to view the decision.', 'RESOLUTION', 5, 0],
      [s2, cid['CMP-2024-DEMO002'], 'Complaint Submitted', 'Your complaint CMP-2024-DEMO002 has been registered successfully.', 'COMPLAINT_SUBMITTED', 25, 1],
      [s2, cid['CMP-2024-DEMO002'], 'Additional Information Required', 'The reviewing officer has requested additional information for your complaint.', 'INFORMATION_REQUEST', 20, 0],
      [o1, cid['CMP-2024-DEMO001'], 'Complaint Assigned', 'Complaint CMP-2024-DEMO001 has been assigned to you.', 'COMPLAINT_ASSIGNED', 43, 1],
      [o2, cid['CMP-2024-DEMO002'], 'Complaint Assigned', 'Complaint CMP-2024-DEMO002 has been assigned to you.', 'COMPLAINT_ASSIGNED', 23, 1],
      [o1, cid['CMP-2024-DEMO010'], 'Complaint Overdue', 'Complaint CMP-2024-DEMO010 is past its deadline.', 'OVERDUE', 1, 0],
      [uid['student5@resolveiq.demo'], cid['CMP-2024-DEMO010'], 'Complaint Overdue', 'Your complaint CMP-2024-DEMO010 has exceeded its expected resolution date.', 'OVERDUE', 1, 0],
    ];
    for (const [userId, compId, title, msg, type, dAgo, isRead] of notifData) {
      await conn.execute(
        `INSERT INTO notifications (user_id, complaint_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [userId, compId, title, msg, type, isRead, dAgo]
      );
    }
    console.log('✅ Notifications inserted');

    // ===== AUDIT LOGS =====
    const auditEntries = [
      [sAdmin, 'super_admin@resolveiq.demo', 'LOGIN_SUCCESS', null, null, null, 50],
      [sAdmin, 'super_admin@resolveiq.demo', 'OFFICER_CREATED', 'user', uid['officer1@resolveiq.demo'], { email: 'officer1@resolveiq.demo' }, 48],
      [sAdmin, 'super_admin@resolveiq.demo', 'OFFICER_CREATED', 'user', uid['officer2@resolveiq.demo'], { email: 'officer2@resolveiq.demo' }, 48],
      [sAdmin, 'super_admin@resolveiq.demo', 'COMPLAINT_ASSIGNED', 'complaint', cid['CMP-2024-DEMO001'], { bureau_id: 1 }, 43],
      [sAdmin, 'super_admin@resolveiq.demo', 'COMPLAINT_ASSIGNED', 'complaint', cid['CMP-2024-DEMO002'], { bureau_id: 3 }, 23],
      [o1, 'officer1@resolveiq.demo', 'STATUS_CHANGED', 'complaint', cid['CMP-2024-DEMO001'], { from: 'UNDER_REVIEW', to: 'UNDER_ACTION' }, 40],
      [o1, 'officer1@resolveiq.demo', 'COMPLAINT_RESOLVED', 'complaint', cid['CMP-2024-DEMO001'], { outcome: 'RESOLVED_IN_FAVOR' }, 5],
      [o4, 'officer4@resolveiq.demo', 'RELATED_CASE_CONFIRMED', 'related_complaint', null, { complaint_id_1: rc1, complaint_id_2: rc2 }, 3],
    ];
    for (const [actorId, actorEmail, action, entityType, entityId, newVal, dAgo] of auditEntries) {
      await conn.execute(
        `INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, new_value, created_at) VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [actorId, actorEmail, action, entityType, entityId, newVal ? JSON.stringify(newVal) : null, dAgo]
      );
    }
    console.log('✅ Audit logs inserted');

    await conn.commit();

    console.log('\n✅ ========================================');
    console.log('   ResolveIQ Demo Seed Completed!');
    console.log('   ⚠️  All data is fictional for demo purposes');
    console.log('   ========================================\n');
    console.log('📋 Demo Login Credentials:');
    console.log('   Super Admin:  super_admin@resolveiq.demo / Admin@123456');
    console.log('   Officer 1:    officer1@resolveiq.demo / Officer@123  (Academic Affairs)');
    console.log('   Officer 2:    officer2@resolveiq.demo / Officer@123  (Fee & Finance)');
    console.log('   Officer 3:    officer3@resolveiq.demo / Officer@123  (Examination)');
    console.log('   Officer 4:    officer4@resolveiq.demo / Officer@123  (Student Welfare)');
    console.log('   Officer 5:    officer5@resolveiq.demo / Officer@123  (Infrastructure)');
    console.log('   Student 1:    student1@resolveiq.demo / Student@123');
    console.log('   Student 2:    student2@resolveiq.demo / Student@123');
    console.log('   Student 3:    student3@resolveiq.demo / Student@123\n');

  } catch (err) {
    await conn.rollback();
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    throw err;
  } finally {
    await conn.end();
  }
}

seed().catch(() => process.exit(1));

