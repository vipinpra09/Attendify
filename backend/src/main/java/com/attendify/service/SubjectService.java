package com.attendify.service;

import com.attendify.dto.SubjectDto;
import com.attendify.dto.SubjectRequest;
import com.attendify.entity.Subject;
import com.attendify.entity.Teacher;
import com.attendify.enums.Role;
import com.attendify.exception.ApiException;
import com.attendify.repository.AttendanceRecordRepository;
import com.attendify.repository.SubjectRepository;
import com.attendify.repository.TeacherRepository;
import com.attendify.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private static final Pattern CODE = Pattern.compile("^[A-Za-z0-9 _-]{2,16}$");

    private final SubjectRepository subjectRepository;
    private final TeacherRepository teacherRepository;
    private final AttendanceRecordRepository attendanceRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<SubjectDto> list() {
        authService.currentUser();
        return subjectRepository.findAll().stream().map(this::toRow).toList();
    }

    @Transactional
    public SubjectDto create(SubjectRequest payload) {
        requireAdmin();
        List<String> errors = baseErrors(payload, true);
        if (payload.getCode() != null && payload.getTeacherId() != null
                && subjectRepository.existsByCodeIgnoreCaseAndTeacher_Id(payload.getCode(), payload.getTeacherId())) {
            errors.add("Subject code: Already assigned to this teacher");
        }
        if (!errors.isEmpty()) {
            throw ApiException.badRequest("Please fix the highlighted fields.", errors);
        }
        Teacher teacher = teacherRepository.findById(payload.getTeacherId())
                .orElseThrow(() -> ApiException.badRequest("Assign a teacher"));
        Subject subject = Subject.builder()
                .id(IdUtil.uid("sub"))
                .name(payload.getName().trim())
                .code(payload.getCode().trim().toUpperCase())
                .subjectType(payload.getSubjectType() != null && !payload.getSubjectType().isBlank() ? payload.getSubjectType() : "Theory")
                .department(payload.getDepartment())
                .semester(payload.getSemester())
                .teacher(teacher)
                .build();
        return toDto(subjectRepository.save(subject));
    }

    @Transactional
    public SubjectDto update(String id, SubjectRequest payload) {
        requireAdmin();
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Subject not found."));
        List<String> errors = baseErrors(payload, false);
        if (payload.getCode() != null && subjectRepository.existsByCodeIgnoreCaseAndIdNot(payload.getCode(), id)) {
            errors.add("Subject code: Already in use");
        }
        if (!errors.isEmpty()) {
            throw ApiException.badRequest("Please fix the highlighted fields.", errors);
        }
        Teacher teacher = teacherRepository.findById(payload.getTeacherId())
                .orElseThrow(() -> ApiException.badRequest("Assign a teacher"));
        subject.setName(payload.getName().trim());
        subject.setCode(payload.getCode().trim().toUpperCase());
        if (payload.getSubjectType() != null && !payload.getSubjectType().isBlank()) subject.setSubjectType(payload.getSubjectType());
        if (payload.getDepartment() != null) subject.setDepartment(payload.getDepartment());
        if (payload.getSemester() != null) subject.setSemester(payload.getSemester());
        subject.setTeacher(teacher);
        return toDto(subjectRepository.save(subject));
    }

    @Transactional
    public void remove(String id) {
        requireAdmin();
        if (!subjectRepository.existsById(id)) {
            throw ApiException.notFound("Subject not found.");
        }
        attendanceRepository.deleteBySubject_Id(id);
        subjectRepository.deleteById(id);
    }

    private void requireAdmin() {
        if (authService.currentPrincipal().getRole() != Role.ADMIN) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
    }

    private List<String> baseErrors(SubjectRequest p, boolean creating) {
        List<String> errors = new ArrayList<>();
        if (p.getName() == null || p.getName().trim().length() < 2) {
            errors.add("Subject name: Minimum 2 characters");
        }
        if (p.getCode() == null || !CODE.matcher(p.getCode()).matches()) {
            errors.add("Subject code: Format like BCS301 or BAS 303");
        }
        if (creating && (p.getDepartment() == null || p.getDepartment().isBlank())) {
            errors.add("Department: Required");
        }
        if (creating && (p.getSemester() == null || p.getSemester() < 1 || p.getSemester() > 8)) {
            errors.add("Semester: 1–8");
        }
        if (p.getTeacherId() == null || p.getTeacherId().isBlank()) {
            errors.add("Teacher: Assign a teacher");
        }
        return errors;
    }

    private SubjectDto toDto(Subject s) {
        return SubjectDto.builder()
                .id(s.getId())
                .name(s.getName())
                .code(s.getCode())
                .department(s.getDepartment())
                .semester(s.getSemester())
                .teacherId(s.getTeacher() == null ? null : s.getTeacher().getId())
                .teacherName(s.getTeacher() == null ? "Unassigned" : s.getTeacher().getName())
                .subjectType(s.getSubjectType() != null ? s.getSubjectType() : "Theory")
                .employeeCode(s.getTeacher() == null ? null : s.getTeacher().getEmployeeCode())
                .teacherDepartment(s.getTeacher() == null ? null : s.getTeacher().getDepartment())
                .build();
    }

    private SubjectDto toRow(Subject s) {
        return toDto(s);
    }
}
