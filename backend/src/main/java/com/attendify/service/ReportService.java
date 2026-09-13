package com.attendify.service;

import com.attendify.dto.ReportResultDto;
import com.attendify.dto.StudentSummaryDto;
import com.attendify.dto.SubjectSummaryDto;
import com.attendify.entity.AttendanceRecord;
import com.attendify.entity.Student;
import com.attendify.entity.Subject;
import com.attendify.enums.AttendanceStatus;
import com.attendify.enums.Role;
import com.attendify.exception.ApiException;
import com.attendify.repository.AttendanceRecordRepository;
import com.attendify.repository.StudentRepository;
import com.attendify.repository.SubjectRepository;
import com.attendify.security.UserPrincipal;
import com.attendify.util.AttendanceMath;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("MMMM yyyy");
    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("d MMM yyyy");

    private final AttendanceRecordRepository attendanceRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public ReportResultDto generate(String type, String date, String month, String classId,
                                    String subjectId, String studentId, String from, String to) {
        UserPrincipal principal = authService.currentPrincipal();
        if (principal.getRole() == Role.STUDENT) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
        List<AttendanceRecord> recs;
        Set<String> mine = Set.of();
        if (principal.getRole() == Role.TEACHER) {
            mine = subjectRepository.findByTeacher_Id(principal.getPersonId()).stream()
                    .map(Subject::getId).collect(Collectors.toSet());
            if (subjectId != null && !subjectId.isBlank() && !mine.contains(subjectId)) {
                throw ApiException.forbidden("You can only report on your subjects.");
            }
            recs = mine.isEmpty() ? List.of() : attendanceRepository.findBySubject_IdIn(List.copyOf(mine));
        } else {
            recs = attendanceRepository.findAll();
        }
        StatsService.hydrate(recs);

        return switch (type == null ? "low" : type) {
            case "daily" -> daily(recs, date, classId, subjectId);
            case "monthly" -> monthly(recs, month, classId, subjectId);
            case "subject" -> subject(recs, subjectId, classId, from, to);
            case "student" -> student(recs, principal, studentId, from, to);
            default -> low(recs, classId);
        };
    }

    private ReportResultDto daily(List<AttendanceRecord> recs, String date, String classId, String subjectId) {
        String d = date == null || date.isBlank() ? LocalDate.now().toString() : date;
        recs = recs.stream().filter(r -> d.equals(r.getDate().toString())).toList();
        if (classId != null && !classId.isBlank()) {
            recs = recs.stream().filter(r -> r.getCollegeClass() != null && classId.equals(r.getCollegeClass().getId())).toList();
        }
        if (subjectId != null && !subjectId.isBlank()) {
            recs = recs.stream().filter(r -> r.getSubject() != null && subjectId.equals(r.getSubject().getId())).toList();
        }
        recs = recs.stream().sorted((a, b) -> {
            String sa = a.getSubject() == null ? "" : a.getSubject().getId();
            String sb = b.getSubject() == null ? "" : b.getSubject().getId();
            int c = sa.compareTo(sb);
            if (c != 0) return c;
            String ia = a.getStudent() == null ? "" : a.getStudent().getId();
            String ib = b.getStudent() == null ? "" : b.getStudent().getId();
            return ia.compareTo(ib);
        }).toList();
        int present = (int) recs.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        long sessions = recs.stream().map(r ->
                (r.getCollegeClass() == null ? "" : r.getCollegeClass().getId()) + "|"
                        + (r.getSubject() == null ? "" : r.getSubject().getId())).distinct().count();
        List<List<Object>> rows = new ArrayList<>();
        for (AttendanceRecord r : recs) {
            var dto = AttendanceService.toRow(r);
            rows.add(List.of(dto.getEnrollmentNo(), dto.getStudentName(), dto.getClassName(),
                    dto.getSubjectCode() + " · " + dto.getSubjectName(), r.getStatus().name(), dto.getTeacherName()));
        }
        LocalDate parsed = LocalDate.parse(d);
        return ReportResultDto.builder()
                .type("daily")
                .title("Daily Attendance — " + parsed.format(DAY_FMT))
                .summary(List.of(
                        item("Sessions", String.valueOf(sessions)),
                        item("Present", String.valueOf(present)),
                        item("Absent", String.valueOf(recs.size() - present)),
                        item("Attendance", AttendanceMath.dash(AttendanceMath.pct(present, recs.size())) + "%")
                ))
                .columns(List.of("Enrollment", "Student", "Class", "Subject", "Status", "Marked By"))
                .rows(rows)
                .build();
    }

    private ReportResultDto monthly(List<AttendanceRecord> recs, String month, String classId, String subjectId) {
        String m = month == null || month.isBlank() ? LocalDate.now().toString().substring(0, 7) : month;
        recs = recs.stream().filter(r -> r.getDate().toString().startsWith(m)).toList();
        if (classId != null && !classId.isBlank()) {
            recs = recs.stream().filter(r -> r.getCollegeClass() != null && classId.equals(r.getCollegeClass().getId())).toList();
        }
        if (subjectId != null && !subjectId.isBlank()) {
            recs = recs.stream().filter(r -> r.getSubject() != null && subjectId.equals(r.getSubject().getId())).toList();
        }
        List<SubjectSummaryDto> summaries = StatsService.Aggregation.subjectSummaries(recs, null);
        int present = (int) recs.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        List<AttendanceRecord> finalRecs = recs;
        List<List<Object>> rows = summaries.stream().map(s -> {
            long sessionCount = finalRecs.stream()
                    .filter(r -> r.getSubject() != null && s.getSubjectId().equals(r.getSubject().getId()))
                    .map(r -> r.getDate().toString())
                    .distinct().count();
            Object pct = s.getPercent() == null ? "—" : s.getPercent();
            return List.<Object>of(s.getCode(), s.getName(), sessionCount, s.getAttended(),
                    s.getTotal() - s.getAttended(), pct);
        }).toList();
        LocalDate monthDate = LocalDate.parse(m + "-01");
        return ReportResultDto.builder()
                .type("monthly")
                .title("Monthly Attendance — " + monthDate.format(MONTH_FMT))
                .summary(List.of(
                        item("Total Records", String.valueOf(recs.size())),
                        item("Present", String.valueOf(present)),
                        item("Absent", String.valueOf(recs.size() - present)),
                        item("Attendance", AttendanceMath.dash(AttendanceMath.pct(present, recs.size())) + "%")
                ))
                .columns(List.of("Code", "Subject", "Sessions", "Present", "Absent", "Attendance %"))
                .rows(rows)
                .build();
    }

    private ReportResultDto subject(List<AttendanceRecord> recs, String subjectId, String classId, String from, String to) {
        if (subjectId == null || subjectId.isBlank()) {
            throw ApiException.badRequest("Choose a subject to generate this report.");
        }
        recs = recs.stream().filter(r -> r.getSubject() != null && subjectId.equals(r.getSubject().getId())).toList();
        if (classId != null && !classId.isBlank()) {
            recs = recs.stream().filter(r -> r.getCollegeClass() != null && classId.equals(r.getCollegeClass().getId())).toList();
        }
        if (from != null && !from.isBlank()) {
            LocalDate f = LocalDate.parse(from);
            recs = recs.stream().filter(r -> !r.getDate().isBefore(f)).toList();
        }
        if (to != null && !to.isBlank()) {
            LocalDate t = LocalDate.parse(to);
            recs = recs.stream().filter(r -> !r.getDate().isAfter(t)).toList();
        }
        List<StudentSummaryDto> sums = StatsService.Aggregation.studentSummaries(recs);
        List<StudentSummaryDto> withPct = sums.stream().filter(s -> s.getPercent() != null).toList();
        Integer avg = withPct.isEmpty() ? null
                : (int) Math.round(withPct.stream().mapToDouble(StudentSummaryDto::getPercent).average().orElse(0));
        Subject subject = subjectRepository.findById(subjectId).orElse(null);
        String title = "Subject Report — " + (subject == null ? "" : subject.getCode() + " · " + subject.getName());
        List<List<Object>> rows = sums.stream().map(s -> List.<Object>of(
                s.getEnrollmentNo(), s.getName(), s.getClassName(), s.getTotal(), s.getAttended(),
                s.getTotal() - s.getAttended(),
                (s.getPercent() == null ? "—" : s.getPercent()) + "%",
                AttendanceMath.isLow(s.getPercent()) ? "LOW" : "GOOD"
        )).toList();
        long sessions = recs.stream().map(r -> r.getDate().toString()).distinct().count();
        return ReportResultDto.builder()
                .type("subject")
                .title(title)
                .summary(List.of(
                        item("Students", String.valueOf(sums.size())),
                        item("Class Average", (avg == null ? "—" : String.valueOf(avg)) + "%"),
                        item("Below 75%", String.valueOf(sums.stream().filter(s -> AttendanceMath.isLow(s.getPercent())).count())),
                        item("Sessions", String.valueOf(sessions))
                ))
                .columns(List.of("Enrollment", "Student", "Class", "Total", "Attended", "Absent", "%", "Status"))
                .rows(rows)
                .build();
    }

    private ReportResultDto student(List<AttendanceRecord> recs, UserPrincipal principal,
                                    String studentId, String from, String to) {
        if (studentId == null || studentId.isBlank()) {
            throw ApiException.badRequest("Choose a student to generate this report.");
        }
        Student student = studentRepository.findById(studentId).orElse(null);
        if (principal.getRole() == Role.TEACHER) {
            Set<String> classes = recs.stream()
                    .map(r -> r.getCollegeClass() == null ? "" : r.getCollegeClass().getId())
                    .collect(Collectors.toSet());
            String studentClass = student == null || student.getCollegeClass() == null ? "" : student.getCollegeClass().getId();
            if (!classes.contains(studentClass)) {
                throw ApiException.forbidden("This student is not in any of your classes.");
            }
        }
        recs = recs.stream().filter(r -> r.getStudent() != null && studentId.equals(r.getStudent().getId())).toList();
        if (from != null && !from.isBlank()) {
            LocalDate f = LocalDate.parse(from);
            recs = recs.stream().filter(r -> !r.getDate().isBefore(f)).toList();
        }
        if (to != null && !to.isBlank()) {
            LocalDate t = LocalDate.parse(to);
            recs = recs.stream().filter(r -> !r.getDate().isAfter(t)).toList();
        }
        List<SubjectSummaryDto> sums = StatsService.Aggregation.subjectSummaries(recs, null);
        int attended = (int) recs.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        String title = "Student Report — " + (student == null ? "" : student.getName())
                + " (" + (student == null ? "" : student.getEnrollmentNo()) + ")";
        List<List<Object>> rows = sums.stream().map(s -> List.<Object>of(
                s.getCode(), s.getName(), s.getTotal(), s.getAttended(), s.getTotal() - s.getAttended(),
                (s.getPercent() == null ? "—" : s.getPercent()) + "%",
                AttendanceMath.isLow(s.getPercent()) ? "LOW" : "GOOD"
        )).toList();
        return ReportResultDto.builder()
                .type("student")
                .title(title)
                .summary(List.of(
                        item("Overall", AttendanceMath.dash(AttendanceMath.pct(attended, recs.size())) + "%"),
                        item("Attended", String.valueOf(attended)),
                        item("Missed", String.valueOf(recs.size() - attended)),
                        item("Low Subjects", String.valueOf(sums.stream().filter(s -> AttendanceMath.isLow(s.getPercent())).count()))
                ))
                .columns(List.of("Code", "Subject", "Total", "Attended", "Absent", "%", "Status"))
                .rows(rows)
                .build();
    }

    private ReportResultDto low(List<AttendanceRecord> recs, String classId) {
        if (classId != null && !classId.isBlank()) {
            recs = recs.stream().filter(r -> r.getCollegeClass() != null && classId.equals(r.getCollegeClass().getId())).toList();
        }
        List<StudentSummaryDto> sums = StatsService.Aggregation.studentSummaries(recs).stream()
                .filter(s -> s.getTotal() > 0 && AttendanceMath.isLow(s.getPercent()))
                .toList();
        String mostCritical = sums.isEmpty() ? "—" : sums.get(0).getName();
        String avgDeficit = sums.isEmpty() ? "—"
                : Math.round(sums.stream().mapToDouble(s -> 75 - (s.getPercent() == null ? 0 : s.getPercent())).average().orElse(0)) + "%";
        List<List<Object>> rows = sums.stream().map(s -> List.<Object>of(
                s.getEnrollmentNo(), s.getName(), s.getClassName(), s.getTotal(), s.getAttended(),
                s.getPercent() + "%", s.getNeeded()
        )).toList();
        return ReportResultDto.builder()
                .type("low")
                .title("Low Attendance Report (below 75%)")
                .summary(List.of(
                        item("Students Below 75%", String.valueOf(sums.size())),
                        item("Threshold", "75%"),
                        item("Most Critical", mostCritical),
                        item("Avg. Deficit", avgDeficit)
                ))
                .columns(List.of("Enrollment", "Student", "Class", "Total", "Attended", "%", "Classes Needed"))
                .rows(rows)
                .build();
    }

    private static ReportResultDto.SummaryItem item(String label, String value) {
        return new ReportResultDto.SummaryItem(label, value);
    }
}
