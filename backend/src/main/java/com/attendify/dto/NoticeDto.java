package com.attendify.dto;

import com.attendify.enums.NoticeTargetType;
import com.attendify.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoticeDto {
    private String id;
    private String title;
    private String content;
    private NoticeTargetType targetType;
    private String targetClassId;
    private String targetClassName;
    private String targetStudentId;
    private String targetStudentName;
    private String targetStudentEnrollment;
    private String priority;
    private String postedById;
    private String postedByName;
    private Role postedByRole;
    private String createdAt;
}
