package com.attendify.service;

import com.attendify.dto.TimeTableDto;
import com.attendify.entity.CollegeClass;
import com.attendify.entity.Student;
import com.attendify.entity.TimeTableEntry;
import com.attendify.enums.Role;
import com.attendify.repository.CollegeClassRepository;
import com.attendify.repository.StudentRepository;
import com.attendify.repository.TimeTableRepository;
import com.attendify.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TimeTableService {

    private final TimeTableRepository timeTableRepository;
    private final CollegeClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final AuthService authService;

    public static final List<TimeTableDto.DirectoryItemDto> DIRECTORY = List.of(
            new TimeTableDto.DirectoryItemDto(1, "Theory", "MATH IV", "BAS 303", "200432", "PRIYANKA KUMARI", "ASH"),
            new TimeTableDto.DirectoryItemDto(2, "Theory", "CYBER SECURITY", "BCC 301", "200914", "NEHA TOMAR", "CSE-AIML"),
            new TimeTableDto.DirectoryItemDto(3, "Theory", "DATA STRUCTURE", "BCS 301", "200876", "ARPITA SINGH", "CSE-AIML"),
            new TimeTableDto.DirectoryItemDto(4, "Theory", "COA", "BCS 302", "201147", "SHIVAM CHAUDHARY", "ECE"),
            new TimeTableDto.DirectoryItemDto(5, "Theory", "DSTL", "BCS 303", "200087", "NEERAJ KUMAR", "CSE-AIML"),
            new TimeTableDto.DirectoryItemDto(6, "Theory", "UHV", "BVE 301", "200045", "PRAVEEN GAUTAM", "ME"),
            new TimeTableDto.DirectoryItemDto(7, "Theory", "MM", "MM301", "200914", "NEHA TOMAR", "CSE-AIML"),
            new TimeTableDto.DirectoryItemDto(8, "Theory", "MM", "MM301", "201147", "SHIVAM CHAUDHARY", "ECE"),
            new TimeTableDto.DirectoryItemDto(9, "Theory", "WD", "WD301", "200885", "NITIN KUMAR SHARMA", "CSE-AIML"),
            new TimeTableDto.DirectoryItemDto(10, "Practical", "MINI PROJECT", "BCC 351", "200914", "NEHA TOMAR", "CSE-AIML"),
            new TimeTableDto.DirectoryItemDto(11, "Practical", "COA LAB", "BCS 352", "201147", "SHIVAM CHAUDHARY", "ECE"),
            new TimeTableDto.DirectoryItemDto(12, "Practical", "WD WORKSHOP", "BCS 353", "200885", "NITIN KUMAR SHARMA", "CSE-AIML"),
            new TimeTableDto.DirectoryItemDto(13, "Practical", "DS LAB", "BCS351", "200876", "ARPITA SINGH", "CSE-AIML"),
            new TimeTableDto.DirectoryItemDto(14, "Practical", "NASSCOM", "NASSCOM301", "200092", "VINISH KUMAR", "CSE-AIML")
    );

    @Transactional(readOnly = true)
    public TimeTableDto.ResponseDto getTimeTable(String requestedClassId) {
        UserPrincipal principal = authService.currentPrincipal();

        String classId = requestedClassId;
        String studentName = "VISHAL KUMAR YADAV (250153137)";
        String rollNo = "2500331530322";
        String regDate = "22-Jul-2026";

        if (principal.getRole() == Role.STUDENT) {
            String studentId = principal.getPersonId();
            if (studentId != null) {
                Student student = studentRepository.findById(studentId).orElse(null);
                if (student != null) {
                    studentName = student.getName() + " (" + student.getId() + ")";
                    rollNo = student.getEnrollmentNo();
                    if (student.getCollegeClass() != null) {
                        classId = student.getCollegeClass().getId();
                    }
                }
            }
        }

        // If classId is still null, pick AIML-E 3(G2) or first class in db
        if (classId == null || classId.isBlank()) {
            CollegeClass aimlClass = classRepository.findById("c_aiml_e")
                    .orElseGet(() -> classRepository.findAll().stream().findFirst().orElse(null));
            if (aimlClass != null) {
                classId = aimlClass.getId();
            }
        }

        CollegeClass cls = classId != null ? classRepository.findById(classId).orElse(null) : null;

        List<TimeTableEntry> entries = classId != null
                ? timeTableRepository.findByCollegeClass_IdOrderByDayOfWeekAscSlotIndexAsc(classId)
                : timeTableRepository.findAllByOrderByDayOfWeekAscSlotIndexAsc();

        // Fallback: If no entries for requested class, load all seeded entries
        if (entries.isEmpty()) {
            entries = timeTableRepository.findAllByOrderByDayOfWeekAscSlotIndexAsc();
        }

        List<TimeTableDto.EntryDto> entryDtos = entries.stream().map(e -> TimeTableDto.EntryDto.builder()
                .id(e.getId())
                .dayOfWeek(e.getDayOfWeek())
                .slotIndex(e.getSlotIndex())
                .timeSlot(e.getTimeSlot())
                .subjectCode(e.getSubjectCode())
                .subjectName(e.getSubjectName())
                .subjectType(e.getSubjectType())
                .teacherName(e.getTeacherName())
                .employeeCode(e.getEmployeeCode())
                .department(e.getDepartment())
                .groupType(e.getGroupType())
                .splitDisplay(e.getSplitDisplay())
                .isBreak(e.isBreak())
                .build()).toList();

        return TimeTableDto.ResponseDto.builder()
                .classId(cls != null ? cls.getId() : "c_aiml_e")
                .className(cls != null ? cls.getName() : "AIML-E 3(G2)")
                .branch(cls != null ? cls.getBranch() : "CSE-AIML")
                .semester(cls != null ? cls.getSemester() : 3)
                .section(cls != null ? cls.getSection() : "E")
                .studentName(studentName)
                .rollNo(rollNo)
                .registrationDate(regDate)
                .entries(entryDtos)
                .directory(DIRECTORY)
                .build();
    }
}
