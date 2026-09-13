package com.attendify.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "timetable_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeTableEntry {

    @Id
    @Column(length = 96)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private CollegeClass collegeClass;

    @Column(nullable = false, length = 20)
    private String dayOfWeek; // MONDAY, TUESDAY, etc.

    @Column(nullable = false)
    private int slotIndex; // 1 to 9

    @Column(nullable = false, length = 30)
    private String timeSlot; // "09:10-10:00", etc.

    @Column(length = 64)
    private String subjectCode; // "BCS 301", "BCC 351", etc.

    @Column(length = 120)
    private String subjectName; // "DATA STRUCTURE", etc.

    @Column(length = 30)
    private String subjectType; // "Theory", "Practical"

    @Column(length = 120)
    private String teacherName; // "ARPITA", "NEHA", etc.

    @Column(length = 30)
    private String employeeCode; // "200876", etc.

    @Column(length = 40)
    private String department; // "CSE-AIML", "ASH", etc.

    @Column(length = 30)
    private String groupType; // "ALL", "G1", "G2"

    @Column(length = 150)
    private String splitDisplay; // For split slots like "BCC 351(G1) NEHA, BCS351(G2) ARPITA"

    @Column(nullable = false)
    private boolean isBreak; // true for lunch
}
