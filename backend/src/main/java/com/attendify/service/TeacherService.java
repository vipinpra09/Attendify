package com.attendify.service;

import com.attendify.dto.TeacherDto;
import com.attendify.dto.TeacherRequest;
import com.attendify.entity.AppUser;
import com.attendify.entity.Teacher;
import com.attendify.enums.Role;
import com.attendify.exception.ApiException;
import com.attendify.repository.SubjectRepository;
import com.attendify.repository.TeacherRepository;
import com.attendify.repository.UserRepository;
import com.attendify.security.UserPrincipal;
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
public class TeacherService {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<TeacherDto> list() {
        requireAdmin();
        return teacherRepository.findAll().stream().map(this::toRow).toList();
    }

    @Transactional(readOnly = true)
    public TeacherDto get(String id) {
        UserPrincipal principal = authService.currentPrincipal();
        if (principal.getRole() == Role.TEACHER && !id.equals(principal.getPersonId())) {
            throw ApiException.forbidden("You can only view your own profile.");
        }
        if (principal.getRole() == Role.STUDENT) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
        return toDto(find(id));
    }

    @Transactional
    public TeacherDto create(TeacherRequest payload) {
        requireAdmin();
        List<String> errors = baseErrors(payload, true);
        if (payload.getEmail() != null && userRepository.existsByEmailIgnoreCase(payload.getEmail())) {
            errors.add("Email: An account with this email already exists");
        }
        if (!errors.isEmpty()) {
            throw ApiException.badRequest("Please fix the highlighted fields.", errors);
        }
        Teacher teacher = Teacher.builder()
                .id(IdUtil.uid("t"))
                .name(payload.getName().trim())
                .email(payload.getEmail().trim().toLowerCase())
                .department(payload.getDepartment())
                .phone(payload.getPhone().trim())
                .employeeCode(payload.getEmployeeCode() != null ? payload.getEmployeeCode().trim() : null)
                .active(true)
                .build();
        teacher = teacherRepository.save(teacher);
        userRepository.save(AppUser.builder()
                .id(IdUtil.uid("u"))
                .name(teacher.getName())
                .email(teacher.getEmail())
                .passwordHash(passwordEncoder.encode(payload.getPassword()))
                .role(Role.TEACHER)
                .personId(teacher.getId())
                .createdAt(Instant.now())
                .build());
        return toDto(teacher);
    }

    @Transactional
    public TeacherDto update(String id, TeacherRequest payload) {
        requireAdmin();
        Teacher teacher = find(id);
        List<String> errors = baseErrors(payload, false);
        if (payload.getEmail() != null
                && userRepository.findByEmailIgnoreCase(payload.getEmail())
                .filter(u -> !id.equals(u.getPersonId()))
                .isPresent()) {
            errors.add("Email: Already in use");
        }
        if (payload.getPassword() != null && !payload.getPassword().isBlank() && payload.getPassword().length() < 6) {
            errors.add("Password: Minimum 6 characters");
        }
        if (!errors.isEmpty()) {
            throw ApiException.badRequest("Please fix the highlighted fields.", errors);
        }
        teacher.setName(payload.getName().trim());
        teacher.setEmail(payload.getEmail().trim().toLowerCase());
        teacher.setDepartment(payload.getDepartment());
        teacher.setPhone(payload.getPhone().trim());
        if (payload.getEmployeeCode() != null) teacher.setEmployeeCode(payload.getEmployeeCode().trim());
        if (payload.getActive() != null) teacher.setActive(payload.getActive());
        teacher = teacherRepository.save(teacher);
        Teacher saved = teacher;
        userRepository.findByPersonIdAndRole(id, Role.TEACHER).ifPresent(user -> {
            user.setName(saved.getName());
            user.setEmail(saved.getEmail());
            if (payload.getPassword() != null && !payload.getPassword().isBlank()) {
                user.setPasswordHash(passwordEncoder.encode(payload.getPassword()));
            }
            userRepository.save(user);
        });
        return toDto(teacher);
    }

    @Transactional
    public void remove(String id) {
        requireAdmin();
        if (!teacherRepository.existsById(id)) {
            throw ApiException.notFound("Teacher not found.");
        }
        long assigned = subjectRepository.countByTeacher_Id(id);
        if (assigned > 0) {
            throw ApiException.conflict("Cannot delete — " + assigned
                    + (assigned > 1 ? " subjects are" : " subject is")
                    + " assigned to this teacher. Reassign them first.");
        }
        userRepository.deleteByPersonIdAndRole(id, Role.TEACHER);
        teacherRepository.deleteById(id);
    }

    private Teacher find(String id) {
        return teacherRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Teacher not found."));
    }

    private void requireAdmin() {
        if (authService.currentPrincipal().getRole() != Role.ADMIN) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
    }

    private List<String> baseErrors(TeacherRequest p, boolean creating) {
        List<String> errors = new ArrayList<>();
        if (p.getName() == null || p.getName().trim().length() < 3) errors.add("Name: Minimum 3 characters");
        if (p.getEmail() == null || !EMAIL.matcher(p.getEmail()).matches()) errors.add("Email: Enter a valid email");
        if (creating && (p.getPassword() == null || p.getPassword().length() < 6)) {
            errors.add("Password: Minimum 6 characters");
        }
        if (p.getDepartment() == null || p.getDepartment().isBlank()) errors.add("Department: Required");
        if (p.getPhone() == null || p.getPhone().replaceAll("\\D", "").length() < 10) {
            errors.add("Phone: Enter a 10-digit phone");
        }
        return errors;
    }

    private TeacherDto toDto(Teacher t) {
        return TeacherDto.builder()
                .id(t.getId())
                .name(t.getName())
                .email(t.getEmail())
                .department(t.getDepartment())
                .phone(t.getPhone())
                .employeeCode(t.getEmployeeCode())
                .active(t.isActive())
                .build();
    }

    private TeacherDto toRow(Teacher t) {
        TeacherDto dto = toDto(t);
        dto.setSubjectCount((int) subjectRepository.countByTeacher_Id(t.getId()));
        return dto;
    }
}
