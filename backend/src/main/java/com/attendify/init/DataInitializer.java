package com.attendify.init;

import com.attendify.entity.*;
import com.attendify.enums.AttendanceStatus;
import com.attendify.enums.NoticeTargetType;
import com.attendify.enums.Role;
import com.attendify.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    @PersistenceContext
    private EntityManager entityManager;

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final CollegeClassRepository classRepository;
    private final AttendanceRecordRepository attendanceRepository;
    private final NoticeRepository noticeRepository;
    private final TimeTableRepository timeTableRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() == 0) {
            seed();
        } else {
            if (noticeRepository.count() == 0) {
                seedNotices();
            }
            syncPdfData();
            syncCseAimlStudents();
        }
    }

    @Transactional
    public void reseed() {
        timeTableRepository.deleteAll();
        noticeRepository.deleteAll();
        attendanceRepository.deleteAll();
        userRepository.deleteAll();
        studentRepository.deleteAll();
        subjectRepository.deleteAll();
        teacherRepository.deleteAll();
        classRepository.deleteAll();
        seed();
    }

    @Transactional
    public void seed() {
        Instant now = Instant.now();
        String studentPassword = passwordEncoder.encode("student123");
        String teacherPassword = passwordEncoder.encode("teacher123");

        Teacher t_priyanka = teacher("t_priyanka", "Priyanka Kumari", "priyanka@attendify.com", "ASH", "9825014706", "200432");
        Teacher t1 = teacher("t1", "Neha Tomar", "teacher@attendify.com", "CSE-AIML", "9825014701", "200914");
        Teacher t2 = teacher("t2", "Arpita Singh", "arpita@attendify.com", "CSE-AIML", "9825014702", "200876");
        Teacher t3 = teacher("t3", "Shivam Chaudhary", "shivam@attendify.com", "ECE", "9825014703", "201147");
        Teacher t_neeraj = teacher("t_neeraj", "Neeraj Kumar", "neeraj@attendify.com", "CSE-AIML", "9825014707", "200087");
        Teacher t_praveen = teacher("t_praveen", "Praveen Gautam", "praveen@attendify.com", "ME", "9825014708", "200045");
        Teacher t_nitin = teacher("t_nitin", "Nitin Kumar Sharma", "nitin@attendify.com", "CSE-AIML", "9825014709", "200885");
        Teacher t_vinish = teacher("t_vinish", "Vinish Kumar", "vinish@attendify.com", "CSE-AIML", "9825014710", "200092");
        List<Teacher> teachers = teacherRepository.saveAll(List.of(t_priyanka, t1, t2, t3, t_neeraj, t_praveen, t_nitin, t_vinish));

        CollegeClass c_aiml = collegeClass("c_aiml_e", "AIML-E", "CSE-AIML", 3, "E", "2025-26");
        CollegeClass c2 = collegeClass("c2", "CSE-3-B", "CSE", 3, "B", "2025-26");
        CollegeClass c3 = collegeClass("c3", "ECE-3-A", "ECE", 3, "A", "2025-26");
        classRepository.saveAll(List.of(c_aiml, c2, c3));

        syncAimlESubjects();

        List<AppUser> users = new ArrayList<>();
        users.add(AppUser.builder()
                .id("u_admin")
                .name("Vipin Prajapati")
                .email("admin@attendify.com")
                .passwordHash(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .personId(null)
                .createdAt(now)
                .build());
        for (Teacher t : teachers) {
            users.add(AppUser.builder()
                    .id("u_" + t.getId())
                    .name(t.getName())
                    .email(t.getEmail())
                    .passwordHash(teacherPassword)
                    .role(Role.TEACHER)
                    .personId(t.getId())
                    .createdAt(now)
                    .build());
        }
        userRepository.saveAll(users);

        seedCseAimlStudents();
        seedNotices();
        syncPdfData();
    }

    @Transactional
    public void seedNotices() {
        if (noticeRepository.count() > 0) return;
        Instant now = Instant.now();
        Student stu0 = studentRepository.findById("stu0").orElse(null);
        CollegeClass c_aiml = classRepository.findById("c_aiml_e").orElse(null);

        List<Notice> demoNotices = new ArrayList<>();

        demoNotices.add(Notice.builder()
                .id("notice_midterm")
                .title("Mid-Term Examination Schedule Announced")
                .content("The mid-term theory and practical examinations for the 3rd semester will commence from October 15. The detailed timetable and room allocations are available on the department bulletin board and academic portal.")
                .targetType(NoticeTargetType.ALL)
                .priority("URGENT")
                .postedById("u_admin")
                .postedByName("Vipin Prajapati")
                .postedByRole(Role.ADMIN)
                .createdAt(now.minusSeconds(86400 * 2))
                .build());

        if (c_aiml != null) {
            demoNotices.add(Notice.builder()
                    .id("notice_lab_assignment")
                    .title("Data Structures Lab Assignment Submission Deadline")
                    .content("All students of AIML-E are instructed to submit their complete implementation of Binary Search Trees and AVL Trees by this Friday at 5:00 PM. Late submissions will incur a 10% penalty.")
                    .targetType(NoticeTargetType.CLASS)
                    .targetClass(c_aiml)
                    .priority("NORMAL")
                    .postedById("u_t1")
                    .postedByName("Neha Tomar")
                    .postedByRole(Role.TEACHER)
                    .createdAt(now.minusSeconds(86400))
                    .build());
        }

        if (stu0 != null) {
            demoNotices.add(Notice.builder()
                    .id("notice_attendance_warning")
                    .title("Attendance Notice - Cyber Security (BCC301)")
                    .content("Dear Vishal Kumar Yadav, your current attendance in Cyber Security (BCC301) is standing at 74%, which is below the mandatory 75% threshold. Please meet me during office hours on Monday to discuss compensatory classes.")
                    .targetType(NoticeTargetType.STUDENT)
                    .targetStudent(stu0)
                    .priority("URGENT")
                    .postedById("u_t1")
                    .postedByName("Neha Tomar")
                    .postedByRole(Role.TEACHER)
                    .createdAt(now.minusSeconds(3600 * 4))
                    .build());
        }

        noticeRepository.saveAll(demoNotices);
    }

    private List<LocalDate> sessionDates() {
        LocalDate end = lastWeekday();
        LocalDate start = end.minusDays(62);
        Set<LocalDate> holidays = Set.of(start.plusDays(16), start.plusDays(31), start.plusDays(45));
        List<LocalDate> dates = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            int day = d.getDayOfWeek().getValue() % 7;
            if (day != 0 && day != 6 && !holidays.contains(d)) {
                dates.add(d);
            }
        }
        return dates;
    }

    private LocalDate lastWeekday() {
        LocalDate d = LocalDate.now();
        while (d.getDayOfWeek().getValue() == 6 || d.getDayOfWeek().getValue() == 7) {
            d = d.minusDays(1);
        }
        return d;
    }

    private List<AttendanceRecord> buildAttendance(List<Student> students, List<Subject> subjects, List<LocalDate> dates) {
        Mulberry32 rand = new Mulberry32(strSeed("attendify-attendance-aiml-e"));
        List<AttendanceRecord> records = new ArrayList<>();
        Map<String, Double> subjectFactor = Map.ofEntries(
                Map.entry("sub_bas303", 0.95),
                Map.entry("sub_bcc301", 0.94),
                Map.entry("sub_bcs301", 0.96),
                Map.entry("sub_bcs302", 0.93),
                Map.entry("sub_bcs303", 0.95),
                Map.entry("sub_bve301", 0.98),
                Map.entry("sub_mm301_nt", 1.0),
                Map.entry("sub_mm301_sc", 1.0),
                Map.entry("sub_wd301", 0.95),
                Map.entry("sub_bcc351", 0.96),
                Map.entry("sub_bcs351", 0.97),
                Map.entry("sub_bcs352", 0.95),
                Map.entry("sub_bcs353", 0.96),
                Map.entry("sub_nasscom301", 0.98)
        );
        Map<String, int[]> subjectDays = Map.ofEntries(
                Map.entry("sub_bas303", new int[]{1, 2, 3, 4, 5}),
                Map.entry("sub_bcc301", new int[]{1, 3, 5}),
                Map.entry("sub_bcs301", new int[]{1, 2, 4, 5}),
                Map.entry("sub_bcs302", new int[]{1, 2, 4, 5}),
                Map.entry("sub_bcs303", new int[]{1, 2, 3, 4, 5}),
                Map.entry("sub_bve301", new int[]{2, 4}),
                Map.entry("sub_mm301_nt", new int[]{1}),
                Map.entry("sub_mm301_sc", new int[]{1}),
                Map.entry("sub_wd301", new int[]{1, 2}),
                Map.entry("sub_bcc351", new int[]{1, 3}),
                Map.entry("sub_bcs351", new int[]{1, 3}),
                Map.entry("sub_bcs352", new int[]{4, 5}),
                Map.entry("sub_bcs353", new int[]{4, 5}),
                Map.entry("sub_nasscom301", new int[]{3})
        );
        Set<String> lowAttenders = new HashSet<>(List.of("stu_2500331530280", "stu_2500331530296", "stu_2500331530310", "stu_2500331530325"));
        List<Student> cseStudents = students.stream()
                .filter(s -> s.getCollegeClass() != null && ("c2".equals(s.getCollegeClass().getId()) || "c_aiml_e".equals(s.getCollegeClass().getId())))
                .toList();
        List<Subject> cseSubjects = subjects.stream().filter(s -> subjectDays.containsKey(s.getId())).toList();

        for (Subject subject : cseSubjects) {
            int[] days = subjectDays.get(subject.getId());
            List<LocalDate> sessions = dates.stream().filter(d -> contains(days, d.getDayOfWeek().getValue() % 7)).toList();
            for (Student student : cseStudents) {
                double tendency = lowAttenders.contains(student.getId()) ? 0.55 + rand.next() * 0.13 : 0.78 + rand.next() * 0.2;
                if ("stu0".equals(student.getId())) {
                    tendency = 0.88 + rand.next() * 0.05;
                }
                double factor = subjectFactor.getOrDefault(subject.getId(), 1.0);
                double demoLow = "stu0".equals(student.getId()) && "sub_bcc301".equals(subject.getId()) ? 0.74 : 1.0;
                double prob = tendency * factor * demoLow;
                for (LocalDate date : sessions) {
                    Instant ts = LocalDateTime.of(date.getYear(), date.getMonth(), date.getDayOfMonth(), 9, 30)
                            .toInstant(ZoneOffset.UTC);
                    records.add(AttendanceRecord.builder()
                            .id("ar_" + subject.getId() + "_" + student.getId() + "_" + date)
                            .student(student)
                            .subject(subject)
                            .teacher(subject.getTeacher())
                            .collegeClass(student.getCollegeClass())
                            .date(date)
                            .status(rand.next() < prob ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT)
                            .createdAt(ts)
                            .updatedAt(ts)
                            .build());
                }
            }
        }
        return records;
    }

    private static boolean contains(int[] days, int day) {
        for (int d : days) {
            if (d == day) return true;
        }
        return false;
    }

    private Teacher teacher(String id, String name, String email, String department, String phone, String empCode) {
        return Teacher.builder().id(id).name(name).email(email).department(department).phone(phone).employeeCode(empCode).active(true).build();
    }

    private CollegeClass collegeClass(String id, String name, String branch, int semester, String section, String year) {
        return CollegeClass.builder().id(id).name(name).branch(branch).semester(semester).section(section).academicYear(year).build();
    }

    private Subject subject(String id, String name, String code, String type, String department, int semester, Teacher teacher) {
        return Subject.builder().id(id).name(name).code(code).subjectType(type).department(department).semester(semester).teacher(teacher).build();
    }

    private static String slug(String name) {
        return name.toLowerCase().replaceAll("[^a-z]+", ".").replaceAll("^\\.|\\.$", "");
    }

    private static int strSeed(String s) {
        int h = (int) 2166136261L;
        for (int i = 0; i < s.length(); i++) {
            h = (h ^ s.charAt(i)) * 16777619;
        }
        return h;
    }

    private static final String[][] AIML_E_SUBJECT_DATA = {
        {"sub_bas303", "Theory", "MATH IV", "BAS 303", "200432", "Priyanka Kumari", "ASH"},
        {"sub_bcc301", "Theory", "CYBER SECURITY", "BCC 301", "200914", "Neha Tomar", "CSE-AIML"},
        {"sub_bcs301", "Theory", "DATA STRUCTURE", "BCS 301", "200876", "Arpita Singh", "CSE-AIML"},
        {"sub_bcs302", "Theory", "COA", "BCS 302", "201147", "Shivam Chaudhary", "ECE"},
        {"sub_bcs303", "Theory", "DSTL", "BCS 303", "200087", "Neeraj Kumar", "CSE-AIML"},
        {"sub_bve301", "Theory", "UHV", "BVE 301", "200045", "Praveen Gautam", "ME"},
        {"sub_mm301_nt", "Theory", "MM", "MM301", "200914", "Neha Tomar", "CSE-AIML"},
        {"sub_mm301_sc", "Theory", "MM", "MM301", "201147", "Shivam Chaudhary", "ECE"},
        {"sub_wd301", "Theory", "WD", "WD301", "200885", "Nitin Kumar Sharma", "CSE-AIML"},
        {"sub_bcc351", "Practical", "MINI PROJECT", "BCC 351", "200914", "Neha Tomar", "CSE-AIML"},
        {"sub_bcs352", "Practical", "COA LAB", "BCS 352", "201147", "Shivam Chaudhary", "ECE"},
        {"sub_bcs353", "Practical", "WD WORKSHOP", "BCS 353", "200885", "Nitin Kumar Sharma", "CSE-AIML"},
        {"sub_bcs351", "Practical", "DS LAB", "BCS351", "200876", "Arpita Singh", "CSE-AIML"},
        {"sub_nasscom301", "Practical", "NASSCOM", "NASSCOM301", "200092", "Vinish Kumar", "CSE-AIML"}
    };

    @Transactional
    public List<Subject> syncAimlESubjects() {
        try {
            entityManager.createNativeQuery("ALTER TABLE subjects DROP CONSTRAINT IF EXISTS uk_rg7x1lyii7kdyycw98d45vep5").executeUpdate();
            entityManager.createNativeQuery("ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_code_key").executeUpdate();
            entityManager.createNativeQuery("ALTER TABLE subjects DROP CONSTRAINT IF EXISTS uk_subjects_code").executeUpdate();
        } catch (Exception ignored) {}

        List<Teacher> teachers = teacherRepository.findAll();
        List<Subject> createdOrUpdated = new ArrayList<>();

        // Delete attendance referencing old placeholder subjects sub1..sub7
        List<String> oldSubIds = List.of("sub1", "sub2", "sub3", "sub4", "sub5", "sub6", "sub7");
        List<AttendanceRecord> oldAtt = attendanceRepository.findAll().stream()
                .filter(ar -> ar.getSubject() != null && oldSubIds.contains(ar.getSubject().getId()))
                .toList();
        if (!oldAtt.isEmpty()) {
            attendanceRepository.deleteAll(oldAtt);
        }
        for (String oldId : oldSubIds) {
            subjectRepository.deleteById(oldId);
        }

        for (String[] row : AIML_E_SUBJECT_DATA) {
            String subId = row[0];
            String type = row[1];
            String name = row[2];
            String code = row[3];
            String empCode = row[4];
            String teacherName = row[5];

            Teacher assignedTeacher = teachers.stream()
                    .filter(t -> empCode.equals(t.getEmployeeCode()) || t.getName().equalsIgnoreCase(teacherName) || (teacherName.startsWith("Shivam") && t.getName().startsWith("Shivam")))
                    .findFirst().orElse(null);

            Subject subject = subjectRepository.findById(subId).orElseGet(() -> Subject.builder().id(subId).build());
            subject.setName(name);
            subject.setCode(code);
            subject.setSubjectType(type);
            subject.setDepartment("CSE-AIML");
            subject.setSemester(3);
            subject.setTeacher(assignedTeacher);
            createdOrUpdated.add(subjectRepository.save(subject));
        }

        return createdOrUpdated;
    }

    @Transactional
    public void syncPdfData() {
        // 1. Sync / create teachers with branches and employee codes matching PDF
        syncOrCreateTeacher("Neha Tomar", "CSE-AIML", "200914", "9825014701");
        syncOrCreateTeacher("Arpita Singh", "CSE-AIML", "200876", "9825014702");
        syncOrCreateTeacher("Shivam Chaudhary", "ECE", "201147", "9825014703");
        syncOrCreateTeacher("Priyanka Kumari", "ASH", "200432", "9825014706");
        syncOrCreateTeacher("Neeraj Kumar", "CSE-AIML", "200087", "9825014707");
        syncOrCreateTeacher("Praveen Gautam", "ME", "200045", "9825014708");
        syncOrCreateTeacher("Nitin Kumar Sharma", "CSE-AIML", "200885", "9825014709");
        syncOrCreateTeacher("Vinish Kumar", "CSE-AIML", "200092", "9825014710");

        // 2. Ensure Class AIML-E 3(G2) exists
        CollegeClass aimlClass = classRepository.findById("c_aiml_e").orElse(null);
        if (aimlClass == null) {
            aimlClass = classRepository.save(collegeClass("c_aiml_e", "AIML-E 3(G2)", "CSE-AIML", 3, "E", "2025-26"));
        } else {
            aimlClass.setName("AIML-E 3(G2)");
            aimlClass.setBranch("CSE-AIML");
            aimlClass.setSemester(3);
            aimlClass.setSection("E");
            aimlClass = classRepository.save(aimlClass);
        }

        // 3. Update Student stu0 to VISHAL KUMAR YADAV
        Student stu0 = studentRepository.findById("stu0").orElse(null);
        if (stu0 != null) {
            stu0.setName("VISHAL KUMAR YADAV");
            stu0.setEnrollmentNo("2500331530322");
            stu0.setBranch("CSE-AIML");
            stu0.setSemester(3);
            stu0.setSection("E");
            stu0.setCollegeClass(aimlClass);
            studentRepository.save(stu0);

            userRepository.findById("u_stu0").ifPresent(u -> {
                u.setName("VISHAL KUMAR YADAV");
                userRepository.save(u);
            });
        }

        // 4. Sync 14 subjects for AIML-E with assigned faculty
        syncAimlESubjects();

        // 5. Seed TimeTable for c_aiml_e
        seedTimeTable(aimlClass);

        // 6. Delete CSE-3-A class if it exists and redirect references
        final CollegeClass targetClass = aimlClass;
        noticeRepository.findAll().stream()
                .filter(n -> n.getTargetClass() != null && ("c1".equals(n.getTargetClass().getId()) || "CSE-3-A".equalsIgnoreCase(n.getTargetClass().getName())))
                .forEach(n -> {
                    n.setTargetClass(targetClass);
                    noticeRepository.save(n);
                });
        classRepository.findById("c1").ifPresent(cls -> {
            studentRepository.findAll().stream()
                    .filter(s -> s.getCollegeClass() != null && "c1".equals(s.getCollegeClass().getId()))
                    .forEach(s -> {
                        s.setCollegeClass(targetClass);
                        studentRepository.save(s);
                    });
            classRepository.delete(cls);
        });
        classRepository.findAll().stream()
                .filter(c -> "CSE-3-A".equalsIgnoreCase(c.getName()))
                .forEach(c -> classRepository.delete(c));
    }

    private Teacher syncOrCreateTeacher(String name, String department, String empCode, String phone) {
        List<Teacher> all = teacherRepository.findAll();
        Teacher existing = all.stream()
                .filter(t -> t.getName().equalsIgnoreCase(name) ||
                        (name.startsWith("Shivam") && t.getName().startsWith("Shivam")) ||
                        (t.getEmail() != null && t.getEmail().startsWith(slug(name))))
                .findFirst().orElse(null);

        if (existing != null) {
            existing.setName(name);
            existing.setDepartment(department);
            existing.setEmployeeCode(empCode);
            existing.setPhone(phone);
            Teacher saved = teacherRepository.save(existing);
            userRepository.findById("u_" + saved.getId()).ifPresent(u -> {
                u.setName(name);
                userRepository.save(u);
            });
            return saved;
        }

        String teacherId = "t_" + slug(name).replace(".", "_");
        String email = slug(name) + "@attendify.com";
        Teacher newTeacher = teacherRepository.save(Teacher.builder()
                .id(teacherId)
                .name(name)
                .email(email)
                .department(department)
                .phone(phone)
                .employeeCode(empCode)
                .active(true)
                .build());

        if (userRepository.findById("u_" + teacherId).isEmpty()) {
            userRepository.save(AppUser.builder()
                    .id("u_" + teacherId)
                    .name(name)
                    .email(email)
                    .passwordHash(passwordEncoder.encode("teacher123"))
                    .role(Role.TEACHER)
                    .personId(teacherId)
                    .createdAt(Instant.now())
                    .build());
        }
        return newTeacher;
    }

    private void seedTimeTable(CollegeClass cls) {
        timeTableRepository.deleteAll(timeTableRepository.findByCollegeClass_IdOrderByDayOfWeekAscSlotIndexAsc(cls.getId()));
        List<TimeTableEntry> list = new ArrayList<>();

        // MONDAY
        list.add(entry(cls, "MONDAY", 1, "09:10-10:00", "BCS 301", "DATA STRUCTURE", "Theory", "ARPITA SINGH", "200876", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "MONDAY", 2, "10:00-10:50", "BCS 303", "DSTL", "Theory", "NEERAJ KUMAR", "200087", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "MONDAY", 3, "10:50-11:40", "BCC 351 / BCS351", "MINI PROJECT (G1) / DS LAB (G2)", "Practical", "NEHA TOMAR / ARPITA SINGH", "200914 / 200876", "CSE-AIML", "G1/G2", "BCC 351(G1) NEHA, BCS351(G2) ARPITA", false));
        list.add(entry(cls, "MONDAY", 4, "11:40-12:30", "BCC 351 / BCS351", "MINI PROJECT (G1) / DS LAB (G2)", "Practical", "NEHA TOMAR / ARPITA SINGH", "200914 / 200876", "CSE-AIML", "G1/G2", "BCC 351(G1) NEHA, BCS351(G2) ARPITA", false));
        list.add(entry(cls, "MONDAY", 5, "12:30-13:30", null, "LUNCH BREAK", "Break", null, null, null, "ALL", null, true));
        list.add(entry(cls, "MONDAY", 6, "13:30-14:20", "BAS 303", "MATH IV", "Theory", "PRIYANKA KUMARI", "200432", "ASH", "ALL", null, false));
        list.add(entry(cls, "MONDAY", 7, "14:20-15:10", "BCS 302", "COA", "Theory", "SHIVAM CHAUDHARY", "201147", "ECE", "ALL", null, false));
        list.add(entry(cls, "MONDAY", 8, "15:10-16:00", "BCC 301", "CYBER SECURITY", "Theory", "NEHA TOMAR", "200914", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "MONDAY", 9, "16:00-16:50", "MM301", "MM", "Theory", "NEHA TOMAR / SHIVAM CHAUDHARY", "200914 / 201147", "CSE-AIML / ECE", "G1/G2", "MM301(G1) NEHA, MM301(G2) SHIVAM", false));

        // TUESDAY
        list.add(entry(cls, "TUESDAY", 1, "09:10-10:00", "BCS 301", "DATA STRUCTURE", "Theory", "ARPITA SINGH", "200876", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "TUESDAY", 2, "10:00-10:50", "BVE 301", "UHV", "Theory", "PRAVEEN GAUTAM", "200045", "ME", "ALL", null, false));
        list.add(entry(cls, "TUESDAY", 3, "10:50-11:40", "BCS 303", "DSTL", "Theory", "NEERAJ KUMAR", "200087", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "TUESDAY", 4, "11:40-12:30", "BCS 302", "COA", "Theory", "SHIVAM CHAUDHARY", "201147", "ECE", "ALL", null, false));
        list.add(entry(cls, "TUESDAY", 5, "12:30-13:30", null, "LUNCH BREAK", "Break", null, null, null, "ALL", null, true));
        list.add(entry(cls, "TUESDAY", 6, "13:30-14:20", "BAS 303", "MATH IV", "Theory", "PRIYANKA KUMARI", "200432", "ASH", "ALL", null, false));
        list.add(entry(cls, "TUESDAY", 7, "14:20-15:10", "BAS 303", "MATH IV", "Theory", "PRIYANKA KUMARI", "200432", "ASH", "ALL", null, false));
        list.add(entry(cls, "TUESDAY", 8, "15:10-16:00", "BCS 302", "COA", "Theory", "SHIVAM CHAUDHARY", "201147", "ECE", "ALL", null, false));

        // WEDNESDAY
        list.add(entry(cls, "WEDNESDAY", 1, "09:10-10:00", "BCS 303", "DSTL", "Theory", "NEERAJ KUMAR", "200087", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "WEDNESDAY", 2, "10:00-10:50", "BAS 303", "MATH IV", "Theory", "PRIYANKA KUMARI", "200432", "ASH", "ALL", null, false));
        list.add(entry(cls, "WEDNESDAY", 3, "10:50-11:40", "NASSCOM301", "NASSCOM", "Practical", "VINISH KUMAR", "200092", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "WEDNESDAY", 4, "11:40-12:30", "NASSCOM301", "NASSCOM", "Practical", "VINISH KUMAR", "200092", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "WEDNESDAY", 5, "12:30-13:30", null, "LUNCH BREAK", "Break", null, null, null, "ALL", null, true));
        list.add(entry(cls, "WEDNESDAY", 6, "13:30-14:20", "BCS351 / BCC 351", "DS LAB (G1) / MINI PROJECT (G2)", "Practical", "ARPITA SINGH / NEHA TOMAR", "200876 / 200914", "CSE-AIML", "G1/G2", "BCS351(G1) ARPITA, BCC 351(G2) NEHA", false));
        list.add(entry(cls, "WEDNESDAY", 7, "14:20-15:10", "BCS351 / BCC 351", "DS LAB (G1) / MINI PROJECT (G2)", "Practical", "ARPITA SINGH / NEHA TOMAR", "200876 / 200914", "CSE-AIML", "G1/G2", "BCS351(G1) ARPITA, BCC 351(G2) NEHA", false));
        list.add(entry(cls, "WEDNESDAY", 8, "15:10-16:00", "BCC 301", "CYBER SECURITY", "Theory", "NEHA TOMAR", "200914", "CSE-AIML", "ALL", null, false));

        // THURSDAY
        list.add(entry(cls, "THURSDAY", 1, "09:10-10:00", "BAS 303", "MATH IV", "Theory", "PRIYANKA KUMARI", "200432", "ASH", "ALL", null, false));
        list.add(entry(cls, "THURSDAY", 2, "10:00-10:50", "BCS 301", "DATA STRUCTURE", "Theory", "ARPITA SINGH", "200876", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "THURSDAY", 3, "10:50-11:40", "BCS 302", "COA", "Theory", "SHIVAM CHAUDHARY", "201147", "ECE", "ALL", null, false));
        list.add(entry(cls, "THURSDAY", 4, "11:40-12:30", "BCS 303", "DSTL", "Theory", "NEERAJ KUMAR", "200087", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "THURSDAY", 5, "12:30-13:30", null, "LUNCH BREAK", "Break", null, null, null, "ALL", null, true));
        list.add(entry(cls, "THURSDAY", 6, "13:30-14:20", "BCS 301", "DATA STRUCTURE", "Theory", "ARPITA SINGH", "200876", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "THURSDAY", 7, "14:20-15:10", "BVE 301", "UHV", "Theory", "PRAVEEN GAUTAM", "200045", "ME", "ALL", null, false));
        list.add(entry(cls, "THURSDAY", 8, "15:10-16:00", "BCS 353 / BCS 352", "WD WORKSHOP (G1) / COA LAB (G2)", "Practical", "NITIN KUMAR SHARMA / SHIVAM CHAUDHARY", "200885 / 201147", "CSE-AIML / ECE", "G1/G2", "BCS 353(G1) NITIN, BCS 352(G2) SHIVAM", false));
        list.add(entry(cls, "THURSDAY", 9, "16:00-16:50", "BCS 353 / BCS 352", "WD WORKSHOP (G1) / COA LAB (G2)", "Practical", "NITIN KUMAR SHARMA / SHIVAM CHAUDHARY", "200885 / 201147", "CSE-AIML / ECE", "G1/G2", "BCS 353(G1) NITIN, BCS 352(G2) SHIVAM", false));

        // FRIDAY
        list.add(entry(cls, "FRIDAY", 1, "09:10-10:00", "BCS 352 / BCS 353", "COA LAB (G1) / WD WORKSHOP (G2)", "Practical", "SHIVAM CHAUDHARY / NITIN KUMAR SHARMA", "201147 / 200885", "ECE / CSE-AIML", "G1/G2", "BCS 353(G2) NITIN, BCS 352(G1) SHIVAM", false));
        list.add(entry(cls, "FRIDAY", 2, "10:00-10:50", "BCS 352 / BCS 353", "COA LAB (G1) / WD WORKSHOP (G2)", "Practical", "SHIVAM CHAUDHARY / NITIN KUMAR SHARMA", "201147 / 200885", "ECE / CSE-AIML", "G1/G2", "BCS 353(G2) NITIN, BCS 352(G1) SHIVAM", false));
        list.add(entry(cls, "FRIDAY", 3, "10:50-11:40", "BCC 301", "CYBER SECURITY", "Theory", "NEHA TOMAR", "200914", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "FRIDAY", 4, "11:40-12:30", "BCS 301", "DATA STRUCTURE", "Theory", "ARPITA SINGH", "200876", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "FRIDAY", 5, "12:30-13:30", null, "LUNCH BREAK", "Break", null, null, null, "ALL", null, true));
        list.add(entry(cls, "FRIDAY", 6, "13:30-14:20", "BCS 301", "DATA STRUCTURE", "Theory", "ARPITA SINGH", "200876", "CSE-AIML", "ALL", null, false));
        list.add(entry(cls, "FRIDAY", 7, "14:20-15:10", "BCS 302", "COA", "Theory", "SHIVAM CHAUDHARY", "201147", "ECE", "ALL", null, false));
        list.add(entry(cls, "FRIDAY", 8, "15:10-16:00", "BAS 303", "MATH IV", "Theory", "PRIYANKA KUMARI", "200432", "ASH", "ALL", null, false));
        list.add(entry(cls, "FRIDAY", 9, "16:00-16:50", "BCS 303", "DSTL", "Theory", "NEERAJ KUMAR", "200087", "CSE-AIML", "ALL", null, false));

        timeTableRepository.saveAll(list);
    }

    private TimeTableEntry entry(CollegeClass cls, String day, int slotIndex, String timeSlot,
                                 String code, String name, String type, String teacherName,
                                 String empCode, String dept, String groupType, String splitDisplay, boolean isBreak) {
        return TimeTableEntry.builder()
                .id("tt_" + cls.getId() + "_" + day.toLowerCase() + "_" + slotIndex)
                .collegeClass(cls)
                .dayOfWeek(day)
                .slotIndex(slotIndex)
                .timeSlot(timeSlot)
                .subjectCode(code)
                .subjectName(name)
                .subjectType(type)
                .teacherName(teacherName)
                .employeeCode(empCode)
                .department(dept)
                .groupType(groupType)
                .splitDisplay(splitDisplay)
                .isBreak(isBreak)
                .build();
    }

    private static final String[][] CSE_AIML_STUDENT_ROSTER = {
        {"1", "2500331530276", "SHIVANSHU CHAUDHARY"},
        {"2", "2500331530277", "SHIVRAJ SINGH"},
        {"3", "2500331530278", "SHREYANSH AGARWAL"},
        {"4", "2500331530279", "SHREYANSH BISHT"},
        {"5", "2500331530280", "SIDNEY AHANTHEM"},
        {"6", "2500331530281", "SPARSH TYAGI"},
        {"7", "2500331530282", "STUTI BHATNAGAR"},
        {"8", "2500331530283", "SUBHASHINE ROUT"},
        {"9", "2500331530284", "SUBHI SHARMA"},
        {"10", "2500331530285", "SUHANI DABRAL"},
        {"11", "2500331530286", "SUJAL KUMAR"},
        {"12", "2500331530288", "SUKHVINDER SINGH"},
        {"13", "2500331530289", "SUMIT SINGH"},
        {"14", "2500331530290", "SURAJ"},
        {"15", "2500331530291", "SURAJ RAJPUT"},
        {"16", "2500331530292", "SWATI"},
        {"17", "2500331530293", "SWATI TOMAR"},
        {"18", "2500331530294", "TANISHKA DABRAL"},
        {"19", "2500331530295", "TANIYA CHAUDHARY"},
        {"20", "2500331530296", "TANU"},
        {"21", "2500331530297", "TANU GAHLOT"},
        {"22", "2500331530298", "TARUN FULARA"},
        {"23", "2500331530300", "TUSHAR SIROHI"},
        {"24", "2500331530301", "UJJAWAL SHARMA"},
        {"25", "2500331530302", "UJJWAL GARG"},
        {"26", "2500331530303", "UMANG TYAGI"},
        {"27", "2500331530304", "URVASHI SHARMA"},
        {"28", "2500331530305", "UTTAM GIRI"},
        {"29", "2500331530306", "UZAID AHMAD"},
        {"30", "2500331530307", "VAIBHAV"},
        {"31", "2500331530308", "VAIBHAV DOBRIYAL"},
        {"32", "2500331530309", "VAIBHAV SHARMA"},
        {"33", "2500331530310", "VANI PANWAR"},
        {"34", "2500331530311", "VANSH CHANDILA"},
        {"35", "2500331530312", "VANSH CHAUDHARY"},
        {"36", "2500331530313", "VANSH MAVI"},
        {"37", "2500331530314", "VANSH SAHRAWAT"},
        {"38", "2500331530315", "VASHU"},
        {"39", "2500331530316", "VIDUSHI CHAUDHARY"},
        {"40", "2500331530317", "VIMAL KUMAR"},
        {"41", "2500331530318", "VINAY SHANKAR SINGH"},
        {"42", "2500331530319", "VINAYAK KAUSHIK"},
        {"43", "2500331530320", "VIPIN PRAJAPATI"},
        {"44", "2500331530321", "VISHAL BHARDWAJ"},
        {"45", "2500331530322", "VISHAL KUMAR YADAV"},
        {"46", "2500331530323", "VISHESH SINGHAL"},
        {"47", "2500331530324", "VISHESH SRIVASTAV"},
        {"48", "2500331530325", "VISHVNATH SINGH"},
        {"49", "2500331530326", "VIVEK DAS"},
        {"50", "2500331530327", "VIVEK SINGH"},
        {"51", "2500331530328", "YASH GOYAL"},
        {"52", "2500331530329", "YASH NIGAM"},
        {"53", "2500331530330", "YASH PAL"},
        {"54", "2500331530331", "YASH SHARMA"},
        {"55", "2500331530332", "YASH SHARMA"},
        {"56", "2500331530333", "YASH SRIVASTAVA"},
        {"57", "2500331530334", "YASH TYAGI"},
        {"58", "2500331530335", "YASHRAJ"},
        {"59", "2500331530336", "YOGESH YADAV"}
    };

    private String formatStudentName(String raw) {
        String[] parts = raw.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (parts[i].isEmpty()) continue;
            if (i > 0) sb.append(" ");
            sb.append(Character.toUpperCase(parts[i].charAt(0)))
              .append(parts[i].substring(1).toLowerCase());
        }
        return sb.toString();
    }

    private List<Student> createCseAimlStudentsList(CollegeClass aimlClass) {
        List<Student> students = new ArrayList<>();
        for (String[] row : CSE_AIML_STUDENT_ROSTER) {
            String rollNo = row[1];
            String rawName = row[2];
            boolean isVishal = "2500331530322".equals(rollNo);
            String id = isVishal ? "stu0" : "stu_" + rollNo;
            String name = isVishal ? "VISHAL KUMAR YADAV" : formatStudentName(rawName);
            String email = isVishal ? "student@attendify.com" : slug(rawName) + "." + rollNo.substring(rollNo.length() - 4) + "@attendify.com";
            String phone = "98250" + rollNo.substring(rollNo.length() - 5);

            students.add(Student.builder()
                    .id(id)
                    .enrollmentNo(rollNo)
                    .name(name)
                    .email(email)
                    .phone(phone)
                    .branch("CSE-AIML")
                    .semester(3)
                    .section("E")
                    .collegeClass(aimlClass)
                    .active(true)
                    .build());
        }
        return students;
    }

    @Transactional
    public void seedCseAimlStudents() {
        CollegeClass aimlClass = classRepository.findById("c_aiml_e").orElse(null);
        if (aimlClass == null) {
            aimlClass = classRepository.save(collegeClass("c_aiml_e", "AIML-E 3(G2)", "CSE-AIML", 3, "E", "2025-26"));
        }

        List<Student> students = createCseAimlStudentsList(aimlClass);
        studentRepository.saveAll(students);

        Instant now = Instant.now();
        String studentPassword = passwordEncoder.encode("student123");
        List<AppUser> studentUsers = new ArrayList<>();
        for (Student s : students) {
            studentUsers.add(AppUser.builder()
                    .id("u_" + s.getId())
                    .name(s.getName())
                    .email(s.getEmail())
                    .passwordHash(studentPassword)
                    .role(Role.STUDENT)
                    .personId(s.getId())
                    .createdAt(now)
                    .build());
        }
        userRepository.saveAll(studentUsers);

        List<Subject> subjects = subjectRepository.findAll();
        List<AttendanceRecord> attendance = buildAttendance(students, subjects, sessionDates());
        attendanceRepository.saveAll(attendance);
    }

    @Transactional
    public void syncCseAimlStudents() {
        // 1. Ensure Class c_aiml_e exists
        CollegeClass aimlClass = classRepository.findById("c_aiml_e").orElse(null);
        if (aimlClass == null) {
            aimlClass = classRepository.save(collegeClass("c_aiml_e", "AIML-E 3(G2)", "CSE-AIML", 3, "E", "2025-26"));
        }

        // 2. Expected 59 students
        List<Student> expectedStudents = createCseAimlStudentsList(aimlClass);
        Set<String> validStudentIds = expectedStudents.stream().map(Student::getId).collect(Collectors.toSet());

        // 3. Remove all other students from previous dummy data
        List<Student> currentStudents = studentRepository.findAll();
        List<Student> studentsToDelete = currentStudents.stream()
                .filter(s -> !validStudentIds.contains(s.getId()))
                .toList();

        if (!studentsToDelete.isEmpty()) {
            Set<String> deleteIds = studentsToDelete.stream().map(Student::getId).collect(Collectors.toSet());

            // Clean up notices referencing removed students
            List<Notice> notices = noticeRepository.findAll();
            for (Notice n : notices) {
                if (n.getTargetStudent() != null && deleteIds.contains(n.getTargetStudent().getId())) {
                    noticeRepository.delete(n);
                }
            }

            // Clean up attendance records for removed students
            List<AttendanceRecord> oldAttendance = attendanceRepository.findAll().stream()
                    .filter(ar -> ar.getStudent() != null && deleteIds.contains(ar.getStudent().getId()))
                    .toList();
            if (!oldAttendance.isEmpty()) {
                attendanceRepository.deleteAll(oldAttendance);
            }

            // Clean up AppUser records for removed students
            List<AppUser> oldUsers = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.STUDENT && u.getPersonId() != null && deleteIds.contains(u.getPersonId()))
                    .toList();
            if (!oldUsers.isEmpty()) {
                userRepository.deleteAll(oldUsers);
            }

            // Delete the dummy students
            studentRepository.deleteAll(studentsToDelete);
        }

        // 4. Save/update all 59 AIML-E students
        studentRepository.saveAll(expectedStudents);

        // 5. Ensure AppUser accounts for all 59 students
        Instant now = Instant.now();
        String studentPassword = passwordEncoder.encode("student123");
        for (Student s : expectedStudents) {
            AppUser u = userRepository.findById("u_" + s.getId()).orElse(null);
            if (u == null) {
                userRepository.save(AppUser.builder()
                        .id("u_" + s.getId())
                        .name(s.getName())
                        .email(s.getEmail())
                        .passwordHash(studentPassword)
                        .role(Role.STUDENT)
                        .personId(s.getId())
                        .createdAt(now)
                        .build());
            } else {
                u.setName(s.getName());
                u.setEmail(s.getEmail());
                userRepository.save(u);
            }
        }

        // 6. Ensure attendance records exist for all 59 students
        List<LocalDate> dates = sessionDates();
        boolean hasAttendanceForRoster = !dates.isEmpty() && attendanceRepository.existsById("ar_sub_bcs301_stu_2500331530276_" + dates.get(0));
        if (!hasAttendanceForRoster) {
            List<Subject> subjects = subjectRepository.findAll();
            List<AttendanceRecord> records = buildAttendance(expectedStudents, subjects, dates);
            attendanceRepository.saveAll(records);
        }
    }

    private static final class Mulberry32 {
        private int seed;

        Mulberry32(int seed) {
            this.seed = seed;
        }

        double next() {
            seed = seed + 0x6d2b79f5;
            int t = (seed ^ (seed >>> 15)) * (1 | seed);
            t = (t + ((t ^ (t >>> 7)) * (61 | t))) ^ t;
            return Integer.toUnsignedLong(t ^ (t >>> 14)) / 4294967296.0;
        }
    }
}
