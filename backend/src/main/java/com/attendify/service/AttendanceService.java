package com.attendify.service;

import com.attendify.dto.*;
import com.attendify.entity.*;
import com.attendify.enums.AttendanceStatus;
import com.attendify.enums.Role;
import com.attendify.exception.ApiException;
import com.attendify.repository.*;
import com.attendify.security.UserPrincipal;
import com.attendify.util.IdUtil;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRecordRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final CollegeClassRepository classRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public SessionLookupResponse getSession(String classId, String subjectId, String dateStr) {
        UserPrincipal principal = authService.currentPrincipal();
        if (principal.getRole() == Role.STUDENT) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> ApiException.notFound("Subject not found."));
        if (principal.getRole() == Role.TEACHER && !subject.getTeacher().getId().equals(principal.getPersonId())) {
            throw ApiException.forbidden("You can only mark attendance for your own subjects.");
        }
        LocalDate date = LocalDate.parse(dateStr);
        List<Student> students = studentRepository.findByCollegeClass_IdAndActiveTrueOrderByEnrollmentNoAsc(classId);
        Map<String, SessionLookupResponse.ExistingMark> existing = new HashMap<>();
        attendanceRepository.findBySubject_IdAndCollegeClass_IdAndDate(subjectId, classId, date)
                .forEach(r -> existing.put(r.getStudent().getId(),
                        new SessionLookupResponse.ExistingMark(r.getStatus(), r.getId())));
        List<SessionLookupResponse.StudentBrief> briefs = students.stream()
                .map(s -> new SessionLookupResponse.StudentBrief(s.getId(), s.getEnrollmentNo(), s.getName()))
                .toList();
        return new SessionLookupResponse(briefs, existing, true);
    }

    @Transactional
    public SaveSessionResponse saveSession(SaveSessionRequest payload) {
        UserPrincipal principal = authService.currentPrincipal();
        if (principal.getRole() == Role.STUDENT) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
        Subject subject = subjectRepository.findById(payload.getSubjectId())
                .orElseThrow(() -> ApiException.notFound("Subject not found."));
        if (principal.getRole() == Role.TEACHER && !subject.getTeacher().getId().equals(principal.getPersonId())) {
            throw ApiException.forbidden("You can only save attendance for your own subjects.");
        }
        if (payload.getDate() == null || payload.getDate().isBlank()) {
            throw ApiException.badRequest("Attendance cannot be marked for a future date.");
        }
        LocalDate date = LocalDate.parse(payload.getDate());
        if (date.isAfter(LocalDate.now())) {
            throw ApiException.badRequest("Attendance cannot be marked for a future date.");
        }
        CollegeClass cls = classRepository.findById(payload.getClassId())
                .orElseThrow(() -> ApiException.notFound("Class not found."));
        Set<String> classStudents = studentRepository.findByCollegeClass_Id(payload.getClassId()).stream()
                .map(Student::getId)
                .collect(Collectors.toSet());
        Set<String> seen = new HashSet<>();
        if (payload.getRecords() == null) {
            throw ApiException.badRequest("No attendance records provided.");
        }
        for (SaveSessionRequest.RecordItem rec : payload.getRecords()) {
            if (!classStudents.contains(rec.getStudentId())) {
                throw ApiException.badRequest("A selected student does not belong to this class.");
            }
            if (!seen.add(rec.getStudentId())) {
                throw ApiException.badRequest("Duplicate entry for the same student.");
            }
        }
        Instant now = Instant.now();
        int updated = 0;
        int saved = 0;
        Map<String, Student> studentCache = studentRepository.findAllById(
                payload.getRecords().stream().map(SaveSessionRequest.RecordItem::getStudentId).toList()
        ).stream().collect(Collectors.toMap(Student::getId, s -> s));

        for (SaveSessionRequest.RecordItem rec : payload.getRecords()) {
            AttendanceRecord existing = attendanceRepository
                    .findByStudent_IdAndSubject_IdAndDate(rec.getStudentId(), payload.getSubjectId(), date)
                    .orElse(null);
            if (existing != null) {
                existing.setStatus(rec.getStatus());
                existing.setTeacher(subject.getTeacher());
                existing.setCollegeClass(cls);
                existing.setUpdatedAt(now);
                attendanceRepository.save(existing);
                updated++;
            } else {
                Student student = studentCache.get(rec.getStudentId());
                attendanceRepository.save(AttendanceRecord.builder()
                        .id(IdUtil.uid("ar"))
                        .student(student)
                        .subject(subject)
                        .teacher(subject.getTeacher())
                        .collegeClass(cls)
                        .date(date)
                        .status(rec.getStatus())
                        .createdAt(now)
                        .updatedAt(now)
                        .build());
                saved++;
            }
        }
        return new SaveSessionResponse(saved, updated);
    }

    @Transactional
    public AttendanceRecordDto updateRecord(String id, AttendanceStatus status) {
        UserPrincipal principal = authService.currentPrincipal();
        if (principal.getRole() == Role.STUDENT) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
        AttendanceRecord rec = attendanceRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Attendance record not found."));
        if (principal.getRole() == Role.TEACHER && !rec.getTeacher().getId().equals(principal.getPersonId())) {
            throw ApiException.forbidden("You can only edit attendance you marked.");
        }
        rec.setStatus(status);
        rec.setUpdatedAt(Instant.now());
        return toRow(attendanceRepository.save(rec));
    }

    @Transactional(readOnly = true)
    public PagedResponse<AttendanceRecordDto> query(
            String classId, String subjectId, String studentId, String status,
            String from, String to, String query, Integer page, Integer size
    ) {
        UserPrincipal principal = authService.currentPrincipal();
        Set<String> teacherSubjectIds = principal.getRole() == Role.TEACHER
                ? subjectRepository.findByTeacher_Id(principal.getPersonId()).stream()
                .map(Subject::getId).collect(Collectors.toSet())
                : Set.of();

        if (principal.getRole() == Role.STUDENT) {
            if (studentId != null && !studentId.isBlank() && !studentId.equals(principal.getPersonId())) {
                throw ApiException.forbidden("You can only view your own attendance.");
            }
        } else if (principal.getRole() == Role.TEACHER) {
            if (subjectId != null && !subjectId.isBlank() && !teacherSubjectIds.contains(subjectId)) {
                throw ApiException.forbidden("You can only view attendance for your subjects.");
            }
        }

        int pageNum = page == null || page < 1 ? 1 : page;
        int pageSize = size == null ? 12 : size;

        Specification<AttendanceRecord> spec = (root, cq, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (principal.getRole() == Role.STUDENT) {
                preds.add(cb.equal(root.get("student").get("id"), principal.getPersonId()));
            } else if (principal.getRole() == Role.TEACHER) {
                if (teacherSubjectIds.isEmpty()) {
                    preds.add(cb.disjunction());
                } else {
                    preds.add(root.get("subject").get("id").in(teacherSubjectIds));
                }
            }
            if (classId != null && !classId.isBlank()) {
                preds.add(cb.equal(root.get("collegeClass").get("id"), classId));
            }
            if (subjectId != null && !subjectId.isBlank()) {
                preds.add(cb.equal(root.get("subject").get("id"), subjectId));
            }
            if (studentId != null && !studentId.isBlank()) {
                preds.add(cb.equal(root.get("student").get("id"), studentId));
            }
            if (status != null && !status.isBlank()) {
                preds.add(cb.equal(root.get("status"), AttendanceStatus.valueOf(status)));
            }
            if (from != null && !from.isBlank()) {
                preds.add(cb.greaterThanOrEqualTo(root.get("date"), LocalDate.parse(from)));
            }
            if (to != null && !to.isBlank()) {
                preds.add(cb.lessThanOrEqualTo(root.get("date"), LocalDate.parse(to)));
            }
            if (query != null && !query.isBlank()) {
                String q = "%" + query.toLowerCase() + "%";
                preds.add(cb.or(
                        cb.like(cb.lower(root.get("student").get("name")), q),
                        cb.like(cb.lower(root.get("student").get("enrollmentNo")), q)
                ));
            }
            return cb.and(preds.toArray(new Predicate[0]));
        };

        Page<AttendanceRecord> result = attendanceRepository.findAll(
                spec,
                PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "date").and(Sort.by("student.id")))
        );
        List<AttendanceRecordDto> rows = result.getContent().stream().map(AttendanceService::toRow).toList();
        return new PagedResponse<>(rows, result.getTotalElements(), pageNum, pageSize, Math.max(1, result.getTotalPages()));
    }

    public static AttendanceRecordDto toRow(AttendanceRecord rec) {
        Student student = rec.getStudent();
        Subject subject = rec.getSubject();
        Teacher teacher = rec.getTeacher();
        CollegeClass cls = rec.getCollegeClass();
        return AttendanceRecordDto.builder()
                .id(rec.getId())
                .studentId(student == null ? null : student.getId())
                .subjectId(subject == null ? null : subject.getId())
                .teacherId(teacher == null ? null : teacher.getId())
                .classId(cls == null ? null : cls.getId())
                .date(rec.getDate() == null ? null : rec.getDate().toString())
                .status(rec.getStatus())
                .createdAt(rec.getCreatedAt() == null ? null : rec.getCreatedAt().toString())
                .updatedAt(rec.getUpdatedAt() == null ? null : rec.getUpdatedAt().toString())
                .enrollmentNo(student == null ? "—" : student.getEnrollmentNo())
                .studentName(student == null ? "Removed student" : student.getName())
                .subjectName(subject == null ? "Removed subject" : subject.getName())
                .subjectCode(subject == null ? "—" : subject.getCode())
                .className(cls == null ? "—" : cls.getName())
                .teacherName(teacher == null ? "—" : teacher.getName())
                .build();
    }
}
