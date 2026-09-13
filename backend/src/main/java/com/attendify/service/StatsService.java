package com.attendify.service;

import com.attendify.dto.*;
import com.attendify.entity.AttendanceRecord;
import com.attendify.entity.CollegeClass;
import com.attendify.entity.Student;
import com.attendify.entity.Subject;
import com.attendify.enums.AttendanceStatus;
import com.attendify.enums.Role;
import com.attendify.exception.ApiException;
import com.attendify.repository.*;
import com.attendify.security.UserPrincipal;
import com.attendify.util.AttendanceMath;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final AttendanceRecordRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final SubjectRepository subjectRepository;
    private final CollegeClassRepository classRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public AdminStatsDto admin() {
        if (authService.currentPrincipal().getRole() != Role.ADMIN) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
        List<AttendanceRecord> recs = loadAll();
        List<Subject> subjects = subjectRepository.findAll();
        int present = (int) recs.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        List<StudentSummaryDto> lows = Aggregation.studentSummaries(recs).stream()
                .filter(s -> s.getTotal() > 0 && AttendanceMath.isLow(s.getPercent()))
                .limit(8)
                .toList();
        return AdminStatsDto.builder()
                .students((int) studentRepository.count())
                .teachers((int) teacherRepository.count())
                .subjects(subjects.size())
                .classes((int) classRepository.count())
                .today(Aggregation.dayStat(recs))
                .averagePercent(AttendanceMath.pct(present, recs.size()))
                .presentTotal(present)
                .absentTotal(recs.size() - present)
                .lowStudents(lows)
                .subjectwise(Aggregation.subjectSummaries(recs, subjects))
                .trend(Aggregation.trendPoints(recs, 14))
                .sessions(Aggregation.sessionInfos(recs, 10))
                .build();
    }

    @Transactional(readOnly = true)
    public TeacherStatsDto teacher() {
        UserPrincipal principal = authService.currentPrincipal();
        if (principal.getRole() != Role.TEACHER) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
        List<Subject> mySubjects = subjectRepository.findByTeacher_Id(principal.getPersonId());
        Set<String> mine = mySubjects.stream().map(Subject::getId).collect(Collectors.toSet());
        List<AttendanceRecord> recs = mine.isEmpty() ? List.of() : attendanceRepository.findBySubject_IdIn(List.copyOf(mine));
        hydrate(recs);
        List<CollegeClass> matching = classRepository.findAll().stream()
                .filter(c -> mySubjects.stream().anyMatch(s ->
                        s.getDepartment().equals(c.getBranch()) && s.getSemester() == c.getSemester()))
                .toList();
        List<String> classIds = matching.stream().map(CollegeClass::getId).toList();
        int totalStudents = matching.stream()
                .mapToInt(c -> (int) studentRepository.countByCollegeClass_Id(c.getId()))
                .sum();
        int present = (int) recs.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        return TeacherStatsDto.builder()
                .subjects(Aggregation.subjectSummaries(recs, mySubjects))
                .classIds(classIds)
                .totalStudents(totalStudents)
                .today(Aggregation.dayStat(recs))
                .averagePercent(AttendanceMath.pct(present, recs.size()))
                .recentSessions(Aggregation.sessionInfos(recs, 8))
                .build();
    }

    @Transactional(readOnly = true)
    public StudentStatsDto student() {
        UserPrincipal principal = authService.currentPrincipal();
        if (principal.getRole() != Role.STUDENT) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
        List<AttendanceRecord> recs = attendanceRepository.findByStudent_Id(principal.getPersonId());
        hydrate(recs);
        int attended = (int) recs.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        Student student = studentRepository.findById(principal.getPersonId()).orElse(null);
        List<Subject> mySubjects = student == null ? List.of()
                : subjectRepository.findByDepartmentAndSemester(student.getBranch(), student.getSemester());
        if (mySubjects.isEmpty() && !recs.isEmpty()) {
            mySubjects = recs.stream()
                    .map(AttendanceRecord::getSubject)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
        }
        List<SubjectSummaryDto> subjects = Aggregation.subjectSummaries(recs, mySubjects);
        List<AttendanceRecordDto> recent = recs.stream()
                .sorted(Comparator.comparing(AttendanceRecord::getDate).reversed()
                        .thenComparing(r -> r.getSubject().getId()))
                .limit(10)
                .map(AttendanceService::toRow)
                .toList();
        return StudentStatsDto.builder()
                .overall(new StudentStatsDto.Overall(recs.size(), attended, recs.size() - attended,
                        AttendanceMath.pct(attended, recs.size())))
                .subjects(subjects)
                .lowCount((int) subjects.stream().filter(s -> AttendanceMath.isLow(s.getPercent())).count())
                .trend(Aggregation.trendPoints(recs, 14))
                .recent(recent)
                .build();
    }

    private List<AttendanceRecord> loadAll() {
        List<AttendanceRecord> recs = attendanceRepository.findAll();
        hydrate(recs);
        return recs;
    }

    static void hydrate(List<AttendanceRecord> recs) {
        recs.forEach(r -> {
            if (r.getStudent() != null) r.getStudent().getName();
            if (r.getSubject() != null) {
                r.getSubject().getName();
                if (r.getSubject().getTeacher() != null) r.getSubject().getTeacher().getName();
            }
            if (r.getTeacher() != null) r.getTeacher().getName();
            if (r.getCollegeClass() != null) r.getCollegeClass().getName();
        });
    }

    public static final class Aggregation {
        private Aggregation() {
        }

        public static List<SubjectSummaryDto> subjectSummaries(List<AttendanceRecord> records, List<Subject> allSubjects) {
            List<Subject> subjects = allSubjects != null ? allSubjects : records.stream()
                    .map(AttendanceRecord::getSubject)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toMap(Subject::getId, s -> s, (a, b) -> a))
                    .values().stream().toList();
            return subjects.stream().map(subject -> {
                List<AttendanceRecord> recs = records.stream()
                        .filter(r -> r.getSubject() != null && subject.getId().equals(r.getSubject().getId()))
                        .toList();
                int attended = (int) recs.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
                String teacherName = subject.getTeacher() == null ? "Unassigned" : subject.getTeacher().getName();
                String empCode = subject.getTeacher() == null ? null : subject.getTeacher().getEmployeeCode();
                String teacherDept = subject.getTeacher() == null ? null : subject.getTeacher().getDepartment();
                return SubjectSummaryDto.builder()
                        .subjectId(subject.getId())
                        .name(subject.getName())
                        .code(subject.getCode())
                        .teacherName(teacherName)
                        .subjectType(subject.getSubjectType() != null ? subject.getSubjectType() : "Theory")
                        .employeeCode(empCode)
                        .teacherDepartment(teacherDept)
                        .total(recs.size())
                        .attended(attended)
                        .percent(AttendanceMath.pct(attended, recs.size()))
                        .build();
            }).sorted(Comparator.comparing(SubjectSummaryDto::getCode)).toList();
        }

        public static List<StudentSummaryDto> studentSummaries(List<AttendanceRecord> records) {
            Map<String, List<AttendanceRecord>> byStudent = records.stream()
                    .filter(r -> r.getStudent() != null)
                    .collect(Collectors.groupingBy(r -> r.getStudent().getId()));
            return byStudent.entrySet().stream().map(e -> {
                Student student = e.getValue().get(0).getStudent();
                int attended = (int) e.getValue().stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
                String className = student.getCollegeClass() == null ? "—" : student.getCollegeClass().getName();
                return StudentSummaryDto.builder()
                        .studentId(e.getKey())
                        .enrollmentNo(student.getEnrollmentNo() == null ? "—" : student.getEnrollmentNo())
                        .name(student.getName() == null ? "Removed student" : student.getName())
                        .className(className)
                        .total(e.getValue().size())
                        .attended(attended)
                        .percent(AttendanceMath.pct(attended, e.getValue().size()))
                        .needed(AttendanceMath.classesNeeded(attended, e.getValue().size()))
                        .build();
            }).sorted(Comparator.comparing(s -> s.getPercent() == null ? 0.0 : s.getPercent())).toList();
        }

        public static List<TrendPointDto> trendPoints(List<AttendanceRecord> records, int limit) {
            List<String> dates = records.stream().map(r -> r.getDate().toString()).distinct().sorted().toList();
            List<String> slice = dates.size() <= limit ? dates : dates.subList(dates.size() - limit, dates.size());
            return slice.stream().map(date -> {
                List<AttendanceRecord> recs = records.stream().filter(r -> date.equals(r.getDate().toString())).toList();
                int present = (int) recs.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
                Double p = AttendanceMath.pct(present, recs.size());
                return new TrendPointDto(date, p == null ? 0 : p);
            }).toList();
        }

        public static List<SessionInfoDto> sessionInfos(List<AttendanceRecord> records, int limit) {
            Map<String, List<AttendanceRecord>> groups = records.stream().collect(Collectors.groupingBy(r ->
                    r.getDate() + "|" + (r.getCollegeClass() == null ? "" : r.getCollegeClass().getId())
                            + "|" + (r.getSubject() == null ? "" : r.getSubject().getId())));
            return groups.entrySet().stream().map(e -> {
                String[] parts = e.getKey().split("\\|", -1);
                List<AttendanceRecord> recs = e.getValue();
                int present = (int) recs.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
                AttendanceRecord sample = recs.get(0);
                CollegeClass cls = sample.getCollegeClass();
                Subject subject = sample.getSubject();
                return SessionInfoDto.builder()
                        .date(parts[0])
                        .classId(cls == null ? parts[1] : cls.getId())
                        .className(cls == null ? "—" : cls.getName())
                        .subjectId(subject == null ? parts[2] : subject.getId())
                        .subjectName(subject == null ? "—" : subject.getName())
                        .subjectCode(subject == null ? "—" : subject.getCode())
                        .teacherName(subject == null || subject.getTeacher() == null ? "—" : subject.getTeacher().getName())
                        .present(present)
                        .total(recs.size())
                        .percent(AttendanceMath.pct(present, recs.size()))
                        .build();
            }).sorted(Comparator.comparing(SessionInfoDto::getDate).reversed()
                    .thenComparing(SessionInfoDto::getClassName))
                    .limit(limit)
                    .toList();
        }

        public static DayStatDto dayStat(List<AttendanceRecord> records) {
            String today = LocalDate.now().toString();
            String date = today;
            List<AttendanceRecord> recs = records.stream().filter(r -> today.equals(r.getDate().toString())).toList();
            if (recs.isEmpty()) {
                Optional<String> last = records.stream().map(r -> r.getDate().toString()).max(String::compareTo);
                date = last.orElse(today);
                String d = date;
                recs = records.stream().filter(r -> d.equals(r.getDate().toString())).toList();
            }
            int present = (int) recs.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
            return DayStatDto.builder()
                    .date(date)
                    .present(present)
                    .total(recs.size())
                    .percent(AttendanceMath.pct(present, recs.size()))
                    .isToday(date.equals(today))
                    .build();
        }
    }
}
