package com.attendify.service;

import com.attendify.dto.CollegeClassDto;
import com.attendify.dto.CollegeClassRequest;
import com.attendify.entity.CollegeClass;
import com.attendify.enums.Role;
import com.attendify.exception.ApiException;
import com.attendify.repository.CollegeClassRepository;
import com.attendify.repository.StudentRepository;
import com.attendify.repository.SubjectRepository;
import com.attendify.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CollegeClassService {

    private static final Pattern YEAR = Pattern.compile("^\\d{4}-\\d{2}$");

    private final CollegeClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<CollegeClassDto> list() {
        authService.currentUser();
        return classRepository.findAll().stream().map(this::toRow).toList();
    }

    @Transactional
    public CollegeClassDto create(CollegeClassRequest payload) {
        requireAdmin();
        List<String> errors = baseErrors(payload, true);
        if (payload.getName() != null && classRepository.existsByNameIgnoreCase(payload.getName())) {
            errors.add("Class name: Already exists");
        }
        if (!errors.isEmpty()) {
            throw ApiException.badRequest("Please fix the highlighted fields.", errors);
        }
        CollegeClass cls = CollegeClass.builder()
                .id(IdUtil.uid("c"))
                .name(payload.getName().trim().toUpperCase())
                .branch(payload.getBranch())
                .semester(payload.getSemester())
                .section(payload.getSection().toUpperCase())
                .academicYear(payload.getAcademicYear())
                .build();
        return toDto(classRepository.save(cls));
    }

    @Transactional
    public CollegeClassDto update(String id, CollegeClassRequest payload) {
        requireAdmin();
        CollegeClass cls = classRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Class not found."));
        List<String> errors = new ArrayList<>();
        if (payload.getName() == null || payload.getName().trim().length() < 2) {
            errors.add("Class name: Minimum 2 characters");
        }
        if (payload.getAcademicYear() == null || !YEAR.matcher(payload.getAcademicYear()).matches()) {
            errors.add("Academic year: Format 2025-26");
        }
        if (payload.getName() != null && classRepository.existsByNameIgnoreCaseAndIdNot(payload.getName(), id)) {
            errors.add("Class name: Already exists");
        }
        if (!errors.isEmpty()) {
            throw ApiException.badRequest("Please fix the highlighted fields.", errors);
        }
        cls.setName(payload.getName().trim().toUpperCase());
        if (payload.getBranch() != null) cls.setBranch(payload.getBranch());
        if (payload.getSemester() != null) cls.setSemester(payload.getSemester());
        if (payload.getSection() != null) cls.setSection(payload.getSection().toUpperCase());
        cls.setAcademicYear(payload.getAcademicYear());
        return toDto(classRepository.save(cls));
    }

    @Transactional
    public void remove(String id) {
        requireAdmin();
        if (!classRepository.existsById(id)) {
            throw ApiException.notFound("Class not found.");
        }
        studentRepository.findByCollegeClass_Id(id).forEach(s -> {
            s.setCollegeClass(null);
            studentRepository.save(s);
        });
        classRepository.deleteById(id);
    }

    private void requireAdmin() {
        if (authService.currentPrincipal().getRole() != Role.ADMIN) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
    }

    private List<String> baseErrors(CollegeClassRequest p, boolean creating) {
        List<String> errors = new ArrayList<>();
        if (p.getName() == null || p.getName().trim().length() < 2) {
            errors.add("Class name: Minimum 2 characters");
        }
        if (creating && (p.getBranch() == null || p.getBranch().isBlank())) errors.add("Branch: Required");
        if (creating && (p.getSemester() == null || p.getSemester() < 1 || p.getSemester() > 8)) {
            errors.add("Semester: 1–8");
        }
        if (creating && (p.getSection() == null || p.getSection().isBlank())) errors.add("Section: Required");
        if (p.getAcademicYear() == null || !YEAR.matcher(p.getAcademicYear()).matches()) {
            errors.add("Academic year: Format 2025-26");
        }
        return errors;
    }

    private CollegeClassDto toDto(CollegeClass c) {
        return CollegeClassDto.builder()
                .id(c.getId())
                .name(c.getName())
                .branch(c.getBranch())
                .semester(c.getSemester())
                .section(c.getSection())
                .academicYear(c.getAcademicYear())
                .build();
    }

    private CollegeClassDto toRow(CollegeClass c) {
        CollegeClassDto dto = toDto(c);
        dto.setStudentCount((int) studentRepository.countByCollegeClass_Id(c.getId()));
        dto.setSubjectCount((int) subjectRepository.countByDepartmentAndSemester(c.getBranch(), c.getSemester()));
        return dto;
    }
}
