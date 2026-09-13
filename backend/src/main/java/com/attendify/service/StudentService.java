package com.attendify.service;

import com.attendify.dto.StudentDto;
import com.attendify.dto.StudentRequest;
import com.attendify.entity.AppUser;
import com.attendify.entity.CollegeClass;
import com.attendify.entity.Student;
import com.attendify.enums.AttendanceStatus;
import com.attendify.enums.Role;
import com.attendify.exception.ApiException;
import com.attendify.repository.AttendanceRecordRepository;
import com.attendify.repository.CollegeClassRepository;
import com.attendify.repository.StudentRepository;
import com.attendify.repository.UserRepository;
import com.attendify.security.UserPrincipal;
import com.attendify.util.AttendanceMath;
import com.attendify.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class StudentService {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern ENROLL = Pattern.compile("^[A-Za-z0-9-]{4,}$");

    private final StudentRepository studentRepository;
    private final CollegeClassRepository classRepository;
    private final UserRepository userRepository;
    private final AttendanceRecordRepository attendanceRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<StudentDto> list() {
        UserPrincipal principal = authService.currentPrincipal();
        if (principal.getRole() == Role.STUDENT) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
        return studentRepository.findAll().stream().map(this::toRow).toList();
    }

    @Transactional(readOnly = true)
    public StudentDto get(String id) {
        UserPrincipal principal = authService.currentPrincipal();
        if (principal.getRole() == Role.STUDENT && !id.equals(principal.getPersonId())) {
            throw ApiException.forbidden("You can only view your own profile.");
        }
        return toDto(find(id));
    }

    @Transactional
    public StudentDto create(StudentRequest payload) {
        requireAdmin();
        validateCreate(payload);
        CollegeClass cls = classRepository.findById(payload.getClassId())
                .orElseThrow(() -> ApiException.badRequest("Class not found."));
        Student student = Student.builder()
                .id(IdUtil.uid("stu"))
                .enrollmentNo(payload.getEnrollmentNo().trim().toUpperCase())
                .name(payload.getName().trim())
                .email(payload.getEmail().trim().toLowerCase())
                .phone(payload.getPhone().trim())
                .branch(payload.getBranch())
                .semester(payload.getSemester())
                .section(payload.getSection().toUpperCase())
                .collegeClass(cls)
                .active(true)
                .build();
        student = studentRepository.save(student);
        userRepository.save(AppUser.builder()
                .id(IdUtil.uid("u"))
                .name(student.getName())
                .email(student.getEmail())
                .passwordHash(passwordEncoder.encode(payload.getPassword()))
                .role(Role.STUDENT)
                .personId(student.getId())
                .createdAt(Instant.now())
                .build());
        return toDto(student);
    }

    @Transactional
    public StudentDto update(String id, StudentRequest payload) {
        requireAdmin();
        Student student = find(id);
        validateUpdate(id, payload);
        student.setName(payload.getName().trim());
        student.setEnrollmentNo(payload.getEnrollmentNo().trim().toUpperCase());
        student.setEmail(payload.getEmail().trim().toLowerCase());
        student.setPhone(payload.getPhone().trim());
        if (payload.getBranch() != null) student.setBranch(payload.getBranch());
        if (payload.getSemester() != null) student.setSemester(payload.getSemester());
        if (payload.getSection() != null) student.setSection(payload.getSection().toUpperCase());
        if (payload.getClassId() != null) {
            CollegeClass cls = classRepository.findById(payload.getClassId())
                    .orElseThrow(() -> ApiException.badRequest("Class not found."));
            student.setCollegeClass(cls);
        }
        if (payload.getActive() != null) student.setActive(payload.getActive());
        Student saved = studentRepository.save(student);
        userRepository.findByPersonIdAndRole(id, Role.STUDENT).ifPresent(user -> {
            user.setName(saved.getName());
            user.setEmail(saved.getEmail());
            if (payload.getPassword() != null && !payload.getPassword().isBlank()) {
                if (payload.getPassword().length() < 6) {
                    throw ApiException.badRequest("New password must be at least 6 characters.");
                }
                user.setPasswordHash(passwordEncoder.encode(payload.getPassword()));
            }
            userRepository.save(user);
        });
        return toDto(saved);
    }

    @Transactional
    public void remove(String id) {
        requireAdmin();
        if (!studentRepository.existsById(id)) {
            throw ApiException.notFound("Student not found.");
        }
        attendanceRepository.deleteByStudent_Id(id);
        userRepository.deleteByPersonIdAndRole(id, Role.STUDENT);
        studentRepository.deleteById(id);
    }

    private Student find(String id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Student not found."));
    }

    private void requireAdmin() {
        if (authService.currentPrincipal().getRole() != Role.ADMIN) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
    }

    private void validateCreate(StudentRequest p) {
        List<String> errors = baseErrors(p, true);
        if (p.getEmail() != null && studentRepository.existsByEmailIgnoreCase(p.getEmail())) {
            errors.add("Email: Already registered to another student");
        }
        if (p.getEmail() != null && userRepository.existsByEmailIgnoreCase(p.getEmail())) {
            errors.add("Email: An account with this email already exists");
        }
        if (p.getEnrollmentNo() != null && studentRepository.existsByEnrollmentNoIgnoreCase(p.getEnrollmentNo())) {
            errors.add("Enrollment no: Already in use");
        }
        if (!errors.isEmpty()) {
            throw ApiException.badRequest("Please fix the highlighted fields.", errors);
        }
    }

    private void validateUpdate(String id, StudentRequest p) {
        List<String> errors = baseErrors(p, false);
        if (p.getEmail() != null && studentRepository.existsByEmailIgnoreCaseAndIdNot(p.getEmail(), id)) {
            errors.add("Email: Already registered to another student");
        }
        if (p.getEnrollmentNo() != null && studentRepository.existsByEnrollmentNoIgnoreCaseAndIdNot(p.getEnrollmentNo(), id)) {
            errors.add("Enrollment no: Already in use");
        }
        if (p.getPassword() != null && !p.getPassword().isBlank() && p.getPassword().length() < 6) {
            errors.add("Password: Minimum 6 characters");
        }
        if (!errors.isEmpty()) {
            throw ApiException.badRequest("Please fix the highlighted fields.", errors);
        }
    }

    private List<String> baseErrors(StudentRequest p, boolean creating) {
        List<String> errors = new ArrayList<>();
        if (p.getName() == null || p.getName().trim().length() < 3) errors.add("Full name: Minimum 3 characters");
        if (p.getEnrollmentNo() == null || !ENROLL.matcher(p.getEnrollmentNo()).matches()) {
            errors.add("Enrollment no: Minimum 4 letters/digits");
        }
        if (p.getEmail() == null || !EMAIL.matcher(p.getEmail()).matches()) errors.add("Email: Enter a valid email");
        if (creating && (p.getPassword() == null || p.getPassword().length() < 6)) {
            errors.add("Password: Minimum 6 characters");
        }
        if (p.getPhone() == null || p.getPhone().replaceAll("\\D", "").length() < 10) {
            errors.add("Phone: Enter a 10-digit phone");
        }
        if (creating) {
            if (p.getBranch() == null || p.getBranch().isBlank()) errors.add("Branch: Required");
            if (p.getSemester() == null || p.getSemester() < 1 || p.getSemester() > 8) errors.add("Semester: 1–8");
            if (p.getSection() == null || p.getSection().isBlank()) errors.add("Section: Required");
            if (p.getClassId() == null || p.getClassId().isBlank()) errors.add("Class: Required");
        }
        return errors;
    }

    private StudentDto toDto(Student s) {
        return StudentDto.builder()
                .id(s.getId())
                .enrollmentNo(s.getEnrollmentNo())
                .name(s.getName())
                .email(s.getEmail())
                .phone(s.getPhone())
                .branch(s.getBranch())
                .semester(s.getSemester())
                .section(s.getSection())
                .classId(s.getCollegeClass() == null ? "" : s.getCollegeClass().getId())
                .active(s.isActive())
                .build();
    }

    private StudentDto toRow(Student s) {
        StudentDto dto = toDto(s);
        dto.setClassName(s.getCollegeClass() == null ? "Unassigned" : s.getCollegeClass().getName());
        long total = attendanceRepository.countByStudent_Id(s.getId());
        long attended = attendanceRepository.countByStudent_IdAndStatus(s.getId(), AttendanceStatus.PRESENT);
        dto.setPercent(AttendanceMath.pct((int) attended, (int) total));
        return dto;
    }
}
