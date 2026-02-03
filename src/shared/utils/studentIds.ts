/**
 * Student ID Resolution Utilities
 *
 * This module provides utilities for working with the different ID types
 * in the student data model:
 *
 * - profileId (student_profiles.id): The primary key of the profile record
 * - studentUserId (student_profiles.user_id): The student's unique identifier
 *   used for data queries (behavior, grades, QOD results, etc.)
 *
 * When a parent creates a student, a UUID is generated for user_id.
 * When a student has their own auth account, user_id matches their auth.users.id.
 */

export interface StudentIds {
  /** Profile record primary key - use for profile table operations */
  profileId: string;
  /** Student's user_id - use for data queries (behavior, grades, QOD) */
  studentUserId: string;
}

export interface StudentLike {
  id: string;
  user_id: string;
}

/**
 * Resolves the correct IDs from a student object for different query types.
 *
 * @param student - Student object from StudentContext or useParentStudents
 * @returns Object with profileId and studentUserId, or empty strings if null
 *
 * @example
 * const { profileId, studentUserId } = resolveStudentIds(selectedStudent);
 * // Use studentUserId for behavior_assessments, student_grades, question_of_day_results
 * // Use profileId for student_profiles operations
 */
export function resolveStudentIds(student: StudentLike | null): StudentIds {
  if (!student) {
    return {
      profileId: '',
      studentUserId: '',
    };
  }

  return {
    profileId: student.id,
    studentUserId: student.user_id,
  };
}

/**
 * Checks if the resolved IDs are valid (non-empty).
 */
export function hasValidStudentIds(ids: StudentIds): boolean {
  return ids.profileId !== '' && ids.studentUserId !== '';
}
