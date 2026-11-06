package com.teachtrack.controller;

import com.teachtrack.entity.Teacher;
import com.teachtrack.service.TeacherService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    private final TeacherService teacherService;

    public TeacherController(TeacherService teacherService) {
        this.teacherService = teacherService;
    }

    // CREATE
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Teacher addTeacher(@Valid @RequestBody Teacher teacher) {
        return teacherService.addTeacher(teacher);
    }

    // READ ALL
    @GetMapping
    public List<Teacher> getAllTeachers() {
        return teacherService.getAllTeachers();
    }

    // READ BY ID
    @GetMapping("/{id}")
    public Teacher getTeacherById(@PathVariable Long id) {
        return teacherService.getTeacherById(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public Teacher updateTeacher(
            @PathVariable Long id,
            @Valid @RequestBody Teacher teacher) {

        return teacherService.updateTeacher(id, teacher);
    }

    // DELETE
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTeacher(@PathVariable Long id) {
        teacherService.deleteTeacher(id);
    }
}