
package com.teachtrack.service;

import com.teachtrack.entity.Teacher;
import com.teachtrack.repository.TeacherRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.http.HttpStatus;

import java.util.List;

@Service
@Transactional
public class TeacherService {

    private final TeacherRepository teacherRepository;

    public TeacherService(TeacherRepository teacherRepository) {
        this.teacherRepository = teacherRepository;
    }

    public Teacher addTeacher(Teacher teacher) {

        if (teacherRepository.existsByEmail(teacher.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Teacher email already exists"
            );
        }

        teacher.setId(null);
        return teacherRepository.save(teacher);
    }

    @Transactional(readOnly = true)
    public List<Teacher> getAllTeachers() {
        return teacherRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Teacher getTeacherById(Long id) {

        return teacherRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Teacher not found with ID: " + id
                ));
    }

    public Teacher updateTeacher(Long id, Teacher updatedTeacher) {

        Teacher existingTeacher = getTeacherById(id);

        teacherRepository.findByEmail(updatedTeacher.getEmail())
                .filter(teacher -> !teacher.getId().equals(id))
                .ifPresent(teacher -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Email already belongs to another teacher"
                    );
                });

        existingTeacher.setFullName(updatedTeacher.getFullName());
        existingTeacher.setEmail(updatedTeacher.getEmail());
        existingTeacher.setPhone(updatedTeacher.getPhone());
        existingTeacher.setSubject(updatedTeacher.getSubject());
        existingTeacher.setQualification(updatedTeacher.getQualification());
        existingTeacher.setSalary(updatedTeacher.getSalary());
        existingTeacher.setJoiningDate(updatedTeacher.getJoiningDate());
        existingTeacher.setActive(updatedTeacher.isActive());

        return teacherRepository.save(existingTeacher);
    }

    public void deleteTeacher(Long id) {

        Teacher teacher = getTeacherById(id);

        teacherRepository.delete(teacher);
    }
}
