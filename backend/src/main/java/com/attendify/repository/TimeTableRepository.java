package com.attendify.repository;

import com.attendify.entity.TimeTableEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimeTableRepository extends JpaRepository<TimeTableEntry, String> {

    List<TimeTableEntry> findByCollegeClass_IdOrderByDayOfWeekAscSlotIndexAsc(String classId);

    List<TimeTableEntry> findAllByOrderByDayOfWeekAscSlotIndexAsc();
}
