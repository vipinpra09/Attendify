package com.attendify.repository;

import com.attendify.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, String> {

    List<Notice> findAllByOrderByCreatedAtDesc();

    @Query("SELECT n FROM Notice n WHERE n.targetType = com.attendify.enums.NoticeTargetType.ALL " +
           "OR (:classId IS NOT NULL AND n.targetType = com.attendify.enums.NoticeTargetType.CLASS AND n.targetClass.id = :classId) " +
           "OR (:studentId IS NOT NULL AND n.targetType = com.attendify.enums.NoticeTargetType.STUDENT AND n.targetStudent.id = :studentId) " +
           "ORDER BY n.createdAt DESC")
    List<Notice> findNoticesForStudent(@Param("classId") String classId, @Param("studentId") String studentId);
}
