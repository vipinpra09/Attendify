package com.attendify.service;

import com.attendify.dto.NoticeDto;
import com.attendify.dto.NoticeRequest;
import com.attendify.entity.CollegeClass;
import com.attendify.entity.Notice;
import com.attendify.entity.Student;
import com.attendify.enums.NoticeTargetType;
import com.attendify.enums.Role;
import com.attendify.exception.ApiException;
import com.attendify.repository.CollegeClassRepository;
import com.attendify.repository.NoticeRepository;
import com.attendify.repository.StudentRepository;
import com.attendify.security.UserPrincipal;
import com.attendify.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final CollegeClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final AuthService authService;

    @Transactional
    public NoticeDto createNotice(NoticeRequest req) {
        UserPrincipal principal = authService.currentPrincipal();
        if (principal.getRole() != Role.ADMIN && principal.getRole() != Role.TEACHER) {
            throw ApiException.forbidden("Only admins and teachers can send notices.");
        }

        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            throw ApiException.badRequest("Notice title is required.");
        }
        if (req.getContent() == null || req.getContent().trim().isEmpty()) {
            throw ApiException.badRequest("Notice content is required.");
        }
        if (req.getTargetType() == null) {
            throw ApiException.badRequest("Target type is required.");
        }

        CollegeClass targetClass = null;
        if (req.getTargetType() == NoticeTargetType.CLASS) {
            if (req.getTargetClassId() == null || req.getTargetClassId().isBlank()) {
                throw ApiException.badRequest("Target class is required when sending class notices.");
            }
            targetClass = classRepository.findById(req.getTargetClassId())
                    .orElseThrow(() -> ApiException.notFound("Target class not found."));
        }

        Student targetStudent = null;
        if (req.getTargetType() == NoticeTargetType.STUDENT) {
            if (req.getTargetStudentId() == null || req.getTargetStudentId().isBlank()) {
                throw ApiException.badRequest("Target student is required when sending direct student notices.");
            }
            targetStudent = studentRepository.findById(req.getTargetStudentId())
                    .orElseThrow(() -> ApiException.notFound("Target student not found."));
        }

        String priority = (req.getPriority() != null && req.getPriority().equalsIgnoreCase("URGENT"))
                ? "URGENT" : "NORMAL";

        Notice notice = Notice.builder()
                .id(IdUtil.uid("notice"))
                .title(req.getTitle().trim())
                .content(req.getContent().trim())
                .targetType(req.getTargetType())
                .targetClass(targetClass)
                .targetStudent(targetStudent)
                .priority(priority)
                .postedById(principal.getUser().getId())
                .postedByName(principal.getUser().getName())
                .postedByRole(principal.getRole())
                .createdAt(Instant.now())
                .build();

        return toDto(noticeRepository.save(notice));
    }

    @Transactional(readOnly = true)
    public List<NoticeDto> getNotices() {
        UserPrincipal principal = authService.currentPrincipal();
        if (principal.getRole() == Role.STUDENT) {
            String studentId = principal.getPersonId();
            String classId = null;
            if (studentId != null) {
                Student student = studentRepository.findById(studentId).orElse(null);
                if (student != null && student.getCollegeClass() != null) {
                    classId = student.getCollegeClass().getId();
                }
            }
            return noticeRepository.findNoticesForStudent(classId, studentId).stream()
                    .map(this::toDto)
                    .toList();
        }

        return noticeRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void deleteNotice(String id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Notice not found."));

        UserPrincipal principal = authService.currentPrincipal();
        if (principal.getRole() == Role.ADMIN) {
            noticeRepository.delete(notice);
            return;
        }

        if (principal.getRole() == Role.TEACHER && notice.getPostedById().equals(principal.getUser().getId())) {
            noticeRepository.delete(notice);
            return;
        }

        throw ApiException.forbidden("You do not have permission to delete this notice.");
    }

    public NoticeDto toDto(Notice n) {
        return NoticeDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .content(n.getContent())
                .targetType(n.getTargetType())
                .targetClassId(n.getTargetClass() != null ? n.getTargetClass().getId() : null)
                .targetClassName(n.getTargetClass() != null ? n.getTargetClass().getName() : null)
                .targetStudentId(n.getTargetStudent() != null ? n.getTargetStudent().getId() : null)
                .targetStudentName(n.getTargetStudent() != null ? n.getTargetStudent().getName() : null)
                .targetStudentEnrollment(n.getTargetStudent() != null ? n.getTargetStudent().getEnrollmentNo() : null)
                .priority(n.getPriority())
                .postedById(n.getPostedById())
                .postedByName(n.getPostedByName())
                .postedByRole(n.getPostedByRole())
                .createdAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : null)
                .build();
    }
}
